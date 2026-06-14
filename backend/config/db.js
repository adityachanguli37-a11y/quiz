const mongoose = require('mongoose');

const connectLocal = async () => {
  try {
    const localUri = 'mongodb://127.0.0.1:27017/cyber_quiz';
    const conn = await mongoose.connect(localUri);
    console.log(`Local MongoDB Connected successfully to host: ${conn.connection.host}`);
  } catch (localErr) {
    console.error(`Database Connection Failure (Atlas & Local): ${localErr.message}`);
    process.exit(1);
  }
};

const connectDB = async () => {
  const dbUri = process.env.MONGODB_URI;
  if (!dbUri) {
    console.warn('MONGODB_URI environment variable is not defined. Falling back to local database...');
    return await connectLocal();
  }

  try {
    const conn = await mongoose.connect(dbUri);
    console.log(`MongoDB Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`MongoDB Atlas Connection Failure: ${error.message}`);
    console.log('Attempting connection to local MongoDB fallback...');
    await connectLocal();
  }
};

module.exports = connectDB;
