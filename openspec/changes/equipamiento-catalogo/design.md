## Context

El módulo Canchas + seed de Disciplinas ya está implementado en `/backend` con NestJS, PostgreSQL + Prisma, IDs UUID, validación con `class-validator`, `ValidationPipe` global, guard global de JWT y `RolesGuard` con `@Roles(...)`. El modelo `Equipamiento` ya existe en `schema.prisma` con `stockTotal`, `stockDisponible`, `precioUnitario` y `activo`, y la tabla `equipamientos` con su FK a `disciplinas` y su relación `ReservaEquipamiento` ya está creada en la migración `init`. Este diseño define el módulo `Equipamiento` sobre esa base, sin migraciones nuevas.

## Goals / Non-Goals

**Goals:**
- Exponer el catálogo público de equipamiento con filtros, paginación y disponibilidad derivada.
- Implementar el CRUD administrativo con `POST`, `PUT` parcial y `DELETE`.
- Mantener el invariante `0 <= stockDisponible <= stockTotal` sin aceptar `stockDisponible` desde el cliente.
- Ajustar `stockDisponible` de forma atómica cuando el administrador cambia `stockTotal`, tolerando modificaciones concurrentes del flujo de alquiler.
- Responder 409 (nunca 500) cuando se intenta borrar un ítem con alquileres asociados o reducir el stock por debajo de lo alquilado.
- Verificar 401/403 con los guards reales de `auth`.

**Non-Goals:**
- Implementar alquileres, reservas, pagos, turnos ni disponibilidad de canchas.
- Modificar el schema de Prisma o las migraciones.
- Modificar los módulos de auth o canchas.
- Implementar frontend.
- Agregar unicidad de nombre u otras restricciones que la spec no pide.

## Decisions

- **Modelo y contrato en camelCase.** Se usa el modelo `Equipamiento` tal como está en el schema: `id`, `nombre`, `disciplinaId`, `stockTotal`, `stockDisponible`, `precioUnitario`, `activo`, `createdAt`, `updatedAt`. La API expone `id`, `nombre`, `disciplinaId`, `disciplina` (`{ id, nombre }`), `stockTotal`, `stockDisponible`, `precioUnitario` (número JSON), `activo` y `disponible` (calculado como `stockDisponible > 0`). No se exponen timestamps.
- **Serialización de `precioUnitario`.** Prisma devuelve `Decimal`; el serializador lo convierte a `number` para que el contrato JSON sea estable y consistente con el resto de la API. La spec lo documenta como número JSON.
- **Catálogo público con `@Public()`.** `GET /equipamiento` y `GET /equipamiento/:id` no requieren token. Por defecto el listado incluye solo `activo = true`; `incluirInactivos=true` incluye también los inactivos. `incluirInactivos` está disponible para cualquier cliente porque el catálogo es público. El detalle devuelve el ítem aunque esté inactivo.
- **Filtros y paginación.** `disciplinaId` es un UUID validado en el DTO de query; `disponible=true` filtra `stockDisponible > 0` y `disponible=false` filtra `stockDisponible = 0`; `page` y `limit` replican los límites de canchas (`limit` entre 1 y 100, default 20). Se filtra en la consulta de Prisma, no en memoria.
- **DTOs en español con límites.** `CrearEquipamientoDto`: `nombre` no vacío, `disciplinaId` UUID, `stockTotal` entero entre 0 y 2147483647, `precioUnitario` número entre 0 y 99999999.99 con hasta 2 decimales, `activo` booleano opcional (default `true`). `ActualizarEquipamientoDto`: todos los campos opcionales con las mismas validaciones. `ListarEquipamientoQueryDto`: `disciplinaId`, `disponible`, `incluirInactivos`, `page`, `limit`. Ningún DTO acepta `stockDisponible`; el `ValidationPipe` global con `forbidNonWhitelisted` responde 400 si se envía.
- **Creación.** Se valida que la disciplina exista (`422` si no) y se crea con `stockDisponible = stockTotal`. No se valida unicidad de `nombre`.
- **Actualización parcial con stock atómico.** `PUT /equipamiento/:id` actualiza solo los campos enviados. Si no se envía `stockTotal`, se actualizan los demás campos sin tocar el stock. Si se envía `stockTotal`, se repite un ciclo acotado (optimistic locking):
  1. Se lee `stockTotal` y `stockDisponible` vigentes.
  2. Se calculan las unidades alquiladas (`stockTotal - stockDisponible`).
  3. Si el nuevo total es menor que las unidades alquiladas, se responde `409`.
  4. Se ejecuta `updateMany` con `where: { id, stockTotal: leído, stockDisponible: leído }` y los nuevos valores (`stockTotal`, `stockDisponible = nuevoTotal - alquiladas`, más los demás campos).
  5. Si `count === 1`, la operación fue atómica y exitosa. Si `count === 0`, el ítem cambió en paralelo (por ejemplo, un alquiler descontó stock) y se reintenta con los valores frescos. Si se agotan los intentos, se responde `409`.
  El `where` condicional evita pisar un cambio concurrente y nunca deja que el CHECK de la base reciba un valor inválido.
- **Eliminación.** Se consulta el ítem con `_count.reservas`; si no existe, `404`; si tiene alquileres, `409` con un mensaje que sugiere `activo = false`. Como red de seguridad, se captura `P2003` de Prisma y se responde el mismo `409`, nunca un 500.
- **Errores.** `400` para validación de DTO o query, `404` para ítem inexistente, `409` para reducir stock por debajo de lo alquilado o eliminar con alquileres, `422` para disciplina inexistente, `401` sin token y `403` sin rol administrador.
- **Roles reales.** Se usa `@Roles(RolUsuario.ADMINISTRADOR)` en `POST`, `PUT` y `DELETE`; el `JwtAuthGuard` y el `RolesGuard` globales ya están registrados en `AuthModule`. `GET` lleva `@Public()`.
- **Sin transacciones explícitas.** No hace falta `$transaction` para el ajuste de stock porque la condición del `updateMany` y el chequeo de `count` hacen la operación atómica a nivel de fila. Las lecturas posteriores solo sirven para serializar la respuesta.
- **Tests.** Unitarios de `EquipamientoService` con Vitest y `PrismaService` mockeado; e2e con Supertest y `PrismaService` mockeado, siguiendo el patrón de `test/canchas.e2e-spec.ts`.

## Risks / Trade-offs

- [Reintentos bajo alta concurrencia] → El ciclo es acotado; si se agota, se responde `409` en lugar de arriesgar un stock inconsistente.
- [Serializar `Decimal` como número] → Se documenta en la spec. El rango permitido (`99999999.99`) evita problemas prácticos de precisión en JSON.
- [Borrado físico vs baja lógica] → La spec pide baja física; la baja lógica queda disponible vía `activo = false` y el mensaje del 409 la sugiere.
- [Sin unicidad de nombre] → Es una decisión explícita: el schema no la tiene y la spec no la pide.

## Migration Plan

- No hay migración nueva: la tabla `equipamientos`, su FK a `disciplinas` y la relación `ReservaEquipamiento` ya existen.
- Rollback: revertir el PR; no se tocó el schema ni las migraciones.

## Open Questions

- Ninguna. El flujo de alquiler queda fuera de alcance y solo se contempla como escritor concurrente de `stockDisponible`.
