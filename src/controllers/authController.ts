import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User';
import config from '../config';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import jsonDataSource from '../utils/jsonDataSource';

/**
 * User login
 * POST /auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      // Use JSON data source when MongoDB is not available
      logger.info('Using JSON data source for authentication');
      
      const user = jsonDataSource.findUserByEmail(email);

      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.hashedPassword);

      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate tokens
      const accessToken = jwt.sign(
        {
          userId: user.id,
          tenantId: user.tenantId,
          role: user.role,
        },
        config.jwt.secret as string,
        { expiresIn: config.jwt.accessExpires } as any
      );

      const refreshToken = jwt.sign(
        {
          userId: user.id,
          type: 'refresh',
        },
        config.jwt.secret as string,
        { expiresIn: config.jwt.refreshExpires } as any
      );

      logger.info(`User logged in (JSON): ${user.email}`);

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        },
      });
      return;
    }

    // Use MongoDB when available
    const user = await User.findOne({ email, isActive: true })
      .select('+hashedPassword')
      .populate('tenantId');

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.hashedPassword);

    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate tokens
    const accessToken = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
      },
      config.jwt.secret as string,
      { expiresIn: config.jwt.accessExpires } as any
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        type: 'refresh',
      },
      config.jwt.secret as string,
      { expiresIn: config.jwt.refreshExpires } as any
    );

    // Save refresh token
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${user.email}`);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Refresh access token
 * POST /auth/refresh
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.secret) as {
      userId: string;
      type: string;
    };

    if (decoded.type !== 'refresh') {
      res.status(401).json({ error: 'Invalid token type' });
      return;
    }

    // Find user
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken || !user.isActive) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
      },
      config.jwt.secret as string,
      { expiresIn: config.jwt.accessExpires } as any
    );

    res.json({ accessToken });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

/**
 * User logout
 * POST /auth/logout
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.userId) {
      await User.findByIdAndUpdate(req.userId, { $unset: { refreshToken: 1 } });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};
