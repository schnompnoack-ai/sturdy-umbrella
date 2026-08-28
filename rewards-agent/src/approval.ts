import { randomUUID } from 'node:crypto';
import type { ApprovalToken, ClaimRequest, Hex } from './types.js';

export interface ApprovalGate {
  requestApproval(request: ClaimRequest, digest: Hex): Promise<ApprovalToken | null>;
  consumeApproval(token: ApprovalToken, digest: Hex): Promise<boolean>;
}

export class ManualApprovalGate implements ApprovalGate {
  private readonly consumed = new Set<string>();

  constructor(private readonly approve: (request: ClaimRequest, digest: Hex) => Promise<boolean>) {}

  async requestApproval(request: ClaimRequest, digest: Hex): Promise<ApprovalToken | null> {
    const approved = await this.approve(request, digest);
    if (!approved) return null;
    return { id: randomUUID(), requestDigest: digest, expiresAt: Date.now() + 5 * 60_000 };
  }

  async consumeApproval(token: ApprovalToken, digest: Hex): Promise<boolean> {
    if (token.expiresAt <= Date.now()) return false;
    if (this.consumed.has(token.id)) return false;
    if (token.requestDigest.toLowerCase() !== digest.toLowerCase()) return false;
    this.consumed.add(token.id);
    return true;
  }
}
