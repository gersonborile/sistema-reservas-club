## Context

Módulo nuevo `reservas` (ver proposal.md - Why). Stack de `openspec/config.yaml`: REST plano `/api/v1/`, DTOs con class-validator, guards globales `JwtAuthGuard` + `RolesGuard` del módulo `auth`, Prisma/PostgreSQL. Los modelos `Reserva`, `Turno` y `Usuario` ya existen en `schema.prisma` (migración `init`): una `Reserva` referencia un `Turno` (`turnoId`) y un `Usuario` (`usuarioId`) y tiene `estado` (`EstadoReserva`: `CONFIRMADA | CANCELADA`). El slot de 1 hora ya está modelado por `Turno` (`fecha`, `horaInicio`, `horaFin`, `disponible`). Roles reales: `USUARIO` y `ADMINISTRADOR`.

## Goals / Non-Goals

**Goals:**
- Crear reservas sobre un turno libre, sin doble reserva ni carreras.
- Consultar reservas con permiso por titularidad (`USUARIO` = propias; `ADMINISTRADOR` = todas, filtrable).
- Cancelar respetando la ventana de 2 horas y dejando el turno libre.

**Non-Goals:**
- Equipamiento en la reserva (lo cubre `spec-alquiler`) y pagos (`spec-pagos-registro`).
- Edición o reprogramación de reservas (solo crear, consultar, cancelar).
- Regla "un usuario no puede tener dos reservas en la misma franja en canchas distintas": en `config.yaml` figura como configurable y no se implementa aquí.
- Frontend: las pantallas existen con mocks.

## Decisions

- **Sin migración**: se reutiliza `Reserva` tal cual. No se agregan campos ni índices.

- **Identificación del slot por `turnoId`**: `POST /reservas` recibe `turnoId` (UUID). No se recalcula `fecha`/`horaInicio`; el turno ya los trae. Alternativa descartada: `courtId` + `date` + `startTime` (duplicaría la lógica de `turnos-franjas`).

- **Un turno = una reserva activa, vía `Turno.disponible`**: dentro de una `$transaction`, `turno.updateMany({ where: { id: turnoId, disponible: true }, data: { disponible: false } })`; si afecta 0 filas → `409` (turno ocupado) y no se crea nada. Luego `reserva.create`. Es atómico y evita la carrera entre dos reservas simultáneas sin agregar un índice único (que impediría re-reservar un turno cancelado, porque las reservas canceladas quedan en la tabla).

- **Orden de validaciones en `POST`**: 1) rol/titularidad (`403`), 2) turno inexistente (`404`), 3) turno pasado (`400`), 4) cancha del turno no `DISPONIBLE` (`409`), 5) turno ocupado (`409`, vía `updateMany`).
  - "Turno pasado" se calcula con el instante de inicio `fecha` + `horaInicio` interpretado en UTC, igual que `esFechaPasada` de `turnos/horarios.ts`. Se reutiliza ese helper cuando alcance y se agrega uno de instante de inicio para la cancelación.

- **Cancelación transaccional**: `reserva.updateMany({ where: { id, estado: CONFIRMADA }, data: { estado: CANCELADA } })` (0 filas → `409` reserva ya cancelada), `turno.update({ disponible: true })` y, si existe alquiler asociado, restitución de stock. La restitución de stock se agrega en el change `spec-alquiler`; aquí queda como punto de extensión en el service (sin implementar) para no depender del catálogo.

- **Ventana de cancelación**: válida si `inicioTurno - ahora >= 2 horas`, con `inicioTurno` = `fecha` + `horaInicio` en UTC. Si falta menos o el turno ya comenzó → `409`.

- **Permisos en el service**: el usuario sale del JWT (`@CurrentUser()`, `TokenSesion`). `POST`: `USUARIO` con `usuarioId` ajeno → `403`; `ADMINISTRADOR` puede enviar `usuarioId` (debe existir, si no `404`). `GET /mis`: `USUARIO` ve solo las suyas y con `?usuarioId=` ajeno → `403`; `ADMINISTRADOR` ve todas, filtrables. `PATCH cancelar`: `USUARIO` solo si `reserva.usuarioId === userId`, si no `403`; `ADMINISTRADOR` cualquiera.

- **Respuesta de reserva**: `id`, `usuarioId`, `turnoId`, `estado`, `createdAt` y el turno embebido (`fecha`, `horaInicio`, `horaFin`, cancha). `GET /mis` ordena por `fecha`/`horaInicio` descendente.

- **DTOs**: `CrearReservaDto` (`turnoId` UUID, `usuarioId?` UUID) y `ListarReservasQueryDto` (`usuarioId?` UUID). Validación por pipe global, no manual en el service. Sigue el patrón de `turnos` y `canchas` (mensajes en un `mensajes.ts`).

## Risks / Trade-offs

- [Carrera por el mismo turno] → `updateMany` condicional dentro de `$transaction`; solo una de las transacciones ve `disponible: true`.
- [`Turno.disponible` desincronizado con `Reserva.estado`] → todo cambio de uno ocurre en la misma transacción que el otro; los tests e2e verifican ambos.
- [Zona horaria] → la ventana de 2 h y "turno pasado" usan UTC como el resto del backend. Si el club opera en otra zona, el desfase afecta a ambos módulos y se corrige en un solo lugar (el helper de horarios).
- [Stock del alquiler al cancelar] → punto de extensión hasta `spec-alquiler`; mientras no exista alquiler, cancelar no toca stock.

## Migration Plan

1. Implementar el módulo `reservas` sobre el schema actual (sin migración).
2. Registrarlo en `AppModule` y publicar `/api/v1/reservas*`.
3. **Rollback**: revertir el PR; no hay cambios de esquema que deshacer.

## Open Questions

- Ninguna que bloquee: la zona horaria del club se mantiene en UTC por consistencia con `turnos-franjas`.
