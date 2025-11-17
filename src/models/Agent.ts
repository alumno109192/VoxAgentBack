import mongoose, { Schema, Document } from 'mongoose';

export interface IAgent extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'training';
  configuration: {
    language: string;
    voiceId: string;
    behavior: string;
    temperature: number;
    maxTokens: number;
    welcomeMessage?: string;
    fallbackMessage?: string;
  };
  metadata: {
    knowledgeBase?: string;
    tags: string[];
    category?: string;
  };
  stats: {
    totalCalls: number;
    totalMinutes: number;
    lastUsed?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AgentSchema: Schema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'training'],
      default: 'active',
      index: true,
    },
    configuration: {
      language: {
        type: String,
        default: 'es',
        required: true,
      },
      voiceId: {
        type: String,
        default: 'default-voice',
        required: true,
      },
      behavior: {
        type: String,
        required: true,
        maxlength: 2000,
      },
      temperature: {
        type: Number,
        default: 0.7,
        min: 0,
        max: 2,
      },
      maxTokens: {
        type: Number,
        default: 150,
        min: 10,
        max: 500,
      },
      welcomeMessage: {
        type: String,
        maxlength: 500,
      },
      fallbackMessage: {
        type: String,
        maxlength: 500,
      },
    },
    metadata: {
      knowledgeBase: {
        type: String,
      },
      tags: [{
        type: String,
        trim: true,
      }],
      category: {
        type: String,
        trim: true,
      },
    },
    stats: {
      totalCalls: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalMinutes: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastUsed: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para búsquedas eficientes
AgentSchema.index({ tenantId: 1, status: 1 });
AgentSchema.index({ tenantId: 1, name: 1 });

export default mongoose.model<IAgent>('Agent', AgentSchema);
