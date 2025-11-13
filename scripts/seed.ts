import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Tenant from '../src/models/Tenant';
import User from '../src/models/User';
import CallLog from '../src/models/CallLog';
import Transcription from '../src/models/Transcription';
import logger from '../src/utils/logger';
import { generateRandomString } from '../src/utils/encryption';

dotenv.config();

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/voice-assistant');
    logger.info('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Tenant.deleteMany({}),
      User.deleteMany({}),
      CallLog.deleteMany({}),
      Transcription.deleteMany({}),
    ]);
    logger.info('Cleared existing data');

    // Create demo tenant
    const tenant = await Tenant.create({
      name: 'Demo Medical Center',
      apiKey: generateRandomString(32),
      isActive: true,
      contactEmail: 'admin@democenter.com',
      billingMethod: 'invoice',
      quotaLimits: {
        maxCallsPerMonth: 1000,
        maxMinutesPerMonth: 5000,
        maxStorageGB: 10,
      },
      settings: {
        allowRecordings: true,
        retentionDays: 90,
        enableWhisperFallback: false,
      },
    });
    logger.info(`Created tenant: ${tenant.name}`);

    // Create admin user
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      hashedPassword: adminPassword,
      role: 'admin',
      tenantId: tenant.id,
      isActive: true,
    });
    logger.info(`Created admin user: ${admin.email}`);

    // Create operator user
    const operatorPassword = await bcrypt.hash('Operator123!', 10);
    const operator = await User.create({
      name: 'Operator User',
      email: 'operator@example.com',
      hashedPassword: operatorPassword,
      role: 'operator',
      tenantId: tenant.id,
      isActive: true,
    });
    logger.info(`Created operator user: ${operator.email}`);

    // Create sample call logs
    const sampleCalls = [
      {
        blandCallId: 'bland-call-001',
        tenantId: tenant.id,
        userId: operator.id,
        from: '+1234567890',
        to: '+0987654321',
        direction: 'inbound',
        status: 'completed',
        startedAt: new Date('2024-11-10T10:00:00Z'),
        endedAt: new Date('2024-11-10T10:05:30Z'),
        durationSec: 330,
        cost: 0.055,
        metadata: {
          patientName: 'John Doe',
          patientId: 'P-12345',
          isConfidential: false,
          tags: ['consultation', 'follow-up'],
        },
      },
      {
        blandCallId: 'bland-call-002',
        tenantId: tenant.id,
        userId: operator.id,
        from: '+1111111111',
        to: '+0987654321',
        direction: 'inbound',
        status: 'completed',
        startedAt: new Date('2024-11-11T14:30:00Z'),
        endedAt: new Date('2024-11-11T14:37:15Z'),
        durationSec: 435,
        cost: 0.073,
        metadata: {
          patientName: 'Jane Smith',
          patientId: 'P-67890',
          isConfidential: true,
          tags: ['new-patient', 'intake'],
        },
      },
    ];

    const calls = await CallLog.insertMany(sampleCalls);
    logger.info(`Created ${calls.length} sample calls`);

    // Create sample transcriptions
    const sampleTranscriptions = [
      {
        callId: calls[0].id,
        tenantId: tenant.id,
        text: 'Patient reports improvement in symptoms after starting the new medication. Blood pressure is stable. Recommended to continue current treatment plan and follow up in 2 weeks.',
        language: 'en',
        confidence: 0.95,
        status: 'completed',
        provider: 'bland',
        chunks: [
          {
            start: 0,
            end: 5.2,
            text: 'Patient reports improvement in symptoms',
            speaker: 'doctor',
            confidence: 0.98,
          },
          {
            start: 5.2,
            end: 12.5,
            text: 'after starting the new medication',
            speaker: 'doctor',
            confidence: 0.93,
          },
        ],
        metadata: {
          durationSec: 330,
          wordCount: 32,
          processingTimeMs: 1200,
        },
        processedAt: new Date('2024-11-10T10:06:00Z'),
      },
      {
        callId: calls[1].id,
        tenantId: tenant.id,
        text: 'New patient intake completed. Medical history documented including current medications, allergies, and previous surgeries. Patient scheduled for lab work next week.',
        language: 'en',
        confidence: 0.92,
        status: 'completed',
        provider: 'bland',
        chunks: [],
        metadata: {
          durationSec: 435,
          wordCount: 28,
          processingTimeMs: 1500,
        },
        processedAt: new Date('2024-11-11T14:38:00Z'),
      },
    ];

    const transcriptions = await Transcription.insertMany(sampleTranscriptions);
    logger.info(`Created ${transcriptions.length} sample transcriptions`);

    // Summary
    console.log('\n✅ Seed completed successfully!\n');
    console.log('📊 Created:');
    console.log(`  - 1 Tenant: ${tenant.name}`);
    console.log(`  - API Key: ${tenant.apiKey}`);
    console.log(`  - 2 Users:`);
    console.log(`    • Admin: admin@example.com / Admin123!`);
    console.log(`    • Operator: operator@example.com / Operator123!`);
    console.log(`  - ${calls.length} Call Logs`);
    console.log(`  - ${transcriptions.length} Transcriptions\n`);

    process.exit(0);
  } catch (error) {
    logger.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
