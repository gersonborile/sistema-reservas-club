## Context

El módulo Canchas + seed de Disciplinas está diseñado en `canchas-crud` (ver proposal.md — Why): backend NestJS en `/backend`, PostgreSQL + Prisma, IDs UUID, validación con `class-validator`, erros estándar de Nest, autorización con los guards globales del módulo `auth` (`JwtAuthGuard` + `RolesGuard`, `@Public()` y `@Roles(RolUsuario.ADMINISTRADOR)`). Este diseño define el módulo `Turnos` sobre esa base: el turno referencia una `Cancha` y una `Disciplina` existentes, y las mutaciones reutilizan esa misma autorización.

## Goals / Non-Goals

**Goals:**
- Modelo Prisma `Turno` con `cancha_id` (FK), `disciplina_id` (FK), `fecha`, `hora_inicio`, `hora_fin` y disponibilidad, manteniendo coherencia con `canchas` y `disciplinas`.
- API pública de consulta de turnos (listado con filtros y detalle) y de disponibilidad por cancha + fecha, sin autenticación.
- Mutaciones admin-only (crear/modificar/eliminar) con validación de superposición, fechas pasadas y referencias existentes.
- Comportamiento 401/403 verificable por tests antes de que `auth-registro-login` se integre.

**Non-Goals:**
- Implementar reservas ni el ciclo de vida de disponibilidad ligado a ellas (son otro cambio; este deja el seam). Implementar el mecanismo de auth en sí. Frontend, equipamiento, pagos. Validar disponibilidad contra un modelo de `Reserva`.

## Decisions

- **Modelo `Turno` con flag `disponible` persistido**: `id`, `cancha_id`, `disciplina_id`, `fecha`, `hora_inicio`, `hora_fin`, `disponible` (default `true`). Alternativa considerada: computar disponibilidad consultando una tabla `Reserva` relacionada. Se descarta porque `Reserva` aún no existe en este cambio; el flag mantiene el contrato observable del spec (`disponible` en toda respuesta) y el futuro cambio de reservas lo pondrá en `false` al reservar y `true` al cancelar (alineado con la regla "cancelar libera la franja"). Se documentará ese contrato en el cambio de reservas.
- **Superposición validada en el servicio (no en la base)**: al crear/modificar, se consultan turnos de la misma `cancha_id` + `fecha` y se descarta el propio turno al validar el rango `[hora_inicio, hora_fin)`. Dos rangos se superponen si `inicioA < finB AND inicioB < finA`. Alternativa considerada: restricción `exclude` de Postgres sobre rangos temporales — descartada por la complejidad de configurar tipos `tsrange` en este modelo y por mantener las validaciones uniformes en TypeScript con mensajes de negocio.
- **`hora_inicio`/`hora_fin` como `TIME`** en Postgres (Prisma `DateTime` a nivel de objeto en la app, truncado a hora/minuto al persistir) y `fecha` como `DATE`. Se descarta almacenar timestamps completos porque cruzar medianoche no cambia la fecha del turno y simplifica los filtros por `fecha`.
- **Endpoints y filtros** (módulo `Turnos` en `backend/src/turnos`, controller REST):
  - `GET /turnos` — público; query params opcionales `cancha_id`, `disciplina_id`, `fecha`, con paginación `page`/`limit` igual que en canchas.
  - `GET /turnos/:id` — público; `404` si no existe.
  - `GET /disponibilidad?cancha_id&fecha` — público; retorna solo turnos con `disponible = true`; `404` si la cancha no existe; `400` si faltan params.
  - `POST /turnos`, `PATCH /turnos/:id`, `DELETE /turnos/:id` — `@Roles(RolUsuario.ADMINISTRADOR)`; las rutas de lectura llevan `@Public()`.
- **Códigos de error** reutilizando el formato estándar de Nest: `400` datos inválidos/faltantes (validación de DTO), `404` no encontrado, `409` superposición o turno con reserva activa, `422` referencia a cancha/disciplina inexistente, `401` no autenticado, `403` no autorizado.
- **Baja lógica del requisito anti-reserva para el borrado**: hasta que exista `Reserva`, "turno con reserva activa" se traduce como `disponible = false` (mismo contrato futuro). Un turno `disponible = true` se puede eliminar físicamente (`204`).
- **DTOs con `class-validator`**: `CrearTurnoDto` y `ActualizarTurnoDto` (Campos parciales), con `IsUUID` para referencias, `IsDateString`/`IsISO8601` para fecha y horas. La existencia de cancha/disciplina se valida en el servicio (query) para responder `422` con referencias inexistentes.
- **Seed / datos**: no hay seed nuevo; los turnos los crea el administrador vía API.

## Risks / Trade-offs

- [Dependencia de auth] → La auth ya está implementada (`auth-registro-login`); los tests e2e usan tokens reales de un admin y de un socio para verificar 401/403.
- [Flag `disponible` desincronizable con futuras reservas] → Se documenta el contrato (reserva → `false`, cancelación → `true`) para el cambio de reservas y se expone `disponible` de solo lectura en respuestas.
- [La validación de superposición depende de la BD al momento de persistir] → Fuera de entornos de alta concurrencia es suficiente para el club; si se necesita, una restricción `exclude` de Postgres puede sumarse luego sin cambio de API.
- [Filtros sin validar formato de `fecha`] → El DTO del query valida `fecha` como ISO 8601; inválida responde 400.
- [POSTgreSQL con tipos DATE/TIME] → Prisma mapea `DateTime`/`String`; se centraliza el manejo de hora (`hora_inicio`/`hora_fin`) en un helper del módulo para evitar divergencias de formato.

## Migration Plan

- `prisma migrate dev --name turnos` para crear la tabla `Turno` y las FKs a `Cancha` y `Disciplina`.
- Rollback: revertir el PR; al no haber reservas, eliminar la tabla (o revertir la migración) no deja datos huérfanos.

## Open Questions

- Ninguna que requiera decisión ahora: la forma exacta de cruzar la relación con `Reserva` pertenece al futuro cambio de reservas y no cambia este spec.