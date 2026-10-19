## Context

El scaffold del backend NestJS (con `PrismaService` global, `ValidationPipe` compartido y PostgreSQL + migración + seed de disciplinas) y el módulo de auth (`JwtAuthGuard` global, `RolesGuard`, decoradores `@Public()`/`@Roles()`/`@CurrentUser()` y `RolUsuario` como enum de Prisma) ya están mergeados en `main` desde cambios previos. Este diseño define el módulo `Canchas` y `GET /disciplinas` sobre esa base (ver proposal.md — Why).

## Goals / Non-Goals

**Goals:**
- API estable y testeable (unit + e2e) que cubra todos los escenarios del spec `specs/canchas/spec.md`.
- Reutilizar el mecanismo de auth ya mergeado sin tocar el módulo `auth`.

**Non-Goals:**
- Frontend, reservas/turnos, disponibilidad, equipamiento, pagos, gestión admin de disciplinas.

## Decisions

- **Scaffold monorepo en `/backend`**: NestJS estándar (TypeScript, strict). Se elige Nest CLI porque el stack ya está decidido en `openspec/config.yaml`; no se evalúa Express plano porque no aporta el inyección de dependencias y decoradores que Nest da por defecto.
- **Prisma con many-to-many implícita** entre `Cancha` y `Disciplina`. Alternativa considerada: join-table explícita `CanchaDisciplina`. Se elige implícita por simplicidad del CRUD (se expone `disciplinas` embebidas); si más adelante disciplina por cancha necesita atributos propios, se migra a explícita.
- **Enumerado `EstadoCancha`** con valores `DISPONIBLE`, `OCUPADA` y `EN_MANTENIMIENTO` (los del enum de Prisma, consistentes con cómo se expone el rol). La API los emite y los acepta tal cual; el query param `?estado=` además admite la forma kebab del spec (`en-mantenimiento`) normalizándola antes de validar.
- **IDs tipo UUID** para canchas y disciplinas (generados por Prisma con `crypto`). Alternativa: autoincrement. UUID evita enumeración de recursos en la API pública y no involucra operaciones costosas a esta escala.
- **Validación con `class-validator`/`class-transformer`** sobre DTOs (create/update/query), con el `ValidationPipe` global compartido (`whitelist` + `forbidNonWhitelisted`). La unicidad del nombre se valida en el servicio (query contra la BD, comparando case-insensitive) porque es una restricción transaccional, no de forma. Las disciplinas se referencian por `disciplinaIds: string[]` (UUIDs validados con `@IsUUID({ each: true })`): UUID mal formado → 400; UUID válido inexistente → 422. `UpdateCanchaDto` es la versión parcial campo a campo de `CreateCanchaDto` (sin `PartialType` de `@nestjs/mapped-types` para no sumar dependencias).
- **Actualización vía `PUT /canchas/:id` con semántica parcial**: los campos no enviados se conservan y los enviados pasan por las mismas validaciones que la creación. Se eligió PUT (y se alineó el spec) por convención del equipo; el comportamiento es el de un PATCH.
- **Capa de acceso a datos con `PrismaService`** (patrón estándar del ecosistema Prisma/Nest). El servicio de canchas orquesta validaciones de negocio + repo.
- **Baja de cancha**: borrado físico solo si no hay `Turno` referenciando la cancha (las reservas cuelgan de turnos, por lo que cubre también las reservas activas); se verifica con un `count` previo y, como red de seguridad, el error de restricción de clave foránea de Prisma (`P2003`) se traduce a 409 —nunca se deja escapar un 500—. Alternativa considerada: soft-delete vía estado; se descarta porque el borrado físico mantiene el modelo simple; si el futuro necesita auditoría, se evalúa un flag `activo`.
- **Autorización con los guards ya mergeados**: el `JwtAuthGuard` y el `RolesGuard` están montados como `APP_GUARD` globales en `AuthModule`. El listado y el detalle de canchas y `GET /disciplinas` llevan `@Public()`; crear, modificar y eliminar llevan `@Roles(RolUsuario.ADMINISTRADOR)`. Sin 401/403 según corresponda, sin código de auth nuevo.
- **Filtros de listado**: `?disciplina=` y `?estado=` como query params opcionales, con paginación `page`/`limit` (por defecto `page=1`, `limit=20`). Se evita filtro por nombre por ahora (futuro cambio de búsqueda).
- **Respuestas de error**: `404` no encontrado, `400` validación, `409` conflicto de negocio (nombre duplicado / cancha con referencias), `401` no autenticado, `403` no autorizado, `422` referencia a disciplina inexistente. Cuerpo de error estándar `{ statusCode, message, error }` (formato por defecto de Nest).
- **Seed de disciplinas**: script Prisma seed idempotente (upsert por nombre) que crea tenis, fútbol, pádel al aplicar migración.

## Risks / Trade-offs

- [Many-to-many implícita limita atributos de la relación] → No es requerido hoy; si surge, migración a join explícita sin cambio de API.
- [Doble fuente de verdad de estados (enum Prisma vs contrato API)] → Se exponen directamente los valores del enum de Prisma; el único punto de conversión es la normalización kebab→enum del query param `estado`.
- [PUT con semántica parcial puede confundir REST puro] → Aceptado por convención del equipo; el spec documenta el comportamiento parcial explícitamente.

## Migration Plan

- No aplica en este cambio: la migración inicial, el schema y el seed de disciplinas ya fueron mergeados por cambios previos; este cambio solo agrega el módulo de API.

## Open Questions

- Ninguna abierta: el rol de usuario se resolvió como enum de Prisma (`RolUsuario`) en el cambio de auth y se consume tal cual en `@Roles(RolUsuario.ADMINISTRADOR)`.