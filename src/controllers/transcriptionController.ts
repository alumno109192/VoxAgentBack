import { Request, Response } from 'express';
import vapiService from '../services/vapiService';
import logger from '../utils/logger';
import {
  TranscriptionRequest,
  TranscriptionResponse,
  TranscriptionSegment,
  VapiTranscriptEvent,
} from '../types/transcription';
import mockDataService from '../utils/mockDataService';

/**
 * Controller for audio transcription endpoints
 */

/**
 * Start a new VAPI transcription session
 * POST /transcription/session/start
 */
export const startSession = async (req: Request, res: Response): Promise<any> => {
  try {
    const { language = 'es-ES', tenantId, sessionId, metadata } = req.body;

    // Validar campos requeridos
    if (!tenantId || !sessionId) {
      return res.status(400).json({
        error: 'tenantId y sessionId son requeridos',
      });
    }

    logger.info('Starting VAPI session', {
      tenantId,
      sessionId,
      language,
    });

    // Crear sesión en VAPI
    const vapiSession = await vapiService.createSession(language, {
      tenantId,
      sessionId,
      ...metadata,
    });

    // Inicializar sesión de transcripción local
    await mockDataService.createTranscriptionSession(tenantId, sessionId);

    logger.info('VAPI session started successfully', {
      vapiSessionId: vapiSession.sessionId,
      sessionId,
      tenantId,
    });

    res.json({
      success: true,
      vapiSessionId: vapiSession.sessionId,
      sessionId,
      status: vapiSession.status,
      createdAt: vapiSession.createdAt,
    });
  } catch (error: any) {
    logger.error('Error starting VAPI session', {
      error: error.message,
      stack: error.stack,
    });

    // Determinar código de error apropiado
    const statusCode = error.message.includes('configurado') ? 503 : 500;

    res.status(statusCode).json({
      error: 'Error al iniciar sesión de transcripción',
      message: error.message,
    });
  }
};

/**
 * Send audio chunk to VAPI session
 * POST /transcription/vapi
 */
export const transcribeVapi = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      vapiSessionId,
      sessionId,
      tenantId,
      audioBlob,
      sequence,
    } = req.body;

    // Validar campos requeridos
    if (!vapiSessionId || !sessionId || !tenantId || !audioBlob) {
      return res.status(400).json({
        error: 'vapiSessionId, sessionId, tenantId y audioBlob son requeridos',
      });
    }

    logger.info('Processing VAPI transcription', {
      vapiSessionId,
      sessionId,
      tenantId,
      audioSize: audioBlob.length,
      sequence,
    });

    // Enviar audio a sesión VAPI
    const transcriptEvent = await vapiService.sendAudioToSession(
      vapiSessionId,
      audioBlob,
      sequence
    );

    // Si es transcripción final, guardar en base de datos
    if (transcriptEvent.isFinal) {
      const segment: TranscriptionSegment = {
        id: `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        tenantId,
        text: transcriptEvent.text,
        confidence: transcriptEvent.confidence,
        timestamp: transcriptEvent.timestamp,
        metadata: {
          audioSize: audioBlob.length,
          format: 'webm',
          engine: 'vapi',
          sequence,
        },
      };

      await mockDataService.addTranscriptionSegment(tenantId, sessionId, segment);
    }

    logger.info('VAPI transcription processed', {
      vapiSessionId,
      textLength: transcriptEvent.text.length,
      type: transcriptEvent.type,
      isFinal: transcriptEvent.isFinal,
    });

    res.json({
      text: transcriptEvent.text,
      type: transcriptEvent.type,
      isFinal: transcriptEvent.isFinal,
      confidence: transcriptEvent.confidence,
      timestamp: transcriptEvent.timestamp,
    });
  } catch (error: any) {
    logger.error('Error processing VAPI transcription', {
      error: error.message,
      stack: error.stack,
    });

    // Manejo de errores específicos
    if (error.message.includes('no encontrada')) {
      return res.status(404).json({
        error: 'Sesión no encontrada o expirada',
        message: error.message,
      });
    }

    if (error.message.includes('configurado')) {
      return res.status(503).json({
        error: 'Servicio de transcripción no disponible',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Error al procesar transcripción',
      message: error.message,
    });
  }
};

/**
 * End a VAPI transcription session
 * POST /transcription/session/end
 */
export const endSession = async (req: Request, res: Response): Promise<any> => {
  try {
    const { vapiSessionId, sessionId, tenantId } = req.body;

    // Validar campos requeridos
    if (!vapiSessionId || !sessionId || !tenantId) {
      return res.status(400).json({
        error: 'vapiSessionId, sessionId y tenantId son requeridos',
      });
    }

    logger.info('Ending VAPI session', {
      vapiSessionId,
      sessionId,
      tenantId,
    });

    // Finalizar sesión en VAPI
    await vapiService.endSession(vapiSessionId);

    // Obtener historial de la sesión
    const session = await mockDataService.getTranscriptionSession(tenantId, sessionId);

    logger.info('VAPI session ended successfully', {
      vapiSessionId,
      sessionId,
      totalSegments: session?.segments.length || 0,
    });

    res.json({
      success: true,
      sessionId,
      vapiSessionId,
      totalSegments: session?.segments.length || 0,
      endedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error ending VAPI session', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      error: 'Error al finalizar sesión',
      message: error.message,
    });
  }
};

/**
 * Transcribe audio segment
 */
export const transcribeSegment = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      sessionId,
      tenantId,
      audioBlob,
      format = 'webm',
      language = 'es-ES',
    } = req.body as TranscriptionRequest;

    // Validar campos requeridos
    if (!sessionId || !tenantId || !audioBlob) {
      return res.status(400).json({
        error: 'sessionId, tenantId y audioBlob son requeridos',
      });
    }

    logger.info('Processing transcription segment', {
      sessionId,
      tenantId,
      audioSize: audioBlob.length,
      format,
      language,
    });

    // Transcribir con VAPI
    const vapiResult = await vapiService.transcribeAudio(audioBlob, language);

    // Crear segmento de transcripción
    const segment: TranscriptionSegment = {
      id: `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      tenantId,
      text: vapiResult.text,
      confidence: vapiResult.confidence,
      duration: vapiResult.duration,
      timestamp: new Date().toISOString(),
      metadata: {
        audioSize: audioBlob.length,
        format,
        engine: 'vapi',
        cost: calculateTranscriptionCost(audioBlob.length, vapiResult.duration),
      },
    };

    // Guardar en JSON
    await mockDataService.addTranscriptionSegment(tenantId, sessionId, segment);

    // Preparar respuesta
    const response: TranscriptionResponse = {
      text: segment.text,
      segmentId: segment.id,
      confidence: segment.confidence,
      timestamp: segment.timestamp,
      metadata: {
        duration: segment.duration,
        cost: segment.metadata?.cost,
      },
    };

    logger.info('Transcription segment processed successfully', {
      segmentId: segment.id,
      textLength: segment.text.length,
      confidence: segment.confidence,
    });

    res.json(response);
  } catch (error: any) {
    logger.error('Error processing transcription segment', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      error: 'Error al procesar la transcripción',
      message: error.message,
    });
  }
};

/**
 * Get transcription session history
 */
export const getSessionHistory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { sessionId } = req.params;
    const { tenantId } = req.query;

    if (!sessionId || !tenantId) {
      return res.status(400).json({
        error: 'sessionId y tenantId son requeridos',
      });
    }

    const session = await mockDataService.getTranscriptionSession(tenantId as string, sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Sesión de transcripción no encontrada',
      });
    }

    res.json(session);
  } catch (error: any) {
    logger.error('Error getting transcription session', {
      error: error.message,
    });

    res.status(500).json({
      error: 'Error al obtener la sesión de transcripción',
    });
  }
};

/**
 * Get all transcription sessions for a tenant
 */
export const getAllSessions = async (req: Request, res: Response): Promise<any> => {
  try {
    const { tenantId } = req.query;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!tenantId) {
      return res.status(400).json({
        error: 'tenantId es requerido',
      });
    }

    const sessions = await mockDataService.getTranscriptionHistory(tenantId as string, limit);

    res.json({
      total: sessions.length,
      limit,
      sessions,
    });
  } catch (error: any) {
    logger.error('Error getting transcription sessions', {
      error: error.message,
    });

    res.status(500).json({
      error: 'Error al obtener las sesiones de transcripción',
    });
  }
};

/**
 * Get transcription statistics
 */
export const getTranscriptionStats = async (req: Request, res: Response): Promise<any> => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        error: 'tenantId es requerido',
      });
    }

    const sessions = await mockDataService.getTranscriptionHistory(tenantId as string);

    // Calcular estadísticas
    let totalSegments = 0;
    let totalDuration = 0;
    let totalCost = 0;
    let totalWords = 0;

    sessions.forEach((session: any) => {
      totalSegments += session.segments.length;
      session.segments.forEach((segment: any) => {
        totalDuration += segment.duration || 0;
        totalCost += segment.metadata?.cost || 0;
        totalWords += segment.text.split(/\s+/).length;
      });
    });

    const stats = {
      totalSessions: sessions.length,
      totalSegments,
      totalDuration: Math.round(totalDuration * 100) / 100,
      totalCost: Math.round(totalCost * 10000) / 10000,
      totalWords,
      averageSegmentsPerSession: sessions.length > 0 
        ? Math.round((totalSegments / sessions.length) * 10) / 10 
        : 0,
      averageDurationPerSegment: totalSegments > 0 
        ? Math.round((totalDuration / totalSegments) * 100) / 100 
        : 0,
    };

    res.json(stats);
  } catch (error: any) {
    logger.error('Error getting transcription stats', {
      error: error.message,
    });

    res.status(500).json({
      error: 'Error al obtener las estadísticas de transcripción',
    });
  }
};

/**
 * Health check for transcription service
 */
export const healthCheck = async (_req: Request, res: Response): Promise<any> => {
  try {
    const vapiHealth = await vapiService.checkHealth();

    res.json({
      status: 'ok',
      vapi: vapiHealth,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
};

/**
 * Helper: Calculate transcription cost
 */
function calculateTranscriptionCost(audioSize: number, duration?: number): number {
  // Cost based on audio duration
  // Example: $0.006 per minute (like Google Speech-to-Text)
  const durationInMinutes = (duration || audioSize / 10000) / 60;
  return Math.round(durationInMinutes * 0.006 * 10000) / 10000;
}
