# Contracts - Hardhat

Contrato principal: `SignalForceLedger` (archivo `contracts/FuzzyRiskLedger.sol`).

## Scripts

- `npm run compile`
- `npm run test`
- `npm run node`
- `npm run deploy:localhost`
- `npm run deploy:sepolia`
- `npm run record:post`
- `npm run record:comment`
- `npm run record:subscription`

## Variables

Copiar `.env.example` a `.env` y completar:

- `SEPOLIA_RPC_URL`
- `DEPLOYER_PRIVATE_KEY`
- `ETHERSCAN_API_KEY` (opcional para verificacion)
- `SIGNALFORCE_LEDGER_ADDRESS` (para scripts de registro)
