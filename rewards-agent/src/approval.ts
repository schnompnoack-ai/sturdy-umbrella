import type { ClaimRequest, Hex } from './types.js';

export interface ApprovalToken {
  id: string;
  requestDigest: Hex;
  expiresAt: number;
}

export interface ApprovalGate {
  requestApproval(request: ClaimRequest, digest: Hex): Promise<ApprovalToken | null>;
  consumeApproval(token: ApprovalToken, digest: Hex): Promise<boolean>;
}

export class ManualApprovalGate implements ApprovalGate {
  constructor(private readonly approve: (request: ClaimRequest, digest: Hex) => Promise<boolean>) {}

  async requestApproval(request: ClaimRequest, digest: Hex): Promise<ApprovalToken | null> {
    const approved = await this.approve(request, digest);
    if (!approved) return null;
    return { id: crypto.randomUUID(), requestDigest: digest, expiresAt: Date.now() + 5 * 60_000 };
  }

  async consumeApproval(token: ApprovalToken, digest: Hex): Promise<boolean> {
    return token.requestDigest.toLowerCase() === digest.toLowerCase() && token.expiresAt > Date.now();
  }
}
