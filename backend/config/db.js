import mongoose from 'mongoose';

export async function connectDatabase(uri) {
  if (!uri) throw new Error('Set MONGO_URI (or MONGODB_URL) in backend/.env');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}
