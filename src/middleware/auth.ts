import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import config from '../config';
import User, { IUser } from '../models/User';
import logger from '../utils/logger';
import jsonDataSource from '../utils/jsonDataSource';

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
  tenantId?: string;
  role?: string;
  requestId?: string;
  file?: Express.Multer.File;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      tenantId: string;
      role: string;
    };

    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      // Use JSON data source when MongoDB is not available
      const user = jsonDataSource.findUserById(decoded.userId);

      if (!user || !user.isActive) {
        res.status(401).json({ error: 'Invalid or inactive user' });
        return;
      }

      // Create a user-like object for req.user
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      } as any;
      
      req.userId = user.id;
      req.tenantId = user.tenantId;
      req.role = user.role;

      next();
      return;
    }

    // Use MongoDB when available
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid or inactive user' });
      return;
    }

    req.user = user;
    req.userId = user.id;
    req.tenantId = user.tenantId.toString();
    req.role = user.role;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};
