## Why

El equipamiento no puede ir dentro de `POST /reservas`: mezclaría reservar una cancha con alquilar equipamiento, dos reglas de negocio distintas (disponibilidad del turno vs stock y montos). `spec-reservas` ya dejó la creación de reservas sin equipamiento y un punto de extensión en la cancelación. Este change agrega el **alquiler de equipamiento** como concepto propio asociado a una reserva `CONFIRMADA`: `POST /reservas/:id/alquiler` es la única vía para alquilar, registra los montos informativos tomados del `precioUnitario` del catálogo y el stock vuelve al catálogo al cancelar la reserva.

## What Changes

- Nueva capacidad `rentals` con módulo NestJS propio (`alquileres`).
- `POST /api/v1/reservas/:id/alquiler` — crea el alquiler de una reserva existente `CONFIRMADA`. Valida que la reserva exista (404), sea del usuario o el usuario sea `ADMINISTRADOR` (403), no esté `CANCELADA` (409), que cada equipamiento exista (404) y esté activo (409) y que haya stock suficiente (409); descuenta el stock en la misma transacción. Una reserva tiene a lo sumo un alquiler (el segundo intento → 409). Responde `201 Created` con items, cantidades y montos.
- Nuevo modelo Prisma `Alquiler` (tabla `alquileres`, `reservaId` unique) que agrupa los items ya existentes en `ReservaEquipamiento` (`reserva_equipamientos`). Migración con backfill.
- `PATCH /api/v1/reservas/:id/cancelar` restituye el `stockDisponible` de los items del alquiler asociado, en la misma transacción (completa el punto de extensión de `spec-reservas`).
- `GET /api/v1/reservas/mis` incluye el `alquiler` de cada reserva (`null` si no tiene).
- `PrismaService.transaccion` pasa a usar el cliente transaccional real (hoy ignora el `tx` y las operaciones no revierten).
- Montos informativos: no hay endpoints ni entidades de facturación nuevos. El pago de la reserva es de `spec-pagos-registro`.

## Capabilities

### New Capabilities
- `rentals`: alquiler de equipamiento asociado a una reserva confirmada (creación con validación y descuento de stock, montos congelados del catálogo, un alquiler por reserva, restitución del stock al cancelar).

### Modified Capabilities
- `reservations`: se modifica "Consulta de reservas" (incluye el alquiler) y "Cancelación de reservas" (restituye el stock del alquiler).

## Impact

- **Backend (NestJS)**: nuevo módulo `alquileres` (controller + service con Prisma, mismo patrón que `pagos`). Ajustes en `reservas` (cancelación y listado) y en `prisma/prisma.service.ts`.
- **Base de datos (Prisma/PostgreSQL)**: tabla nueva `alquileres`; `reserva_equipamientos` pasa a depender de `alquileres` (FK por `reserva_id`). `equipamientos.precio_unitario` ya existe.
- **API contract**: nuevo `POST /api/v1/reservas/:id/alquiler`; `GET /reservas/mis` agrega el campo `alquiler`. `POST /reservas` no cambia (ya no acepta `items`).
- **Frontend (Next.js)**: flujo de alquiler sobre una reserva y alquiler visible en "mis reservas" (sección 4 de `tasks.md`; se hace después del backend, al conectar front y back).
- **Testing**: unit tests (stock, montos, un-alquiler-por-reserva, permisos, liberación al cancelar) y e2e del endpoint.
- **Rollback**: revertir la migración (restaurar la FK de `reserva_equipamientos` a `reservas` y borrar `alquileres`) y quitar el módulo.

## Dependencies

- Requiere `equipamiento-catalogo` (`Equipamiento`, `stockDisponible`, `precioUnitario`) y `spec-reservas` (`Reserva`, punto de extensión en cancelar); ambos ya están implementados en `main`.
