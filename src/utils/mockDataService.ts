import fs from 'fs/promises';
import * as fsSync from 'fs';
import path from 'path';
import logger from './logger';

// Lock simple en memoria para evitar condiciones de carrera
const fileLocks = new Map<string, Promise<void>>();

/**
 * Servicio para gestión segura de archivos JSON mock por tenant
 */
class MockDataService {
  private dataPath: string;

  constructor() {
    this.dataPath = process.env.MOCK_DATA_PATH || path.join(process.cwd(), 'data', 'mock');
  }

  /**
   * Genera el path del archivo por tenant y tipo
   */
  private getFilePath(tenantId: string, type: string): string {
    return path.join(this.dataPath, `${type}-${tenantId}.json`);
  }

  /**
   * Lee un archivo JSON de forma segura por tenant
   */
  private async readJSON<T>(tenantId: string, type: string): Promise<T> {
    const filePath = this.getFilePath(tenantId, type);
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.info(`Mock file not found: ${type}-${tenantId}.json, returning empty data`);
        // Retornar array vacío o objeto vacío según el tipo
        return (type === 'agents' || type === 'payments' || type === 'voxagentai' ? [] : {}) as T;
      }
      logger.error(`Error reading mock file ${type}-${tenantId}.json:`, error);
      throw error;
    }
  }

  /**
   * Escribe un archivo JSON de forma atómica por tenant
   */
  private async writeJSON<T>(tenantId: string, type: string, data: T): Promise<void> {
    const filePath = this.getFilePath(tenantId, type);
    const tempPath = `${filePath}.tmp`;

    // Asegurar que el directorio existe
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    try {
      // Escribir en archivo temporal
      await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      
      // Renombrar atómicamente
      await fs.rename(tempPath, filePath);
      
      logger.info(`Mock file written successfully: ${type}-${tenantId}.json`);
    } catch (error) {
      // Limpiar archivo temporal en caso de error
      try {
        await fs.unlink(tempPath);
      } catch {}
      
      logger.error(`Error writing mock file ${type}-${tenantId}.json:`, error);
      throw error;
    }
  }

  /**
   * Ejecuta una operación con lock para evitar condiciones de carrera
   */
  private async withLock<T>(tenantId: string, type: string, operation: () => Promise<T>): Promise<T> {
    const lockKey = `${type}-${tenantId}`;
    
    // Esperar a que se libere el lock actual si existe
    const currentLock = fileLocks.get(lockKey);
    if (currentLock) {
      await currentLock;
    }

    // Crear nuevo lock
    let releaseLock: () => void;
    const newLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    
    fileLocks.set(lockKey, newLock);

    try {
      const result = await operation();
      return result;
    } finally {
      // Liberar lock
      releaseLock!();
      fileLocks.delete(lockKey);
    }
  }

  // ============ AGENTES ============

  async getAgents(tenantId: string) {
    return this.readJSON<any[]>(tenantId, 'agents');
  }

  async getAgentById(tenantId: string, id: string) {
    const agents = await this.readJSON<any[]>(tenantId, 'agents');
    return agents.find(a => a.id === id);
  }

  async createAgent(tenantId: string, agent: any) {
    return this.withLock(tenantId, 'agents', async () => {
      const agents = await this.readJSON<any[]>(tenantId, 'agents');
      
      // Validar que no exista el ID
      if (agents.some(a => a.id === agent.id)) {
        throw new Error(`Agent with id ${agent.id} already exists`);
      }

      agents.push({
        ...agent,
        tenantId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await this.writeJSON(tenantId, 'agents', agents);
      return agent;
    });
  }

  async updateAgent(tenantId: string, id: string, updates: any) {
    return this.withLock(tenantId, 'agents', async () => {
      const agents = await this.readJSON<any[]>(tenantId, 'agents');
      const index = agents.findIndex(a => a.id === id);
      
      if (index === -1) {
        throw new Error(`Agent with id ${id} not found`);
      }

      // Verificar que el agente pertenece al tenant
      if (agents[index].tenantId !== tenantId) {
        throw new Error('Agent does not belong to this tenant');
      }

      agents[index] = {
        ...agents[index],
        ...updates,
        id, // Preservar ID
        tenantId, // Preservar tenantId
        updatedAt: new Date().toISOString(),
      };

      await this.writeJSON(tenantId, 'agents', agents);
      return agents[index];
    });
  }

  async deleteAgent(tenantId: string, id: string) {
    return this.withLock(tenantId, 'agents', async () => {
      const agents = await this.readJSON<any[]>(tenantId, 'agents');
      const agentToDelete = agents.find(a => a.id === id);
      
      if (!agentToDelete) {
        throw new Error(`Agent with id ${id} not found`);
      }

      // Verificar que el agente pertenece al tenant
      if (agentToDelete.tenantId !== tenantId) {
        throw new Error('Agent does not belong to this tenant');
      }

      const filteredAgents = agents.filter(a => a.id !== id);
      await this.writeJSON(tenantId, 'agents', filteredAgents);
      return true;
    });
  }

  // ============ USO (ANGELITOS) ============

  async getUsage(tenantId: string) {
    return this.readJSON<any>(tenantId, 'usage');
  }

  async updateUsage(tenantId: string, updates: any) {
    return this.withLock(tenantId, 'usage', async () => {
      const usage = await this.readJSON<any>(tenantId, 'usage');
      
      const updatedUsage = {
        ...usage,
        ...updates,
        tenantId,
        updatedAt: new Date().toISOString(),
      };

      await this.writeJSON(tenantId, 'usage', updatedUsage);
      return updatedUsage;
    });
  }

  // ============ PLAN ============

  async getPlan(tenantId: string) {
    return this.readJSON<any>(tenantId, 'plan');
  }

  async updatePlan(tenantId: string, newPlan: any) {
    return this.withLock(tenantId, 'plan', async () => {
      const currentPlan = await this.readJSON<any>(tenantId, 'plan');
      
      const updatedPlan = {
        ...currentPlan,
        tenantId,
        currentPlan: newPlan,
        updatedAt: new Date().toISOString(),
      };

      await this.writeJSON(tenantId, 'plan', updatedPlan);
      return updatedPlan;
    });
  }

  // ============ VOXAGENTAI ============

  async getVoxAgentAIInteractions(tenantId: string) {
    return this.readJSON<any[]>(tenantId, 'voxagentai');
  }

  async addVoxAgentAIInteraction(tenantId: string, interaction: any) {
    return this.withLock(tenantId, 'voxagentai', async () => {
      const interactions = await this.readJSON<any[]>(tenantId, 'voxagentai');
      
      // Validar que no exista el ID
      if (interactions.some(i => i.id === interaction.id)) {
        throw new Error(`Interaction with id ${interaction.id} already exists`);
      }

      interactions.push({
        ...interaction,
        tenantId,
        timestamp: new Date().toISOString(),
      });

      await this.writeJSON(tenantId, 'voxagentai', interactions);
      return interaction;
    });
  }

  // ============ PAGOS ============

  async getPayments(tenantId: string) {
    return this.readJSON<any[]>(tenantId, 'payments');
  }

  async addPayment(tenantId: string, payment: any) {
    return this.withLock(tenantId, 'payments', async () => {
      const payments = await this.readJSON<any[]>(tenantId, 'payments');
      
      // Validar que no exista el ID
      if (payments.some(p => p.id === payment.id)) {
        throw new Error(`Payment with id ${payment.id} already exists`);
      }

      payments.push({
        ...payment,
        tenantId,
        createdAt: new Date().toISOString(),
      });

      await this.writeJSON(tenantId, 'payments', payments);
      return payment;
    });
  }

  // ============ WIDGET CONFIG ============
  async getWidgetConfig(tenantId: string) {
    try {
      return await this.readJSON<any>(tenantId, 'widget-config');
    } catch (error) {
      // Si no existe, devolver configuración por defecto
      return {
        tenantId,
        theme: 'light',
        language: 'es-ES',
        voice: 'female',
        position: 'bottom-right',
        enabled: true,
        primaryColor: '#4F46E5',
        secondaryColor: '#818CF8',
        welcomeMessage: '¡Hola! ¿En qué puedo ayudarte hoy?',
        placeholderText: 'Escribe tu pregunta...',
        buttonText: 'Enviar',
        maxQueriesPerDay: 100,
      };
    }
  }

  async updateWidgetConfig(tenantId: string, config: any) {
    return this.withLock(tenantId, 'widget-config', async () => {
      const existingConfig = await this.getWidgetConfig(tenantId);
      const updatedConfig = {
        ...existingConfig,
        ...config,
        tenantId, // Preservar tenantId
        updatedAt: new Date().toISOString(),
      };
      await this.writeJSON(tenantId, 'widget-config', updatedConfig);
      return updatedConfig;
    });
  }

  // ============ WIDGET INTERACTIONS ============
  async getWidgetInteractions(tenantId: string, limit?: number) {
    try {
      const interactions = await this.readJSON<any[]>(tenantId, 'widget-interactions');
      if (limit) {
        return interactions.slice(-limit);
      }
      return interactions;
    } catch (error) {
      return [];
    }
  }

  async addWidgetInteraction(tenantId: string, interaction: any) {
    return this.withLock(tenantId, 'widget-interactions', async () => {
      let interactions = [];
      try {
        interactions = await this.readJSON<any[]>(tenantId, 'widget-interactions');
      } catch (error) {
        // Si no existe el archivo, crear array vacío
        interactions = [];
      }
      
      const newInteraction = {
        ...interaction,
        id: interaction.id || `widget-int-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tenantId,
        timestamp: interaction.timestamp || new Date().toISOString(),
      };
      
      interactions.push(newInteraction);
      
      // Mantener solo las últimas 1000 interacciones por tenant
      if (interactions.length > 1000) {
        interactions = interactions.slice(-1000);
      }
      
      await this.writeJSON(tenantId, 'widget-interactions', interactions);
      return newInteraction;
    });
  }

  async getWidgetInteractionsCount(tenantId: string, since?: Date): Promise<number> {
    try {
      const interactions = await this.readJSON<any[]>(tenantId, 'widget-interactions');
      if (!since) {
        return interactions.length;
      }
      return interactions.filter(i => new Date(i.timestamp) >= since).length;
    } catch (error) {
      return 0;
    }
  }

  // === Transcription Methods ===
  async getTranscriptionSession(tenantId: string, sessionId: string): Promise<any | null> {
    try {
      return await this.readJSON<any>(tenantId, `transcription-${sessionId}`);
    } catch (error) {
      return null;
    }
  }

  async addTranscriptionSegment(tenantId: string, sessionId: string, segment: any): Promise<any> {
    return this.withLock(tenantId, `transcription-${sessionId}`, async () => {
      let session: any;
      try {
        session = await this.readJSON<any>(tenantId, `transcription-${sessionId}`);
      } catch (error) {
        // Create new session
        session = {
          sessionId,
          tenantId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          segments: [],
          totalDuration: 0,
          totalCost: 0,
          totalWords: 0
        };
      }

      session.segments.push(segment);
      session.updatedAt = new Date().toISOString();
      session.totalDuration = (session.totalDuration || 0) + (segment.duration || 0);
      session.totalCost = (session.totalCost || 0) + (segment.metadata?.cost || 0);
      session.totalWords = (session.totalWords || 0) + (segment.metadata?.words?.length || 0);

      await this.writeJSON(tenantId, `transcription-${sessionId}`, session);
      return segment;
    });
  }

  async getTranscriptionHistory(tenantId: string, limit?: number): Promise<any[]> {
    try {
      const tenantDir = path.join(this.dataPath, tenantId);
      
      if (!fsSync.existsSync(tenantDir)) {
        return [];
      }

      const files = fsSync.readdirSync(tenantDir)
        .filter((f: string) => f.startsWith('transcription-') && f.endsWith('.json'))
        .map((f: string) => {
          const filePath = path.join(tenantDir, f);
          const stats = fsSync.statSync(filePath);
          const content = JSON.parse(fsSync.readFileSync(filePath, 'utf-8'));
          return {
            ...content,
            lastModified: stats.mtime
          };
        })
        .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      return limit ? files.slice(0, limit) : files;
    } catch (error) {
      return [];
    }
  }
}

export default new MockDataService();
