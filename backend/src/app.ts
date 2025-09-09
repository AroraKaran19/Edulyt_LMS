import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import courseRoutes from "./routes/course.routes";
import uploadRoutes from "./routes/upload.routes";
import authRoutes from "./routes/auth.routes";
import paymentRoutes from "./routes/payment.routes";
import cleanupRoutes from "./routes/cleanup.routes";

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Middleware
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
app.use("/api/upload", uploadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/cleanup", cleanupRoutes);

export default app;
