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
   * Create a new VAPI session
   */
  async createSession(language: string = 'es-ES', metadata?: Record<string, any>): Promise<VapiSessionResponse> {
    try {
      logger.info('Creating VAPI session', { language, metadata });

      // Si VAPI no está configurado, crear sesión mock
      if (!this.apiKey || this.apiKey === 'mock') {
        logger.warn('VAPI not configured, using mock session');
        return this.createMockSession(language, metadata);
      }

      const payload = {
        assistantId: this.assistantId,
        language,
        metadata,
      };

      const response = await axios.post<VapiSessionResponse>(
        `${this.apiUrl}/v1/sessions`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 10000,
        }
      );

      // Almacenar sesión activa
      this.activeSessions.set(response.data.sessionId, {
        sessionId: response.data.sessionId,
        createdAt: new Date(),
        transcripts: [],
      });

      logger.info('VAPI session created successfully', {
        sessionId: response.data.sessionId,
        status: response.data.status,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error creating VAPI session', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      // Fallback to mock on error
      if (error.response?.status === 401 || error.response?.status === 403) {
        logger.warn('VAPI authentication failed, using mock session');
        return this.createMockSession(language, metadata);
      }

      throw new Error('Error al crear sesión VAPI');
    }
  }

  /**
   * Send audio chunk to VAPI session and get transcription
   */
  async sendAudioToSession(sessionId: string, audioBlob: string, sequence?: number): Promise<VapiTranscriptEvent> {
    try {
      logger.info('Sending audio to VAPI session', {
        sessionId,
        audioSize: audioBlob.length,
        sequence,
      });

      // Verificar si es sesión mock
      const session = this.activeSessions.get(sessionId);
      if (session && sessionId.startsWith('mock-')) {
        return this.mockTranscriptEvent(audioBlob);
      }

      // Si VAPI no está configurado, usar mock
      if (!this.apiKey || this.apiKey === 'mock') {
        logger.warn('VAPI not configured, using mock transcription');
        return this.mockTranscriptEvent(audioBlob);
      }

      const payload = {
        audio: audioBlob,
        sequence,
      };

      const response = await axios.post<VapiTranscriptEvent>(
        `${this.apiUrl}/v1/sessions/${sessionId}/audio`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        }
      );

      // Almacenar transcripción en la sesión
      if (session) {
        session.transcripts.push(response.data);
      }

      logger.info('Audio transcribed successfully', {
        sessionId,
        textLength: response.data.text?.length || 0,
        type: response.data.type,
        isFinal: response.data.isFinal,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error sending audio to VAPI session', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        sessionId,
      });

      // Fallback to mock on error
      if (error.response?.status === 404) {
        throw new Error('Sesión VAPI no encontrada o expirada');
      }

      if (error.response?.status === 401 || error.response?.status === 403) {
        logger.warn('VAPI authentication failed, using mock transcription');
        return this.mockTranscriptEvent(audioBlob);
      }

      throw new Error('Error al enviar audio a sesión VAPI');
    }
  }

  /**
   * End a VAPI session
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      logger.info('Ending VAPI session', { sessionId });

      // Si es sesión mock, solo eliminarla del mapa
      if (sessionId.startsWith('mock-')) {
        this.activeSessions.delete(sessionId);
        logger.info('Mock session ended', { sessionId });
        return;
      }

      // Si VAPI no está configurado, solo limpiar
      if (!this.apiKey || this.apiKey === 'mock') {
        this.activeSessions.delete(sessionId);
        return;
      }

      await axios.delete(
        `${this.apiUrl}/v1/sessions/${sessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 10000,
        }
      );

      // Eliminar de sesiones activas
      this.activeSessions.delete(sessionId);

      logger.info('VAPI session ended successfully', { sessionId });
    } catch (error: any) {
      logger.error('Error ending VAPI session', {
        error: error.message,
        status: error.response?.status,
        sessionId,
      });

      // Eliminar de todas formas
      this.activeSessions.delete(sessionId);

      if (error.response?.status === 404) {
        logger.warn('Session not found on VAPI, already ended or expired');
        return;
      }

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
   * Create mock session for development/testing
   */
  private createMockSession(language: string, metadata?: Record<string, any>): VapiSessionResponse {
    const sessionId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const mockSession: VapiSessionResponse = {
      sessionId,
      status: 'active',
      createdAt: new Date().toISOString(),
      assistantId: this.assistantId,
    };

    // Almacenar sesión mock
    this.activeSessions.set(sessionId, {
      sessionId,
      createdAt: new Date(),
      transcripts: [],
    });

    logger.info('Mock session created', { sessionId, language, metadata });
    return mockSession;
  }

  /**
   * Generate mock transcript event
   */
  private mockTranscriptEvent(_audioBlob: string): VapiTranscriptEvent {
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

    return {
      type: 'final',
      text: randomText,
      timestamp: new Date().toISOString(),
      confidence: 0.85 + Math.random() * 0.14,
      isFinal: true,
    };
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
  async checkHealth(): Promise<{ status: 'ok' | 'error'; configured: boolean }> {
    const configured = !!(this.apiKey && this.apiKey !== 'mock');
    
    if (!configured) {
      return { status: 'ok', configured: false };
    }

    try {
      // Simple health check
      await axios.get(`${this.apiUrl}/health`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        timeout: 5000,
      });
      return { status: 'ok', configured: true };
    } catch (error) {
      logger.error('VAPI health check failed', { error });
      return { status: 'error', configured: true };
    }
  }
}

export default new VapiService();
