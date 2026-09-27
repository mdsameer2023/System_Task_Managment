import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, Project, Task, Notification } from '../models/index.js';
import { AppError } from '../middleware/index.js';
import { accessibleProjectFilter, getAccessibleProject, isManager, requireManager, projectUserIds } from '../services/access.js';

const tokenFor = (id) => jwt.sign({ sub: id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const ok = (res, data, status = 200) => res.status(status).json({ success: true, ...data });
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const auth = {
  register: async (req, res) => {
    if (await User.exists({ email: req.body.email })) throw new AppError('An account with this email already exists', 409);
    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password, role: 'USER' });
    return ok(res, { user, token: tokenFor(user._id) }, 201);
  },
  login: async (req, res) => {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !(await user.comparePassword(req.body.password))) throw new AppError('Invalid email or password', 401);
    user.password = undefined;
    return ok(res, { user, token: tokenFor(user._id) });
  },
  me: async (req, res) => ok(res, { user: req.user }),
};

export const users = {
  list: async (_req, res) => ok(res, { users: await User.find().sort({ createdAt: -1 }) }),
  directory: async (req, res) => {
    const search = String(req.query.search || '').trim();
    const filter = search ? { $or: [{ name: new RegExp(escapeRegex(search), 'i') }, { email: new RegExp(escapeRegex(search), 'i') }] } : {};
    return ok(res, { users: await User.find(filter).select('name email role').sort({ name: 1 }).limit(30) });
  },
};

export const projects = {
  list: async (req, res) => {
    const filter = accessibleProjectFilter(req.user);
    if (req.query.status) filter.status = req.query.status;
    const rows = await Project.find(filter).populate('owner', 'name email').populate('members', 'name email').sort({ updatedAt: -1 });
    const ids = rows.map((p) => p._id);
    const counts = await Task.aggregate([
      { $match: { project: { $in: ids } } },
      { $group: { _id: '$project', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } } } },
    ]);
    const byProject = new Map(counts.map((c) => [c._id.toString(), c]));
    return ok(res, { projects: rows.map((p) => ({ ...p.toObject(), taskStats: byProject.get(p._id.toString()) || { total: 0, completed: 0 } })) });
  },
  create: async (req, res) => {
    const project = await Project.create({ ...req.body, owner: req.user._id, members: [] });
    await project.populate('owner', 'name email');
    return ok(res, { project }, 201);
  },
  get: async (req, res) => {
    const project = await getAccessibleProject(req.params.id, req.user);
    await project.populate('owner members', 'name email role');
    const [total, completed] = await Promise.all([Task.countDocuments({ project: project._id }), Task.countDocuments({ project: project._id, status: 'COMPLETED' })]);
    return ok(res, { project: { ...project.toObject(), taskStats: { total, completed } } });
  },
  update: async (req, res) => {
    const project = await getAccessibleProject(req.params.id, req.user); requireManager(project, req.user);
    const start = new Date(req.body.startDate || project.startDate); const due = new Date(req.body.dueDate || project.dueDate);
    if (due < start) throw new AppError('Due date cannot precede start date', 400, [{ field: 'dueDate', message: 'Due date cannot precede start date' }]);
    Object.assign(project, req.body); await project.save(); await project.populate('owner members', 'name email role');
    return ok(res, { project });
  },
  remove: async (req, res) => {
    const project = await getAccessibleProject(req.params.id, req.user); requireManager(project, req.user);
    const taskIds = await Task.find({ project: project._id }).distinct('_id');
    await Promise.all([Task.deleteMany({ project: project._id }), Notification.deleteMany({ $or: [{ relatedProject: project._id }, { relatedTask: { $in: taskIds } }] }), project.deleteOne()]);
    return ok(res, { message: 'Project deleted' });
  },
  archive: async (req, res) => {
    const project = await getAccessibleProject(req.params.id, req.user); requireManager(project, req.user);
    project.status = 'ARCHIVED'; await project.save(); return ok(res, { project });
  },
  addMember: async (req, res) => {
    const project = await getAccessibleProject(req.params.id, req.user); requireManager(project, req.user);
    const member = await User.findById(req.body.userId); if (!member) throw new AppError('User not found', 404);
    if (project.owner.equals(member._id)) throw new AppError('The project owner already has access', 409);
    if (project.members.some((id) => id.equals(member._id))) throw new AppError('User is already a project member', 409);
    project.members.push(member._id); await project.save();
    await Notification.create({ user: member._id, message: `You were added to ${project.name}`, type: 'PROJECT_MEMBER_ADDED', relatedProject: project._id });
    await project.populate('owner members', 'name email role'); return ok(res, { project });
  },
  removeMember: async (req, res) => {
    const project = await getAccessibleProject(req.params.id, req.user); requireManager(project, req.user);
    const memberId = req.params.userId;
    if (!project.members.some((id) => id.toString() === memberId)) throw new AppError('Project member not found', 404);
    project.members.pull(memberId); await project.save();
    await Task.updateMany({ project: project._id, assignedTo: memberId }, { $set: { assignedTo: null } });
    await project.populate('owner members', 'name email role'); return ok(res, { project });
  },
};

async function accessibleProjectIds(user) {
  return Project.find(accessibleProjectFilter(user)).distinct('_id');
}
function ensureAssignee(project, assignedTo) {
  if (assignedTo && !projectUserIds(project).has(assignedTo.toString())) throw new AppError('Assigned user must be the project owner or a project member', 400);
}
async function populateTask(task) { return Task.populate(task, [{ path: 'project', select: 'name status owner members' }, { path: 'assignedTo', select: 'name email' }, { path: 'createdBy', select: 'name email' }]); }

export const tasks = {
  list: async (req, res) => {
    const ids = await accessibleProjectIds(req.user);
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1); const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const filter = { project: { $in: ids } };
    if (req.query.project) {
      if (!mongoose.isValidObjectId(req.query.project) || !ids.some((id) => id.toString() === req.query.project)) throw new AppError('Project not found or access denied', 404);
      filter.project = new mongoose.Types.ObjectId(req.query.project);
    }
    if (req.query.search) filter.title = new RegExp(escapeRegex(String(req.query.search).trim()), 'i');
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.assignedTo) {
      if (!mongoose.isValidObjectId(req.query.assignedTo)) throw new AppError('Invalid assigned user identifier', 400);
      filter.assignedTo = new mongoose.Types.ObjectId(req.query.assignedTo);
    }
    if (req.query.dueDate) { const start = new Date(req.query.dueDate); const end = new Date(start); end.setDate(end.getDate() + 1); filter.dueDate = { $gte: start, $lt: end }; }
    if (req.query.dueBefore) filter.dueDate = { ...(filter.dueDate || {}), $lte: new Date(req.query.dueBefore) };
    if (req.query.dueAfter) filter.dueDate = { ...(filter.dueDate || {}), $gte: new Date(req.query.dueAfter) };
    const sortBy = ['createdAt', 'dueDate', 'priority'].includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const direction = req.query.order === 'asc' ? 1 : -1;
    const totalRecords = await Task.countDocuments(filter); let rows;
    if (sortBy === 'priority') {
      rows = await Task.aggregate([{ $match: filter }, { $addFields: { priorityRank: { $indexOfArray: [['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], '$priority'] } } }, { $sort: { priorityRank: direction, createdAt: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit }]);
      rows = await populateTask(rows);
    } else rows = await Task.find(filter).populate('project', 'name status owner members').populate('assignedTo', 'name email').populate('createdBy', 'name email').sort({ [sortBy]: direction }).skip((page - 1) * limit).limit(limit);
    return ok(res, { tasks: rows, pagination: { currentPage: page, totalPages: Math.max(1, Math.ceil(totalRecords / limit)), totalRecords, limit } });
  },
  get: async (req, res) => {
    const task = await Task.findById(req.params.id); if (!task) throw new AppError('Task not found', 404);
    await getAccessibleProject(task.project, req.user); return ok(res, { task: await populateTask(task) });
  },
  create: async (req, res) => {
    const project = await getAccessibleProject(req.body.project, req.user); ensureAssignee(project, req.body.assignedTo);
    if (new Date(req.body.dueDate) < new Date(project.startDate)) throw new AppError('Task due date cannot precede the project start date', 400, [{ field: 'dueDate', message: 'Due date cannot precede the project start date' }]);
    const task = await Task.create({ ...req.body, createdBy: req.user._id });
    if (task.assignedTo && !task.assignedTo.equals(req.user._id)) await Notification.create({ user: task.assignedTo, message: `You were assigned: ${task.title}`, type: 'TASK_ASSIGNED', relatedProject: project._id, relatedTask: task._id });
    return ok(res, { task: await populateTask(task) }, 201);
  },
  update: async (req, res) => {
    const task = await Task.findById(req.params.id); if (!task) throw new AppError('Task not found', 404);
    const project = await getAccessibleProject(task.project, req.user); const manager = isManager(project, req.user); const assigned = task.assignedTo?.equals(req.user._id);
    if (!manager && !assigned) throw new AppError('Only project managers or the assigned user can update this task', 403);
    if (!manager && Object.keys(req.body).some((key) => key !== 'status')) throw new AppError('Assigned users may only update task status', 403);
    ensureAssignee(project, req.body.assignedTo); const previousAssignee = task.assignedTo?.toString(); const previousStatus = task.status;
    if (req.body.dueDate && new Date(req.body.dueDate) < new Date(project.startDate)) throw new AppError('Task due date cannot precede the project start date', 400, [{ field: 'dueDate', message: 'Due date cannot precede the project start date' }]);
    Object.assign(task, req.body); await task.save();
    if (task.assignedTo && task.assignedTo.toString() !== previousAssignee && !task.assignedTo.equals(req.user._id)) await Notification.create({ user: task.assignedTo, message: `You were assigned: ${task.title}`, type: 'TASK_ASSIGNED', relatedProject: project._id, relatedTask: task._id });
    if (previousStatus !== 'COMPLETED' && task.status === 'COMPLETED') {
      const recipient = project.owner.equals(req.user._id) ? task.assignedTo : project.owner;
      if (recipient && !recipient.equals(req.user._id)) await Notification.create({ user: recipient, message: `${task.title} was completed`, type: 'TASK_COMPLETED', relatedProject: project._id, relatedTask: task._id });
    }
    return ok(res, { task: await populateTask(task) });
  },
  remove: async (req, res) => {
    const task = await Task.findById(req.params.id); if (!task) throw new AppError('Task not found', 404);
    const project = await getAccessibleProject(task.project, req.user); requireManager(project, req.user);
    await Promise.all([task.deleteOne(), Notification.deleteMany({ relatedTask: task._id })]); return ok(res, { message: 'Task deleted' });
  },
};

export const dashboard = async (req, res) => {
  const projectFilter = accessibleProjectFilter(req.user); const projectRows = await Project.find(projectFilter).select('_id name status'); const ids = projectRows.map((p) => p._id); const now = new Date();
  const [taskStats, progress, overdue, overdueCount] = await Promise.all([
    Task.aggregate([{ $match: { project: { $in: ids } } }, { $group: { _id: null, total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } }, highPriority: { $sum: { $cond: [{ $in: ['$priority', ['HIGH', 'CRITICAL']] }, 1, 0] } } } }]),
    Task.aggregate([{ $match: { project: { $in: ids } } }, { $group: { _id: '$project', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } } } }]),
    Task.find({ project: { $in: ids }, dueDate: { $lt: now }, status: { $ne: 'COMPLETED' } }).populate('project', 'name').populate('assignedTo', 'name email').sort({ dueDate: 1 }).limit(8),
    Task.countDocuments({ project: { $in: ids }, dueDate: { $lt: now }, status: { $ne: 'COMPLETED' } }),
  ]);
  const stats = taskStats[0] || { total: 0, completed: 0, highPriority: 0 }; const progressMap = new Map(progress.map((p) => [p._id.toString(), p]));
  return ok(res, { metrics: { totalProjects: projectRows.length, activeProjects: projectRows.filter((p) => p.status === 'IN_PROGRESS').length, completedProjects: projectRows.filter((p) => p.status === 'COMPLETED').length, totalTasks: stats.total, pendingTasks: stats.total - stats.completed, completedTasks: stats.completed, overdueTasks: overdueCount, highPriorityTasks: stats.highPriority }, projectProgress: projectRows.map((p) => { const s = progressMap.get(p._id.toString()) || { total: 0, completed: 0 }; return { _id: p._id, name: p.name, total: s.total, completed: s.completed, percent: s.total ? Math.round((s.completed / s.total) * 100) : 0 }; }), overdueTasks: overdue });
};

async function createDueSoonNotifications(user) {
  const ids = await accessibleProjectIds(user); const now = new Date(); const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dueTasks = await Task.find({ project: { $in: ids }, assignedTo: user._id, dueDate: { $gte: now, $lte: soon }, status: { $ne: 'COMPLETED' } });
  await Promise.all(dueTasks.map(async (task) => { if (!(await Notification.exists({ user: user._id, type: 'TASK_DUE_SOON', relatedTask: task._id }))) await Notification.create({ user: user._id, message: `${task.title} is due within 24 hours`, type: 'TASK_DUE_SOON', relatedProject: task.project, relatedTask: task._id }); }));
}
export const notifications = {
  list: async (req, res) => { await createDueSoonNotifications(req.user); const rows = await Notification.find({ user: req.user._id }).populate('relatedProject', 'name').populate('relatedTask', 'title').sort({ createdAt: -1 }).limit(100); return ok(res, { notifications: rows, unreadCount: rows.filter((n) => !n.isRead).length }); },
  read: async (req, res) => { const item = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true }, { new: true }); if (!item) throw new AppError('Notification not found', 404); return ok(res, { notification: item }); },
  readAll: async (req, res) => { await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true }); return ok(res, { message: 'All notifications marked as read' }); },
};
