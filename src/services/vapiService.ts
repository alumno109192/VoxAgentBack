import axios from 'axios';
import config from '../config';
import logger from '../utils/logger';
import {
  VapiTranscriptionResponse,
  VapiSessionResponse,
  VapiTranscriptEvent,
} from '../types/transcription';

/**
 * VAPI Service - Integration with VAPI API for transcription using sessions
 */
class VapiService {
  private apiUrl: string;
  private publicKey: string;
  private assistantId: string;
  private apiKey?: string;
  private sessionTimeout: number;
  private activeSessions: Map<string, { sessionId: string; createdAt: Date; transcripts: VapiTranscriptEvent[] }>;

  constructor() {
    this.apiUrl = config.vapi?.apiUrl || 'https://api.vapi.ai';
    this.publicKey = config.vapi?.publicKey || '209ac772-6752-4407-9740-84afdfc7a41c';
    this.assistantId = config.vapi?.assistantId || '0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf';
    this.apiKey = config.vapi?.apiKey;
    this.sessionTimeout = parseInt(process.env.VAPI_SESSION_TIMEOUT || '300', 10);
    this.activeSessions = new Map();
  }

  /**
   * Get VAPI widget configuration for frontend
   */
  getWidgetConfig() {
    return {
      publicKey: this.publicKey,
      assistantId: this.assistantId,
      apiUrl: this.apiUrl,
    };
  }

  /**
   * Create a new VAPI session (local tracking only - VAPI is stateless)
   */
  async createSession(language: string = 'es-ES', metadata?: Record<string, any>): Promise<VapiSessionResponse> {
    try {
      logger.info('Creating local VAPI session', { language, metadata });

      // Verificar que VAPI esté configurado
      if (!this.apiKey || this.apiKey === 'mock') {
        throw new Error('VAPI API key no configurada. Configure VAPI_API_KEY en .env');
      }

      // Generar ID de sesión local (VAPI es stateless, solo usamos /v1/transcriptions)
      const sessionId = `vapi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Almacenar sesión activa localmente para tracking
      this.activeSessions.set(sessionId, {
        sessionId,
        createdAt: new Date(),
        transcripts: [],
      });

      const sessionResponse: VapiSessionResponse = {
        sessionId,
        status: 'active',
        createdAt: new Date().toISOString(),
        assistantId: this.assistantId,
      };

      logger.info('Local VAPI session created', {
        sessionId,
        language,
        note: 'VAPI es stateless, sesión solo para tracking local',
      });

      return sessionResponse;
    } catch (error: any) {
      logger.error('Error creating local VAPI session', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send audio chunk to VAPI and get transcription (stateless)
   */
  async sendAudioToSession(sessionId: string, audioBlob: string, sequence?: number): Promise<VapiTranscriptEvent> {
    try {
      logger.info('Sending audio to VAPI (stateless)', {
        sessionId,
        audioSize: audioBlob.length,
        sequence,
      });

      // Verificar que VAPI esté configurado
      if (!this.apiKey || this.apiKey === 'mock') {
        throw new Error('VAPI API key no configurada. Configure VAPI_API_KEY en .env');
      }

      // Usar endpoint /v1/transcriptions de VAPI (stateless)
      const payload = {
        audio: audioBlob,
        language: 'es-ES',
        assistantId: this.assistantId,
      };

      const response = await axios.post(
        `${this.apiUrl}/v1/transcriptions`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        }
      );

      // Convertir respuesta de VAPI a formato VapiTranscriptEvent
      const transcriptEvent: VapiTranscriptEvent = {
        type: 'final',
        text: response.data.text || '',
        timestamp: new Date().toISOString(),
        confidence: response.data.confidence,
        isFinal: true,
      };

      // Almacenar transcripción en la sesión local
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.transcripts.push(transcriptEvent);
      }

      logger.info('Audio transcribed successfully with VAPI', {
        sessionId,
        textLength: transcriptEvent.text.length,
        confidence: transcriptEvent.confidence,
      });

      return transcriptEvent;
    } catch (error: any) {
      logger.error('Error sending audio to VAPI', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        sessionId,
      });

      if (error.response?.status === 404) {
        throw new Error('Endpoint de VAPI no encontrado. Verifique VAPI_API_URL');
      }

      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Autenticación VAPI falló. Verifique VAPI_API_KEY');
      }

      throw new Error(`Error al transcribir con VAPI: ${error.message}`);
    }
  }

  /**
   * End a VAPI session (cleanup local tracking)
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      logger.info('Ending VAPI session (local cleanup)', { sessionId });

      // Solo eliminar del tracking local (VAPI es stateless)
      this.activeSessions.delete(sessionId);

      logger.info('VAPI session ended (local tracking cleaned)', { sessionId });
    } catch (error: any) {
      logger.error('Error ending VAPI session', {
        error: error.message,
        sessionId,
      });

      // Eliminar de todas formas
      this.activeSessions.delete(sessionId);

      throw new Error('Error al finalizar sesión VAPI');
    }
  }

  /**
   * Get session transcripts history
   */
  getSessionTranscripts(sessionId: string): VapiTranscriptEvent[] {
    const session = this.activeSessions.get(sessionId);
    return session?.transcripts || [];
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    this.activeSessions.forEach((session, sessionId) => {
      const elapsed = (now.getTime() - session.createdAt.getTime()) / 1000;
      if (elapsed > this.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    });

    expiredSessions.forEach(sessionId => {
      logger.info('Cleaning up expired session', { sessionId });
      this.endSession(sessionId).catch(err => {
        logger.error('Error cleaning up expired session', {
          sessionId,
          error: err.message,
        });
      });
    });
  }

  /**
   * Transcribe audio using VAPI API (legacy method - use sessions instead)
   * @deprecated Use createSession() and sendAudioToSession() instead
   */
  async transcribeAudio(audioBlob: string, language: string = 'es-ES'): Promise<VapiTranscriptionResponse> {
    try {
      logger.info('Transcribing audio with VAPI (legacy)', {
        audioSize: audioBlob.length,
        language,
      });

      // Si VAPI no está configurado, usar transcripción mock
      if (!this.apiKey || this.apiKey === 'mock') {
        logger.warn('VAPI not configured, using mock transcription');
        return this.mockTranscribe(audioBlob, language);
      }

      // Payload según especificación de VAPI /v1/transcriptions
      const payload = {
        audio: audioBlob, // audio en base64
        language: language,
        assistantId: this.assistantId,
      };

      const response = await axios.post<VapiTranscriptionResponse>(
        `${this.apiUrl}/v1/transcriptions`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      logger.info('VAPI transcription successful', {
        textLength: response.data.text?.length || 0,
        confidence: response.data.confidence,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error transcribing with VAPI', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      // Fallback to mock if VAPI fails
      if (error.response?.status === 401 || error.response?.status === 403) {
        logger.warn('VAPI authentication failed, using mock transcription');
        return this.mockTranscribe(audioBlob, language);
      }

      throw new Error('Error al transcribir audio con VAPI');
    }
  }

  /**
   * Mock transcription for development/testing
   */
  private mockTranscribe(audioBlob: string, _language: string): VapiTranscriptionResponse {
    // Generar texto mock basado en el tamaño del audio
    const audioSize = audioBlob.length;
    const mockTexts = [
      'Hola, ¿cómo estás?',
      '¿Cuál es el horario de atención?',
      'Necesito información sobre sus servicios',
      'Quisiera hacer una consulta',
      '¿Tienen disponibilidad para mañana?',
      'Me gustaría agendar una cita',
      'Gracias por la información',
      '¿Cuánto cuesta el servicio?',
      'Estoy interesado en contratar',
      '¿Pueden ayudarme con una duda?',
    ];

    const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
    const mockDuration = Math.floor(audioSize / 10000); // Aproximar duración

    return {
      text: randomText,
      confidence: 0.85 + Math.random() * 0.14, // 0.85 - 0.99
      duration: mockDuration,
      words: randomText.split(' ').map((word, index) => ({
        word,
        start: index * 0.5,
        end: (index + 1) * 0.5,
        confidence: 0.90 + Math.random() * 0.09,
      })),
    };
  }

  /**
   * Check VAPI service health
   */
  async checkHealth(): Promise<{ status: 'ok' | 'error'; configured: boolean; message?: string }> {
    const configured = !!(this.apiKey && this.apiKey !== 'mock');
    
    if (!configured) {
      return { 
        status: 'error', 
        configured: false,
        message: 'VAPI_API_KEY no configurada' 
      };
    }

    // Solo validar que las credenciales estén configuradas
    // No hacer request real porque requiere audio válido
    return { 
      status: 'ok', 
      configured: true,
      message: 'VAPI configurado correctamente (credenciales presentes)' 
    };
  }
}

export default new VapiService();
