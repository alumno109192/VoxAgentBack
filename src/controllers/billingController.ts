import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import { AuthRequest } from '../middleware/auth';
import BillingRecord from '../models/BillingRecord';
import AuditLog from '../models/AuditLog';
import logger from '../utils/logger';
import config from '../config';
import { io } from '../server';
import * as paymentsFile from '../utils/paymentsFile';
import type { PaymentRecord } from '../utils/paymentsFile';

// Initialize Stripe (only if configured)
let stripe: Stripe | null = null;
if (config.stripe.secretKey) {
  stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2023-10-16',
  });
}

/**
 * Create a payment session (real or emulated)
 * POST /billing/create-session
 */
export const createSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tenantId, amount, currency = 'USD', description, testMode = false } = req.body;

    // Validation
    if (!tenantId || !amount) {
      res.status(400).json({ error: 'tenantId and amount are required' });
      return;
    }

    if (amount <= 0) {
      res.status(400).json({ error: 'amount must be greater than 0' });
      return;
    }

    // Test mode - emulated payment
    if (testMode) {
      const sessionIdEmu = `emu_session_${uuidv4()}`;
      const clientSecretEmu = `emu_secret_${uuidv4()}`;
      const checkoutUrlEmu = `${config.appName}://emulated-checkout/${sessionIdEmu}`;

      // Create provisional billing record in DB
      const billingRecord = await BillingRecord.create({
        tenantId,
        type: 'emulated_payment',
        amount,
        currency: currency.toUpperCase(),
        status: 'pending_emulated',
        description: description || 'Emulated payment session',
        metadata: {
          sessionIdEmu,
          clientSecretEmu,
          testMode: true,
        },
      });

      logger.info(`Emulated payment session created: ${sessionIdEmu}`, {
        tenantId,
        amount,
        billingRecordId: billingRecord.id,
      });

      // Audit log
      await AuditLog.create({
        action: 'billing.emulated_session_created',
        actorId: req.userId,
        tenantId,
        resourceType: 'BillingRecord',
        resourceId: billingRecord.id,
        after: { sessionIdEmu, amount, currency },
        ipAddress: req.ip,
        requestId: req.requestId,
      });

      res.json({
        success: true,
        testMode: true,
        checkout_url_emulado: checkoutUrlEmu,
        sessionIdEmu,
        client_secret_emulado: clientSecretEmu,
        billingRecordId: billingRecord.id,
      });
      return;
    }

    // Real Stripe mode
    if (!stripe) {
      res.status(500).json({
        error: 'Stripe not configured',
        hint: 'Set STRIPE_SECRET_KEY in environment or use testMode: true',
      });
      return;
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: description || 'VoxAgent Service Payment',
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel`,
      metadata: {
        tenantId,
        description: description || '',
      },
    });

    // Create billing record
    const billingRecord = await BillingRecord.create({
      tenantId,
      type: 'stripe_payment',
      amount,
      currency: currency.toUpperCase(),
      status: 'pending',
      gatewayId: session.id,
      description: description || 'Stripe payment session',
      metadata: {
        stripeSessionId: session.id,
        testMode: false,
      },
    });

    logger.info(`Stripe payment session created: ${session.id}`, {
      tenantId,
      amount,
      billingRecordId: billingRecord.id,
    });

    // Audit log
    await AuditLog.create({
      action: 'billing.stripe_session_created',
      actorId: req.userId,
      tenantId,
      resourceType: 'BillingRecord',
      resourceId: billingRecord.id,
      after: { stripeSessionId: session.id, amount, currency },
      ipAddress: req.ip,
      requestId: req.requestId,
    });

    res.json({
      success: true,
      testMode: false,
      checkout_url: session.url,
      sessionId: session.id,
      billingRecordId: billingRecord.id,
    });
  } catch (error: any) {
    logger.error('Error creating payment session:', error);
    res.status(500).json({
      error: 'Failed to create payment session',
      message: error.message,
    });
  }
};

/**
 * Handle emulated Stripe webhook events
 * POST /webhooks/stripe-emulator
 */
export const handleEmulatedWebhook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = req.body;

    if (!event || !event.type || !event.data) {
      res.status(400).json({ error: 'Invalid event payload' });
      return;
    }

    const { type, data } = event;
    const paymentIntent = data.object;

    if (!paymentIntent || !paymentIntent.id) {
      res.status(400).json({ error: 'Invalid payment intent data' });
      return;
    }

    const providerPaymentId = paymentIntent.id;
    const tenantId = paymentIntent.metadata?.tenantId || 'unknown';
    const amount = paymentIntent.amount ? paymentIntent.amount / 100 : 0;
    const currency = paymentIntent.currency || 'USD';

    logger.info(`Emulated webhook event received: ${type}`, {
      providerPaymentId,
      tenantId,
      amount,
    });

    // Check idempotency
    const exists = await paymentsFile.recordExists(providerPaymentId);
    if (exists) {
      logger.warn(`Duplicate webhook event ignored: ${providerPaymentId}`);
      res.status(200).json({
        received: true,
        message: 'Event already processed (idempotent)',
      });
      return;
    }

    // Process event based on type
    let status: string;
    let billingStatus: 'succeeded' | 'failed';

    if (type === 'payment_intent.succeeded') {
      status = 'succeeded';
      billingStatus = 'succeeded';
    } else if (type === 'payment_intent.failed') {
      status = 'failed';
      billingStatus = 'failed';
    } else {
      res.status(200).json({
        received: true,
        message: `Event type ${type} not handled`,
      });
      return;
    }

    // Find or create billing record in DB
    let billingRecord = await BillingRecord.findOne({
      'metadata.sessionIdEmu': paymentIntent.metadata?.sessionIdEmu,
    });

    if (!billingRecord) {
      // Create new record if not found
      billingRecord = await BillingRecord.create({
        tenantId,
        type: 'emulated_payment',
        amount,
        currency: currency.toUpperCase(),
        status: billingStatus,
        gatewayId: providerPaymentId,
        description: paymentIntent.description || 'Emulated payment',
        metadata: {
          providerPaymentId,
          emulatedEvent: type,
          testMode: true,
        },
      });
    } else {
      // Update existing record
      billingRecord.status = billingStatus === 'succeeded' ? 'paid' : 'failed';
      billingRecord.gatewayId = providerPaymentId;
      billingRecord.metadata = {
        ...billingRecord.metadata,
        providerPaymentId,
        processedAt: new Date().toISOString(),
      };
      await billingRecord.save();
    }

    // Write to JSON file atomically
    const paymentRecord: PaymentRecord = {
      id: billingRecord.id,
      tenantId,
      amount,
      currency: currency.toUpperCase(),
      status,
      providerPaymentId,
      description: paymentIntent.description || 'Emulated payment',
      metadata: {
        billingRecordId: billingRecord.id,
        eventType: type,
        testMode: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await paymentsFile.writeAtomic(paymentRecord);

    // Emit Socket.IO event for real-time updates
    if (io && status === 'succeeded') {
      io.emit('payment.succeeded', {
        billingRecordId: billingRecord.id,
        tenantId,
        amount,
        currency,
        providerPaymentId,
      });
    } else if (io && status === 'failed') {
      io.emit('payment.failed', {
        billingRecordId: billingRecord.id,
        tenantId,
        amount,
        currency,
        providerPaymentId,
        reason: paymentIntent.last_payment_error?.message || 'Unknown error',
      });
    }

    // Audit log
    await AuditLog.create({
      action: `payment.${status}`,
      tenantId,
      resourceType: 'BillingRecord',
      resourceId: billingRecord.id,
      after: { status, providerPaymentId, amount, currency },
      metadata: {
        emulatedEvent: true,
        eventType: type,
      },
    });

    logger.info(`Payment ${status}: ${providerPaymentId}`, {
      billingRecordId: billingRecord.id,
      tenantId,
      amount,
    });

    res.status(200).json({
      received: true,
      status,
      billingRecordId: billingRecord.id,
    });
  } catch (error: any) {
    logger.error('Error processing emulated webhook:', error);
    res.status(500).json({
      error: 'Failed to process webhook',
      message: error.message,
    });
  }
};

/**
 * Get paginated list of payments
 * GET /billing/payments
 */
export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tenantId, page = 1, limit = 20 } = req.query;

    if (!tenantId) {
      res.status(400).json({ error: 'tenantId is required' });
      return;
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Query database
    const [records, total] = await Promise.all([
      BillingRecord.find({ tenantId: tenantId as string })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      BillingRecord.countDocuments({ tenantId: tenantId as string }),
    ]);

    // Also read from JSON files as fallback (last 30 days)
    const jsonRecords = await paymentsFile.readPaymentsByTenant(tenantId as string);

    // Merge records, preferring DB records
    const dbIds = new Set(records.map(r => r.gatewayId));
    const additionalRecords = jsonRecords
      .filter(jr => !dbIds.has(jr.providerPaymentId))
      .slice(0, Number(limit));

    const mergedRecords = [
      ...records.map(r => ({
        id: r._id,
        tenantId: r.tenantId,
        amount: r.amount,
        currency: r.currency,
        status: r.status,
        providerPaymentId: r.gatewayId,
        description: r.description,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        source: 'database',
      })),
      ...additionalRecords.map(r => ({
        ...r,
        source: 'json_file',
      })),
    ];

    res.json({
      data: mergedRecords,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching payments:', error);
    res.status(500).json({
      error: 'Failed to fetch payments',
      message: error.message,
    });
  }
};

/**
 * Get latest payment
 * GET /billing/payments/latest
 */
export const getLatestPayment = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Try database first
    const dbRecord = await BillingRecord.findOne()
      .sort({ createdAt: -1 })
      .lean();

    // Try JSON file
    const jsonRecord = await paymentsFile.getLatestPayment();

    // Return the most recent one
    let latestRecord;
    if (dbRecord && jsonRecord) {
      const dbDate = new Date(dbRecord.createdAt).getTime();
      const jsonDate = new Date(jsonRecord.createdAt).getTime();
      latestRecord = dbDate > jsonDate ? dbRecord : jsonRecord;
    } else {
      latestRecord = dbRecord || jsonRecord;
    }

    if (!latestRecord) {
      res.status(404).json({ error: 'No payments found' });
      return;
    }

    res.json(latestRecord);
  } catch (error: any) {
    logger.error('Error fetching latest payment:', error);
    res.status(500).json({
      error: 'Failed to fetch latest payment',
      message: error.message,
    });
  }
};
