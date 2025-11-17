import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  tier: 'free' | 'starter' | 'professional' | 'enterprise';
  description: string;
  limits: {
    maxAgents: number;
    maxMinutesPerMonth: number;
    maxCallsPerMonth: number;
    maxStorageGB: number;
    voxagentaiQueries: number;
  };
  features: string[];
  pricing: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    tier: {
      type: String,
      enum: ['free', 'starter', 'professional', 'enterprise'],
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    limits: {
      maxAgents: {
        type: Number,
        required: true,
        min: 0,
      },
      maxMinutesPerMonth: {
        type: Number,
        required: true,
        min: 0,
      },
      maxCallsPerMonth: {
        type: Number,
        required: true,
        min: 0,
      },
      maxStorageGB: {
        type: Number,
        required: true,
        min: 0,
      },
      voxagentaiQueries: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    features: [{
      type: String,
      trim: true,
    }],
    pricing: {
      monthly: {
        type: Number,
        required: true,
        min: 0,
      },
      yearly: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: 'USD',
        uppercase: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPlan>('Plan', PlanSchema);
