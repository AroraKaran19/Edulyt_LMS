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
    // Pool sizing matters because EVERY Node process keeps its own pool. Total
    // open connections to the cluster ≈
    //     (PM2 api instances + worker processes) × maxPoolSize × app servers
    // and must stay under the cluster's connection cap (Atlas M0/Flex ≈ 500,
    // M10 ≈ 1500). With 4 api + 2 workers, maxPoolSize=10 ⇒ ~60 conns/server.
    // Override per environment via DB_MAX_POOL_SIZE / DB_MIN_POOL_SIZE.
    const maxPoolSize = Math.max(1, Number(process.env.DB_MAX_POOL_SIZE) || 10);
    const minPoolSize = Math.min(
      maxPoolSize,
      Math.max(0, Number(process.env.DB_MIN_POOL_SIZE ?? 1)),
    );
    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize,
      minPoolSize,
      maxIdleTimeMS: 30000, // Reclaim idle connections after 30s
      serverSelectionTimeoutMS: 10000, // How long to try selecting a server
      socketTimeoutMS: 600000, // 10 minutes socket timeout for large operations
      connectTimeoutMS: 10000, // 10 seconds connection timeout
      bufferCommands: false, // Disable mongoose buffering
    });
    console.log(
      `⚙️  Mongo pool: max=${maxPoolSize} min=${minPoolSize} per process`,
    );

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
