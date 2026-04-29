// config/db.js
//Uses Mongoose to connect to MongoDB using process.env.MONGO_URI.
//Logs a success message showing the host on connection.
// Exits process if connection fails (so you’ll notice and fix credentials).

import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
