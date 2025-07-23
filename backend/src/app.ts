import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRoutes } from './routes';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
})); // Enable CORS
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use('/api', apiRoutes);


export default app; 