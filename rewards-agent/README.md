# Rewards Agent

Produktionsorientierte Grundlage fuer automatisches On-Chain-Rewards-Claiming.

## Sicherheitsprinzipien
- Keine Seed-Phrases oder Private Keys im Repository.
- Claims laufen ueber eine externe Signaturkomponente.
- Jeder Adapter muss Netzwerk, Contract, ABI und Claim-Funktion explizit definieren.
- Vor dem Claim werden Claimbarkeit, Mindestwert, Gas und Tageslimit geprueft.
- Standardmodus ist DRY_RUN; Mainnet-Ausfuehrung muss explizit aktiviert werden.

## Architektur
- `config/` Netzwerke und Adapter-Konfiguration
- `src/` Agent, Adapter, Policy und Signatur-Schnittstelle
- `abi/` verifizierte ABIs
- `tests/` Tests und Simulationen

Die konkreten Rewards-Contracts werden erst aktiviert, wenn Contract-Adresse, Chain und ABI verifiziert sind.
