import request from 'supertest';
import app from '../../src/app';
import mongoose from 'mongoose';

describe('Agents API', () => {
  let authToken: string;
  let tenantId: string;
  let agentId: string;

  beforeAll(async () => {
    // Login to get token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'test123',
      });

    authToken = loginResponse.body.token;
    tenantId = loginResponse.body.user.tenantId;
  });

  describe('POST /agents', () => {
    it('should create a new agent', async () => {
      const response = await request(app)
        .post('/agents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenantId,
          name: 'Test Agent',
          description: 'Agent for testing',
          configuration: {
            language: 'es',
            voiceId: 'voice-123',
            behavior: 'friendly',
            temperature: 0.7,
            maxTokens: 500,
            welcomeMessage: '¡Hola! ¿En qué puedo ayudarte?',
            fallbackMessage: 'Lo siento, no entendí tu pregunta.',
          },
          metadata: {
            tags: ['testing', 'demo'],
            category: 'customer-service',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe('Test Agent');
      expect(response.body.status).toBe('active');
      expect(response.body.configuration.language).toBe('es');

      agentId = response.body._id;
    });

    it('should enforce plan limits', async () => {
      // Create agents until limit is reached
      // This assumes the test tenant has a plan with limited agents
      const maxAttempts = 20;
      let limitReached = false;

      for (let i = 0; i < maxAttempts; i++) {
        const response = await request(app)
          .post('/agents')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            tenantId,
            name: `Agent ${i}`,
          });

        if (response.status === 403 && response.body.error.includes('limit')) {
          limitReached = true;
          break;
        }
      }

      expect(limitReached).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/agents')
        .send({
          tenantId,
          name: 'Unauthorized Agent',
        });

      expect(response.status).toBe(401);
    });

    it('should fail for another tenant', async () => {
      const response = await request(app)
        .post('/agents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenantId: new mongoose.Types.ObjectId().toString(),
          name: 'Forbidden Agent',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /agents', () => {
    it('should list agents for tenant', async () => {
      const response = await request(app)
        .get('/agents')
        .query({ tenantId })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('agents');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.agents)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/agents')
        .query({ tenantId, status: 'active' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      response.body.agents.forEach((agent: any) => {
        expect(agent.status).toBe('active');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/agents')
        .query({ tenantId, page: 1, limit: 5 })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });
  });

  describe('GET /agents/:id', () => {
    it('should get agent by ID', async () => {
      const response = await request(app)
        .get(`/agents/${agentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(agentId);
      expect(response.body.name).toBe('Test Agent');
    });

    it('should return 404 for non-existent agent', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/agents/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /agents/:id', () => {
    it('should update agent', async () => {
      const response = await request(app)
        .put(`/agents/${agentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Agent',
          description: 'Updated description',
          configuration: {
            temperature: 0.9,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Agent');
      expect(response.body.description).toBe('Updated description');
      expect(response.body.configuration.temperature).toBe(0.9);
    });
  });

  describe('DELETE /agents/:id', () => {
    it('should soft delete agent', async () => {
      const response = await request(app)
        .delete(`/agents/${agentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted');

      // Verify agent is inactive
      const getResponse = await request(app)
        .get(`/agents/${agentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.status).toBe('inactive');
    });
  });
});
