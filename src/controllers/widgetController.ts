import { Request, Response } from 'express';
import mockDataService from '../utils/mockDataService';
import logger from '../utils/logger';
import { WidgetQueryRequest, WidgetQueryResponse, WidgetInteraction } from '../types/widget';

/**
 * Widget Controllers
 * Endpoints públicos para el widget embebible
 */

/**
 * GET /widget/config
 * Obtener configuración del widget para un tenant
 */
export const getWidgetConfig = async (req: Request, res: Response): Promise<any> => {
  try {
    const { tenantId } = req.query;

    if (!tenantId || typeof tenantId !== 'string') {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    const config = await mockDataService.getWidgetConfig(tenantId);
    
    logger.info(`Widget config retrieved for tenant: ${tenantId}`);
    
    res.json(config);
  } catch (error: any) {
    logger.error('Error getting widget config:', error);
    res.status(500).json({ error: 'Failed to get widget configuration' });
  }
};

/**
 * PUT /widget/config
 * Actualizar configuración del widget (requiere auth)
 */
export const updateWidgetConfig = async (req: Request, res: Response): Promise<any> => {
  try {
    const { tenantId } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    const config = await mockDataService.updateWidgetConfig(tenantId, req.body);
    
    logger.info(`Widget config updated for tenant: ${tenantId}`);
    
    res.json(config);
  } catch (error: any) {
    logger.error('Error updating widget config:', error);
    res.status(500).json({ error: 'Failed to update widget configuration' });
  }
};

/**
 * POST /widget/query
 * Procesar consulta desde el widget (requiere API Key)
 */
export const processWidgetQuery = async (req: Request, res: Response): Promise<any> => {
  try {
    const { tenantId, query, mode = 'text', sessionId, agentId } = req.body as WidgetQueryRequest;

    if (!tenantId || !query) {
      return res.status(400).json({ error: 'tenantId and query are required' });
    }

    // Verificar límite de consultas diarias
    const config = await mockDataService.getWidgetConfig(tenantId);
    if (!config.enabled) {
      return res.status(403).json({ error: 'Widget is disabled for this tenant' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await mockDataService.getWidgetInteractionsCount(tenantId, today);

    if (todayCount >= (config.maxQueriesPerDay || 100)) {
      logger.warn(`Widget query limit exceeded for tenant: ${tenantId}`);
      return res.status(429).json({ 
        error: 'Daily query limit exceeded',
        limit: config.maxQueriesPerDay || 100
      });
    }

    // Simular respuesta de VoxAgentAI
    const response = generateMockResponse(query, config.language);
    const tokens = Math.floor(query.length / 4) + Math.floor(response.length / 4);
    const cost = tokens * 0.00001;
    const duration = Math.random() * 2 + 0.5;

    const interaction: WidgetInteraction = {
      id: `widget-int-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      agentId,
      sessionId,
      query,
      response,
      mode: mode as 'text' | 'voice',
      metadata: {
        tokens,
        cost,
        duration,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      },
      timestamp: new Date().toISOString(),
    };

    // Guardar interacción
    await mockDataService.addWidgetInteraction(tenantId, interaction);

    // También guardar en VoxAgentAI si está disponible
    try {
      await mockDataService.addVoxAgentAIInteraction(tenantId, {
        id: interaction.id,
        tenantId,
        agentId: agentId || 'widget-agent',
        query,
        response,
        mode,
        metadata: {
          tokens,
          cost,
          duration,
          source: 'widget',
        },
        timestamp: interaction.timestamp,
      });
    } catch (error) {
      logger.warn('Failed to save to VoxAgentAI history:', error);
    }

    logger.info(`Widget query processed for tenant: ${tenantId}, session: ${sessionId}`);

    const responseData: WidgetQueryResponse = {
      response,
      timestamp: interaction.timestamp,
      mode: mode as 'text' | 'voice',
      metadata: {
        tokens,
        cost,
        duration,
      },
    };

    res.json(responseData);
  } catch (error: any) {
    logger.error('Error processing widget query:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
};

/**
 * GET /widget/interactions
 * Obtener historial de interacciones del widget (requiere auth)
 */
export const getWidgetInteractions = async (req: Request, res: Response): Promise<any> => {
  try {
    const { tenantId } = req.query;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    if (!tenantId || typeof tenantId !== 'string') {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    const interactions = await mockDataService.getWidgetInteractions(tenantId, limit);
    
    logger.info(`Widget interactions retrieved for tenant: ${tenantId}, count: ${interactions.length}`);
    
    res.json({
      interactions,
      total: interactions.length,
    });
  } catch (error: any) {
    logger.error('Error getting widget interactions:', error);
    res.status(500).json({ error: 'Failed to get interactions' });
  }
};

/**
 * GET /widget/stats
 * Obtener estadísticas de uso del widget (requiere auth)
 */
export const getWidgetStats = async (req: Request, res: Response): Promise<any> => {
  try {
    const { tenantId } = req.query;

    if (!tenantId || typeof tenantId !== 'string') {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    const interactions = await mockDataService.getWidgetInteractions(tenantId);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayInteractions = interactions.filter(i => new Date(i.timestamp) >= today);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const monthInteractions = interactions.filter(i => new Date(i.timestamp) >= thisMonth);

    const totalCost = interactions.reduce((sum, i) => sum + (i.metadata?.cost || 0), 0);
    const totalTokens = interactions.reduce((sum, i) => sum + (i.metadata?.tokens || 0), 0);

    const stats = {
      tenantId,
      total: interactions.length,
      today: todayInteractions.length,
      thisMonth: monthInteractions.length,
      totalCost: parseFloat(totalCost.toFixed(4)),
      totalTokens,
      byMode: {
        text: interactions.filter(i => i.mode === 'text').length,
        voice: interactions.filter(i => i.mode === 'voice').length,
      },
      lastInteraction: interactions.length > 0 ? interactions[interactions.length - 1].timestamp : null,
    };

    logger.info(`Widget stats retrieved for tenant: ${tenantId}`);
    
    res.json(stats);
  } catch (error: any) {
    logger.error('Error getting widget stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
};

/**
 * Helper: Generar respuesta simulada
 */
function generateMockResponse(query: string, language: string): string {
  const lowerQuery = query.toLowerCase();
  
  const responses: { [key: string]: { [lang: string]: string } } = {
    greeting: {
      'es-ES': '¡Hola! Soy tu asistente virtual. Estoy aquí para ayudarte con cualquier pregunta que tengas.',
      'en-US': 'Hello! I\'m your virtual assistant. I\'m here to help you with any questions you may have.',
    },
    hours: {
      'es-ES': 'Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00 horas.',
      'en-US': 'Our business hours are Monday to Friday from 9:00 AM to 6:00 PM.',
    },
    contact: {
      'es-ES': 'Puedes contactarnos por email a soporte@empresa.com o llamar al +34 900 123 456.',
      'en-US': 'You can contact us by email at support@company.com or call +1 800 123 4567.',
    },
    pricing: {
      'es-ES': 'Ofrecemos varios planes adaptados a tus necesidades. ¿Te gustaría conocer más detalles sobre algún plan específico?',
      'en-US': 'We offer various plans tailored to your needs. Would you like to know more about any specific plan?',
    },
    features: {
      'es-ES': 'Nuestro servicio incluye atención 24/7, integración con múltiples plataformas y análisis detallados en tiempo real.',
      'en-US': 'Our service includes 24/7 support, integration with multiple platforms, and detailed real-time analytics.',
    },
  };

  // Detectar tipo de consulta
  if (lowerQuery.includes('hola') || lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
    return responses.greeting[language] || responses.greeting['es-ES'];
  }
  if (lowerQuery.includes('horario') || lowerQuery.includes('hours') || lowerQuery.includes('schedule')) {
    return responses.hours[language] || responses.hours['es-ES'];
  }
  if (lowerQuery.includes('contacto') || lowerQuery.includes('contact') || lowerQuery.includes('teléfono')) {
    return responses.contact[language] || responses.contact['es-ES'];
  }
  if (lowerQuery.includes('precio') || lowerQuery.includes('plan') || lowerQuery.includes('pricing') || lowerQuery.includes('cost')) {
    return responses.pricing[language] || responses.pricing['es-ES'];
  }
  if (lowerQuery.includes('funcionalidad') || lowerQuery.includes('característica') || lowerQuery.includes('features')) {
    return responses.features[language] || responses.features['es-ES'];
  }

  // Respuesta genérica
  const genericResponses: { [key: string]: string } = {
    'es-ES': `Gracias por tu pregunta sobre "${query}". Un miembro de nuestro equipo te ayudará con información detallada. ¿Hay algo más en lo que pueda ayudarte?`,
    'en-US': `Thank you for your question about "${query}". A member of our team will help you with detailed information. Is there anything else I can help you with?`,
  };

  return genericResponses[language] || genericResponses['es-ES'];
}
