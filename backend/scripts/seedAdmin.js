import '../config/env.js';
import { connectDatabase } from '../config/db.js';
import { User } from '../models/index.js';
import { registerSchema } from '../validators/index.js';

const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } = process.env;
if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD before running this script');
const { name, email, password } = registerSchema.parse({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
await connectDatabase(MONGO_URI);
const existing = await User.findOne({ email }).select('+password');
if (existing) { existing.name = name; existing.role = 'ADMIN'; existing.password = password; await existing.save(); console.log(`Updated admin ${email}`); }
else { await User.create({ name, email, password, role: 'ADMIN' }); console.log(`Created admin ${email}`); }
process.exit(0);
