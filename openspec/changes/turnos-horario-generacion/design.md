## Context

El módulo `turnos` (`backend/src/turnos`) valida al crear y modificar que el fin sea posterior al inicio, que la fecha no sea pasada y que no haya superposición en la misma cancha y fecha. Las fechas se guardan como `DATE` y las horas como texto `HH:mm`. Los helpers de `horarios.ts` interpretan todo en UTC: `esFechaPasada` compara contra el día de hoy en UTC y `aInstanteInicioUtc` arma el instante de inicio de un turno como si la hora fuera UTC; `reservas.service.ts` usa este último para «turno pasado» y para la ventana de 2 horas de cancelación. El frontend del administrador (`app/admin/turnos/`) deja escribir cualquier hora de inicio y de fin.

Decidido con el usuario el 09/11: horario de 08:00 a 22:00 todos los días; franjas fijas de 60 minutos para todas las disciplinas, sin margen; el horario como constante del backend; la generación recibe cancha, disciplina y rango de fechas, saltea lo existente y limita el rango a 31 días; la zona horaria del club es `America/Argentina/Buenos_Aires`; el bloque incluye la pantalla del administrador y la carga en producción.

## Goals / Non-Goals

**Goals:**
- Una sola fuente de verdad del horario en el backend, con las franjas derivadas de apertura, cierre y duración.
- Validar las franjas en `POST /turnos` y `PATCH /turnos/:id`.
- Todas las comparaciones de fecha y hora de turnos en la zona horaria del club.
- `POST /turnos/generar` que cargue semanas de turnos en una sola llamada y sin duplicar.
- Diálogos del administrador alineados con la regla.

**Non-Goals:**
- Horario editable por el administrador o guardado en la base.
- Horarios distintos por día de la semana o por disciplina; duración por disciplina (`duracionTipicaMinutos` no se usa).
- Migrar o borrar los turnos existentes que no cumplen la regla.
- El 500 de `DELETE /turnos/:id` con una reserva cancelada (otro arreglo).

## Decisions

- **Horario como constante (`turnos/horario-club.ts`)**: `APERTURA = '08:00'`, `CIERRE = '22:00'`, `DURACION_MINUTOS = 60`, `ZONA_HORARIA = 'America/Argentina/Buenos_Aires'`. `franjasDelClub()` devuelve las 14 franjas `{ inicio, fin }` y `esFranjaDelClub(inicio, fin)` valida un par. Alternativa descartada: tabla de configuración editable, que suma migración y pantalla sin que el TP lo necesite.
- **La API de turnos no cambia de forma**: `POST` y `PATCH` siguen recibiendo `hora_inicio` y `hora_fin`; se agrega la validación de franja (400, mensaje `MENSAJE_FUERA_DE_HORARIO`) después de la validación de rango. Así el frontend y los tests existentes no cambian de contrato, solo de datos.
- **Zona horaria con `Intl`**: `hoyEnZonaClub(ahora)` devuelve el día `AAAA-MM-DD` en Argentina con `Intl.DateTimeFormat('en-CA', { timeZone })`, y `aInstanteInicio(fecha, hora)` arma el instante real sumando el desfase de la zona (calculado con `Intl` para ese día, no fijo en -3, por si la zona vuelve a tener horario de verano). Reemplazan a `esFechaPasada` y `aInstanteInicioUtc`, que se borran; `reservas.service.ts` pasa a usar `aInstanteInicio`. Las funciones reciben `ahora` como parámetro con valor por defecto, para probarlas sin depender del reloj.
- **Generación (`POST /turnos/generar`)**: DTO `GenerarTurnosDto` (`cancha_id`, `disciplina_id`, `fecha_desde`, `fecha_hasta`). Orden de validación: DTO (400) → `fecha_hasta >= fecha_desde`, `fecha_desde` no pasada y rango ≤ 31 días (400) → cancha y disciplina existen (422) → la disciplina pertenece a la cancha (422). Después se leen en una sola consulta los turnos existentes de la cancha en el rango, se arma en memoria la lista de franjas que no se superponen y, para hoy, que no empezaron, y se insertan con `createMany` dentro de `prisma.transaccion`. Respuesta 201 `{ creados, salteados }`. Alternativa descartada: fallar todo el bloque ante el primer turno existente, porque obliga a elegir rangos «limpios» a mano.
- **Ruta antes de `:id`**: `@Post('generar')` no choca con rutas existentes (no hay `POST /turnos/:id`), pero se declara junto a `@Post()` con `@Roles(RolUsuario.ADMINISTRADOR)`.
- **Frontend**: `lib/franjas.ts` replica el horario (apertura, cierre, duración) y expone `franjasDelClub()`, igual que el backend; la duplicación se acepta porque son tres constantes y el backend es la barrera real. `dialogo-turno.tsx` cambia los inputs de hora por un `<select>` de inicio y una hora de fin de solo lectura. Nuevo `dialogo-generar.tsx` con disciplina (las de la cancha seleccionada), fecha desde y fecha hasta; `validarGeneracion()` en `lib/adaptadores.ts` replica las reglas de rango para avisar antes de llamar al backend; `generarTurnos()` en `lib/api.ts`.
- **Seed**: el turno de fútbol `09:00–10:30` pasa a `09:00–10:00`; el resto ya cumple.

## Puntos de prueba (TDD)

- `horario-club.ts`, funciones puras: las 14 franjas; `esFranjaDelClub` con inicio fuera de horario, inicio desalineado, duración distinta y la última franja; `hoyEnZonaClub` a las 00:30 UTC (todavía es «ayer» en Argentina); `aInstanteInicio` de un turno de las 10:00 (13:00 UTC).
- `turnos.service.spec.ts` (Prisma simulado, como hoy): crear y modificar fuera de franja → 400; generar → cuenta de creados y salteados con turnos existentes y con `ahora` a media tarde; cada validación de la generación.
- `reservas.service.spec.ts` (ya usa `vi.setSystemTime`): turno de las 10:00 reservado a las 08:30 de Argentina no está pasado; cancelar a las 08:30 un turno de las 10:00 cae dentro de la ventana.
- `test/turnos.e2e-spec.ts`: `POST /turnos/generar` con 401, 403, 201 y la respuesta `{ creados, salteados }`.
- Frontend (`lib/`, Vitest): `franjasDelClub`, `validarGeneracion` y `generarTurnos` simulando solo `fetch`.

## Risks / Trade-offs

- [Los tests existentes usan turnos fuera de horario (por ejemplo `00:00–01:00`)] → se actualizan sus datos a franjas válidas; no cambia lo que verifican.
- [Turnos existentes fuera de la regla en producción] → se conservan; solo se valida al crear o editar. Editar uno de ellos obliga a moverlo a una franja.
- [Horario duplicado en el frontend] → tres constantes con un test que fija las 14 franjas; si cambia el horario hay que tocar los dos lados.
- [Generar muchos turnos de una vez] → el tope de 31 días limita cada llamada a 434 turnos por cancha.
