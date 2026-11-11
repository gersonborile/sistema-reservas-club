## Context

Módulo nuevo `alquileres` (ver proposal.md - Why) que se apoya en `equipamiento-catalogo` (`Equipamiento` con `precioUnitario` y `stockDisponible`) y `spec-reservas` (`Reserva` `CONFIRMADA`). `POST /reservas` ya no acepta equipamiento; el alquiler es la única vía. Roles reales: `USUARIO` y `ADMINISTRADOR` (no existe `recepcionista`). Los montos son informativos; el pago de la reserva lo cubre `spec-pagos-registro`.

Los tests e2e del repo usan Prisma mockeado en memoria (no una BD real); los de este change siguen ese patrón.

## Goals / Non-Goals

**Goals:**
- Crear el alquiler de una reserva `CONFIRMADA` con descuento atómico de stock y montos congelados.
- Garantizar un único alquiler por reserva.
- Restituir el stock del alquiler al cancelar la reserva (dentro de la ventana de 2 h ya definida).

**Non-Goals:**
- Devolución o cancelación independiente de un alquiler, o editarlo (se resuelve cancelando la reserva).
- Usar `estadoDevolucion` (queda en su default `PENDIENTE`, sin endpoints).
- Pagos o facturación del alquiler.

## Decisions

- **Modelo Prisma**: la tabla `reserva_equipamientos` (`ReservaEquipamiento`) ya existe con `cantidad`, `precioUnitario` (snapshot) y PK `(reservaId, equipamientoId)`, que ya impide repetir un equipamiento dentro de una reserva. Se **reutiliza como items** y se agrega el modelo cabecera:

  ```prisma
  model Alquiler {
    id        String                @id @default(uuid()) @db.Uuid
    reservaId String                @unique @map("reserva_id") @db.Uuid
    total     Decimal               @db.Decimal(10, 2)
    reserva   Reserva               @relation(fields: [reservaId], references: [id], onDelete: Cascade)
    items     ReservaEquipamiento[]
    createdAt DateTime              @default(now()) @map("created_at")
    updatedAt DateTime              @updatedAt @map("updated_at")

    @@map("alquileres")
  }
  ```

  En `Reserva`: reemplazar `equipamientos ReservaEquipamiento[]` por `alquiler Alquiler?`. En `ReservaEquipamiento`: **quitar** la relación `reserva` y agregar `alquiler Alquiler @relation(fields: [reservaId], references: [reservaId], onDelete: Cascade)` (Prisma no admite dos relaciones sobre el mismo campo con el mismo nombre de FK; los items llegan a la reserva a través del alquiler). `Equipamiento.reservas` se mantiene (lo usa el borrado de equipamiento para devolver 409). Se validó que `prisma format` y `prisma migrate diff` aceptan este schema.

- **Migración** (`prisma migrate dev --name alquileres`): el SQL generado hace `DROP` de la FK `reserva_equipamientos_reserva_id_fkey`, crea `alquileres` con unique en `reserva_id` y agrega la FK nueva hacia `alquileres(reserva_id)`. **Antes de agregar la FK nueva** hay que insertar el backfill, para no romper bases con datos (seed, producción):

  ```sql
  INSERT INTO "alquileres" ("id", "reserva_id", "total", "updated_at")
  SELECT gen_random_uuid(), "reserva_id", SUM("cantidad" * "precio_unitario"), CURRENT_TIMESTAMP
  FROM "reserva_equipamientos"
  GROUP BY "reserva_id";
  ```

  `prisma/seed.ts` crea hoy la reserva de ejemplo con `equipamientos: { create }`; debe pasar a `alquiler: { create: { total, items: { create } } }`.

- **Un alquiler por reserva**: unique en `Alquiler.reservaId` + catch `P2002` → `409`. Un check previo de existencia se descarta por race condition; el constraint lo garantiza en BD.

- **Precio**: dentro de la transacción el service lee el `precioUnitario` vigente de cada `Equipamiento` y lo persiste en `ReservaEquipamiento.precioUnitario` (snapshot). Total por item = `cantidad × precioUnitario` (se calcula en la respuesta, no se persiste); `Alquiler.total` = suma, persistido. Se usa `Prisma.Decimal` para evitar errores de punto flotante y en la respuesta se serializan como `number`.

- **Flujo de creación** (`prisma.transaccion`): reserva inexistente o id no UUID → 404; reserva ajena siendo `USUARIO` → 403; reserva `CANCELADA` → 409; algún equipamiento inexistente → 404; algún equipamiento con `activo = false` → 409; por cada item, descuento con `updateMany({ where: { id, stockDisponible: { gte: cantidad } }, data: { stockDisponible: { decrement: cantidad } } })` y 0 filas → 409; por último `alquiler.create` con los items anidados (`P2002` → 409). Cualquier error revierte el descuento ya hecho, lo que exige el fix de `transaccion` (siguiente punto).

- **Fix de `PrismaService.transaccion`**: hoy hace `this.$transaction(async () => correr(this))`, o sea que las consultas corren sobre el cliente base y **no dentro de la transacción**; un `throw` no revierte nada. Cambiar a `this.$transaction(async (tx) => correr(tx as never))`. Es una corrección de infraestructura que también vuelve atómicos `reservas` y `pagos`; los unit tests mockean `transaccion`, así que no se ven afectados.

- **Restitución al cancelar**: en `ReservasService.cancelar`, en el punto de extensión que dejó `spec-reservas` (después de liberar el turno, misma transacción), leer `tx.reservaEquipamiento.findMany({ where: { reservaId: id }, select: { equipamientoId, cantidad } })` y por cada item ejecutar `tx.$executeRaw` con ``UPDATE "equipamientos" SET "stock_disponible" = LEAST("stock_disponible" + ${cantidad}, "stock_total") WHERE "id" = ${equipamientoId}::uuid``. El `LEAST` hace el tope en `stockTotal` de forma atómica (Prisma no puede comparar dos columnas en un `updateMany`). Sin alquiler no se toca stock; si la reserva ya estaba cancelada el `updateMany` previo da 0 filas → 409 y no se restituye nada.

- **Listado**: `SELECCION_RESERVA_PUBLICA` suma `alquiler` (`id`, `total`, `items` con `equipamientoId`, `cantidad`, `precioUnitario`) y `aReservaPublica` lo mapea (`null` si no hay). Los montos serializados como `number`.

- **Permisos**: guards globales ya existentes; el endpoint no usa `@Roles` (cualquier autenticado) y el service, con `@CurrentUser()`, devuelve 403 si un `USUARIO` no es titular de la reserva; `ADMINISTRADOR` puede sobre cualquiera. Mismo patrón que `pagos` (`obtenerDeReserva`).

- **DTO**: `CrearAlquilerDto { items: ItemAlquilerDto[] }` con `ItemAlquilerDto { equipamientoId: UUID, cantidad: int >= 1 }`; `@ArrayMinSize(1)`, `@ArrayUnique` por `equipamientoId`, `@ValidateNested({ each: true })` + `@Type`. El `validationPipe` global usa `whitelist` y `forbidNonWhitelisted`.

- **Respuesta 201**: `{ id, reservaId, total, createdAt, items: [{ equipamientoId, cantidad, precioUnitario, total }] }`, items ordenados por `equipamientoId`.

- **Convenciones**: archivos en `backend/src/alquileres/` (`alquileres.module/controller/service.ts`, `dto/crear-alquiler.dto.ts`, `alquiler-publico.ts`, `mensajes.ts`), mensajes de error en español en `mensajes.ts`, controller con decoradores `@ApiTags/@ApiResponse` como `pagos.controller.ts`, tests `*.spec.ts` junto al código con vitest y `test/alquileres.e2e-spec.ts`.

## Risks / Trade-offs

- [Carrera por el mismo stock entre alquileres] → `updateMany` condicional + transacción real; 0 filas → 409.
- [Cambio de `precioUnitario` entre lectura y persistencia] → lectura y persistencia dentro de la misma transacción (snapshot).
- [Restituir puede superar `stockTotal` si el admin lo redujo] → `LEAST(..., stock_total)`.
- [Arreglar `transaccion` cambia el comportamiento de reservas y pagos] → ahora revierten de verdad; se verifica corriendo toda la suite.
- [Migración sobre datos existentes] → backfill de `alquileres` antes de la FK nueva.

## Migration Plan

1. Aplicar `equipamiento-catalogo` y `spec-reservas` (ya en `main`).
2. Migración `alquileres` con backfill (arriba); `prisma generate`; ajustar `seed.ts`.
3. Implementar el módulo `alquileres`, el fix de `transaccion` y los ajustes en `reservas`.
4. Frontend (sección 4 de tasks.md), después del backend.
5. **Rollback**: migración inversa (borrar FK nueva y `alquileres`, restaurar `reserva_equipamientos_reserva_id_fkey` hacia `reservas`) y quitar el módulo.

## Open Questions

Ninguna que cambie specs, enfoque o tareas.
