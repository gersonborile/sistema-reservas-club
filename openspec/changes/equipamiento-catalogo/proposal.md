## Why

El club necesita administrar el catálogo de equipamiento deportivo (raquetas, pelotas, redes, chalecos, etc.) disponible para sus socios. El modelo `Equipamiento` ya existe en el schema de Prisma y la tabla se creó en la migración `init`, pero no hay ninguna capa de API que permita consultarlo ni gestionarlo. Agregar el catálogo con su stock total y disponible es prerrequisito para futuras funcionalidades de alquiler de equipamiento.

## What Changes

- API REST para el catálogo y la administración de equipamiento, usando el modelo `Equipamiento` existente (`id`, `nombre`, `disciplinaId`, `stockTotal`, `stockDisponible`, `precioUnitario`, `activo`):
  - `GET /equipamiento` — catálogo público con filtros `disciplinaId`, `disponible` e `incluirInactivos`, y paginación `page`/`limit`.
  - `GET /equipamiento/:id` — detalle público de un ítem.
  - `POST /equipamiento` — crear un ítem (solo administrador).
  - `PUT /equipamiento/:id` — modificar parcialmente un ítem (solo administrador).
  - `DELETE /equipamiento/:id` — eliminar físicamente un ítem sin alquileres asociados (solo administrador).
- Reglas de negocio:
  - `stockTotal` es un entero entre 0 y 2147483647; `precioUnitario` está entre 0 y 99999999.99 con hasta 2 decimales.
  - `stockDisponible` nunca se acepta desde el cliente. Al crear se inicializa igual a `stockTotal`.
  - Al modificar `stockTotal`, se aplica la misma diferencia a `stockDisponible`. Si el nuevo total queda por debajo de las unidades alquiladas (`stockTotal - stockDisponible`), se responde 409 y no se modifica el ítem. La operación es atómica frente a cambios concurrentes del flujo de alquiler.
  - `disponible` es un campo calculado (`stockDisponible > 0`) y se incluye en toda respuesta.
  - El catálogo público devuelve solo ítems activos por defecto; `incluirInactivos=true` incluye los inactivos.
  - No se puede eliminar un ítem con registros asociados en `ReservaEquipamiento`; se responde 409 y el mensaje sugiere desactivarlo con `activo = false`.
- Dependencia con `canchas-crud`: cada ítem referencia una `Disciplina` existente (422 si no existe).
- **BREAKING**: no aplica sobre código existente; este es el primer cambio que crea la capa de equipamiento.

## Capabilities

### New Capabilities
- `equipamiento-catalogo`: catálogo de equipamiento deportivo del club — crear, listar, consultar, editar y eliminar ítems con gestión de stock total y disponible, precio unitario, filtrado por disciplina y disponibilidad, autorización admin-only en mutaciones y lectura pública.

### Modified Capabilities
- Ninguna (no existen specs previas aprobadas en `openspec/specs/`).

## Impact

- **Repositorio**: nueva capability `specs/equipamiento-catalogo/spec.md`.
- **Base de datos**: usa la tabla `equipamientos`, su FK a `disciplinas` y la relación `ReservaEquipamiento` ya existentes; no requiere migración nueva.
- **API**: endpoints REST de equipamiento sin prefijo de versión, con autorización admin-only en mutaciones.
- **Dependencias**: no agrega dependencias nuevas más allá de las ya requeridas por NestJS/Prisma/class-validator.
- **Fuera de alcance**: alquileres, reservas, pagos, turnos, frontend, autenticación en sí y modificación del schema/migraciones.
