## Why

Las secciones "Turnos y franjas" y "Reservas" del panel de administración están deshabilitadas, pero el sistema no es utilizable sin ellas:
- **Sin turnos nadie puede reservar.** El backend modela la disponibilidad como turnos creados por el administrador (`POST /turnos`), y el frontend no tiene dónde crearlos. Hoy solo existen los del seed local.
- **Los pagos no tienen pantalla.** `spec-pagos-registro` dejó el frontend de pagos para cuando se conecte la API; el registro y cobro lo hace solo el administrador (`POST /reservas/:id/pagos`, `PATCH /pagos/:id/pagar`, `PATCH /pagos/:id/anular`).

Este change habilita ambas secciones contra el backend real.

## What Changes

- **Turnos y franjas** (se habilita): el administrador elige cancha y fecha, ve los turnos (`GET /turnos`), crea uno (`POST /turnos` con cancha, disciplina, fecha, hora de inicio y fin), lo edita (`PATCH /turnos/:id`) y lo elimina (`DELETE /turnos/:id`). El backend rechaza fechas pasadas, rangos inválidos, solapamientos y eliminar un turno con reserva activa; los mensajes se muestran en la pantalla.
- **Reservas** (se habilita): lista todas las reservas (`GET /reservas/mis` como administrador) con usuario, cancha, fecha, hora, estado y estado de pago; permite cancelar (`PATCH /reservas/:id/cancelar`) y gestionar el pago de cada reserva: registrar (monto y método), confirmar cobro y anular.
- Se quita el estado "deshabilitado" de los dos ítems de la barra lateral.

## Capabilities

### New Capabilities
- `frontend-admin-reservas`: gestión de turnos, reservas y pagos por el administrador contra el backend real.

### Modified Capabilities
- `frontend-panel-admin`: los ítems "Turnos y franjas" y "Reservas" pasan de deshabilitados a funcionales (la spec original los define como deshabilitados).

## Impact

- **Frontend**: `app/admin/layout.tsx` (ítems habilitados), nuevas rutas `app/admin/turnos` y `app/admin/reservas`, `lib/api*.ts` y adaptadores.
- **Backend**: sin cambios. Se verifica que `GET /reservas/mis` como administrador incluya el nombre del usuario; si el contrato no lo trae, se muestra el `usuarioId` y se anota como limitación.
- **Rollback**: revertir el PR; los ítems vuelven a estar deshabilitados.

## Dependencies

- Requiere `frontend-base-api`, `frontend-canchas-api`, `frontend-reservas-api` y `frontend-admin-catalogo` (selector de canchas y disciplinas, adaptadores de reservas).
- Backend ya en `main`: `turnos-franjas`, `spec-reservas`, `spec-pagos-registro`.
