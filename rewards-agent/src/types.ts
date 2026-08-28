export type Hex = `0x${string}`;

export interface RewardCandidate {
  adapter: string;
  chainId: number;
  contract: Hex;
  recipient: Hex;
  claimable: boolean;
  rewardAmount: bigint;
  estimatedGasWei: bigint;
  nativeBalanceWei: bigint;
}

export interface ClaimRequest {
  chainId: number;
  contract: Hex;
  data: Hex;
  recipient: Hex;
  valueWei: bigint;
}

export interface ClaimResult {
  submitted: boolean;
  transactionHash?: Hex;
  reason?: string;
}

export interface ApprovalToken {
  id: string;
  requestDigest: Hex;
  expiresAt: number;
}

export interface Signer {
  signAndSend(request: ClaimRequest, approval: ApprovalToken): Promise<Hex>;
}

export interface RewardsAdapter {
  readonly id: string;
  discover(): Promise<RewardCandidate[]>;
  buildClaim(candidate: RewardCandidate): Promise<ClaimRequest>;
}
