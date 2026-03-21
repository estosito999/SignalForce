# SignalForce - Plan de actualizacion por fases

## Fase 1 - Rebranding sobre base actual

- Renombrar branding visible de FuzzyRiskLedger a SignalForce.
- Mantener la estructura actual `frontend/`, `backend/`, `contracts/`.

## Fase 2 - Dominio de negocio social

- Convertir evaluaciones a tesis/senales.
- Reutilizar formulario actual como composer de tesis.
- Reutilizar historial como feed inicial.

## Fase 3 - Modelado backend extendido

- Nuevos modelos: `Profile`, `Thesis`, `Comment`, `Like`, `Follow`, `Subscription`, `ReputationHistory`.
- Mantener `Evaluation` como capa legacy para compatibilidad.

## Fase 4 - API social

- Auth por wallet (`/auth/wallet-login`).
- Endpoints de perfiles, feed, tesis, comentarios, likes, follows.
- Endpoints para resolver tesis y recalcular reputacion.
- Endpoints de suscripcion y sincronizacion on-chain.

## Fase 5 - Contrato actualizado

- Contrato `SignalForceLedger` para:
  - `recordPost`
  - `recordComment`
  - `recordReputationCheckpoint`
  - `recordSubscription`
- Mantener Hardhat y despliegue en Sepolia.

## Fase 6 - Frontend social

- Home/feed con composer y estado on-chain.
- Detalle de tesis con caja de comentarios.
- Perfil pseudonimo con rango.
- Premium lock/unlock por suscripcion.

## Fase 7 - Reputacion 75/25

- Verificable (75%): tiempo, completitud difusa, utilidad, consistencia.
- Social (25%): likes, comentarios, followers y actividad.

## Fase 8 - Monetizacion MVP

- Suscripcion a autores.
- Desbloqueo de contenido premium.
- Acumulacion y visualizacion de ingresos del creador.
