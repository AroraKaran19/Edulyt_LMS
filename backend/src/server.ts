import app from './app';
import { connectDB, disconnectDB } from './config/database';
import dotenv from 'dotenv';
import { initializeS3 } from './config/s3';


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



    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Airkrit Backend Server is running on port ${PORT}`);
      console.log(`🌐 Health check available at: http://localhost:${PORT}/`);
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

