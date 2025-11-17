import mongoose, { Schema, Document } from 'mongoose';

export interface IUsage extends Document {
  tenantId: mongoose.Types.ObjectId;
  agentId?: mongoose.Types.ObjectId;
  type: 'call' | 'voxagentai' | 'transcription';
  minutesConsumed: number; // "angelitos"
  callId?: mongoose.Types.ObjectId;
  metadata: {
    duration?: number;
    cost?: number;
    tokens?: number;
  };
  date: Date;
  createdAt: Date;
}

const UsageSchema: Schema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
      index: true,
    },
    type: {
      type: String,
      enum: ['call', 'voxagentai', 'transcription'],
      required: true,
      index: true,
    },
    minutesConsumed: {
      type: Number,
      required: true,
      min: 0,
    },
    callId: {
      type: Schema.Types.ObjectId,
      ref: 'CallLog',
    },
    metadata: {
      duration: {
        type: Number,
        min: 0,
      },
      cost: {
        type: Number,
        min: 0,
      },
      tokens: {
        type: Number,
        min: 0,
      },
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para consultas eficientes
UsageSchema.index({ tenantId: 1, date: -1 });
UsageSchema.index({ tenantId: 1, type: 1, date: -1 });
UsageSchema.index({ agentId: 1, date: -1 });

export default mongoose.model<IUsage>('Usage', UsageSchema);
