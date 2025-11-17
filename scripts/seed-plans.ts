/**
 * Seed script for Plans
 * Run: npx ts-node scripts/seed-plans.ts
 */

import mongoose from 'mongoose';
import config from '../src/config';
import Plan from '../src/models/Plan';
import logger from '../src/utils/logger';

const plans = [
  {
    name: 'Plan Gratuito',
    tier: 'free',
    description: 'Ideal para probar la plataforma',
    limits: {
      maxAgents: 1,
      maxMinutesPerMonth: 100,
      maxCallsPerMonth: 50,
      maxStorageGB: 1,
      voxagentaiQueries: 50,
    },
    features: [
      '1 agente virtual',
      '100 minutos/mes',
      '50 llamadas/mes',
      '1 GB de almacenamiento',
      '50 consultas VoxAgentAI/mes',
      'Soporte por email',
    ],
    pricing: {
      monthly: 0,
      yearly: 0,
      currency: 'USD',
    },
    isActive: true,
  },
  {
    name: 'Plan Starter',
    tier: 'starter',
    description: 'Perfecto para pequeños negocios',
    limits: {
      maxAgents: 5,
      maxMinutesPerMonth: 500,
      maxCallsPerMonth: 250,
      maxStorageGB: 5,
      voxagentaiQueries: 500,
    },
    features: [
      '5 agentes virtuales',
      '500 minutos/mes',
      '250 llamadas/mes',
      '5 GB de almacenamiento',
      '500 consultas VoxAgentAI/mes',
      'Soporte prioritario',
      'Análisis básicos',
      'Webhooks personalizados',
    ],
    pricing: {
      monthly: 29,
      yearly: 290,
      currency: 'USD',
    },
    isActive: true,
  },
  {
    name: 'Plan Professional',
    tier: 'professional',
    description: 'Para empresas en crecimiento',
    limits: {
      maxAgents: 20,
      maxMinutesPerMonth: 2000,
      maxCallsPerMonth: 1000,
      maxStorageGB: 20,
      voxagentaiQueries: 2000,
    },
    features: [
      '20 agentes virtuales',
      '2,000 minutos/mes',
      '1,000 llamadas/mes',
      '20 GB de almacenamiento',
      '2,000 consultas VoxAgentAI/mes',
      'Soporte 24/7',
      'Análisis avanzados',
      'Webhooks ilimitados',
      'Integración API completa',
      'Exportación de datos',
      'Base de conocimiento personalizada',
    ],
    pricing: {
      monthly: 99,
      yearly: 990,
      currency: 'USD',
    },
    isActive: true,
  },
  {
    name: 'Plan Enterprise',
    tier: 'enterprise',
    description: 'Solución empresarial completa',
    limits: {
      maxAgents: 100,
      maxMinutesPerMonth: 10000,
      maxCallsPerMonth: 5000,
      maxStorageGB: 100,
      voxagentaiQueries: 10000,
    },
    features: [
      '100 agentes virtuales',
      '10,000 minutos/mes',
      '5,000 llamadas/mes',
      '100 GB de almacenamiento',
      '10,000 consultas VoxAgentAI/mes',
      'Soporte dedicado 24/7',
      'Análisis empresariales',
      'Webhooks ilimitados',
      'API completa con SLA',
      'Exportación ilimitada',
      'Base de conocimiento avanzada',
      'Entrenamiento personalizado',
      'Onboarding dedicado',
      'Multi-tenant support',
      'White-label disponible',
    ],
    pricing: {
      monthly: 299,
      yearly: 2990,
      currency: 'USD',
    },
    isActive: true,
  },
];

async function seedPlans() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/voice-assistant';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    // Clear existing plans
    await Plan.deleteMany({});
    logger.info('Cleared existing plans');

    // Insert new plans
    const createdPlans = await Plan.insertMany(plans);
    logger.info(`Created ${createdPlans.length} plans`);

    // Display plan IDs
    createdPlans.forEach((plan) => {
      console.log(`\n${plan.name} (${plan.tier})`);
      console.log(`  ID: ${plan._id}`);
      console.log(`  Price: $${plan.pricing.monthly}/month`);
      console.log(`  Max Agents: ${plan.limits.maxAgents}`);
      console.log(`  Max Minutes: ${plan.limits.maxMinutesPerMonth}`);
    });

    logger.info('\n✅ Plans seeded successfully');
  } catch (error) {
    logger.error('Error seeding plans:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
}

seedPlans();
