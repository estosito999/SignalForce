# SignalForce

SignalForce es una red social pseudonima de tesis y senales de mercado. Los usuarios entran con wallet, publican tesis estructuradas, comentan analisis de otros autores y anclan cada publicacion/comentario en blockchain.

## Stack conservado

- Frontend: Next.js + TypeScript + Tailwind + wagmi + viem
- Backend: FastAPI + SQLAlchemy + scikit-fuzzy
- Smart contracts: Solidity + Hardhat + OpenZeppelin
- Wallet: MetaMask (via wagmi)
- Red blockchain: Sepolia
- Base de datos: SQLite por defecto (o PostgreSQL via `DATABASE_URL`)

## Arquitectura actualizada por capas

- Rebranding de FuzzyRiskLedger -> SignalForce
- Dominio social: perfiles, tesis, comentarios, likes, follows, suscripciones
- Anclaje on-chain obligatorio para posts y comentarios
- Motor difuso reutilizado para `risk_score` y `risk_level`
- Reputacion 75/25 (verificable/social) con checkpoints

## Flujo funcional MVP

1. Usuario conecta wallet y hace login pseudonimo.
2. Crea tesis con activo, horizonte, sesgo, parametros difusos y deadline.
3. Backend calcula riesgo difuso y genera `post_hash` canonico.
4. Frontend envia transaccion `recordPost(postId, postHash)`.
5. Al confirmar tx, frontend sincroniza backend (`PATCH /theses/{id}/onchain`).
6. Comentarios repiten el flujo con `recordComment(commentId, postId, commentHash)`.
7. Feed y perfil muestran estado de tesis, reputacion y premium lock/unlock.

## Estructura

```text
SignalForge/
├── frontend/    # App web, feed, composer, detalle, wallet
├── backend/     # API social, motor difuso, persistencia, reputacion
├── contracts/   # Contrato SignalForceLedger, tests y scripts
├── docs/        # Plan e integracion
├── .env.example
└── docker-compose.yml
```

## Arranque local rapido

### 1) Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2) Contracts

```bash
cd contracts
npm install
npx hardhat node
```

En otra terminal:

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
```

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

## Variables de entorno

- Copia cada `.env.example` a su `.env`/`.env.local`.
- Frontend usa `NEXT_PUBLIC_SIGNAL_FORCE_CONTRACT_ADDRESS` (con fallback a `NEXT_PUBLIC_RISK_LEDGER_CONTRACT_ADDRESS`).
