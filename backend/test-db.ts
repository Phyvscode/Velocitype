import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || '';
console.log(`Testing MongoDB connection to: ${uri}`);

mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 })
  .then(() => {
    console.log('SUCCESS! Connected to real MongoDB.');
    process.exit(0);
  })
  .catch(err => {
    console.error('FAILED to connect to MongoDB:', err.message);
    process.exit(1);
  });
