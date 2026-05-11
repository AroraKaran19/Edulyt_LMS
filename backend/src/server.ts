import app from "./app";
import { connectDB, disconnectDB } from "./config/database";
import dotenv from "dotenv";
import { initializeS3 } from "./config/s3";
import { initializeCronJobs } from "./services/cron.services";
import { startCertificateWorker } from "./workers/certificate.worker";
import { startCollaborationWorker } from "./workers/collaboration.worker";
import { startOfferLetterWorker } from "./workers/offerLetter.worker";

dotenv.config();

if (!process.env.PORT) {
  throw new Error("PORT is not defined in environment variables");
}

const PORT = process.env.PORT || 8080;

const RUN_BACKGROUND_JOBS = process.env.RUN_BACKGROUND_JOBS !== "false";

const startServer = async () => {
  try {
    await connectDB();
    await initializeS3();

    if (RUN_BACKGROUND_JOBS) {
      initializeCronJobs();
      startCertificateWorker();
      startCollaborationWorker();
      startOfferLetterWorker();
    } else {
      console.log("⏭️  Skipping cron & worker (RUN_BACKGROUND_JOBS=false, running behind load balancer)");
    }

    const server = app.listen(PORT, () => {
      console.log(`🚀 Airkrit Backend Server is running on port ${PORT}`);
      console.log(`🌐 Health check available at: http://localhost:${PORT}/`);
    });

    // Gracefully shutdown the server
    process.on("SIGTERM", () => {
      console.log("🔄 Shutting down server...");
      server.close(() => {
        console.log("🔒 Server closed");
        disconnectDB();
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
