import app from './app';
import { connectDB, disconnectDB } from './config/database';
import dotenv from 'dotenv';
import { initializeS3 } from './config/s3';
import { CronService } from './services/cron.service';

dotenv.config();

if (!process.env.PORT) {
  throw new Error('PORT is not defined in environment variables');
}

const PORT = process.env.PORT || 8080;

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    await initializeS3();

    // Initialize and start cleanup cron job
    const cronService = new CronService();
    const cleanupInterval = process.env.CLEANUP_INTERVAL_MINUTES ? parseInt(process.env.CLEANUP_INTERVAL_MINUTES) : 5;
    cronService.startCleanupCron(cleanupInterval);
    console.log(`🧹 Cleanup cron job started with ${cleanupInterval} minute interval`);

    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Edulyt Backend Server is running on port ${PORT}`);
      console.log(`🌐 Health check available at: http://localhost:${PORT}/health`);
    });

    // Configure server timeouts to prevent 504 errors
    server.timeout = 600000; // 10 minutes for large course creation
    server.keepAliveTimeout = 65000; // 65 seconds
    server.headersTimeout = 66000; // 66 seconds (must be > keepAliveTimeout)
    
    console.log(`⏱️  Server timeout configured: ${server.timeout / 1000}s`);
    console.log(`🔄 Keep-alive timeout: ${server.keepAliveTimeout / 1000}s`);

    // Gracefully shutdown the server
    process.on('SIGTERM', () => {
      console.log('🔄 Shutting down server...');
      server.close(() => {
        console.log('🔒 Server closed');
        disconnectDB();
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

