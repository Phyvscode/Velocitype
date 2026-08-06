import mongoose from 'mongoose';
export const connectDB = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/velocitype';
    const forceMemoryDb = process.env.USE_MEMORY_DB === 'true';
    if (!forceMemoryDb) {
        try {
            console.log(`Connecting to MongoDB at: ${uri}...`);
            await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 3000,
            });
            console.log('MongoDB Connected successfully!');
            return;
        }
        catch (err) {
            console.warn(`Could not connect to external MongoDB (${err.message}).`);
        }
    }
    // Fallback to mongodb-memory-server if local/remote MongoDB is not reachable
    try {
        console.log('Starting in-memory MongoDB server as fallback...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        const memUri = mongoServer.getUri();
        await mongoose.connect(memUri);
        console.log(`In-memory MongoDB Connected successfully at: ${memUri}`);
    }
    catch (memErr) {
        console.error('Failed to initialize in-memory MongoDB:', memErr.message);
    }
};
