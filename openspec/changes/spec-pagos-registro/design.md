## Context

Módulo nuevo `pagos` (ver proposal.md - Why) que se apoya en `user-auth` (roles JWT `USUARIO`/`ADMINISTRADOR`) y `spec-reservas` (`Reserva` `CONFIRMADA`). Las reservas no tienen precio de cancha; el `monto` del pago lo provee el `ADMINISTRADOR` al registrarlo. Los montos del alquiler (`rentals`) quedan fuera: este pago cubre la reserva de cancha. No hay rol `recepcionista`: solo `USUARIO` y `ADMINISTRADOR`.

## Goals / Non-Goals

**Goals:**
- Registrar un pago único por cada reserva `CONFIRMADA`, con `monto` y `metodoPago`.
- Ciclo de vida acotado y transiciones explícitas: `PENDIENTE → PAGADO`, `PENDIENTE|PAGADO → ANULADO` (terminal).
- Garantizar "una reserva → a lo sumo un pago" a nivel de base de datos.
- Permisos: mutaciones solo `ADMINISTRADOR`; consultas para `USUARIO` (propias) y `ADMINISTRADOR`.

**Non-Goals:**
- Pagos del alquiler de equipamiento (`rentals`) ni facturación/talones.
- Pagos parciales o múltiples cuotas por reserva.
- Definir/precalcular el precio de la cancha (el `monto` lo ingresa el `ADMINISTRADOR`).
- Editar `monto`/`metodoPago`/`fecha` de un pago creado.
- Motivo de anulación ni devolución automática de `monto`.
- Cuota social / membresía.

## Decisions

- **Modelo Prisma**: `Pago` (tabla `pagos`) ya existe en `schema.prisma`: `reservaId` unique → `Reserva`, `monto` `Decimal(10,2)`, `metodoPago` (`EFECTIVO`|`TRANSFERENCIA`|`TARJETA`), `estado` (`PENDIENTE`|`PAGADO`|`ANULADO`, default `PENDIENTE`), `fechaPago` nullable. Sin migración nueva; no hay campo `fecha` (se descartó del spec).

- **Un pago por reserva**: `reservaId` `@unique` + catch `P2002` → `409`. Alternativa: check previo de existencia → descartada por race condition; el constraint lo garantiza en BD.

- **Monto provisto por el admin**: la reserva no tiene precio de cancha hoy, así que `monto` entra por DTO (`> 0`). Alternativa descartada: calcular desde `Court`/turnos — requiere introducir precio de cancha, fuera de alcance y sin contrato previo. Se registra tal cual se ingresa (snapshot).

- **Máquina de estados**: mapa de transiciones en el service (`PENDIENTE → PAGADO`, `PENDIENTE|PAGADO → ANULADO`). Transición no permitida → `409`. El enum de Prisma y el DTO de salida garantizan que un pago no salga con un estado inválido. `ANULADO` no admite salida.

- **Registro**: valida que la reserva exista (404) y esté `CONFIRMADA` (409), e inserta `Pago` con `estado: PENDIENTE`. Si el insert choca con el unique (`P2002`) → `409` (ya existe pago). Esto cubre la carrera de dos registros simultáneos.

- **Confirmar (PATCH `/pagar`)**: `updateMany({ where: { id, estado: PENDIENTE }, data: { estado: PAGADO, fechaPago: new Date() } })`. Si afecta 0 filas, se reintroduce el registro para distinguir `404` (no existe) de `409` (no pendiente). Alternativa descartada: fetch + update en dos pasos siempre → más vulnerable a carrera.

- **Anular (PATCH `/anular`)**: `updateMany({ where: { id, estado: { in: [PENDIENTE, PAGADO] } }, data: { estado: ANULADO } })`; 0 filas → 404/409 según exista el registro.

- **Permisos** (mismo patrón que `reservas`): guards globales `JwtAuthGuard` + `RolesGuard`; `@Roles(RolUsuario.ADMINISTRADOR)` en las mutaciones; en la consulta, el service (usuario vía `@CurrentUser()`) valida que un `USUARIO` solo consulte reservas con su `usuarioId` (403); `ADMINISTRADOR` consulta cualquiera.

- **DTO**: `CrearPagoDto` con `monto` (`IsNumber` + `Min(0.01)`) y `metodoPago` (`IsEnum`). Validación con class-validator; el service no valida manualmente.

## Risks / Trade-offs

- [Carrera entre dos registros de pago simultáneos para la misma reserva] → unique `reservationId` + catch `P2002` → `409`; nunca dos pagos.
- [`monto` sin origen automático: pagos de la misma reserva/cancha pueden diferir] → Es un trade-off asumido: el precio de la cancha no existe aún. Mitigación: el `monto` queda congelado en el pago (snapshot) y la nota queda en el proposal para un cambio futuro de tarifas.
- [`PAGADO → ANULADO` permite "deshacer" un cobro en papel] → Intencional para correcciones administrativas; `ANULADO` es terminal y no reabre estados.
- [Chequeo de titularidad duplicado con `reservations`] → Se reutiliza la misma lógica helper de ownership (`usuarioId`) para no divergir.
- [Enum de `metodoPago`/`estado` nuevo en BD] → Migración aditiva con enum de Prisma; sin impacto en tablas existentes.

## Migration Plan

1. Aplicar antes: `auth` y `spec-reservas`.
2. Sin migración: el modelo `Pago` ya existe.
3. Implementar módulo `pagos` (controller, service, DTOs) y registrarlo en `AppModule`.
4. Frontend: sección de cobros para `ADMINISTRADOR` y estado de pago en "mis reservas".
5. **Rollback**: revertir el PR; no hay cambios de esquema.

## Open Questions

Ninguna. La tarifa de cancha (origen automático del `monto`) queda para un change futuro de precios.
