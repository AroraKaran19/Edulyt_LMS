import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import courseRoutes from './routes/course.routes';
import uploadRoutes from './routes/upload.routes';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
})); // Enable CORS
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Edulyt Backend Server is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/courses', courseRoutes);
app.use('/api/upload', uploadRoutes);

export default app; 