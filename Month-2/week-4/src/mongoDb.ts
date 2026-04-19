import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI || '';

export async function connectDB() {
  if (!uri) {
    throw new Error('MONGO_URI is not set');
  }

  await mongoose.connect(uri);
}