import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import logger from './logger';
import config from '../config';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const rename = promisify(fs.rename);
const mkdir = promisify(fs.mkdir);

export interface PaymentRecord {
  id: string;
  tenantId: string;
  amount: number;
  currency: string;
  status: string;
  providerPaymentId: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface SavedPaymentRecord extends PaymentRecord {
  filepath: string;
  lineOffset: number;
}

/**
 * Simple in-process mutex for atomic file writes
 * Note: This only works in single-instance deployments
 * For multi-instance, use Redis-based locks
 */
class FileMutex {
  private locks: Map<string, Promise<void>> = new Map();

  async acquire(key: string): Promise<() => void> {
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    let release: () => void;
    const promise = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.locks.set(key, promise);

    return () => {
      this.locks.delete(key);
      release!();
    };
  }
}

const mutex = new FileMutex();

/**
 * Get payment file path for a specific date
 */
function getPaymentFilePath(date: Date = new Date()): string {
  const baseDir = config.emulator.paymentsJsonPath;
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(baseDir, `payments-${dateStr}.json`);
}

/**
 * Ensure directory exists
 */
async function ensureDirectoryExists(filepath: string): Promise<void> {
  const dir = path.dirname(filepath);
  try {
    await mkdir(dir, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Read all records from a payment file
 */
async function readPaymentFile(filepath: string): Promise<PaymentRecord[]> {
  try {
    const content = await readFile(filepath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    return lines.map(line => JSON.parse(line));
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Check if a payment record already exists (idempotency check)
 */
async function recordExists(
  providerPaymentId: string,
  filepath?: string
): Promise<boolean> {
  const filePath = filepath || getPaymentFilePath();
  
  try {
    const records = await readPaymentFile(filePath);
    return records.some(record => record.providerPaymentId === providerPaymentId);
  } catch (error) {
    logger.error('Error checking record existence:', error);
    return false;
  }
}

/**
 * Write payment record atomically to JSON file
 * Uses temp file + rename pattern for atomicity
 * Includes in-process mutex for concurrency control
 */
async function writeAtomic(record: PaymentRecord): Promise<SavedPaymentRecord> {
  const filepath = getPaymentFilePath();
  const tempPath = `${filepath}.tmp`;
  
  // Acquire lock for this file
  const release = await mutex.acquire(filepath);

  try {
    // Ensure directory exists
    await ensureDirectoryExists(filepath);

    // Check idempotency - if record already exists, return early
    const exists = await recordExists(record.providerPaymentId, filepath);
    if (exists) {
      logger.warn(`Payment record already exists: ${record.providerPaymentId}`);
      const existingRecords = await readPaymentFile(filepath);
      const existingRecord = existingRecords.find(
        r => r.providerPaymentId === record.providerPaymentId
      );
      
      if (existingRecord) {
        return {
          ...existingRecord,
          filepath,
          lineOffset: existingRecords.indexOf(existingRecord),
        };
      }
    }

    // Read existing records
    const existingRecords = await readPaymentFile(filepath);
    
    // Append new record
    existingRecords.push(record);
    
    // Write to temp file (one record per line for append-friendly format)
    const content = existingRecords.map(r => JSON.stringify(r)).join('\n') + '\n';
    await writeFile(tempPath, content, 'utf-8');
    
    // Atomic rename
    await rename(tempPath, filepath);
    
    logger.info(`Payment record written atomically: ${record.id} to ${filepath}`);
    
    return {
      ...record,
      filepath,
      lineOffset: existingRecords.length - 1,
    };
  } catch (error) {
    logger.error('Error writing payment record:', error);
    
    // Clean up temp file if it exists
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (cleanupError) {
      logger.error('Error cleaning up temp file:', cleanupError);
    }
    
    throw error;
  } finally {
    release();
  }
}

/**
 * Read all payments for a specific date range
 */
async function readPaymentsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<PaymentRecord[]> {
  const records: PaymentRecord[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const filepath = getPaymentFilePath(currentDate);
    
    try {
      const dayRecords = await readPaymentFile(filepath);
      records.push(...dayRecords);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        logger.error(`Error reading payment file ${filepath}:`, error);
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return records;
}

/**
 * Read payments for a specific tenant
 */
async function readPaymentsByTenant(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<PaymentRecord[]> {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const end = endDate || new Date();
  
  const allRecords = await readPaymentsByDateRange(start, end);
  return allRecords.filter(record => record.tenantId === tenantId);
}

/**
 * Get the latest payment record
 */
async function getLatestPayment(): Promise<PaymentRecord | null> {
  const filepath = getPaymentFilePath();
  
  try {
    const records = await readPaymentFile(filepath);
    return records.length > 0 ? records[records.length - 1] : null;
  } catch (error) {
    logger.error('Error reading latest payment:', error);
    return null;
  }
}

export type {
  SavedPaymentRecord,
};

export {
  writeAtomic,
  readPaymentFile,
  readPaymentsByDateRange,
  readPaymentsByTenant,
  getLatestPayment,
  recordExists,
  getPaymentFilePath,
};
