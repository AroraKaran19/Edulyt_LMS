import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
})); // Enable CORS
app.use(express.json({ limit: '5gb' })); // Parse JSON bodies with 5GB limit
app.use(express.urlencoded({ extended: true, limit: '5gb' })); // Parse URL-encoded bodies with 5GB limit

// Routes
app.use('/api', apiRoutes);


export default app; 