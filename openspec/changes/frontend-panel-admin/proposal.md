# Proposal: frontend-panel-admin

## Why

El club tiene rol `administrador` en la sesión, pero hoy no existe ninguna pantalla para
ese rol: un administrador entra a la misma Home que un socio y no puede gestionar canchas ni
equipamiento. El wireframe define un Panel de administración con un resumen del día, el
listado de canchas y el equipamiento.

## What Changes

- Implementar el Panel de administración en `/admin`, con barra lateral, tres indicadores
  (reservas de hoy, canchas activas, equipamiento con poco stock), la tabla de Canchas, la
  lista de Equipamiento y las reservas de hoy.
- Proteger `/admin` por rol: solo `administrador` entra; un socio es redirigido a `/` y
  quien no tiene sesión, a `/login`.
- Redirigir al administrador a `/admin` después de iniciar sesión.
- Permitir al administrador crear y editar canchas, activarlas y desactivarlas, y editar el
  stock de cada ítem de equipamiento.
- Una cancha desactivada deja de ofrecerse a los socios para reservar.
- Agregar al mock un administrador semilla y el catálogo de canchas y equipamiento
  editable y persistido.

## Capabilities

### New Capabilities
- `frontend-panel-admin`: panel del administrador con resumen, gestión de canchas y de
  stock de equipamiento.

### Modified Capabilities
- `frontend-reservations-ui`: las pantallas de reserva solo ofrecen canchas activas.

## Impact

- Nueva ruta `app/admin/` con su propio layout (barra lateral, sin la navbar del socio).
- `lib/mock-reservas.ts`: `Cancha` gana `activa`; el catálogo pasa a persistirse en
  `localStorage`; nuevas funciones de administración.
- `lib/api.ts`: usuario administrador semilla en el mock de login.
- `app/login/formulario-login.tsx`: destino de la redirección según el rol.
- Wireframe de referencia: `docs/wireframes/panel-admin-web.png`.
- Fuera de alcance: pantallas "Turnos y franjas" y "Reservas" del panel, botón "Franjas",
  alta de equipamiento y backend real.
