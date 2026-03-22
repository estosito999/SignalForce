# Frontend - Next.js

Cliente de SignalForce para publicar tesis, comentar, conectar wallet y registrar acciones en blockchain.

## Comandos

- `npm install`
- `npm run dev`
- `npm run build`

## Variables

Copiar `.env.example` a `.env.local`.

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SIGNAL_FORCE_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_SIGNAL_FORCE_CHAIN_ID` (default: `11155111`)
- `NEXT_PUBLIC_SIGNAL_FORCE_DEPLOY_BLOCK` (bloque de despliegue para lectura de eventos)
- `NEXT_PUBLIC_ONCHAIN_FEED_LOOKBACK_BLOCKS` (default: `3000`)
- `NEXT_PUBLIC_ONCHAIN_LOG_BLOCK_RANGE` (default: `2000`, auto-ajuste a `10` si el RPC lo exige)
- `NEXT_PUBLIC_ONCHAIN_MAX_LOG_CALLS` (default: `350`)
- `NEXT_PUBLIC_ONCHAIN_FEED_LIMIT` (default: `100`)
- `NEXT_PUBLIC_BLOCK_EXPLORER_BASE_URL` (default: `https://sepolia.etherscan.io`)
- `NEXT_PUBLIC_TX_GAS_CAP` (default: `500000`, hard cap interno: `900000`)
- `NEXT_PUBLIC_SEPOLIA_RPC_URL`
