import './config/env.js';
import app from './app.js';
import { connectDatabase } from './config/db.js';

const port = Number(process.env.PORT) || 5000;
async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');
  await connectDatabase(process.env.MONGO_URI);
  const server = app.listen(port, () => console.log(`TaskFlow API listening on port ${port}`));
  server.on('error', (error) => {
    const message = error.code === 'EADDRINUSE'
      ? `Port ${port} is already in use. Stop the other backend instance before restarting this one.`
      : error.message;
    console.error(`Startup failed: ${message}`);
    process.exit(1);
  });
  const shutdown = () => server.close(() => process.exit(0));
  process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
}
start().catch((error) => { console.error(`Startup failed: ${error.message}`); process.exit(1); });
