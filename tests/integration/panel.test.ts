import request from 'supertest';
import app from '../../src/app';
import mongoose from 'mongoose';
import Tenant from '../../src/models/Tenant';
import User from '../../src/models/User';
import CallLog from '../../src/models/CallLog';
import Transcription from '../../src/models/Transcription';
import jwt from 'jsonwebtoken';
import config from '../../src/config';
import bcrypt from 'bcryptjs';

describe('Panel Interno API Integration Tests', () => {
  let authToken: string;
  let testUserId: string;
  let testTenantId: string;
  let testCallId: string;
  let testTranscriptionId: string;

  beforeAll(async () => {
    // Create test tenant
    const tenant = await Tenant.create({
      name: 'Test Panel Tenant',
      apiKey: 'test-api-key-panel-123',
      isActive: true,
      status: 'active',
      domain: 'testpanel.example.com',
      contactEmail: 'panel@test.com',
      contactPhone: '+1234567890',
      billingMethod: 'invoice',
      settings: {
        allowRecordings: true,
        retentionDays: 90,
        enableWhisperFallback: false,
        language: 'en',
        voiceId: 'default',
      },
    });
    testTenantId = tenant.id;

    // Create test user
    const hashedPassword = await bcrypt.hash('TestUser123!', 10);
    const user = await User.create({
      email: 'paneluser@test.com',
      hashedPassword,
      name: 'Panel Test User',
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

    // Create test call
    const call = await CallLog.create({
      blandCallId: 'panel-test-call-001',
      tenantId: testTenantId,
      userId: testUserId,
      from: '+1234567890',
      to: '+0987654321',
      direction: 'inbound',
      status: 'completed',
      startedAt: new Date(),
      endedAt: new Date(Date.now() + 300000),
      durationSec: 300,
      metadata: {
        isConfidential: false,
        tags: ['test'],
      },
    });
    testCallId = call.id;

    // Create test transcription
    const transcription = await Transcription.create({
      callId: testCallId,
      tenantId: testTenantId,
      text: 'This is a test transcription for panel testing.',
      language: 'en',
      confidence: 0.95,
      status: 'completed',
      provider: 'bland',
      processedAt: new Date(),
    });
    testTranscriptionId = transcription.id;
  });

  afterAll(async () => {
    // Cleanup
    await Transcription.deleteMany({ tenantId: testTenantId });
    await CallLog.deleteMany({ tenantId: testTenantId });
    await User.deleteMany({ email: 'paneluser@test.com' });
    await Tenant.deleteMany({ name: 'Test Panel Tenant' });
  });

  describe('GET /calls', () => {
    it('should list calls for authenticated tenant', async () => {
      const response = await request(app)
        .get(`/calls?tenantId=${testTenantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThan(0);
    });

    it('should require tenantId parameter', async () => {
      await request(app)
        .get('/calls')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/calls?tenantId=${testTenantId}`)
        .expect(401);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get(`/calls?tenantId=${testTenantId}&status=completed`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      response.body.data.forEach((call: any) => {
        expect(call.status).toBe('completed');
      });
    });
  });

  describe('GET /calls/:id', () => {
    it('should get call details', async () => {
      const response = await request(app)
        .get(`/calls/${testCallId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body._id).toBe(testCallId);
      expect(response.body.blandCallId).toBe('panel-test-call-001');
      expect(response.body.transcription).toBeDefined();
    });

    it('should return 404 for non-existent call', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/calls/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/calls/${testCallId}`)
        .expect(401);
    });
  });

  describe('GET /transcriptions', () => {
    it('should list transcriptions for authenticated tenant', async () => {
      const response = await request(app)
        .get(`/transcriptions?tenantId=${testTenantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    it('should support full-text search', async () => {
      const response = await request(app)
        .get(`/transcriptions?tenantId=${testTenantId}&search=test`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should require tenantId parameter', async () => {
      await request(app)
        .get('/transcriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/transcriptions?tenantId=${testTenantId}`)
        .expect(401);
    });
  });

  describe('GET /transcriptions/:id', () => {
    it('should get transcription details', async () => {
      const response = await request(app)
        .get(`/transcriptions/${testTranscriptionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body._id).toBe(testTranscriptionId);
      expect(response.body.text).toContain('test transcription');
      expect(response.body.callId).toBeDefined();
    });

    it('should return 404 for non-existent transcription', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/transcriptions/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/transcriptions/${testTranscriptionId}`)
        .expect(401);
    });
  });

  describe('GET /tenant/:id', () => {
    it('should get tenant details', async () => {
      const response = await request(app)
        .get(`/tenant/${testTenantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body._id).toBe(testTenantId);
      expect(response.body.name).toBe('Test Panel Tenant');
      expect(response.body.apiKey).toBe('test-api-key-panel-123');
      expect(response.body.settings).toBeDefined();
      expect(response.body.settings.language).toBe('en');
    });

    it('should return 404 for non-existent tenant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/tenant/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/tenant/${testTenantId}`)
        .expect(401);
    });
  });

  describe('POST /tenant/:id/regenerate-key', () => {
    it('should regenerate API key', async () => {
      const oldApiKey = 'test-api-key-panel-123';
      
      const response = await request(app)
        .post(`/tenant/${testTenantId}/regenerate-key`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('regenerated');
      expect(response.body.apiKey).toBeDefined();
      expect(response.body.apiKey).not.toBe(oldApiKey);
      expect(response.body.tenant.id).toBe(testTenantId);

      // Verify in database
      const tenant = await Tenant.findById(testTenantId);
      expect(tenant?.apiKey).toBe(response.body.apiKey);
    });

    it('should require authentication', async () => {
      await request(app)
        .post(`/tenant/${testTenantId}/regenerate-key`)
        .expect(401);
    });
  });

  describe('PATCH /tenant/:id', () => {
    it('should update tenant settings', async () => {
      const updates = {
        name: 'Updated Panel Tenant',
        contactPhone: '+9876543210',
        settings: {
          language: 'es',
          voiceId: 'spanish-voice',
        },
      };

      const response = await request(app)
        .patch(`/tenant/${testTenantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.message).toContain('updated');
      expect(response.body.tenant.name).toBe('Updated Panel Tenant');
      expect(response.body.tenant.settings.language).toBe('es');
    });

    it('should require authentication', async () => {
      await request(app)
        .patch(`/tenant/${testTenantId}`)
        .send({ name: 'Hacker' })
        .expect(401);
    });
  });

  describe('POST /auth/login', () => {
    it('should login and return JWT token', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'paneluser@test.com',
          password: 'TestUser123!',
        })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('paneluser@test.com');
      expect(response.body.user.tenantId).toBe(testTenantId);
    });

    it('should reject invalid credentials', async () => {
      await request(app)
        .post('/auth/login')
        .send({
          email: 'paneluser@test.com',
          password: 'WrongPassword',
        })
        .expect(401);
    });
  });

  describe('POST /billing/create-session (emulated)', () => {
    it('should create emulated payment session', async () => {
      const response = await request(app)
        .post('/billing/create-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenantId: testTenantId,
          amount: 50,
          currency: 'USD',
          description: 'Panel test payment',
          testMode: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.testMode).toBe(true);
      expect(response.body.sessionIdEmu).toMatch(/^emu_session_/);
      expect(response.body.checkout_url_emulado).toBeDefined();
    });
  });
});
