import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import config from '../config';
import logger from '../utils/logger';
import Transcription from '../models/Transcription';
import CallLog from '../models/CallLog';
import BillingRecord from '../models/BillingRecord';

// Redis connection for BullMQ
const connection = new Redis(config.redis.url, {
  password: config.redis.password,
  maxRetriesPerRequest: null,
});

// Define queues
export const transcriptionQueue = new Queue('transcription', { connection });
export const billingQueue = new Queue('billing', { connection });
export const notificationQueue = new Queue('notification', { connection });

/**
 * Transcription Worker
 * Processes audio files for transcription
 */
const transcriptionWorker = new Worker(
  'transcription',
  async (job: Job) => {
    const { callId, audioUrl: _audioUrl, provider: _provider } = job.data;

    try {
      logger.info(`Processing transcription for call: ${callId}`);

      // TODO: Integrate with actual transcription service (Whisper, etc.)
      // For now, this is a placeholder

      await job.updateProgress(50);

      // Simulate transcription processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update transcription in database
      const transcription = await Transcription.findOne({ callId });
      if (transcription) {
        transcription.status = 'completed';
        transcription.processedAt = new Date();
        await transcription.save();
      }

      await job.updateProgress(100);

      logger.info(`Transcription completed for call: ${callId}`);

      return { success: true, callId };
    } catch (error) {
      logger.error('Transcription job failed:', error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

/**
 * Billing Worker
 * Processes billing reconciliation and charges
 */
const billingWorker = new Worker(
  'billing',
  async (job: Job) => {
    const { type, tenantId, period } = job.data;

    try {
      logger.info(`Processing billing job: ${type} for tenant: ${tenantId}`);

      if (type === 'reconcile') {
        // Find completed calls without billing records
        const calls = await CallLog.find({
          tenantId,
          status: 'completed',
          createdAt: {
            $gte: new Date(period.start),
            $lte: new Date(period.end),
          },
        });

        let totalAmount = 0;

        for (const call of calls) {
          // Check if billing record exists
          const existingRecord = await BillingRecord.findOne({ callId: call.id });

          if (!existingRecord && call.cost) {
            // Create billing record
            await BillingRecord.create({
              tenantId: call.tenantId,
              callId: call.id,
              type: 'call',
              amount: call.cost,
              currency: call.currency,
              status: 'pending',
              description: `Call ${call.blandCallId} - ${call.durationSec || 0}s`,
              metadata: {
                durationMinutes: (call.durationSec || 0) / 60,
                ratePerMinute: 0.01,
              },
            });

            totalAmount += call.cost;
          }
        }

        logger.info(`Billing reconciliation completed. Total: $${totalAmount.toFixed(2)}`);

        return { success: true, recordsCreated: calls.length, totalAmount };
      }

      return { success: true };
    } catch (error) {
      logger.error('Billing job failed:', error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 2,
  }
);

/**
 * Notification Worker
 * Sends email notifications
 */
const notificationWorker = new Worker(
  'notification',
  async (job: Job) => {
    const { type, to, data: _data } = job.data;

    try {
      logger.info(`Sending notification: ${type} to ${to}`);

      // TODO: Integrate with SendGrid or other email service
      // For now, just log

      logger.info(`Notification sent: ${type}`);

      return { success: true };
    } catch (error) {
      logger.error('Notification job failed:', error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 10,
  }
);

// Worker event handlers
[transcriptionWorker, billingWorker, notificationWorker].forEach((worker) => {
  worker.on('completed', (job) => {
    logger.info(`Job completed: ${job.id} in queue ${job.queueName}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job failed: ${job?.id} in queue ${job?.queueName}`, err);
  });

  worker.on('error', (err) => {
    logger.error('Worker error:', err);
  });
});

/**
 * Add transcription job to queue
 */
export async function queueTranscription(callId: string, audioUrl: string, provider: string = 'whisper') {
  await transcriptionQueue.add(
    'process',
    { callId, audioUrl, provider },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );

  logger.info(`Transcription job queued for call: ${callId}`);
}

/**
 * Add billing reconciliation job
 */
export async function queueBillingReconciliation(tenantId: string, period: { start: Date; end: Date }) {
  await billingQueue.add(
    'reconcile',
    { type: 'reconcile', tenantId, period },
    {
      attempts: 2,
      removeOnComplete: 50,
    }
  );

  logger.info(`Billing reconciliation queued for tenant: ${tenantId}`);
}

/**
 * Add notification job
 */
export async function queueNotification(type: string, to: string, data: any) {
  await notificationQueue.add(
    type,
    { type, to, data },
    {
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
      removeOnComplete: true,
    }
  );

  logger.info(`Notification job queued: ${type}`);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await Promise.all([
    transcriptionWorker.close(),
    billingWorker.close(),
    notificationWorker.close(),
  ]);
  await connection.quit();
});

logger.info('BullMQ workers initialized');
