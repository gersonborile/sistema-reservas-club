# Proposal: frontend-mis-reservas

## Why

La navbar tiene un link "Mis reservas" que hoy no lleva a ninguna parte, y los botones
"Ver detalle" y "Cancelar" de la Home son placeholders. El socio puede crear reservas pero
no puede ver el historial ni cancelar una. La regla de negocio "un usuario puede cancelar
sus propias reservas hasta 2 horas antes" todavía no tiene interfaz.

## What Changes

- Implementar la pantalla "Mis reservas" (`/reservas`), con pestañas Todas, Confirmadas y
  Canceladas y una tabla con cancha, fecha y horario, equipamiento, estado y acciones.
- Activar el link "Mis reservas" de la navbar.
- Permitir cancelar una reserva propia hasta 2 horas antes del turno; al cancelar, la franja
  y el equipamiento quedan libres.
- Agregar al mock la función para cancelar una reserva y la de listar las reservas del
  usuario.

## Capabilities

### New Capabilities
- `frontend-mis-reservas`: listado de las reservas del socio con filtro por estado y
  cancelación.

### Modified Capabilities
- `frontend-reservations-ui`: el link "Mis reservas" de la navbar deja de ser un
  placeholder y pasa a navegar a `/reservas`.

## Impact

- Nueva página `app/(protegido)/reservas/` y ajuste en `app/componentes/navbar.tsx`.
- Capa mock `lib/mock-reservas.ts`: `obtenerReservasDeUsuario` y `cancelarReserva`.
- Wireframe de referencia: `docs/wireframes/mis-reservas-web.png`.
