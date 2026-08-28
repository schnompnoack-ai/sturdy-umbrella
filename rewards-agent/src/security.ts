import type { ClaimRequest, RewardCandidate, Hex } from './types.js';

export interface SecurityPolicy {
  allowedChainIds: readonly number[];
  allowedContracts: readonly Hex[];
  allowedRecipients: readonly Hex[];
  maxRewardWei: bigint;
  maxGasWei: bigint;
  maxNativeBalanceWei: bigint;
  maxClaimsPerRun: number;
}

export type SecurityDecision =
  | { allowed: true }
  | { allowed: false; reason: string };

const sameHex = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export function validateCandidate(candidate: RewardCandidate, policy: SecurityPolicy): SecurityDecision {
  if (!policy.allowedChainIds.includes(candidate.chainId)) {
    return { allowed: false, reason: `chain-not-allowed:${candidate.chainId}` };
  }
  if (!policy.allowedContracts.some((x) => sameHex(x, candidate.contract))) {
    return { allowed: false, reason: 'contract-not-allowed' };
  }
  if (!policy.allowedRecipients.some((x) => sameHex(x, candidate.recipient))) {
    return { allowed: false, reason: 'recipient-not-allowed' };
  }
  if (candidate.rewardAmount < 0n || candidate.rewardAmount > policy.maxRewardWei) {
    return { allowed: false, reason: 'reward-limit-exceeded' };
  }
  if (candidate.estimatedGasWei < 0n || candidate.estimatedGasWei > policy.maxGasWei) {
    return { allowed: false, reason: 'gas-limit-exceeded' };
  }
  if (candidate.nativeBalanceWei < 0n || candidate.nativeBalanceWei > policy.maxNativeBalanceWei) {
    return { allowed: false, reason: 'native-balance-policy-violation' };
  }
  return { allowed: true };
}

export function validateClaimRequest(request: ClaimRequest, policy: SecurityPolicy): SecurityDecision {
  if (!policy.allowedChainIds.includes(request.chainId)) return { allowed: false, reason: 'chain-not-allowed' };
  if (!policy.allowedContracts.some((x) => sameHex(x, request.contract))) return { allowed: false, reason: 'contract-not-allowed' };
  if (!policy.allowedRecipients.some((x) => sameHex(x, request.recipient))) return { allowed: false, reason: 'recipient-not-allowed' };
  if (request.valueWei < 0n) return { allowed: false, reason: 'negative-value' };
  return { allowed: true };
}
