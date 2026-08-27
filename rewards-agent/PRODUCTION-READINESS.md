# Production readiness gate

## Current state

Discovery is read-only. No private key or seed phrase is required.

## Required gates before live claims

1. Verify every target chain and RPC network identity.
2. Verify contract address and published ABI.
3. Verify the claim method and wallet eligibility with read-only calls.
4. Simulate the complete transaction.
5. Compare expected reward with gas and configured limits.
6. Enforce contract allowlist, chain allowlist and daily limits.
7. Sign only through a separately managed wallet signer.
8. Record transaction hash and receipt.

Unknown or unverifiable contracts remain disabled.
