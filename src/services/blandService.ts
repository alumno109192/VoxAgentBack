import axios, { AxiosInstance } from 'axios';
import config from '../config';
import logger from '../utils/logger';
import Redis from 'ioredis';

interface BlandTokenResponse {
  token: string;
  expiresIn: number;
}

interface BlandCallSession {
  sessionId: string;
  callId: string;
}

class BlandService {
  private axiosInstance: AxiosInstance;
  private redis: Redis;
  private tokenCacheKey = 'bland:auth:token';

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: config.bland.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.redis = new Redis(config.redis.url, {
      password: config.redis.password,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for retry logic
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If token expired, refresh and retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          await this.refreshToken();
          return this.axiosInstance(originalRequest);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Get cached auth token or request new one
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const cachedToken = await this.redis.get(this.tokenCacheKey);
      if (cachedToken) {
        return cachedToken;
      }

      return await this.refreshToken();
    } catch (error) {
      logger.error('Error getting Bland auth token:', error);
      return null;
    }
  }

  /**
   * Request new token from Bland API
   */
  private async refreshToken(): Promise<string> {
    try {
      // Mock implementation - replace with actual Bland auth endpoint
      const response = await axios.post<BlandTokenResponse>(
        `${config.bland.baseUrl}/auth/token`,
        {
          apiKey: config.bland.apiKey,
          apiSecret: config.bland.apiSecret,
        }
      );

      const { token, expiresIn } = response.data;

      // Cache token with TTL
      await this.redis.setex(
        this.tokenCacheKey,
        Math.min(expiresIn, config.bland.tokenCacheTTL),
        token
      );

      return token;
    } catch (error) {
      logger.error('Error refreshing Bland token:', error);
      throw error;
    }
  }

  /**
   * Create a new call session
   */
  async createSession(params: {
    phoneNumber: string;
    task?: string;
    voice?: string;
    webhook?: string;
  }): Promise<BlandCallSession> {
    try {
      const response = await this.axiosInstance.post('/calls', {
        phone_number: params.phoneNumber,
        task: params.task,
        voice: params.voice || 'default',
        webhook_url: params.webhook,
      });

      return {
        sessionId: response.data.session_id,
        callId: response.data.call_id,
      };
    } catch (error: any) {
      logger.error('Error creating Bland session:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Initiate outbound call
   */
  async initiateCall(params: {
    to: string;
    from?: string;
    task: string;
    voice?: string;
    webhookUrl?: string;
  }): Promise<string> {
    try {
      const response = await this.axiosInstance.post('/calls', params);
      return response.data.call_id;
    } catch (error: any) {
      logger.error('Error initiating call:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Answer incoming call
   */
  async answerCall(callId: string): Promise<void> {
    try {
      await this.axiosInstance.post(`/calls/${callId}/answer`);
    } catch (error: any) {
      logger.error('Error answering call:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * End active call
   */
  async endCall(callId: string): Promise<void> {
    try {
      await this.axiosInstance.post(`/calls/${callId}/end`);
    } catch (error: any) {
      logger.error('Error ending call:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Send TTS message during call
   */
  async sendTTS(callId: string, message: string): Promise<void> {
    try {
      await this.axiosInstance.post(`/calls/${callId}/tts`, { message });
    } catch (error: any) {
      logger.error('Error sending TTS:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Get call recording URL
   */
  async getRecording(callId: string): Promise<string | null> {
    try {
      const response = await this.axiosInstance.get(`/calls/${callId}/recording`);
      return response.data.recording_url || null;
    } catch (error: any) {
      logger.error('Error getting recording:', error.response?.data || error);
      return null;
    }
  }

  /**
   * Request transcription for a call
   */
  async requestTranscription(callId: string): Promise<void> {
    try {
      await this.axiosInstance.post(`/calls/${callId}/transcribe`);
    } catch (error: any) {
      logger.error('Error requesting transcription:', error.response?.data || error);
      throw error;
    }
  }
}

export default new BlandService();
