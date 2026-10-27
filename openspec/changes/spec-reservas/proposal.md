## Why

Los socios no pueden reservar canchas hoy: existen los turnos (`turnos-franjas`) pero no hay forma de reservarlos, consultar las propias ni cancelarlas. Este change introduce la capacidad de **reservas** sobre un turno existente, con las reglas de negocio clave: un turno admite una sola reserva activa, no se reservan turnos pasados y la cancelación exige una ventana mínima de 2 horas. El equipamiento queda fuera: se alquila contra la reserva en el change `spec-alquiler`.

## What Changes

- Nueva capacidad `reservations` con un módulo NestJS propio (`reservas`).
- Tres endpoints bajo `/api/v1/`:
  - `POST /api/v1/reservas` — crear una reserva sobre un turno. Autenticado: `USUARIO` reserva solo para sí mismo; `ADMINISTRADOR` puede indicar `usuarioId` para reservar en nombre de otro usuario. Valida que el turno exista (404), que no haya pasado (400), que la cancha del turno esté `DISPONIBLE` (409) y que el turno esté libre (409). Responde `201 Created` con la reserva en estado `CONFIRMADA`.
  - `GET /api/v1/reservas/mis` — listar reservas. `USUARIO` ve solo las suyas; `ADMINISTRADOR` ve todas y puede filtrar con `?usuarioId=`. Responde `200 OK`.
  - `PATCH /api/v1/reservas/:id/cancelar` — cancelar una reserva. `USUARIO` solo las propias; `ADMINISTRADOR` cualquiera. Solo si faltan al menos 2 horas para el inicio del turno; fuera de ventana, turno ya iniciado o reserva ya cancelada → `409`. Libera el turno y, si la reserva tiene alquiler, restituye su stock. Responde `200 OK`.
- Al reservar, `Turno.disponible` pasa a `false`; al cancelar vuelve a `true` (contrato documentado en `turnos-franjas`).
- Estados de reserva: `CONFIRMADA` y `CANCELADA` (enum `EstadoReserva` ya existente en el schema).
- Sin equipamiento ni pagos: `POST /reservas` no acepta `items`; el alquiler y el pago son changes separados.

## Capabilities

### New Capabilities
- `reservations`: ciclo de vida de reservas de turnos (crear, consultar, cancelar) con un turno = una reserva activa, ventana de cancelación de 2 horas y permisos por rol.

### Modified Capabilities
(none)

## Impact

- **Backend (NestJS)**: nuevo módulo `reservas` (controller, service, DTOs con class-validator) sobre los modelos `Reserva` y `Turno` ya definidos en el schema Prisma. Sin migración nueva: la tabla `reservas` existe desde `init`.
- **Turnos**: el módulo de reservas actualiza `Turno.disponible`; `turnos-franjas` no cambia.
- **API contract**: nuevos endpoints `/api/v1/reservas*`, todos con JWT; roles `USUARIO` y `ADMINISTRADOR`.
- **Frontend (Next.js)**: las pantallas ya existen con datos mock (#22, #24); conectarlas a la API real queda para la fase de integración.
- **Dependencias**: `user-auth` (JWT y roles), `turnos-franjas` (modelo `Turno`) y `canchas-crud` (estado de la cancha). No depende de `equipamiento-catalogo`.
