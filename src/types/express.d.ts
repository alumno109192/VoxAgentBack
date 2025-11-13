import { Request } from 'express';
import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
      tenantId?: string;
      requestId?: string;
    }
  }
}

export {};
