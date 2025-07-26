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
      // Remove deprecated options that are no longer needed in Mongoose 6+
      // useNewUrlParser and useUnifiedTopology are now default
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
