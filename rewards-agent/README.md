# Rewards Agent

Produktionsorientierte, sicherheitszentrierte Grundlage fuer automatisches On-Chain-Rewards-Claiming.

## Security by Design
- Zero Trust und Least Privilege zwischen Komponenten.
- Keine Seed-Phrases oder Private Keys im Repository oder im Agentenprozess.
- Signatur bleibt in einer externen Komponente.
- Keine Auszahlung oder Umbuchung ohne explizite manuelle Freigabe.
- Freigaben sind an einen kryptografischen Request-Digest gebunden, laufen nach 5 Minuten ab und sind gegen Replay geschuetzt.
- Chain, Contract und Recipient muessen explizit erlaubt sein.
- Reward-, Gas-, Kontostands- und Lauf-Limits werden vor dem Signieren geprueft.
- DRY_RUN ist der sichere Standard.
- Fehler fuehren nicht zu einer automatischen Fortsetzung der betroffenen Aktion.
- Audit-Ereignisse koennen ueber eine Hash-Kette manipulationserschwerend protokolliert werden.

## Ablauf
`discover -> policy validation -> build request -> request digest -> dry-run OR manual approval -> external signer -> audit`

## Architektur
- `config/` Netzwerke und Sicherheitskonfiguration
- `src/agent.ts` Orchestrierung und Sicherheitsgrenze
- `src/security.ts` Allowlist- und Limit-Pruefungen
- `src/approval.ts` manuelle Freigabe und Replay-Schutz
- `src/audit.ts` Audit-Schnittstelle und Hash-Kette
- `src/types.ts` streng typisierte Adapter-/Signer-Schnittstellen
- `abi/` verifizierte ABIs
- `tests/` Tests und Simulationen

Die konkreten Rewards-Contracts werden erst aktiviert, wenn Contract-Adresse, Chain, ABI, Recipient und Limits verifiziert sind. Ein echter Mainnet-Betrieb gilt erst nach erfolgreichem Build, Tests, Lockfile/CI und einem kontrollierten Dry-Run als freigabefaehig.
