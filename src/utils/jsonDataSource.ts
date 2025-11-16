import fs from 'fs';
import path from 'path';
import logger from './logger';

interface TestUser {
  id: string;
  name: string;
  email: string;
  password: string;
  hashedPassword: string;
  role: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
}

interface TestTenant {
  id: string;
  name: string;
  apiKey: string;
  isActive: boolean;
  status: string;
  domain: string;
  contactEmail: string;
  contactPhone: string;
  billingMethod: string;
  quotaLimits: any;
  currentUsage: any;
  settings: any;
  metadata: any;
}

interface TestCall {
  id: string;
  blandCallId: string;
  tenantId: string;
  userId: string;
  from: string;
  to: string;
  direction: string;
  status: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  cost: number;
  recordingUrl: string;
  metadata: any;
}

interface TestTranscription {
  id: string;
  callId: string;
  tenantId: string;
  text: string;
  language: string;
  confidence: number;
  status: string;
  provider: string;
  chunks: any[];
  metadata: any;
  processedAt: string;
  createdAt: string;
}

interface TestPayment {
  id: string;
  tenantId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  gatewayId?: string;
  description: string;
  metadata: any;
  createdAt: string;
  paidAt?: string;
}

interface TestData {
  tenant: TestTenant;
  users: TestUser[];
  calls: TestCall[];
  transcriptions: TestTranscription[];
  payments: TestPayment[];
  _metadata: any;
}

class JsonDataSource {
  private dataPath: string;
  private data: TestData | null = null;

  constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'test-users.json');
  }

  private loadData(): TestData {
    if (this.data) {
      return this.data;
    }

    try {
      const fileContent = fs.readFileSync(this.dataPath, 'utf-8');
      this.data = JSON.parse(fileContent);
      logger.info('Test data loaded from JSON file');
      return this.data!;
    } catch (error) {
      logger.error('Error loading test data:', error);
      throw new Error('Could not load test data');
    }
  }

  findUserByEmail(email: string): TestUser | null {
    const data = this.loadData();
    const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.isActive);
    return user || null;
  }

  findUserById(id: string): TestUser | null {
    const data = this.loadData();
    const user = data.users.find(u => u.id === id && u.isActive);
    return user || null;
  }

  getTenant(): TestTenant {
    const data = this.loadData();
    return data.tenant;
  }

  findTenantById(id: string): TestTenant | null {
    const data = this.loadData();
    return data.tenant.id === id ? data.tenant : null;
  }

  getCallsByTenantId(tenantId: string, filters?: any): TestCall[] {
    const data = this.loadData();
    let calls = data.calls.filter(c => c.tenantId === tenantId);

    if (filters?.status) {
      calls = calls.filter(c => c.status === filters.status);
    }

    if (filters?.from) {
      calls = calls.filter(c => new Date(c.startedAt) >= new Date(filters.from));
    }

    if (filters?.to) {
      calls = calls.filter(c => new Date(c.startedAt) <= new Date(filters.to));
    }

    return calls;
  }

  findCallById(id: string): TestCall | null {
    const data = this.loadData();
    return data.calls.find(c => c.id === id) || null;
  }

  getTranscriptionsByTenantId(tenantId: string, filters?: any): TestTranscription[] {
    const data = this.loadData();
    let transcriptions = data.transcriptions.filter(t => t.tenantId === tenantId);

    if (filters?.status) {
      transcriptions = transcriptions.filter(t => t.status === filters.status);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      transcriptions = transcriptions.filter(t => 
        t.text.toLowerCase().includes(searchLower)
      );
    }

    return transcriptions;
  }

  findTranscriptionById(id: string): TestTranscription | null {
    const data = this.loadData();
    return data.transcriptions.find(t => t.id === id) || null;
  }

  findTranscriptionByCallId(callId: string): TestTranscription | null {
    const data = this.loadData();
    return data.transcriptions.find(t => t.callId === callId) || null;
  }

  getPaymentsByTenantId(tenantId: string): TestPayment[] {
    const data = this.loadData();
    return data.payments.filter(p => p.tenantId === tenantId);
  }

  getLatestPayment(tenantId: string): TestPayment | null {
    const payments = this.getPaymentsByTenantId(tenantId);
    if (payments.length === 0) return null;
    
    return payments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }
}

export default new JsonDataSource();
