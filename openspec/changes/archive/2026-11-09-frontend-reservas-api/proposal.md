## Why

Reservar, ver "mis reservas", cancelar y la "próxima reserva" de la Home funcionan sobre `localStorage`. Este change los conecta con el backend real (`POST /reservas`, `GET /reservas/mis`, `PATCH /reservas/:id/cancelar`, `GET /equipamiento`, `POST /reservas/:id/alquiler`) y absorbe la sección 4 de `spec-alquiler` (alquilar equipamiento y mostrar el alquiler en el frontend).

Desajustes entre el mock y el backend:
- **Reservar**: el mock guarda `canchaId` + `fecha` + `hora` + `equipamiento[]` en un solo paso; el backend reserva un **turno** (`POST /reservas { turnoId }`) y el equipamiento se alquila aparte (`POST /reservas/:id/alquiler`), porque son dos reglas distintas (disponibilidad del turno vs stock).
- **Reserva**: el mock la aplana (`canchaNombre`, `fecha`, `hora`, `equipamiento`, `monto`); el backend devuelve `turno { fecha, horaInicio, horaFin, cancha { id, nombre } }`, `estado` (`CONFIRMADA` / `CANCELADA`) y `alquiler` (`null` o items con montos y total).
- **Estados**: el mock tiene `pendiente | confirmada | cancelada`; el backend solo `CONFIRMADA | CANCELADA`.
- **Monto**: el mock usa un monto placeholder; el backend no calcula un precio de cancha, solo el total del alquiler.

## What Changes

- Funciones de API: `crearReserva(turnoId)`, `obtenerMisReservas()`, `cancelarReserva(id)`, `obtenerEquipamiento(disciplinaId)` y `crearAlquiler(reservaId, items)`, con adaptadores a los tipos de la UI.
- Reservar: confirmar crea la reserva y, si hay equipamiento elegido, crea el alquiler a continuación. Si la reserva se crea pero el alquiler falla, la reserva se conserva y el usuario ve un aviso con la opción de reintentar el alquiler desde "Mis reservas".
- "Mis reservas": lista real con cancha, fecha, hora, estado y alquiler (items y total); cancelar con `PATCH`; el backend decide la ventana de 2 horas (`409`).
- Alquilar sobre una reserva existente (spec-alquiler 4.1 a 4.3): acción "Alquilar equipamiento" visible solo sobre reservas `CONFIRMADA` sin alquiler, y solo para el titular (o administrador).
- Home: "Próxima reserva" sale de `GET /reservas/mis` (la `CONFIRMADA` futura más cercana).
- Se elimina el estado `pendiente` y el monto placeholder; el resumen muestra el total del alquiler cuando existe.

## Capabilities

### New Capabilities
- `frontend-reservas-api`: creación, consulta y cancelación de reservas y alquiler de equipamiento desde el frontend contra el backend real.

### Modified Capabilities
- Ninguna. Las specs `frontend-reservas` y `frontend-mis-reservas` siguen vigentes en lo funcional salvo los puntos de arriba (estado `pendiente` y monto placeholder), que se resuelven en este change.

## Impact

- **Frontend**: `app/(protegido)/canchas/[id]/reservar/reservar-client.tsx`, `app/(protegido)/reservas/reservas-client.tsx`, `app/home-client.tsx` (próxima reserva), `lib/api*.ts` y adaptadores.
- **Backend**: sin cambios.
- **`spec-alquiler`**: las tareas 4.1, 4.2 y 4.3 se tildan al completar este change; luego se puede archivar `spec-alquiler`.
- **Rollback**: revertir el PR; las pantallas vuelven al mock.

## Dependencies

- Requiere `frontend-base-api` y `frontend-canchas-api` (el turno elegido llega desde las franjas reales).
- Backend ya en `main`: `spec-reservas`, `spec-alquiler`, `equipamiento-catalogo`.
