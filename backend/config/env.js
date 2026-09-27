import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

// Accept the alternate name used by existing local configurations.
if (!process.env.MONGO_URI && process.env.MONGODB_URL) {
  process.env.MONGO_URI = process.env.MONGODB_URL;
}
