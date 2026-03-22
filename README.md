# SignalForce

SignalForce es una red social pseudónima de tesis y señales de mercado. Los usuarios ingresan con su wallet, publican tesis estructuradas, comentan análisis de otros autores y anclan cada publicación o comentario en blockchain.

## Qué hace el proyecto

SignalForce combina una capa social con una capa de análisis bajo incertidumbre:

- Publicación de tesis de mercado con estructura mínima
- Cálculo de riesgo mediante lógica difusa
- Anclaje on-chain de publicaciones y comentarios
- Perfiles pseudónimos ligados a wallet
- Sistema de reputación con componente verificable y social
- Base para contenido premium y suscripciones

## Stack

- **Frontend:** Next.js + TypeScript + Tailwind + wagmi + viem
- **Backend:** FastAPI + SQLAlchemy + scikit-fuzzy
- **Smart contracts:** Solidity + Hardhat + OpenZeppelin
- **Wallet:** MetaMask
- **Blockchain:** Sepolia
- **Base de datos:** SQLite por defecto o PostgreSQL mediante `DATABASE_URL`

## Arquitectura por capas

- Rebranding de FuzzyRiskLedger a SignalForce
- Dominio social: perfiles, tesis, comentarios, likes, follows y suscripciones
- Anclaje on-chain obligatorio para posts y comentarios
- Motor difuso reutilizado para `risk_score` y `risk_level`
- Reputación híbrida 75/25:
  - **75% verificable**
  - **25% social**

## Flujo funcional MVP

1. El usuario conecta su wallet y crea o reutiliza su perfil pseudónimo.
2. Publica una tesis con activo, horizonte, sesgo, parámetros difusos y deadline.
3. El backend calcula el riesgo difuso y genera un `post_hash` canónico.
4. El frontend envía la transacción `recordPost(postId, postHash)` a Sepolia.
5. Tras confirmarse la transacción, el frontend sincroniza el backend.
6. Los comentarios repiten el mismo flujo mediante `recordComment(commentId, postId, commentHash)`.
7. El feed y los perfiles muestran estado de tesis, reputación y contenido premium bloqueado o desbloqueado.

## Estructura del proyecto

```text
SignalForge/
├── frontend/            # App web, feed, composer, detalle, perfil, wallet
├── backend/             # API social, motor difuso, persistencia, reputación
├── contracts/           # Contrato SignalForceLedger, tests y scripts
├── docs/                # Plan de implementación e integración
├── .env.example
└── docker-compose.yml
```

SignalForceLedger: 0xa9aDe086525F8Df4cd398B7c224F4BA4b85E493b


## Arranque local rapido

### 1) Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

http://localhost:8000/docs
```

### 2) Contracts

```bash
cd contracts
npm install
npx hardhat run scripts/deploy.ts --network sepolia
```


### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

## Variables de entorno

Frontend (frontend/.env.local)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SIGNAL_FORCE_CONTRACT_ADDRESS=0xa9aDe086525F8Df4cd398B7c224F4BA4b85E493b
NEXT_PUBLIC_SEPOLIA_RPC_URL=TU_RPC_DE_SEPOLIA
Contracts (contracts/.env)
SEPOLIA_RPC_URL=TU_RPC_DE_SEPOLIA
DEPLOYER_PRIVATE_KEY=TU_PRIVATE_KEY
ETHERSCAN_API_KEY=
Backend (backend/.env si aplica)
DATABASE_URL=sqlite:///./signalforce.db
CORS_ORIGINS=http://localhost:3000