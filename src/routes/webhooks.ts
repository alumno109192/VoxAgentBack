import { Router, Request, Response } from 'express';
import CallLog from '../models/CallLog';
import Transcription from '../models/Transcription';
import config from '../config';
import logger from '../utils/logger';
import { verifyHmacSignature } from '../utils/encryption';
import { io } from '../server';
import storageService from '../services/storageService';
import { devEmulatorAuth } from '../middleware/emulatorAuth';
import * as billingController from '../controllers/billingController';

const router = Router();

/**
 * Verify Bland webhook signature
 */
const verifyBlandWebhook = (req: Request): boolean => {
  const signature = req.headers['x-bland-signature'] as string;
  const payload = JSON.stringify(req.body);

  if (!signature) {
    return false;
  }

  return verifyHmacSignature(payload, signature, config.bland.webhookSecret);
};

/**
 * @swagger
 * /api/webhooks/bland/events:
 *   post:
 *     summary: Receive Bland Voice webhook events
 *     tags: [Webhooks]
 */
router.post('/bland/events', async (req: Request, res: Response) => {
  try {
    // Verify webhook signature
    if (config.env === 'production' && !verifyBlandWebhook(req)) {
      logger.warn('Invalid webhook signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const { event, data } = req.body;

    logger.info(`Bland webhook event: ${event}`, { data });

    switch (event) {
      case 'incoming_call':
        await handleIncomingCall(data);
        break;
      case 'call_connected':
        await handleCallConnected(data);
        break;
      case 'transcription_chunk':
        await handleTranscriptionChunk(data);
        break;
      case 'transcription_completed':
        await handleTranscriptionCompleted(data);
        break;
      case 'call_disconnected':
        await handleCallDisconnected(data);
        break;
      case 'error':
        await handleCallError(data);
        break;
      default:
        logger.warn(`Unknown webhook event: ${event}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle incoming call event
 */
async function handleIncomingCall(data: any) {
  try {
    const callLog = new CallLog({
      blandCallId: data.call_id,
      tenantId: data.tenant_id || data.metadata?.tenant_id,
      from: data.from,
      to: data.to,
      direction: 'inbound',
      status: 'initiated',
      metadata: {
        isConfidential: false,
        tags: [],
        ...data.metadata,
      },
    });

    await callLog.save();

    // Emit real-time event
    if (io) {
      io.emit('call:incoming', {
        callId: callLog.id,
        from: callLog.from,
        to: callLog.to,
      });
    }

    logger.info(`Incoming call logged: ${callLog.blandCallId}`);
  } catch (error) {
    logger.error('Error handling incoming call:', error);
  }
}

/**
 * Handle call connected event
 */
async function handleCallConnected(data: any) {
  try {
    const callLog = await CallLog.findOne({ blandCallId: data.call_id });

    if (callLog) {
      callLog.status = 'connected';
      callLog.startedAt = new Date(data.connected_at || Date.now());
      await callLog.save();

      // Emit real-time event
      if (io) {
        io.emit('call:connected', {
          callId: callLog.id,
          startedAt: callLog.startedAt,
        });
      }

      logger.info(`Call connected: ${callLog.blandCallId}`);
    }
  } catch (error) {
    logger.error('Error handling call connected:', error);
  }
}

/**
 * Handle transcription chunk (streaming)
 */
async function handleTranscriptionChunk(data: any) {
  try {
    const callLog = await CallLog.findOne({ blandCallId: data.call_id });

    if (!callLog) {
      return;
    }

    // Emit real-time transcription chunk
    if (io) {
      io.emit('transcription:chunk', {
        callId: callLog.id,
        text: data.text,
        start: data.start,
        end: data.end,
        speaker: data.speaker,
      });
    }

    logger.debug(`Transcription chunk for call: ${callLog.blandCallId}`);
  } catch (error) {
    logger.error('Error handling transcription chunk:', error);
  }
}

/**
 * Handle transcription completed event
 */
async function handleTranscriptionCompleted(data: any) {
  try {
    const callLog = await CallLog.findOne({ blandCallId: data.call_id });

    if (!callLog) {
      logger.warn(`Call log not found for transcription: ${data.call_id}`);
      return;
    }

    // Create or update transcription
    const transcription = new Transcription({
      callId: callLog.id,
      tenantId: callLog.tenantId,
      text: data.transcript || data.text,
      language: data.language || 'en',
      confidence: data.confidence,
      chunks: data.chunks || [],
      status: 'completed',
      provider: 'bland',
      metadata: {
        durationSec: data.duration,
        wordCount: data.word_count,
        processingTimeMs: data.processing_time,
      },
      processedAt: new Date(),
    });

    await transcription.save();

    // Emit real-time event
    if (io) {
      io.emit('transcription:completed', {
        callId: callLog.id,
        transcriptionId: transcription.id,
        text: transcription.text,
      });
    }

    logger.info(`Transcription completed for call: ${callLog.blandCallId}`);
  } catch (error) {
    logger.error('Error handling transcription completed:', error);
  }
}

/**
 * Handle call disconnected event
 */
async function handleCallDisconnected(data: any) {
  try {
    const callLog = await CallLog.findOne({ blandCallId: data.call_id });

    if (callLog) {
      callLog.status = 'completed';
      callLog.endedAt = new Date(data.disconnected_at || Date.now());

      if (callLog.startedAt) {
        callLog.durationSec = Math.floor(
          (callLog.endedAt.getTime() - callLog.startedAt.getTime()) / 1000
        );
      }

      // Store recording URL
      if (data.recording_url) {
        callLog.recordingUrl = data.recording_url;

        // Optional: Upload recording to S3
        try {
          const fileName = `${callLog.blandCallId}.mp3`;
          const s3Key = await storageService.uploadFromUrl(data.recording_url, fileName);
          callLog.recordingUrl = s3Key;
        } catch (uploadError) {
          logger.warn('Failed to upload recording to S3:', uploadError);
        }
      }

      // Calculate cost (example: $0.01 per minute)
      if (callLog.durationSec) {
        callLog.cost = (callLog.durationSec / 60) * 0.01;
      }

      await callLog.save();

      // Emit real-time event
      if (io) {
        io.emit('call:disconnected', {
          callId: callLog.id,
          durationSec: callLog.durationSec,
          cost: callLog.cost,
        });
      }

      logger.info(`Call disconnected: ${callLog.blandCallId}`);
    }
  } catch (error) {
    logger.error('Error handling call disconnected:', error);
  }
}

/**
 * Handle call error event
 */
async function handleCallError(data: any) {
  try {
    const callLog = await CallLog.findOne({ blandCallId: data.call_id });

    if (callLog) {
      callLog.status = 'failed';
      callLog.error = {
        code: data.error_code,
        message: data.error_message,
      };
      await callLog.save();

      // Emit real-time event
      if (io) {
        io.emit('call:error', {
          callId: callLog.id,
          error: callLog.error,
        });
      }

      logger.error(`Call error: ${callLog.blandCallId}`, callLog.error);
    }
  } catch (error) {
    logger.error('Error handling call error:', error);
  }
}

/**
 * @swagger
 * /api/webhooks/stripe-emulator:
 *   post:
 *     summary: Emulated Stripe webhook for testing payment flows
 *     tags: [Webhooks]
 *     security:
 *       - EmulatorKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [payment_intent.succeeded, payment_intent.failed]
 *               data:
 *                 type: object
 *                 properties:
 *                   object:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       metadata:
 *                         type: object
 *     responses:
 *       200:
 *         description: Event processed
 */
router.post('/stripe-emulator', devEmulatorAuth, billingController.handleEmulatedWebhook);

export default router;
