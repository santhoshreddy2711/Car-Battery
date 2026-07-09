import mongoose, { Schema } from 'mongoose';
import { MockModel } from '../models/mockDb.js';

let isMongoConnected = false;
const mockModels: Record<string, MockModel<any>> = {};

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('No MONGODB_URI found in environment. Using Local File JSON Database.');
    isMongoConnected = false;
    return;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully!');
    isMongoConnected = true;
  } catch (error) {
    console.error('MongoDB connection failed. Using Local File JSON Database fallback. Error:', error);
    isMongoConnected = false;
  }
}

export function getModel<T extends { _id?: string; createdAt?: string; updatedAt?: string }>(
  modelName: string,
  schema: Schema
): any {
  // If MongoDB is connected, return the standard mongoose model
  // If not, return our File-based Mock Model
  if (isMongoConnected) {
    try {
      return mongoose.model(modelName);
    } catch {
      return mongoose.model(modelName, schema);
    }
  } else {
    if (!mockModels[modelName]) {
      mockModels[modelName] = new MockModel<T>(modelName);
    }
    return mockModels[modelName];
  }
}

export function getDbMode(): string {
  return isMongoConnected ? 'MongoDB' : 'Local JSON Files';
}
