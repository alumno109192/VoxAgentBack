import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Middleware para validar API Key del tenant
 * Usado en endpoints públicos del widget
 */

// Mock de API Keys por tenant (en producción estaría en BD)
const TENANT_API_KEYS: { [tenantId: string]: string } = {
  'test-tenant-001': 'vox_test_sk_1234567890abcdef',
  'tenant-456': 'vox_prod_sk_abcdef1234567890',
};

export const validateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const apiKey = req.headers['x-api-key'] as string || req.body.apiKey;
    const tenantId = req.query.tenantId as string || req.body.tenantId;

    if (!apiKey) {
      logger.warn('API key missing in widget request');
      return res.status(401).json({ 
        error: 'API key is required',
        message: 'Please provide your API key in the X-API-Key header or request body'
      });
    }

    if (!tenantId) {
      logger.warn('Tenant ID missing in widget request');
      return res.status(400).json({ 
        error: 'tenantId is required',
      });
    }

    // Validar que la API key corresponda al tenant
    const validApiKey = TENANT_API_KEYS[tenantId];
    
    if (!validApiKey) {
      logger.warn(`Unknown tenant: ${tenantId}`);
      return res.status(404).json({ 
        error: 'Tenant not found',
      });
    }

    if (apiKey !== validApiKey) {
      logger.warn(`Invalid API key for tenant: ${tenantId}`);
      return res.status(401).json({ 
        error: 'Invalid API key',
        message: 'The provided API key is not valid for this tenant'
      });
    }

    // API key válida - continuar
    logger.info(`API key validated for tenant: ${tenantId}`);
    next();
  } catch (error: any) {
    logger.error('Error validating API key:', error);
    res.status(500).json({ 
      error: 'Failed to validate API key',
    });
  }
};

/**
 * Middleware para validar origen del dominio (CORS adicional)
 * Verifica que el widget se cargue solo desde dominios autorizados
 */
export const validateWidgetOrigin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const origin = req.headers.origin || req.headers.referer;
    const tenantId = req.query.tenantId as string || req.body.tenantId;

    if (!origin) {
      // Permitir requests sin origen (por ejemplo, desde Postman/curl)
      return next();
    }

    // Obtener dominios permitidos para el tenant
    // En producción esto vendría de la configuración del widget
    const allowedDomains: { [key: string]: string[] } = {
      'test-tenant-001': [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://example.com',
        'https://www.example.com',
      ],
      'tenant-456': [
        'https://cliente.com',
        'https://www.cliente.com',
      ],
    };

    const allowed = allowedDomains[tenantId] || [];
    
    // Verificar si el origen está permitido
    const originUrl = new URL(origin);
    const originBase = `${originUrl.protocol}//${originUrl.host}`;
    
    if (!allowed.some(domain => originBase.startsWith(domain))) {
      logger.warn(`Unauthorized widget origin: ${originBase} for tenant: ${tenantId}`);
      return res.status(403).json({ 
        error: 'Unauthorized origin',
        message: 'Widget is not authorized to load from this domain'
      });
    }

    next();
  } catch (error: any) {
    logger.error('Error validating widget origin:', error);
    // En caso de error, permitir el request (fail-open para desarrollo)
    next();
  }
};

/**
 * Helper para obtener API key de un tenant (para documentación)
 */
export const getTenantApiKey = (tenantId: string): string | undefined => {
  return TENANT_API_KEYS[tenantId];
};

/**
 * Helper para agregar nueva API key (para testing)
 */
export const addTenantApiKey = (tenantId: string, apiKey: string): void => {
  TENANT_API_KEYS[tenantId] = apiKey;
  logger.info(`API key added for tenant: ${tenantId}`);
};
