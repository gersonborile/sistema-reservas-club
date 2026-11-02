## Why

Las pantallas de canchas (listado con filtro, franjas horarias de una cancha) y la sección "Canchas disponibles ahora" de la Home leen datos simulados de `lib/mock-reservas.ts`. Este change las conecta con el backend real (`/canchas`, `/disciplinas`, `/turnos`, `/disponibilidad`), apoyándose en el cliente HTTP de `frontend-base-api`.

Desajustes entre el mock y el backend que se resuelven acá:
- **Cancha**: el mock tiene `disciplina` única, `activa` e `imagenUrl`; el backend devuelve `disciplinas[]` (objetos con `id` y `nombre`), `ubicacion`, `capacidad` y `estado` (`DISPONIBLE` / `OCUPADA` / `EN_MANTENIMIENTO`). No existe imagen ni `activa`.
- **Disciplinas**: el mock las fija en `"Tenis" | "Fútbol 5" | "Pádel"`; la base las guarda en minúscula (`tenis`, `futbol`, `padel`) y son datos, no una lista fija.
- **Franjas**: el mock inventa horas fijas (16:00 a 21:00); el backend modela **turnos** (`hora_inicio`, `hora_fin`, `disponible`) creados por el administrador. `GET /disponibilidad` devuelve solo los turnos libres, así que para mostrar también los ocupados hay que usar `GET /turnos`.

## What Changes

- Funciones de API en el frontend: `obtenerCanchas`, `obtenerCancha`, `obtenerDisciplinas` y `obtenerTurnos` (por cancha y fecha), más adaptadores que traducen el contrato del backend a los tipos de la UI (`activa = estado !== EN_MANTENIMIENTO`, etiqueta de disciplina, franja = turno).
- La pantalla `/canchas` usa `GET /canchas?disciplina=` y `GET /turnos?cancha_id=&fecha=`; los accesos rápidos de la Home y el filtro salen de `GET /disciplinas`.
- "Canchas disponibles ahora" (Home) se calcula con `GET /canchas` y `GET /disponibilidad?cancha_id=&fecha=<hoy>`: el primer turno libre que aún no terminó, máximo 3 canchas.
- Estados de carga, error y vacío en las pantallas conectadas (el mock era síncrono y no los tenía).
- Se quita la imagen de cancha (no existe en el backend); la tarjeta usa el ícono placeholder ya existente.

## Capabilities

### New Capabilities
- `frontend-canchas-api`: lectura de canchas, disciplinas, turnos y disponibilidad desde el backend real, con adaptadores al modelo de la UI.

### Modified Capabilities
- Ninguna. Las specs `frontend-reservas` y `frontend-landing` siguen vigentes en lo funcional; solo cambia el origen de los datos.

## Impact

- **Frontend**: `lib/api.ts` (o módulos `lib/api-canchas.ts` y `lib/adaptadores.ts`), `app/(protegido)/canchas/*`, `app/home-client.tsx` (solo la parte de canchas disponibles). Las funciones de canchas del mock quedan sin uso en estas pantallas, pero `mock-reservas.ts` no se borra (lo hace `frontend-retirar-mocks`).
- **Backend**: sin cambios.
- **Rollback**: revertir el PR; las pantallas vuelven al mock.

## Dependencies

- Requiere `frontend-base-api` (cliente HTTP y sesión).
- Requiere turnos cargados en la base (seed local o creados por el administrador); sin turnos la pantalla de franjas se muestra vacía.
