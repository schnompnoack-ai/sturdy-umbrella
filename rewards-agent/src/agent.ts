import type { RewardsAdapter, Signer, ClaimResult } from './types.js';

export interface AgentOptions {
  dryRun: boolean;
  maxClaimsPerRun: number;
}

export class RewardsAgent {
  constructor(
    private readonly adapters: RewardsAdapter[],
    private readonly signer: Signer,
    private readonly options: AgentOptions,
  ) {}

  async run(): Promise<ClaimResult[]> {
    const results: ClaimResult[] = [];
    let claims = 0;

    for (const adapter of this.adapters) {
      const candidates = await adapter.discover();
      for (const candidate of candidates) {
        if (!candidate.claimable || claims >= this.options.maxClaimsPerRun) continue;
        const request = await adapter.buildClaim(candidate);
        if (this.options.dryRun) {
          results.push({ submitted: false, reason: 'dry-run' });
          continue;
        }
        const hash = await this.signer.signAndSend(request);
        results.push({ submitted: true, transactionHash: hash });
        claims += 1;
      }
    }
    return results;
  }
}
