# Integracion entre modulos (SignalForce)

## 1) Frontend -> Backend (crear tesis)

- Endpoint: `POST /api/v1/theses`
- Payload minimo:

```json
{
  "author_wallet": "0x...",
  "asset": "BTC",
  "horizon": "7d",
  "bias": "bullish",
  "price_volatility": 72,
  "context_climate": 60,
  "expected_demand": 45,
  "author_confidence": 66,
  "summary": "Escenario base con sesgo alcista",
  "thesis_text": "Detalle de tesis",
  "is_premium": true,
  "premium_price_wei": "1000000000000000",
  "evaluation_deadline": "2026-03-30T18:00:00Z",
  "reference_price": 61250
}
```

- Respuesta: incluye `id`, `risk_score`, `risk_level`, `post_hash`, `status=pending_onchain`.

## 2) Frontend -> Smart Contract (anclar post)

- Funcion: `recordPost(string postId, bytes32 postHash)`
- `postHash` proviene del backend.

## 3) Frontend -> Backend (sync post tx)

- Endpoint: `PATCH /api/v1/theses/{id}/onchain`

```json
{
  "wallet_address": "0x...",
  "tx_hash": "0x...",
  "chain_id": 11155111
}
```

## 4) Comentarios con anclaje obligatorio

- Crear: `POST /api/v1/theses/{id}/comments`
- Anclar: `recordComment(string commentId, string postId, bytes32 commentHash)`
- Sincronizar: `PATCH /api/v1/theses/comments/{id}/onchain`

## 5) Suscripciones premium

- Crear pendiente: `POST /api/v1/subscriptions`
- On-chain: `recordSubscription(address creator)` con `value`.
- Sincronizar: `PATCH /api/v1/subscriptions/{id}/onchain`

## 6) Reputacion

- Recalcular: `POST /api/v1/reputation/recalculate/{wallet}`
- Registrar checkpoint on-chain: `recordReputationCheckpoint(address wallet, uint256 score, string rank)`
