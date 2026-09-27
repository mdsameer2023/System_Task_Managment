import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { api } from './routes/index.js';
import { notFound, errorHandler } from './middleware/index.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL?.split(',').map((v) => v.trim()) || ['http://localhost:5173'], credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use('/api', api);
app.use(notFound);
app.use(errorHandler);
export default app;
