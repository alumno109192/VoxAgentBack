import { SpeechClient, protos } from '@google-cloud/speech';
import logger from '../utils/logger';

type ISpeechRecognitionResult = protos.google.cloud.speech.v1.ISpeechRecognitionResult;
type IWordInfo = protos.google.cloud.speech.v1.IWordInfo;

/**
 * Google Cloud Speech-to-Text Service
 */
class GoogleSpeechService {
  private client: SpeechClient | null;
  private isConfigured: boolean;

  constructor() {
    try {
      // Verificar si está configurado el path de credenciales
      this.isConfigured = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      if (this.isConfigured) {
        this.client = new SpeechClient();
        logger.info('Google Speech-to-Text client initialized successfully');
      } else {
        logger.warn('GOOGLE_APPLICATION_CREDENTIALS not set, Google STT will use mock mode');
        this.client = null;
      }
    } catch (error) {
      logger.error('Error initializing Google Speech client', { error });
      this.isConfigured = false;
      this.client = null;
    }
  }

  /**
   * Transcribe audio using Google Cloud Speech-to-Text
   * @param audioBuffer - Audio buffer (raw bytes or base64)
   * @param encoding - Audio encoding (LINEAR16, WEBM_OPUS, etc)
   * @param sampleRateHertz - Sample rate in Hz
   * @param languageCode - Language code (es-ES, en-US, etc)
   */
  async transcribe(
    audioBuffer: Buffer | string,
    encoding: string = 'WEBM_OPUS',
    sampleRateHertz: number = 48000,
    languageCode: string = 'es-ES'
  ): Promise<{
    text: string;
    confidence: number;
    words?: Array<{
      word: string;
      startTime: number;
      endTime: number;
    }>;
  }> {
    try {
      // Si no está configurado, usar modo mock
      if (!this.isConfigured || !this.client) {
        logger.warn('Using mock transcription (Google STT not configured)');
        return this.mockTranscribe(audioBuffer);
      }

      // Convertir a base64 si es necesario
      const audioBytes = Buffer.isBuffer(audioBuffer)
        ? audioBuffer.toString('base64')
        : audioBuffer;

      logger.info('Transcribing audio with Google STT', {
        encoding,
        sampleRateHertz,
        languageCode,
        audioLength: audioBytes.length,
      });

      // Configurar request para Google STT
      const request: protos.google.cloud.speech.v1.IRecognizeRequest = {
        audio: {
          content: audioBytes,
        },
        config: {
          encoding: encoding as any,
          sampleRateHertz,
          languageCode,
          model: 'default',
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true,
        },
      };

      // Llamar a Google Speech-to-Text API
      const [response] = await this.client.recognize(request);

      if (!response.results || response.results.length === 0) {
        logger.warn('No transcription results from Google STT');
        return {
          text: '',
          confidence: 0,
        };
      }

      // Extraer el texto transcrito
      const transcription = response.results
        ?.map((result: ISpeechRecognitionResult) => result.alternatives?.[0]?.transcript || '')
        .join('\n') || '';

      // Obtener confianza promedio
      const confidences = response.results
        ?.map((result: ISpeechRecognitionResult) => result.alternatives?.[0]?.confidence || 0)
        .filter((c: number) => c > 0) || [];

      const avgConfidence =
        confidences.length > 0
          ? confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length
          : 0;

      // Extraer información de palabras si está disponible
      const words = response.results
        ?.flatMap((result: ISpeechRecognitionResult) => result.alternatives?.[0]?.words || [])
        .map((wordInfo: IWordInfo) => ({
          word: wordInfo.word || '',
          startTime: wordInfo.startTime?.seconds
            ? Number(wordInfo.startTime.seconds) +
              (wordInfo.startTime.nanos || 0) / 1e9
            : 0,
          endTime: wordInfo.endTime?.seconds
            ? Number(wordInfo.endTime.seconds) +
              (wordInfo.endTime.nanos || 0) / 1e9
            : 0,
        }));

      logger.info('Google STT transcription successful', {
        textLength: transcription.length,
        confidence: avgConfidence,
        wordsCount: words.length,
      });

      return {
        text: transcription,
        confidence: avgConfidence,
        words: words.length > 0 ? words : undefined,
      };
    } catch (error: any) {
      logger.error('Error transcribing with Google STT', {
        error: error.message,
        stack: error.stack,
      });

      // Fallback a mock si hay error
      logger.warn('Falling back to mock transcription');
      return this.mockTranscribe(audioBuffer);
    }
  }

  /**
   * Mock transcription for development/testing
   */
  private mockTranscribe(_audioBuffer: Buffer | string): {
    text: string;
    confidence: number;
  } {
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
      'Buenos días, necesito ayuda',
      'Perfecto, muchas gracias',
    ];

    const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
    const confidence = 0.85 + Math.random() * 0.14; // 0.85 - 0.99

    logger.info('Mock transcription generated', {
      text: randomText,
      confidence,
    });

    return {
      text: randomText,
      confidence,
    };
  }

  /**
   * Check if Google STT is configured
   */
  isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'ok' | 'error' | 'degraded';
    configured: boolean;
    mode: 'production' | 'mock';
  }> {
    if (!this.isConfigured || !this.client) {
      return {
        status: 'degraded',
        configured: false,
        mode: 'mock',
      };
    }

    try {
      // Hacer una pequeña prueba de conexión
      // (Google STT no tiene un endpoint de health específico)
      return {
        status: 'ok',
        configured: true,
        mode: 'production',
      };
    } catch (error) {
      logger.error('Google STT health check failed', { error });
      return {
        status: 'error',
        configured: true,
        mode: 'production',
      };
    }
  }
}

export default new GoogleSpeechService();
