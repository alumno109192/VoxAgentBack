import mongoose, { Document, Schema } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  apiKey: string;
  isActive: boolean;
  quotaLimits: {
    maxCallsPerMonth: number;
    maxMinutesPerMonth: number;
    maxStorageGB: number;
  };
  currentUsage: {
    callsThisMonth: number;
    minutesThisMonth: number;
    storageUsedGB: number;
    lastResetDate: Date;
  };
  billingMethod: 'stripe' | 'invoice' | 'prepaid';
  stripeCustomerId?: string;
  contactEmail: string;
  settings: {
    allowRecordings: boolean;
    retentionDays: number;
    enableWhisperFallback: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    apiKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    quotaLimits: {
      maxCallsPerMonth: {
        type: Number,
        default: 1000,
      },
      maxMinutesPerMonth: {
        type: Number,
        default: 5000,
      },
      maxStorageGB: {
        type: Number,
        default: 10,
      },
    },
    currentUsage: {
      callsThisMonth: {
        type: Number,
        default: 0,
      },
      minutesThisMonth: {
        type: Number,
        default: 0,
      },
      storageUsedGB: {
        type: Number,
        default: 0,
      },
      lastResetDate: {
        type: Date,
        default: Date.now,
      },
    },
    billingMethod: {
      type: String,
      enum: ['stripe', 'invoice', 'prepaid'],
      default: 'invoice',
    },
    stripeCustomerId: {
      type: String,
    },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    settings: {
      allowRecordings: {
        type: Boolean,
        default: true,
      },
      retentionDays: {
        type: Number,
        default: 90,
      },
      enableWhisperFallback: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITenant>('Tenant', TenantSchema);
