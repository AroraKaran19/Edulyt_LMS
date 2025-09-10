import { Request, Response, NextFunction } from 'express';

/**
 * Timeout middleware for handling long-running operations
 * Prevents server freezing and provides graceful error handling
 */
export const timeoutMiddleware = (timeoutMs: number = 300000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set timeout for the request
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.error(`⏰ Request timeout after ${timeoutMs}ms:`, {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        });
        
        res.status(504).json({
          error: 'Request Timeout',
          message: 'The operation is taking longer than expected. Please try again or contact support.',
          code: 'OPERATION_TIMEOUT',
          timestamp: new Date().toISOString()
        });
      }
    }, timeoutMs);

    // Clear timeout when response is finished
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    // Clear timeout when response is closed
    res.on('close', () => {
      clearTimeout(timeout);
    });

    // Add timeout info to request for logging
    (req as any).timeoutMs = timeoutMs;
    (req as any).startTime = Date.now();

    next();
  };
};

/**
 * Specialized timeout middleware for course operations
 * Provides longer timeout and specific error messaging
 */
export const courseOperationTimeout = timeoutMiddleware(600000); // 10 minutes

/**
 * Progress tracking middleware for long operations
 * Sends periodic updates to prevent client timeout
 */
export const progressMiddleware = (req: Request, res: Response, next: NextFunction) => {
  let progressInterval: NodeJS.Timeout;
  let progressCount = 0;

  // Set up progress tracking for long operations
  if (req.method === 'POST' && (req.url.includes('/course') || req.url.includes('/upload'))) {
    // Send initial response headers for streaming
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    
    // Send periodic progress updates
    progressInterval = setInterval(() => {
      if (!res.headersSent) {
        progressCount++;
        const progressData = {
          status: 'processing',
          progress: Math.min(progressCount * 5, 95), // Max 95% until completion
          message: 'Processing course data...',
          timestamp: new Date().toISOString()
        };
        
        try {
          res.write(`data: ${JSON.stringify(progressData)}\n\n`);
        } catch (error) {
          console.error('Error sending progress update:', error);
          clearInterval(progressInterval);
        }
      } else {
        clearInterval(progressInterval);
      }
    }, 5000); // Send update every 5 seconds
  }

  // Clean up interval on response finish
  res.on('finish', () => {
    if (progressInterval) {
      clearInterval(progressInterval);
    }
  });

  res.on('close', () => {
    if (progressInterval) {
      clearInterval(progressInterval);
    }
  });

  next();
};

/**
 * Memory monitoring middleware
 * Logs memory usage for performance tracking
 */
export const memoryMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startMemory = process.memoryUsage();
  const startTime = Date.now();

  res.on('finish', () => {
    const endMemory = process.memoryUsage();
    const duration = Date.now() - startTime;
    
    // Log memory usage for long operations
    if (duration > 10000) { // Log operations longer than 10 seconds
      console.log('📊 Memory Usage Report:', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        memoryDelta: {
          rss: `${((endMemory.rss - startMemory.rss) / 1024 / 1024).toFixed(2)}MB`,
          heapUsed: `${((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2)}MB`,
          heapTotal: `${((endMemory.heapTotal - startMemory.heapTotal) / 1024 / 1024).toFixed(2)}MB`,
        },
        currentMemory: {
          rss: `${(endMemory.rss / 1024 / 1024).toFixed(2)}MB`,
          heapUsed: `${(endMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
          heapTotal: `${(endMemory.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        }
      });
      
      // Suggest garbage collection for high memory usage
      if (endMemory.heapUsed > 500 * 1024 * 1024) { // > 500MB
        console.warn('⚠️ High memory usage detected, suggesting garbage collection');
        if (global.gc) {
          global.gc();
        }
      }
    }
  });

  next();
};