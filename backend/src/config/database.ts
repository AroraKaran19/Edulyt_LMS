import mongoose from "mongoose";

// MongoDB connection configuration
const connectDB = async (): Promise<void> => {
  try {
    // Check multiple possible environment variable names
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error(`MONGODB_URI is not defined in environment variables.`);
    }

    console.log("🔄 Connecting to MongoDB...");
    const conn = await mongoose.connect(mongoUri, {
      // Connection pool settings for better performance
      maxPoolSize: 20, // Maximum number of connections in the pool
      minPoolSize: 5,  // Minimum number of connections in the pool
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 10000, // How long to try selecting a server
      socketTimeoutMS: 600000, // 10 minutes socket timeout for large operations
      connectTimeoutMS: 10000, // 10 seconds connection timeout
      bufferCommands: false, // Disable mongoose buffering
    });

    console.log(`🔗 MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on("connected", () => {
      console.log("✅ Mongoose connected to MongoDB");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ Mongoose connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️  Mongoose disconnected from MongoDB");
    });
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

// Graceful shutdown
const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log("🔒 MongoDB connection closed");
  } catch (error) {
    console.error("❌ Error closing MongoDB connection:", error);
  }
};

export { connectDB, disconnectDB };
