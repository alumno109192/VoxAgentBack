import mongoose, { Document, Schema } from 'mongoose';

export interface ITranscriptionChunk {
  start: number;
  end: number;
  text: string;
  speaker?: string;
  confidence?: number;
}

export interface ITranscription extends Document {
  callId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  text: string;
  language: string;
  confidence?: number;
  chunks: ITranscriptionChunk[];
  status: 'processing' | 'completed' | 'failed';
  provider: 'bland' | 'whisper' | 'other';
  metadata: {
    durationSec?: number;
    wordCount?: number;
    processingTimeMs?: number;
  };
  error?: {
    code: string;
    message: string;
  };
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TranscriptionSchema = new Schema<ITranscription>(
  {
    callId: {
      type: Schema.Types.ObjectId,
      ref: 'CallLog',
      required: true,
      index: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: 'en',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    chunks: [
      {
        start: {
          type: Number,
          required: true,
        },
        end: {
          type: Number,
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        speaker: String,
        confidence: Number,
      },
    ],
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
      index: true,
    },
    provider: {
      type: String,
      enum: ['bland', 'whisper', 'other'],
      default: 'bland',
    },
    metadata: {
      durationSec: Number,
      wordCount: Number,
      processingTimeMs: Number,
    },
    error: {
      code: String,
      message: String,
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
TranscriptionSchema.index({ callId: 1 }, { unique: true });
TranscriptionSchema.index({ tenantId: 1, createdAt: -1 });
TranscriptionSchema.index({ tenantId: 1, status: 1 });

// Full-text search index
TranscriptionSchema.index({ text: 'text' });

export default mongoose.model<ITranscription>('Transcription', TranscriptionSchema);
