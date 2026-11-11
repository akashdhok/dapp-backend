import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongodInstance = null;

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dapp_db';
  try {
    console.log(`Connecting to MongoDB at: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('✅ Connected to MongoDB successfully.');
  } catch (err) {
    console.warn(`⚠️ Could not connect to local/external MongoDB (${err.message}). Starting in-memory MongoDB server...`);
    try {
      mongodInstance = await MongoMemoryServer.create();
      const inMemoryUri = mongodInstance.getUri();
      await mongoose.connect(inMemoryUri);
      console.log(`✅ In-Memory MongoDB running at: ${inMemoryUri}`);
    } catch (memErr) {
      console.error('❌ Failed to start In-Memory MongoDB:', memErr.message);
      process.exit(1);
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (error) {
    console.error('Error disconnecting DB:', error);
  }
};

