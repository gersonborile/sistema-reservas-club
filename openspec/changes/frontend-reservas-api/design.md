## Context

`POST /reservas { turnoId }` crea la reserva `CONFIRMADA` del usuario autenticado (un administrador puede indicar `usuarioId`). `GET /reservas/mis` devuelve las reservas del usuario; para un `ADMINISTRADOR` devuelve todas. `PATCH /reservas/:id/cancelar` responde `409` si faltan menos de 2 horas para el turno. `POST /reservas/:id/alquiler { items: [{ equipamientoId, cantidad }] }` crea el alquiler (a lo sumo uno por reserva), descuenta stock y responde con montos; `GET /equipamiento` es público, paginado y filtrable por disciplina.

## Goals / Non-Goals

**Goals:**
- Reservar y alquilar de punta a punta contra el backend real.
- Que "Mis reservas" y la Home muestren datos reales, incluido el alquiler.

**Non-Goals:**
- Pagos del socio (estado de pago): el pago lo registra el administrador (`frontend-admin-reservas`).
- Cambiar o eliminar el alquiler una vez creado (el backend no lo permite; se cancela la reserva).
- Reservar a nombre de otro usuario desde la UI de socio.

## Decisions

- **Dos pasos al confirmar**: primero `POST /reservas`, luego `POST /reservas/:id/alquiler` solo si hay equipamiento elegido. No hay transacción entre ambos; si el segundo falla, la reserva queda y se informa. Se prefiere esto a ocultar el fallo o a cancelar la reserva automáticamente (acción destructiva no pedida por el usuario).
- **Errores del alquiler tras reservar**: `409` (stock insuficiente o equipamiento inactivo) → mensaje del backend, la reserva se conserva y "Mis reservas" ofrece "Alquilar equipamiento" para reintentar. `404`/`403`/red → mensaje genérico con el mismo reintento.
- **Turno ocupado (`409` al reservar)**: se vuelve a pedir las franjas, se muestra "Ese turno ya no está disponible." y el usuario elige otro.
- **Adaptador de reserva**: `aReservaUI(reserva)` produce `{ id, canchaId, canchaNombre, fecha, hora (horaInicio), horaFin, estado, alquiler }` desde `turno.cancha` y `turno`. La disciplina de la reserva se toma de la cancha del turno si el backend la expone; si no, no se muestra (no se infiere).
- **Estados**: `estado` se muestra como "Confirmada" / "Cancelada". Se elimina `pendiente`.
- **Cancelación**: el botón se habilita con la misma regla de 2 horas como ayuda visual, pero el backend es la autoridad: ante `409` se muestra su mensaje y se recarga la lista.
- **Equipamiento a elegir**: `GET /equipamiento?disciplina=<id de la disciplina del turno>&disponible=true`, recorriendo páginas; se muestra nombre, `stockDisponible` y `precioUnitario`. Cantidad entre 1 y `stockDisponible`.
- **Total del alquiler**: `precioUnitario × cantidad` por ítem es solo vista previa; el valor definitivo es el `total` que devuelve el backend. Se muestra como "Total del alquiler" (no se inventa un precio de cancha).
- **Quién ve "Alquilar"**: reserva `CONFIRMADA`, `alquiler === null`, y la reserva es del usuario autenticado (o el usuario es administrador). Un socio solo recibe sus propias reservas de `GET /reservas/mis`, así que la titularidad queda garantizada por el backend; la condición de la UI es defensa adicional.
- **Próxima reserva (Home)**: de `GET /reservas/mis`, la `CONFIRMADA` con inicio mayor o igual a ahora y menor inicio. Se calcula con fecha y hora locales.

## Risks / Trade-offs

- [Reserva sin alquiler] Un fallo entre los dos pasos deja la reserva sin el equipamiento pedido → aviso explícito y reintento, sin cancelar nada por cuenta propia.
- [Doble clic en "Confirmar"] Podría crear dos reservas del mismo turno → el segundo recibe `409`; además se deshabilita el botón mientras la petición está en curso.
- [Zona horaria] Comparar el inicio del turno con "ahora" depende de la zona local del navegador; se usan las funciones de `lib/fechas.ts`.
