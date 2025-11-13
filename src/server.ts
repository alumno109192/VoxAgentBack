import mongoose from 'mongoose';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app';
import config from './config';
import logger from './utils/logger';

const server = http.createServer(app);

// Initialize Socket.IO if enabled
let io: SocketServer | null = null;

if (config.features.enableRealtime) {
  io = new SocketServer(server, {
    cors: {
      origin: config.cors.origin,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('Socket.IO initialized');
}

// Export io for use in other modules
export { io };

// Connect to MongoDB
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongo.uri);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  logger.info('Shutting down gracefully...');

  server.close(() => {
    logger.info('HTTP server closed');
  });

  await mongoose.connection.close();
  logger.info('MongoDB connection closed');

  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    server.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} in ${config.env} mode`);
      logger.info(`📊 Health check: http://localhost:${config.port}/health`);
      
      if (config.env !== 'production') {
        logger.info(`📚 API Docs: http://localhost:${config.port}/docs`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
