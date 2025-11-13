import mongoose, { Document, Schema } from 'mongoose';

export interface ICallLog extends Document {
  blandCallId: string;
  tenantId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  from: string;
  to: string;
  status: 'initiated' | 'connected' | 'completed' | 'failed' | 'no_answer';
  direction: 'inbound' | 'outbound';
  startedAt?: Date;
  endedAt?: Date;
  durationSec?: number;
  recordingUrl?: string;
  cost?: number;
  currency: string;
  metadata: {
    patientName?: string;
    patientId?: string;
    appointmentId?: string;
    notes?: string;
    isConfidential: boolean;
    tags: string[];
    [key: string]: any;
  };
  error?: {
    code: string;
    message: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CallLogSchema = new Schema<ICallLog>(
  {
    blandCallId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['initiated', 'connected', 'completed', 'failed', 'no_answer'],
      default: 'initiated',
      index: true,
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    durationSec: {
      type: Number,
    },
    recordingUrl: {
      type: String,
    },
    cost: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    metadata: {
      patientName: String,
      patientId: String,
      appointmentId: String,
      notes: String,
      isConfidential: {
        type: Boolean,
        default: false,
      },
      tags: {
        type: [String],
        default: [],
      },
    },
    error: {
      code: String,
      message: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
CallLogSchema.index({ tenantId: 1, createdAt: -1 });
CallLogSchema.index({ tenantId: 1, status: 1 });
CallLogSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
CallLogSchema.index({ 'metadata.patientId': 1, tenantId: 1 });

export default mongoose.model<ICallLog>('CallLog', CallLogSchema);
