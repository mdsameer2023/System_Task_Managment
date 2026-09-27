import mongoose from 'mongoose';
import { Project } from '../models/index.js';
import { AppError } from '../middleware/index.js';

export const accessibleProjectFilter = (user) => user.role === 'ADMIN' ? {} : { $or: [{ owner: user._id }, { members: user._id }] };
export async function getAccessibleProject(projectId, user) {
  if (!mongoose.isValidObjectId(projectId)) throw new AppError('Invalid project identifier', 400);
  const project = await Project.findOne({ _id: projectId, ...accessibleProjectFilter(user) });
  if (!project) throw new AppError('Project not found or access denied', 404);
  return project;
}
export const isManager = (project, user) => user.role === 'ADMIN' || project.owner.toString() === user._id.toString();
export function requireManager(project, user) { if (!isManager(project, user)) throw new AppError('Only the project owner or an admin can perform this action', 403); }
export const projectUserIds = (project) => new Set([project.owner.toString(), ...project.members.map((id) => id.toString())]);
