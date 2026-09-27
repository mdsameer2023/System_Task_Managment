import { z } from 'zod';
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
const dateString = z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date');
export const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().email(), password: z.string().min(8).max(72) });
export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });
const projectFields = z.object({
  name: z.string().trim().min(2).max(120), description: z.string().trim().max(2000).optional().default(''),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).optional(), priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  startDate: dateString, dueDate: dateString,
});
export const projectSchema = projectFields.refine((v) => new Date(v.dueDate) >= new Date(v.startDate), { path: ['dueDate'], message: 'Due date cannot precede start date' });
export const projectUpdateSchema = projectFields.partial();
export const memberSchema = z.object({ userId: objectId });
export const taskSchema = z.object({
  title: z.string().trim().min(2).max(160), description: z.string().trim().max(3000).optional().default(''), project: objectId,
  assignedTo: objectId.nullable().optional(), status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(), dueDate: dateString,
});
export const taskUpdateSchema = taskSchema.omit({ project: true }).partial();
