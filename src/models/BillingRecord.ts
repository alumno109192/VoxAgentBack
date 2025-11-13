import mongoose, { Document, Schema } from 'mongoose';

export interface IBillingRecord extends Document {
  tenantId: mongoose.Types.ObjectId;
  callId?: mongoose.Types.ObjectId;
  type: 'call' | 'transcription' | 'storage' | 'monthly_fee' | 'other';
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  description?: string;
  metadata: {
    durationMinutes?: number;
    ratePerMinute?: number;
    storageGB?: number;
    [key: string]: any;
  };
  gatewayId?: string;
  gateway?: 'stripe' | 'manual';
  paidAt?: Date;
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BillingRecordSchema = new Schema<IBillingRecord>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    callId: {
      type: Schema.Types.ObjectId,
      ref: 'CallLog',
      index: true,
    },
    type: {
      type: String,
      enum: ['call', 'transcription', 'storage', 'monthly_fee', 'other'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    description: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    gatewayId: {
      type: String,
      index: true,
    },
    gateway: {
      type: String,
      enum: ['stripe', 'manual'],
    },
    paidAt: {
      type: Date,
    },
    invoiceUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
BillingRecordSchema.index({ tenantId: 1, createdAt: -1 });
BillingRecordSchema.index({ tenantId: 1, status: 1 });
BillingRecordSchema.index({ callId: 1 }, { sparse: true });

export default mongoose.model<IBillingRecord>('BillingRecord', BillingRecordSchema);
