# Proposal: front-conectar-api

## Why

La UI nueva de la Home (pública y autenticada), el listado de canchas, la reserva y Mis reservas todavía muestran datos inventados o acceden a rutas protegidas de forma incorrecta. El diseño visual ya está definido; falta que todos esos datos y acciones provengan del backend real.

## What Changes

- La Home autenticada usa el nombre real de `GET /auth/perfil`, la próxima reserva de `GET /reservas/mis`, las disciplinas de `GET /disciplinas` y los turnos libres de una única llamada a `GET /turnos?fecha=`, agrupados por cancha en el front.
- La Home pública muestra las disciplinas de `GET /disciplinas`, el horario único del club (08:00–22:00) y botones que llevan a `/canchas`.
- `/canchas` pasa a ser pública y de solo lectura. Los filtros de disciplina, fecha y horario salen de `GET /canchas` y `GET /turnos`; los turnos libres y ocupados se distinguen. Sin sesión, elegir un turno redirige a `/login` con retorno a la reserva.
- Reservar usa `POST /reservas` con `{ turnoId }`, maneja `409`, `400` y `401`, y al confirmar navega a `/reservas` con un aviso de éxito.
- Todas las pantallas conectadas tienen estados de carga con skeleton, vacío con mensaje útil y error con reintento.
- Se eliminan `setTimeout`, arrays hardcodeados, precios, fotos, ratings, números de socio, amenities, datos de contacto y cualquier otro elemento sin respaldo en el backend.
- Se documenta en el README del frontend cómo levantar backend y frontend en local, migrar, sembrar datos y generar turnos de prueba desde el panel admin.

## Capabilities

### New Capabilities
- `frontend-home-api`: Home pública y autenticada alimentada por el backend, con disciplinas, próxima reserva, turnos libres y estados de carga/vacío/error.

### Modified Capabilities
- `frontend-canchas-api`: `/canchas` deja de exigir sesión; el listado y las franjas se obtienen con una llamada a `GET /turnos?fecha=` y se agrupan por cancha; los turnos libres redirigen al login con retorno cuando no hay sesión.
- `frontend-reservas-api`: la reserva exitosa navega a `/reservas` con aviso; se manejan `400` y `401` además de `409`.
- `frontend-retirar-mocks`: se eliminan los datos y acciones simuladas que quedaban en la UI nueva, incluidos `setTimeout`, arrays fijos y contenido sin respaldo en la API.

## Impact

- `frontend/app/inicio-client.tsx`, `frontend/app/home-client.tsx`, `frontend/app/componentes/landing.tsx`, `frontend/app/componentes/home/*`.
- `frontend/app/canchas/*` (mover desde `app/(protegido)/canchas`) y `frontend/app/(protegido)/reservar`/`reservas`.
- `frontend/app/login/*`, `frontend/lib/api.ts`, `frontend/lib/adaptadores.ts`, `frontend/lib/fechas.ts`, `frontend/lib/sesion.ts`, `frontend/lib/use-sesion.ts`.
- Tests Vitest de adaptadores, fechas y navegación segura.
- `frontend/README.md` y, si hace falta, un override local de Docker Compose para exponer PostgreSQL y el backend.
- No se agregan endpoints ni campos al backend. No se inventan precios, imágenes, ratings ni datos de contacto.
