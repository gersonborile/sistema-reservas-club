## Why

Las reservas y los alquileres ya registran montos informativos, pero el club no tiene forma de registrar el cobro efectivo: no existe ninguna entidad ni endpoint de pago en el sistema. Este change introduce el **registro de pagos contra reservas**: un pago único por cada reserva `CONFIRMADA`, con ciclo de vida propio (`PENDIENTE`/`PAGADO`/`ANULADO`), que solo el `ADMINISTRADOR` puede registrar y que los usuarios pueden consultar sobre sus propias reservas. Sin este change, el club no puede llevar el control de qué reservas fueron cobradas.

## What Changes

- Nueva capacidad `payments` con módulo NestJS propio (`pagos`).
- `POST /api/v1/reservas/:id/pagos` — registrar el pago de una reserva en estado `CONFIRMADA`. El cuerpo SHALL incluir `monto` (mayor a 0) y `metodoPago` (`EFECTIVO` | `TRANSFERENCIA` | `TARJETA`). Reserva inexistente → `404`; reserva `CANCELADA` → `409`. Una reserva tiene a lo sumo un pago (segundo intento → `409`). Responde `201 Created`.
- Estados del pago: `PENDIENTE` (al crearse), `PAGADO` (al confirmarse el cobro) y `ANULADO` (al anularse). `ANULADO` es terminal.
- `PATCH /api/v1/pagos/:id/pagar` — confirmar el cobro de un pago `PENDIENTE`, pasándolo a `PAGADO` y registrando `fechaPago`. Pago inexistente → `404`; transición inválida → `409`. Responde `200 OK`.
- `PATCH /api/v1/pagos/:id/anular` — anular un pago en estado `PENDIENTE` o `PAGADO`, pasándolo a `ANULADO`. Pago inexistente → `404`; pago ya `ANULADO` → `409`. Responde `200 OK`.
- `GET /api/v1/reservas/:id/pagos` — consultar el pago de una reserva. Los `USUARIO` SHALL ver únicamente el pago de sus propias reservas; `ADMINISTRADOR` SHALL poder consultar el pago de cualquier reserva. Reserva inexistente → `404`; reserva sin pago → `404`.
- Permisos (JWT): registrar, confirmar y anular pagos son mutaciones reservadas **solo** al rol `ADMINISTRADOR` (`USUARIO` → `403`). Las consultas requieren autenticación (`401` sin token) y respetan la titularidad: un `USUARIO` que consulta el pago de una reserva ajena → `403`.
- Sin relación con el alquiler de equipamiento: los montos del alquiler (`rentals`) quedan fuera de este change; el pago cubre la reserva de cancha.

## Capabilities

### New Capabilities
- `payments`: registro de pago único por reserva `CONFIRMADA` (crear, confirmar cobro, anular y consultar) con ciclo de vida `PENDIENTE`/`PAGADO`/`ANULADO` y permisos por rol (mutaciones solo `ADMINISTRADOR`).

### Modified Capabilities
- (none)

## Impact

- **Backend (NestJS)**: nuevo módulo `pagos` (controller, service, DTOs con class-validator; Prisma directo en el service, como `reservas`). Lee `Reserva` para validar existencia, estado y titularidad (`usuarioId`).
- **Base de datos**: el modelo `Pago` (tabla `pagos`, `reservaId` unique, `monto`, `metodoPago`, `estado`, `fechaPago`) ya existe en `schema.prisma` (migración `init`): **sin migración nueva**.
- **API contract**: nuevos endpoints `/api/v1/reservas/:id/pagos` (POST, GET) y `/api/v1/pagos/:id/pagar|anular` (PATCH); todos requieren JWT.
- **Dependencia**: `user-auth` (roles `USUARIO`/`ADMINISTRADOR`, JWT) y `reservations` (`Reserva`, estados `CONFIRMADA`/`CANCELADA`). Sin tocar `rentals` ni `equipment`.
- **Frontend (Next.js)**: pantalla de cobros para `ADMINISTRADOR` y estado de pago en "mis reservas" para `USUARIO`.
- **Testing**: unit tests de service y e2e de los endpoints.
- **Rollback**: revertir el PR; no hay cambios de esquema que deshacer. Decisión de alcance: no hay campo `fecha` del pago (el schema no lo tiene); solo `fechaPago` al confirmar.
