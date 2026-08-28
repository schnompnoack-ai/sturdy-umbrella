import { createHash } from 'node:crypto';

export interface AuditEvent {
  id: string;
  at: string;
  event: string;
  status: 'accepted' | 'rejected' | 'error';
  details: Record<string, string>;
  previousHash?: string;
  hash: string;
}

export interface AuditSink {
  append(event: AuditEvent): Promise<void>;
}

export class HashChainAudit implements AuditSink {
  private previousHash = '';

  constructor(private readonly sink: AuditSink) {}

  async append(event: Omit<AuditEvent, 'previousHash' | 'hash'>): Promise<void> {
    const payload = JSON.stringify({ ...event, previousHash: this.previousHash });
    const hash = createHash('sha256').update(payload).digest('hex');
    const complete: AuditEvent = { ...event, previousHash: this.previousHash || undefined, hash };
    await this.sink.append(complete);
    this.previousHash = hash;
  }
}

export class MemoryAuditSink implements AuditSink {
  readonly events: AuditEvent[] = [];
  async append(event: AuditEvent): Promise<void> {
    this.events.push(Object.freeze({ ...event, details: { ...event.details } }));
  }
}
