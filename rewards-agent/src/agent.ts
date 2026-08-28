import { createHash } from 'node:crypto';
import type { RewardsAdapter, Signer, ClaimResult, ClaimRequest } from './types.js';
import type { ApprovalGate } from './approval.js';
import type { AuditSink } from './audit.js';
import { validateCandidate, validateClaimRequest, type SecurityPolicy } from './security.js';

export interface AgentOptions {
  dryRun: boolean;
  maxClaimsPerRun: number;
}

function requestDigest(request: ClaimRequest): `0x${string}` {
  const canonical = [request.chainId, request.contract.toLowerCase(), request.data.toLowerCase(), request.recipient.toLowerCase(), request.valueWei.toString()].join('|');
  return `0x${createHash('sha256').update(canonical).digest('hex')}`;
}

export class RewardsAgent {
  constructor(
    private readonly adapters: RewardsAdapter[],
    private readonly signer: Signer,
    private readonly options: AgentOptions,
    private readonly policy: SecurityPolicy,
    private readonly approval: ApprovalGate,
    private readonly audit: AuditSink,
  ) {}

  async run(): Promise<ClaimResult[]> {
    const results: ClaimResult[] = [];
    let claims = 0;

    if (this.options.maxClaimsPerRun <= 0 || this.options.maxClaimsPerRun > this.policy.maxClaimsPerRun) {
      throw new Error('invalid-claim-limit');
    }

    for (const adapter of this.adapters) {
      let candidates;
      try {
        candidates = await adapter.discover();
      } catch (error) {
        await this.record('discovery-error', 'error', { adapter: adapter.id, error: String(error) });
        continue;
      }

      for (const candidate of candidates) {
        if (claims >= this.options.maxClaimsPerRun) break;
        if (!candidate.claimable) continue;

        const candidateDecision = validateCandidate(candidate, this.policy);
        if (!candidateDecision.allowed) {
          results.push({ submitted: false, reason: candidateDecision.reason });
          await this.record('candidate-rejected', 'rejected', { adapter: adapter.id, reason: candidateDecision.reason });
          continue;
        }

        let request: ClaimRequest;
        try {
          request = await adapter.buildClaim(candidate);
        } catch (error) {
          results.push({ submitted: false, reason: 'build-claim-failed' });
          await this.record('claim-build-error', 'error', { adapter: adapter.id, error: String(error) });
          continue;
        }

        const requestDecision = validateClaimRequest(request, this.policy);
        if (!requestDecision.allowed) {
          results.push({ submitted: false, reason: requestDecision.reason });
          await this.record('request-rejected', 'rejected', { adapter: adapter.id, reason: requestDecision.reason });
          continue;
        }

        const digest = requestDigest(request);
        if (this.options.dryRun) {
          results.push({ submitted: false, reason: `dry-run:${digest}` });
          await this.record('dry-run', 'accepted', { adapter: adapter.id, digest });
          continue;
        }

        const token = await this.approval.requestApproval(request, digest);
        if (!token || !(await this.approval.consumeApproval(token, digest))) {
          results.push({ submitted: false, reason: 'manual-approval-required' });
          await this.record('approval-denied', 'rejected', { adapter: adapter.id, digest });
          continue;
        }

        try {
          const hash = await this.signer.signAndSend(request, token);
          results.push({ submitted: true, transactionHash: hash });
          claims += 1;
          await this.record('claim-submitted', 'accepted', { adapter: adapter.id, digest, transactionHash: hash });
        } catch (error) {
          results.push({ submitted: false, reason: 'sign-or-send-failed' });
          await this.record('sign-or-send-error', 'error', { adapter: adapter.id, digest, error: String(error) });
        }
      }
    }
    return results;
  }

  private async record(event: string, status: 'accepted' | 'rejected' | 'error', details: Record<string, string>) {
    const at = new Date().toISOString();
    const id = createHash('sha256').update(`${at}|${event}|${JSON.stringify(details)}`).digest('hex');
    await this.audit.append({ id, at, event, status, details, hash: id });
  }
}
