import request from 'supertest';
import app from '../../src/app';

describe('VoxAgentAI API', () => {
  let authToken: string;
  let tenantId: string;

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

  describe('POST /voxagentai/query', () => {
    it('should process text query', async () => {
      const response = await request(app)
        .post('/voxagentai/query')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenantId,
          query: '¿Cuál es el horario de atención?',
          mode: 'text',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('mode', 'text');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('tokens');
      expect(response.body.metadata).toHaveProperty('cost');
      expect(response.body.metadata).toHaveProperty('queriesRemaining');
    });

    it('should process voice query', async () => {
      const response = await request(app)
        .post('/voxagentai/query')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenantId,
          query: 'Necesito agendar una cita',
          mode: 'voice',
        });

      expect(response.status).toBe(200);
      expect(response.body.mode).toBe('voice');
    });

    it('should enforce query limits', async () => {
      // Make queries until limit is reached
      const maxAttempts = 100;
      let limitReached = false;

      for (let i = 0; i < maxAttempts; i++) {
        const response = await request(app)
          .post('/voxagentai/query')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            tenantId,
            query: `Test query ${i}`,
            mode: 'text',
          });

        if (response.status === 429) {
          expect(response.body.error).toContain('limit');
          limitReached = true;
          break;
        }
      }

      expect(limitReached).toBe(true);
    });

    it('should fail without tenantId', async () => {
      const response = await request(app)
        .post('/voxagentai/query')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'Test query',
        });

      expect(response.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/voxagentai/query')
        .send({
          tenantId,
          query: 'Test query',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /voxagentai/status', () => {
    it('should get VoxAgentAI status', async () => {
      const response = await request(app)
        .get('/voxagentai/status')
        .query({ tenantId })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'active');
      expect(response.body).toHaveProperty('quota');
      expect(response.body.quota).toHaveProperty('limit');
      expect(response.body.quota).toHaveProperty('used');
      expect(response.body.quota).toHaveProperty('remaining');
      expect(response.body.quota).toHaveProperty('percentage');
      expect(response.body).toHaveProperty('monthlyStats');
      expect(response.body.monthlyStats).toHaveProperty('totalQueries');
      expect(response.body.monthlyStats).toHaveProperty('totalMinutes');
      expect(response.body.monthlyStats).toHaveProperty('totalCost');
      expect(response.body.monthlyStats).toHaveProperty('totalTokens');
    });
  });
});
