import request from 'supertest';
import app from '../../src/app';

describe('Health Endpoint', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('services');
  });

  it('should include service statuses', async () => {
    const response = await request(app).get('/health');

    expect(response.body.services).toHaveProperty('database');
    expect(response.body.services).toHaveProperty('redis');
    expect(response.body.services).toHaveProperty('bland');
  });
});
