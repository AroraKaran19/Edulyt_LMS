import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Edulyt Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health'
    }
  });
});

export default app; 