import axios from 'axios';
import config from '../config';
import logger from '../utils/logger';
import { VapiTranscriptionRequest, VapiTranscriptionResponse } from '../types/transcription';

/**
 * VAPI Service - Integration with VAPI API for transcription
 */
class VapiService {
  private apiUrl: string;
  private publicKey: string;
  private assistantId: string;
  private apiKey?: string;

  constructor() {
    this.apiUrl = config.vapi?.apiUrl || 'https://api.vapi.ai';
    this.publicKey = config.vapi?.publicKey || '209ac772-6752-4407-9740-84afdfc7a41c';
    this.assistantId = config.vapi?.assistantId || '0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf';
    this.apiKey = config.vapi?.apiKey;
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
   * Transcribe audio using VAPI API
   */
  async transcribeAudio(audioBlob: string, language: string = 'es-ES'): Promise<VapiTranscriptionResponse> {
    try {
      logger.info('Transcribing audio with VAPI', {
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
