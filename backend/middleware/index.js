import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/index.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, details) {
    super(message); this.statusCode = statusCode; this.details = details; this.isOperational = true;
  }
}
export const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.get('authorization');
  if (!header?.startsWith('Bearer ')) throw new AppError('Authentication is required', 401);
  let payload;
  try { payload = jwt.verify(header.slice(7), process.env.JWT_SECRET); }
  catch { throw new AppError('Your session is invalid or has expired', 401); }
  const user = await User.findById(payload.sub);
  if (!user) throw new AppError('The account for this session no longer exists', 401);
  req.user = user; next();
});
export const authorize = (...roles) => (req, _res, next) => roles.includes(req.user.role)
  ? next() : next(new AppError('You do not have permission to perform this action', 403));
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const parsed = schema.safeParse(req[source]);
  if (!parsed.success) return next(new AppError('Validation failed', 400, parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))));
  req[source] = parsed.data; next();
};
export function notFound(req, res) { res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` }); }
export function errorHandler(error, _req, res, _next) {
  let status = error.statusCode || 500; let message = error.message || 'Internal server error'; let details = error.details;
  if (error instanceof mongoose.Error.CastError) { status = 400; message = `Invalid ${error.path}`; }
  else if (error?.code === 11000) { status = 409; message = `${Object.keys(error.keyPattern || {})[0] || 'Resource'} already exists`; }
  else if (error instanceof mongoose.Error.ValidationError) { status = 400; message = 'Validation failed'; details = Object.values(error.errors).map((i) => ({ field: i.path, message: i.message })); }
  if (status >= 500 && process.env.NODE_ENV === 'production') message = 'Internal server error';
  if (status >= 500) console.error(error);
  res.status(status).json({ success: false, message, ...(details ? { details } : {}) });
}
