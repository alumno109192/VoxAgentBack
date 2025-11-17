import fs from 'fs/promises';
import path from 'path';
import logger from './logger';

// Lock simple en memoria para evitar condiciones de carrera
const fileLocks = new Map<string, Promise<void>>();

/**
 * Servicio para gestión segura de archivos JSON mock
 */
class MockDataService {
  private dataPath: string;

  constructor() {
    this.dataPath = process.env.MOCK_DATA_PATH || path.join(process.cwd(), 'data', 'mock');
  }

  /**
   * Lee un archivo JSON de forma segura
   */
  private async readJSON<T>(filename: string): Promise<T> {
    const filePath = path.join(this.dataPath, filename);
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.warn(`Mock file not found: ${filename}, returning empty data`);
        return (filename.endsWith('agents.json') || 
                filename.endsWith('payments.json') || 
                filename.endsWith('voxagentai.json') ? [] : {}) as T;
      }
      logger.error(`Error reading mock file ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Escribe un archivo JSON de forma atómica
   */
  private async writeJSON<T>(filename: string, data: T): Promise<void> {
    const filePath = path.join(this.dataPath, filename);
    const tempPath = `${filePath}.tmp`;

    // Asegurar que el directorio existe
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    try {
      // Escribir en archivo temporal
      await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      
      // Renombrar atómicamente
      await fs.rename(tempPath, filePath);
      
      logger.info(`Mock file written successfully: ${filename}`);
    } catch (error) {
      // Limpiar archivo temporal en caso de error
      try {
        await fs.unlink(tempPath);
      } catch {}
      
      logger.error(`Error writing mock file ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Ejecuta una operación con lock para evitar condiciones de carrera
   */
  private async withLock<T>(filename: string, operation: () => Promise<T>): Promise<T> {
    // Esperar a que se libere el lock actual si existe
    const currentLock = fileLocks.get(filename);
    if (currentLock) {
      await currentLock;
    }

    // Crear nuevo lock
    let releaseLock: () => void;
    const newLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    
    fileLocks.set(filename, newLock);

    try {
      const result = await operation();
      return result;
    } finally {
      // Liberar lock
      releaseLock!();
      fileLocks.delete(filename);
    }
  }

  // ============ AGENTES ============

  async getAgents(tenantId?: string) {
    const agents = await this.readJSON<any[]>('agents.json');
    if (tenantId) {
      return agents.filter(a => a.tenantId === tenantId);
    }
    return agents;
  }

  async getAgentById(id: string) {
    const agents = await this.readJSON<any[]>('agents.json');
    return agents.find(a => a.id === id);
  }

  async createAgent(agent: any) {
    return this.withLock('agents.json', async () => {
      const agents = await this.readJSON<any[]>('agents.json');
      
      // Validar que no exista el ID
      if (agents.some(a => a.id === agent.id)) {
        throw new Error(`Agent with id ${agent.id} already exists`);
      }

      agents.push({
        ...agent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await this.writeJSON('agents.json', agents);
      return agent;
    });
  }

  async updateAgent(id: string, updates: any) {
    return this.withLock('agents.json', async () => {
      const agents = await this.readJSON<any[]>('agents.json');
      const index = agents.findIndex(a => a.id === id);
      
      if (index === -1) {
        throw new Error(`Agent with id ${id} not found`);
      }

      agents[index] = {
        ...agents[index],
        ...updates,
        id, // Preservar ID
        updatedAt: new Date().toISOString(),
      };

      await this.writeJSON('agents.json', agents);
      return agents[index];
    });
  }

  async deleteAgent(id: string) {
    return this.withLock('agents.json', async () => {
      const agents = await this.readJSON<any[]>('agents.json');
      const filteredAgents = agents.filter(a => a.id !== id);
      
      if (filteredAgents.length === agents.length) {
        throw new Error(`Agent with id ${id} not found`);
      }

      await this.writeJSON('agents.json', filteredAgents);
      return true;
    });
  }

  // ============ USO (ANGELITOS) ============

  async getUsage(tenantId?: string) {
    const usage = await this.readJSON<any>('usage.json');
    if (tenantId && usage.tenantId !== tenantId) {
      return {
        tenantId,
        period: new Date().toISOString().slice(0, 7),
        summary: { totalMinutes: 0, totalCalls: 0, totalCost: 0, unit: 'angelitos' },
        byType: {},
        byAgent: [],
        dailyUsage: [],
      };
    }
    return usage;
  }

  async updateUsage(tenantId: string, updates: any) {
    return this.withLock('usage.json', async () => {
      const usage = await this.readJSON<any>('usage.json');
      
      const updatedUsage = {
        ...usage,
        ...updates,
        tenantId,
        updatedAt: new Date().toISOString(),
      };

      await this.writeJSON('usage.json', updatedUsage);
      return updatedUsage;
    });
  }

  // ============ PLAN ============

  async getPlan(tenantId?: string) {
    const plan = await this.readJSON<any>('plan.json');
    if (tenantId && plan.tenantId !== tenantId) {
      return null;
    }
    return plan;
  }

  async updatePlan(tenantId: string, newPlan: any) {
    return this.withLock('plan.json', async () => {
      const currentPlan = await this.readJSON<any>('plan.json');
      
      const updatedPlan = {
        ...currentPlan,
        tenantId,
        currentPlan: newPlan,
        updatedAt: new Date().toISOString(),
      };

      await this.writeJSON('plan.json', updatedPlan);
      return updatedPlan;
    });
  }

  // ============ VOXAGENTAI ============

  async getVoxAgentAIInteractions(tenantId?: string) {
    const interactions = await this.readJSON<any[]>('voxagentai.json');
    if (tenantId) {
      return interactions.filter(i => i.tenantId === tenantId);
    }
    return interactions;
  }

  async addVoxAgentAIInteraction(interaction: any) {
    return this.withLock('voxagentai.json', async () => {
      const interactions = await this.readJSON<any[]>('voxagentai.json');
      
      // Validar que no exista el ID
      if (interactions.some(i => i.id === interaction.id)) {
        throw new Error(`Interaction with id ${interaction.id} already exists`);
      }

      interactions.push({
        ...interaction,
        timestamp: new Date().toISOString(),
      });

      await this.writeJSON('voxagentai.json', interactions);
      return interaction;
    });
  }

  // ============ PAGOS ============

  async getPayments(tenantId?: string) {
    const payments = await this.readJSON<any[]>('payments.json');
    if (tenantId) {
      return payments.filter(p => p.tenantId === tenantId);
    }
    return payments;
  }

  async addPayment(payment: any) {
    return this.withLock('payments.json', async () => {
      const payments = await this.readJSON<any[]>('payments.json');
      
      // Validar que no exista el ID
      if (payments.some(p => p.id === payment.id)) {
        throw new Error(`Payment with id ${payment.id} already exists`);
      }

      payments.push({
        ...payment,
        createdAt: new Date().toISOString(),
      });

      await this.writeJSON('payments.json', payments);
      return payment;
    });
  }
}

export default new MockDataService();
