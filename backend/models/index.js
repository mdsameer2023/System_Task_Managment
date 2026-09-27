import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
}, { timestamps: true });
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.comparePassword = function comparePassword(value) { return bcrypt.compare(value, this.password); };
userSchema.set('toJSON', { transform: (_doc, value) => { delete value.password; delete value.__v; return value; } });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  status: { type: String, enum: ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'], default: 'PLANNING' },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  startDate: { type: Date, required: true }, dueDate: { type: Date, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });
projectSchema.index({ members: 1 });

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 3000, default: '' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'], default: 'TODO', index: true },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM', index: true },
  dueDate: { type: Date, required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
taskSchema.index({ title: 'text' });
taskSchema.index({ project: 1, status: 1, dueDate: 1 });

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  message: { type: String, required: true, trim: true, maxlength: 300 },
  type: { type: String, enum: ['PROJECT_MEMBER_ADDED', 'TASK_ASSIGNED', 'TASK_COMPLETED', 'TASK_DUE_SOON'], required: true },
  isRead: { type: Boolean, default: false, index: true },
  relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  relatedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
}, { timestamps: true });
notificationSchema.index({ user: 1, createdAt: -1 });

export const User = mongoose.model('User', userSchema);
export const Project = mongoose.model('Project', projectSchema);
export const Task = mongoose.model('Task', taskSchema);
export const Notification = mongoose.model('Notification', notificationSchema);
