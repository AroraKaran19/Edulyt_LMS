import app from './app';
import { connectDB, disconnectDB } from './config/database';

const PORT = process.env.PORT || 5000;

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    console.log("LODA Connecting to MongoDB");
    await connectDB();
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Edulyt Backend Server is running on port ${PORT}`);
      console.log(`🌐 Health check available at: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('🔄 SIGTERM received, shutting down gracefully...');
      await disconnectDB();
      server.close(() => {
        console.log('👋 Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('🔄 SIGINT received, shutting down gracefully...');
      await disconnectDB();
      server.close(() => {
        console.log('👋 Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

