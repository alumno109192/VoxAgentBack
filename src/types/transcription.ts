/**
 * Types for Audio Transcription System
 */

export interface TranscriptionSegment {
  id: string;
  sessionId: string;
  tenantId: string;
  text: string;
  confidence?: number;
  duration?: number;
  timestamp: string;
  metadata?: {
    audioSize?: number;
    format?: string;
    engine?: string;
    cost?: number;
  };
}

export interface TranscriptionSession {
  sessionId: string;
  tenantId: string;
  segments: TranscriptionSegment[];
  createdAt: string;
  updatedAt: string;
  totalDuration?: number;
  totalCost?: number;
}

export interface TranscriptionRequest {
  sessionId: string;
  tenantId: string;
  apiKey?: string;
  audioBlob: string; // Base64 encoded audio
  format?: 'webm' | 'mp3' | 'wav' | 'ogg';
  language?: string;
}

export interface TranscriptionResponse {
  text: string;
  segmentId: string;
  confidence?: number;
  timestamp: string;
  metadata?: {
    duration?: number;
    cost?: number;
  };
}

export interface VapiTranscriptionRequest {
  audio: string;
  agentId?: string;
  apiKey?: string;
  language?: string;
}

export interface VapiTranscriptionResponse {
  text: string;
  confidence?: number;
  duration?: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}
