# Backend - FastAPI (SignalForce)

## Estructura

```text
backend/
├── app/
│   ├── core/        # Configuracion y settings
│   ├── db/          # Engine, sesion y modelos SQLAlchemy
│   ├── routes/      # Endpoints HTTP (auth, feed, theses, profiles, etc.)
│   ├── schemas/     # Contratos de entrada/salida
│   └── services/    # Logica de negocio, motor difuso y reputacion
├── .env.example
└── requirements.txt
```

## Endpoints principales

- `GET /api/v1/health`
- `POST /api/v1/auth/wallet-login`
- `GET /api/v1/feed`
- `POST /api/v1/theses`
- `PATCH /api/v1/theses/{id}/onchain`
- `POST /api/v1/theses/{id}/comments`
- `PATCH /api/v1/theses/comments/{id}/onchain`
- `POST /api/v1/reputation/recalculate/{wallet}`
- `POST /api/v1/subscriptions`
- `PATCH /api/v1/subscriptions/{id}/onchain`

## Endpoints legacy (compat)

- `POST /api/v1/evaluations`
- `GET /api/v1/evaluations`
- `PATCH /api/v1/evaluations/{id}/onchain`

## Ejecucion local

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Migracion de historial legacy

Si ya tienes datos en `evaluations`, puedes pasarlos a `theses` sin perder trazabilidad:

```bash
python migrate_evaluations_to_theses.py
```
