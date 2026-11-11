## Purpose

Define el horario del club y las franjas fijas de turno, fija la zona horaria del club para todas las validaciones de fechas y horas, y permite al administrador generar turnos en bloque para que los socios tengan turnos que reservar.

## ADDED Requirements

### Requirement: Franjas del horario del club

El sistema SHALL aceptar solo turnos que coincidan con una franja del horario del club: todos los días de 08:00 a 22:00, con franjas de 60 minutos para todas las disciplinas, consecutivas y sin margen entre una y otra (la primera de 08:00 a 09:00 y la última de 21:00 a 22:00). La regla se valida al crear y al modificar un turno; los turnos existentes que no la cumplen se conservan.

#### Scenario: Crear un turno en una franja del horario

- **WHEN** un administrador envía `POST /turnos` con `hora_inicio` `08:00` y `hora_fin` `09:00`, y el resto de los datos válidos
- **THEN** el sistema responde 201 con el turno creado

#### Scenario: Crear un turno fuera del horario

- **WHEN** un administrador envía `POST /turnos` con `hora_inicio` `07:00` y `hora_fin` `08:00`, o con `hora_inicio` `22:00` y `hora_fin` `23:00`
- **THEN** el sistema responde 400 con un mensaje que indica el horario del club y la duración de las franjas

#### Scenario: Crear un turno que no empieza en una franja

- **WHEN** un administrador envía `POST /turnos` con `hora_inicio` `08:30` y `hora_fin` `09:30`
- **THEN** el sistema responde 400 con el mismo mensaje

#### Scenario: Crear un turno con una duración distinta de 60 minutos

- **WHEN** un administrador envía `POST /turnos` con `hora_inicio` `09:00` y `hora_fin` `10:30`
- **THEN** el sistema responde 400 con el mismo mensaje

#### Scenario: Modificar un turno a una hora fuera de las franjas

- **WHEN** un administrador envía `PATCH /turnos/:id` con `hora_inicio` `08:15` sobre un turno existente
- **THEN** el sistema responde 400 y el turno queda sin cambios

### Requirement: Zona horaria del club

El sistema SHALL interpretar las fechas y las horas de los turnos en la zona horaria del club (`America/Argentina/Buenos_Aires`) para decidir si una fecha es pasada, si un turno ya empezó y si una reserva está dentro de la ventana de 2 horas para cancelar.

#### Scenario: Crear un turno para hoy por la noche

- **WHEN** a las 21:30 de Argentina (00:30 del día siguiente en UTC) un administrador crea un turno para la fecha de hoy en Argentina
- **THEN** el sistema no lo rechaza por fecha pasada

#### Scenario: Reservar un turno de la mañana que todavía no empezó

- **WHEN** a las 08:30 de Argentina un socio reserva un turno de ese mismo día que empieza a las 10:00
- **THEN** el sistema no lo rechaza por turno pasado

#### Scenario: Reservar un turno que ya empezó

- **WHEN** a las 10:15 de Argentina un socio reserva un turno de ese mismo día que empieza a las 10:00
- **THEN** el sistema responde 400 porque el turno ya pasó

#### Scenario: Cancelar dentro de la ventana de 2 horas

- **WHEN** a las 08:30 de Argentina un socio cancela su reserva de un turno que empieza a las 10:00 de ese día
- **THEN** el sistema responde 409 porque faltan menos de 2 horas para el turno

### Requirement: Generar turnos en bloque

El sistema SHALL permitir al administrador generar con `POST /turnos/generar` los turnos de una cancha y una disciplina para un rango de fechas, creando para cada día todas las franjas del horario del club. Las franjas que se superponen con un turno existente de esa cancha, y las de hoy que ya empezaron, se saltean. La respuesta informa cuántos turnos se crearon y cuántos se saltearon.

#### Scenario: Generar una semana de turnos

- **WHEN** un administrador envía `POST /turnos/generar` con una `cancha_id` existente, una `disciplina_id` de esa cancha, `fecha_desde` de mañana y `fecha_hasta` 6 días después
- **THEN** el sistema responde 201 con `creados` igual a 98 (7 días × 14 franjas) y `salteados` igual a 0, y esos turnos aparecen en `GET /turnos` como disponibles

#### Scenario: Generar sobre un rango con turnos existentes

- **WHEN** un administrador genera turnos para un día en el que la cancha ya tiene un turno de 10:00 a 11:00
- **THEN** el sistema crea las otras 13 franjas, responde `creados` 13 y `salteados` 1, y el turno existente queda sin cambios

#### Scenario: Generar desde hoy

- **WHEN** a las 15:30 de Argentina un administrador genera turnos con `fecha_desde` igual a hoy
- **THEN** el sistema no crea las franjas de hoy que ya empezaron (08:00 a 15:00) y las cuenta como salteadas

#### Scenario: Generar con un rango mayor a 31 días

- **WHEN** un administrador envía un rango de 32 días o más
- **THEN** el sistema responde 400 y no crea ningún turno

#### Scenario: Generar con fechas inválidas

- **WHEN** un administrador envía `fecha_hasta` anterior a `fecha_desde`, o `fecha_desde` anterior a hoy
- **THEN** el sistema responde 400 y no crea ningún turno

#### Scenario: Generar con una disciplina que la cancha no tiene

- **WHEN** un administrador envía una `disciplina_id` existente que no pertenece a la cancha indicada
- **THEN** el sistema responde 422 y no crea ningún turno

#### Scenario: Generar con cancha o disciplina inexistente

- **WHEN** un administrador envía una `cancha_id` o una `disciplina_id` que no existe
- **THEN** el sistema responde 422 y no crea ningún turno

#### Scenario: Generar sin ser administrador

- **WHEN** un cliente sin autenticación, o un socio, envía `POST /turnos/generar`
- **THEN** el sistema responde 401 o 403 respectivamente y no crea ningún turno

### Requirement: Turnos del horario en el panel del administrador

El panel del administrador SHALL ofrecer en «Turnos y franjas» solo las franjas del horario del club al crear o editar un turno, y un diálogo para generar turnos en bloque que muestre el resultado.

#### Scenario: Elegir la hora de un turno

- **WHEN** el administrador abre el diálogo de nuevo turno
- **THEN** la hora de inicio se elige entre las franjas de 08:00 a 21:00 y la hora de fin se muestra calculada (inicio + 60 minutos), sin poder escribirla

#### Scenario: Generar turnos desde el panel

- **WHEN** el administrador abre «Generar turnos», elige disciplina, fecha desde y fecha hasta para la cancha seleccionada, y confirma
- **THEN** el panel muestra cuántos turnos se crearon y cuántos se saltearon, y la lista de turnos de la fecha visible se actualiza

#### Scenario: Rango inválido en el panel

- **WHEN** el administrador elige una fecha hasta anterior a la fecha desde, o un rango de más de 31 días
- **THEN** el panel muestra el error junto al formulario sin llamar al backend
