import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import config from '../config';

/**
 * Middleware to authenticate payment emulator requests
 * Only active when ALLOW_PAYMENT_EMULATION is enabled
 */
export const devEmulatorAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check if emulation is enabled
  const emulationEnabled = config.features.allowPaymentEmulation;
  
  if (!emulationEnabled) {
    res.status(403).json({
      error: 'Payment emulation is not enabled',
      hint: 'Set ALLOW_PAYMENT_EMULATION=true in environment variables',
    });
    return;
  }

  // Verify emulator key
  const emulatorKey = req.headers['x-emulator-key'] as string;
  const expectedKey = config.emulator.key;

  if (!expectedKey) {
    logger.error('EMULATOR_KEY not configured in environment');
    res.status(500).json({
      error: 'Emulator not properly configured',
    });
    return;
  }

  if (!emulatorKey || emulatorKey !== expectedKey) {
    logger.warn('Invalid emulator key attempt', {
      ip: req.ip,
      providedKey: emulatorKey ? 'provided' : 'missing',
    });
    
    res.status(401).json({
      error: 'Invalid or missing X-Emulator-Key header',
    });
    return;
  }

  // Log emulator access
  logger.debug('Emulator access authenticated', {
    ip: req.ip,
    path: req.path,
  });

  next();
};

/**
 * Middleware to check if payment emulation is allowed
 * Used for endpoints that support both real and emulated modes
 */
export const checkEmulationAllowed = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { testMode } = req.body;

  if (testMode) {
    const emulationEnabled = config.features.allowPaymentEmulation;
    
    if (!emulationEnabled) {
      res.status(403).json({
        error: 'Payment emulation is not enabled',
        hint: 'Set ALLOW_PAYMENT_EMULATION=true to use test mode',
      });
      return;
    }
  }

  next();
};
