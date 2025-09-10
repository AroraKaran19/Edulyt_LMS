import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import courseRoutes from "./routes/course.routes";
import jobRoutes from "./routes/job.routes";
import uploadRoutes from "./routes/upload.routes";
import authRoutes from "./routes/auth.routes";
import paymentRoutes from "./routes/payment.routes";
import cleanupRoutes from "./routes/cleanup.routes";

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Request timeout middleware for long-running operations
const requestTimeout = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Set longer timeout for course creation endpoints
  if (req.path.includes('/courses') && req.method === 'POST') {
    req.setTimeout(600000); // 10 minutes for course creation
    res.setTimeout(600000);
  } else {
    req.setTimeout(120000); // 2 minutes for other operations
    res.setTimeout(120000);
  }
  
  req.on('timeout', () => {
    console.error(`⏰ Request timeout for ${req.method} ${req.path}`);
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: 'Request timeout - Operation took too long to complete',
        error: 'TIMEOUT'
      });
    }
  });
  
  next();
};

// Middleware
app.use(requestTimeout); // Apply timeout middleware first
app.use(
  cors({
    origin: true,
    credentials: true,
  })
); // Enable CORS
app.use(express.json({ limit: "100mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "100mb" })); // Parse URL-encoded bodies

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Edulyt Backend Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/courses", courseRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/cleanup", cleanupRoutes);

export default app;
