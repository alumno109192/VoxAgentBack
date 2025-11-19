import { Request, Response } from 'express';
import vapiService from '../services/vapiService';
import logger from '../utils/logger';
import {
  TranscriptionRequest,
  TranscriptionResponse,
  TranscriptionSegment,
} from '../types/transcription';
import mockDataService from '../utils/mockDataService';

/**
 * Controller for audio transcription endpoints
 */

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
