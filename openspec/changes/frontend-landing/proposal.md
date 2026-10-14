# Proposal: frontend-landing

## Why

Hoy quien llega a `/` sin sesión es redirigido directo a `/login`: el club no tiene una
página que explique qué ofrece ni cómo se reserva. El wireframe define una landing pública
con las disciplinas, los pasos para reservar y accesos a iniciar sesión y registrarse.

## What Changes

- Implementar la landing pública en `/`, con barra de navegación, portada, disciplinas, "Cómo
  funciona", un llamado a crear cuenta y pie de página.
- `/` muestra la landing a quien no tiene sesión y la Home actual a quien la tiene.
- Las demás rutas protegidas siguen redirigiendo a `/login` sin sesión.
- Mover la Home fuera del layout protegido y compartir su estructura (navbar y fondo) con ese
  layout, para que `/` pueda decidir qué mostrar.

## Capabilities

### New Capabilities
- `frontend-landing`: página pública de presentación del club con accesos a login y registro.

### Modified Capabilities
- `frontend-reservations-ui`: `/` deja de exigir sesión; la landing es lo que ve quien no la
  tiene.

## Impact

- `app/page.tsx` nuevo (decide landing o Home); se elimina `app/(protegido)/page.tsx` y la
  Home pasa a `app/home-client.tsx`.
- Componente compartido `app/componentes/shell-socio.tsx` (navbar y contenedor) usado por
  `app/(protegido)/layout.tsx` y por `/`.
- Componente `app/componentes/landing.tsx`.
- Wireframe de referencia: `docs/wireframes/landing-web.png`.
- Fuera de alcance: contenido real de contacto y redes, imágenes reales, SEO y backend.
