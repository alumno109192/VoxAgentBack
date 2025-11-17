import mongoose, { Document, Schema } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  apiKey: string;
  isActive: boolean;
  status: 'active' | 'suspended' | 'inactive';
  domain?: string;
  contactEmail: string;
  contactPhone?: string;
  planId?: mongoose.Types.ObjectId;
  planTier: 'free' | 'starter' | 'professional' | 'enterprise';
  quotaLimits: {
    maxCallsPerMonth: number;
    maxMinutesPerMonth: number;
    maxStorageGB: number;
    maxAgents: number;
    voxagentaiQueries: number;
  };
  currentUsage: {
    callsThisMonth: number;
    minutesThisMonth: number;
    storageUsedGB: number;
    agentsCreated: number;
    voxagentaiQueriesUsed: number;
    lastResetDate: Date;
  };
  billingMethod: 'stripe' | 'invoice' | 'prepaid';
  stripeCustomerId?: string;
  settings: {
    allowRecordings: boolean;
    retentionDays: number;
    enableWhisperFallback: boolean;
    language?: string;
    voiceId?: string;
  };
  metadata?: Record<string, any>;
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
    status: {
      type: String,
      enum: ['active', 'suspended', 'inactive'],
      default: 'active',
    },
    domain: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
    },
    planTier: {
      type: String,
      enum: ['free', 'starter', 'professional', 'enterprise'],
      default: 'free',
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
      maxAgents: {
        type: Number,
        default: 3,
      },
      voxagentaiQueries: {
        type: Number,
        default: 100,
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
      agentsCreated: {
        type: Number,
        default: 0,
      },
      voxagentaiQueriesUsed: {
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
      language: {
        type: String,
        default: 'en',
      },
      voiceId: {
        type: String,
        default: 'default',
      },
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITenant>('Tenant', TenantSchema);
