import request from 'supertest';
import app from '../../src/app';
import fs from 'fs/promises';
import path from 'path';
import BillingRecord from '../../src/models/BillingRecord';
import User from '../../src/models/User';
import Tenant from '../../src/models/Tenant';
import jwt from 'jsonwebtoken';
import config from '../../src/config';

describe('Payment Emulation Integration Tests', () => {
  let authToken: string;
  let testUserId: string;
  let testTenantId: string;
  const emulatorKey = config.emulator.key;
  const paymentsDir = config.emulator.paymentsJsonPath;

  beforeAll(async () => {
    // Create test tenant
    const tenant = await Tenant.create({
      name: 'Test Tenant',
      domain: 'test.example.com',
      status: 'active',
      contactEmail: 'test@example.com',
      contactPhone: '+1234567890',
    });
    testTenantId = tenant.id;

    // Create test user
    const user = await User.create({
      email: 'testuser@example.com',
      password: 'hashedpassword123',
      name: 'Test User',
      role: 'admin',
      tenantId: testTenantId,
      isActive: true,
    });
    testUserId = user.id;

    // Generate auth token
    authToken = jwt.sign(
      { userId: user.id, role: user.role, tenantId: testTenantId },
      config.jwt.secret
    );

    // Ensure payments directory exists
    await fs.mkdir(paymentsDir, { recursive: true });
  });

  afterAll(async () => {
    // Cleanup test data
    await BillingRecord.deleteMany({ tenantId: testTenantId });
    await User.deleteMany({ email: 'testuser@example.com' });
    await Tenant.deleteMany({ name: 'Test Tenant' });

    // Cleanup payment files
    try {
      const files = await fs.readdir(paymentsDir);
      for (const file of files) {
        if (file.startsWith('payments-')) {
          await fs.unlink(path.join(paymentsDir, file));
        }
      }
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  beforeEach(async () => {
    // Clear billing records before each test
    await BillingRecord.deleteMany({ tenantId: testTenantId });
  });

  describe('POST /api/billing/create-session', () => {
    it('should create an emulated payment session in test mode', async () => {
      const response = await request(app)
        .post('/api/billing/create-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenantId: testTenantId,
          amount: 100,
          currency: 'USD',
          description: 'Test payment',
          testMode: true,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        testMode: true,
      });
      expect(response.body.checkout_url_emulado).toBeDefined();
      expect(response.body.sessionIdEmu).toMatch(/^emu_session_/);
      expect(response.body.billingRecordId).toBeDefined();

      // Verify database record
      const billingRecord = await BillingRecord.findById(response.body.billingRecordId);
      expect(billingRecord).toBeDefined();
      expect(billingRecord?.status).toBe('pending_emulated');
    });

    it('should reject testMode when ALLOW_PAYMENT_EMULATION is false', async () => {
      // Temporarily disable emulation
      const originalValue = config.features.allowPaymentEmulation;
      config.features.allowPaymentEmulation = false;

      const response = await request(app)
        .post('/api/billing/create-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenantId: testTenantId,
          amount: 100,
          currency: 'USD',
          testMode: true,
        })
        .expect(403);

      expect(response.body.error).toContain('emulation');

      // Restore original value
      config.features.allowPaymentEmulation = originalValue;
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/billing/create-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100,
          // Missing tenantId
        })
        .expect(400);
    });
  });

  describe('POST /api/webhooks/stripe-emulator', () => {
    it('should process payment_intent.succeeded event', async () => {
      const providerPaymentId = `pi_test_${Date.now()}`;
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: providerPaymentId,
            amount: 10000, // $100.00 in cents
            currency: 'usd',
            description: 'Test payment',
            metadata: {
              tenantId: testTenantId,
              sessionIdEmu: 'emu_session_123',
            },
          },
        },
      };

      const response = await request(app)
        .post('/api/webhooks/stripe-emulator')
        .set('X-Emulator-Key', emulatorKey)
        .send(event)
        .expect(200);

      expect(response.body).toMatchObject({
        received: true,
        status: 'succeeded',
      });

      // Verify database record
      const billingRecord = await BillingRecord.findById(response.body.billingRecordId);
      expect(billingRecord).toBeDefined();
      expect(billingRecord?.status).toBe('paid');
      expect(billingRecord?.gatewayId).toBe(providerPaymentId);

      // Verify JSON file
      const today = new Date().toISOString().split('T')[0];
      const filePath = path.join(paymentsDir, `payments-${today}.json`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const records = fileContent
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line));

      const record = records.find((r) => r.providerPaymentId === providerPaymentId);
      expect(record).toBeDefined();
      expect(record.status).toBe('succeeded');
    });

    it('should handle idempotent webhook events', async () => {
      const providerPaymentId = `pi_idempotent_${Date.now()}`;
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: providerPaymentId,
            amount: 5000,
            currency: 'usd',
            metadata: {
              tenantId: testTenantId,
            },
          },
        },
      };

      // First request - should succeed
      const response1 = await request(app)
        .post('/api/webhooks/stripe-emulator')
        .set('X-Emulator-Key', emulatorKey)
        .send(event)
        .expect(200);

      expect(response1.body.status).toBe('succeeded');

      // Second request with same providerPaymentId - should be idempotent
      const response2 = await request(app)
        .post('/api/webhooks/stripe-emulator')
        .set('X-Emulator-Key', emulatorKey)
        .send(event)
        .expect(200);

      expect(response2.body.message).toContain('idempotent');

      // Verify only one record exists in DB
      const records = await BillingRecord.find({ gatewayId: providerPaymentId });
      expect(records.length).toBe(1);

      // Verify only one record in JSON file
      const today = new Date().toISOString().split('T')[0];
      const filePath = path.join(paymentsDir, `payments-${today}.json`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const jsonRecords = fileContent
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line))
        .filter((r) => r.providerPaymentId === providerPaymentId);

      expect(jsonRecords.length).toBe(1);
    });

    it('should handle concurrent webhook requests with same providerPaymentId', async () => {
      const providerPaymentId = `pi_concurrent_${Date.now()}`;
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: providerPaymentId,
            amount: 7500,
            currency: 'usd',
            metadata: {
              tenantId: testTenantId,
            },
          },
        },
      };

      // Send 10 concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/webhooks/stripe-emulator')
          .set('X-Emulator-Key', emulatorKey)
          .send(event)
      );

      const responses = await Promise.all(promises);

      // At least one should succeed, others should be idempotent
      const successCount = responses.filter((r) => r.body.status === 'succeeded').length;
      const idempotentCount = responses.filter((r) => r.body.message?.includes('idempotent')).length;

      expect(successCount).toBe(1);
      expect(idempotentCount).toBe(9);

      // Verify only one record in DB
      const records = await BillingRecord.find({ gatewayId: providerPaymentId });
      expect(records.length).toBe(1);

      // Verify only one record in JSON file
      const today = new Date().toISOString().split('T')[0];
      const filePath = path.join(paymentsDir, `payments-${today}.json`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const jsonRecords = fileContent
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line))
        .filter((r) => r.providerPaymentId === providerPaymentId);

      expect(jsonRecords.length).toBe(1);
    });

    it('should reject webhook without valid emulator key', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_unauthorized',
            amount: 1000,
            currency: 'usd',
            metadata: {
              tenantId: testTenantId,
            },
          },
        },
      };

      await request(app)
        .post('/api/webhooks/stripe-emulator')
        .set('X-Emulator-Key', 'invalid-key')
        .send(event)
        .expect(401);
    });

    it('should handle payment_intent.failed event', async () => {
      const providerPaymentId = `pi_failed_${Date.now()}`;
      const event = {
        type: 'payment_intent.failed',
        data: {
          object: {
            id: providerPaymentId,
            amount: 2500,
            currency: 'usd',
            last_payment_error: {
              message: 'Insufficient funds',
            },
            metadata: {
              tenantId: testTenantId,
            },
          },
        },
      };

      const response = await request(app)
        .post('/api/webhooks/stripe-emulator')
        .set('X-Emulator-Key', emulatorKey)
        .send(event)
        .expect(200);

      expect(response.body.status).toBe('failed');

      // Verify database record
      const billingRecord = await BillingRecord.findById(response.body.billingRecordId);
      expect(billingRecord).toBeDefined();
      expect(billingRecord?.status).toBe('failed');
    });
  });

  describe('GET /api/billing/payments', () => {
    beforeEach(async () => {
      // Create test billing records
      await BillingRecord.create([
        {
          tenantId: testTenantId,
          type: 'emulated_payment',
          amount: 100,
          currency: 'USD',
          status: 'paid',
          gatewayId: 'pi_test_1',
          description: 'Payment 1',
        },
        {
          tenantId: testTenantId,
          type: 'emulated_payment',
          amount: 200,
          currency: 'USD',
          status: 'paid',
          gatewayId: 'pi_test_2',
          description: 'Payment 2',
        },
      ]);
    });

    it('should return paginated payments for a tenant', async () => {
      const response = await request(app)
        .get('/api/billing/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ tenantId: testTenantId, page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
      });
    });

    it('should require tenantId parameter', async () => {
      await request(app)
        .get('/api/billing/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/billing/payments')
        .query({ tenantId: testTenantId })
        .expect(401);
    });
  });

  describe('GET /api/billing/payments/latest', () => {
    beforeEach(async () => {
      await BillingRecord.create({
        tenantId: testTenantId,
        type: 'emulated_payment',
        amount: 300,
        currency: 'USD',
        status: 'paid',
        gatewayId: 'pi_latest',
        description: 'Latest payment',
      });
    });

    it('should return the most recent payment', async () => {
      const response = await request(app)
        .get('/api/billing/payments/latest')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      // Should have payment properties
      expect(response.body.amount || response.body._id).toBeDefined();
    });

    it('should require authentication', async () => {
      await request(app).get('/api/billing/payments/latest').expect(401);
    });
  });
});
