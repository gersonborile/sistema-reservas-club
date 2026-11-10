## Why

Producción casi no tiene turnos libres: los turnos solo los crea el seed (3 días) o el administrador de a uno, así que un socio no tiene qué reservar. Además, el club no tiene horario ni duración de turno definidos: el backend acepta un turno a las 03:00 o uno de 7 minutos, y valida «fecha pasada» y «turno pasado» en UTC, de modo que en Argentina a partir de las 21:00 rechaza turnos de hoy y un turno de la mañana puede darse por pasado antes de empezar.

Este change define el horario del club, obliga a que cada turno sea una franja de ese horario y agrega la generación de turnos en bloque para cargar semanas enteras de una vez (tareas 15 y 8 de `docs/tareas-pendientes-sueltas.md`).

## What Changes

- **Horario del club**: todos los días de 08:00 a 22:00, con franjas fijas de 60 minutos para todas las disciplinas, pegadas y sin margen (08:00–09:00 … 21:00–22:00: 14 franjas por cancha y por día). Se define como constante del backend y se anota como regla en `openspec/config.yaml`.
- **Validación de turnos**: `POST /turnos` y `PATCH /turnos/:id` rechazan con 400 un turno que no coincida con una franja del horario. Los turnos existentes que no cumplen la regla se conservan.
- **Zona horaria única**: «fecha pasada», «turno pasado» y la ventana de 2 horas para cancelar se calculan en `America/Argentina/Buenos_Aires`, no en UTC.
- **Generación en bloque**: nuevo `POST /turnos/generar` (solo administrador) que recibe cancha, disciplina, fecha desde y fecha hasta (máximo 31 días), crea todas las franjas del horario de cada día y saltea las que ya tienen un turno superpuesto o ya empezaron. Responde cuántos turnos creó y cuántos salteó.
- **Frontend del administrador**: en «Turnos y franjas», el diálogo de turno ofrece solo las franjas del horario (la hora de fin se calcula) y se agrega un diálogo «Generar turnos».
- **Seed**: el turno de fútbol de 90 minutos pasa a 60.
- **Producción**: al terminar, se generan los turnos de las 2 semanas siguientes para las 4 canchas activas.

## Capabilities

### New Capabilities
- `horario-turnos`: horario del club y franjas fijas de turno, zona horaria del club para las validaciones de fechas y horas, y generación de turnos en bloque.

### Modified Capabilities
- Ninguna en `openspec/specs/`. Las reglas de creación y edición de turnos (`turnos-franjas`) y de reservas (`reservations`) se amplían con los requisitos nuevos de `horario-turnos`.

## Impact

- **Backend**: módulo `turnos` (horario, validaciones, endpoint de generación) y `reservas` (zona horaria en «turno pasado» y en la ventana de cancelación). Sin migraciones.
- **Frontend**: `lib/` (franjas, API y validación de la generación) y `app/admin/turnos/`.
- **Datos**: seed de turnos; carga de turnos en producción.
- **Fuera de alcance**: horario editable por el administrador, horarios distintos por día o por disciplina, duración por disciplina (`duracionTipicaMinutos` queda como dato informativo), y el 500 al borrar un turno con reserva cancelada.
