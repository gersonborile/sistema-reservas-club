## Purpose

Permite a usuarios y administradores del club crear, consultar y cancelar reservas de turnos de canchas, respetando la disponibilidad del turno y la política de cancelación.

## ADDED Requirements

### Requirement: Creación de reservas
El sistema SHALL permitir crear una reserva mediante `POST /api/v1/reservas`. El cuerpo SHALL incluir `turnoId` y, opcionalmente, `usuarioId` solo para `ADMINISTRADOR`. Un usuario `USUARIO` SHALL poder reservar solo para sí mismo. El turno SHALL existir, no haber comenzado, pertenecer a una cancha en estado `DISPONIBLE` y no tener una reserva activa. Al crearse, la reserva queda en estado `CONFIRMADA` y el turno pasa a `disponible = false`. La creación NO acepta equipamiento: se alquila mediante la capacidad `rentals`.

#### Scenario: Crear reserva en turno libre
- **WHEN** un usuario `USUARIO` autenticado hace `POST /api/v1/reservas` con el `turnoId` de un turno futuro y disponible
- **THEN** el sistema responde `201 Created` con la reserva en estado `CONFIRMADA` y el turno queda con `disponible = false`

#### Scenario: Turno ya reservado
- **WHEN** un usuario autenticado hace `POST /api/v1/reservas` con un turno que ya tiene una reserva activa
- **THEN** el sistema responde `409 Conflict` y no crea la reserva

#### Scenario: Turno de la misma franja en otra cancha
- **WHEN** un usuario autenticado hace `POST /api/v1/reservas` para un turno libre de una cancha distinta, en la misma fecha y hora que un turno ya reservado
- **THEN** el sistema responde `201 Created` sin conflictos

#### Scenario: Turno ya iniciado o pasado
- **WHEN** un usuario autenticado hace `POST /api/v1/reservas` con un turno cuyo inicio (`fecha` y `horaInicio`) ya pasó
- **THEN** el sistema responde `400 Bad Request` y no crea la reserva

#### Scenario: Turno inexistente
- **WHEN** un usuario autenticado hace `POST /api/v1/reservas` con un `turnoId` que no existe
- **THEN** el sistema responde `404 Not Found` y no crea la reserva

#### Scenario: Cancha no disponible
- **WHEN** un usuario autenticado hace `POST /api/v1/reservas` con un turno cuya cancha está en estado `OCUPADA` o `EN_MANTENIMIENTO`
- **THEN** el sistema responde `409 Conflict` y no crea la reserva

#### Scenario: Cuerpo inválido
- **WHEN** un usuario autenticado hace `POST /api/v1/reservas` sin `turnoId` o con un `turnoId` que no es un UUID
- **THEN** el sistema responde `400 Bad Request` y no crea la reserva

#### Scenario: Administrador reserva en nombre de un usuario
- **WHEN** un usuario `ADMINISTRADOR` hace `POST /api/v1/reservas` indicando el `usuarioId` de un usuario existente
- **THEN** el sistema responde `201 Created` con la reserva asociada a ese usuario

#### Scenario: Administrador indica un usuario inexistente
- **WHEN** un usuario `ADMINISTRADOR` hace `POST /api/v1/reservas` con un `usuarioId` que no existe
- **THEN** el sistema responde `404 Not Found` y no crea la reserva

#### Scenario: Usuario intenta reservar para otro usuario
- **WHEN** un usuario `USUARIO` hace `POST /api/v1/reservas` con un `usuarioId` distinto al suyo
- **THEN** el sistema responde `403 Forbidden` y no crea la reserva

#### Scenario: Acceso sin autenticación
- **WHEN** un usuario no autenticado hace `POST /api/v1/reservas`
- **THEN** el sistema responde `401 Unauthorized`

### Requirement: Consulta de reservas
El sistema SHALL permitir consultar reservas mediante `GET /api/v1/reservas/mis`. Un usuario `USUARIO` SHALL ver únicamente sus propias reservas, en cualquier estado. Un usuario `ADMINISTRADOR` SHALL ver las reservas de todos los usuarios y podrá filtrar con `?usuarioId=`. Cada reserva SHALL incluir su estado y los datos del turno (`fecha`, `horaInicio`, `horaFin`, cancha).

#### Scenario: Usuario consulta sus reservas
- **WHEN** un usuario `USUARIO` autenticado hace `GET /api/v1/reservas/mis`
- **THEN** el sistema responde `200 OK` con solo sus reservas, cada una con su estado y los datos del turno

#### Scenario: Administrador consulta todas las reservas
- **WHEN** un usuario `ADMINISTRADOR` autenticado hace `GET /api/v1/reservas/mis`
- **THEN** el sistema responde `200 OK` con las reservas de todos los usuarios

#### Scenario: Administrador filtra por usuario
- **WHEN** un usuario `ADMINISTRADOR` autenticado hace `GET /api/v1/reservas/mis?usuarioId=<id>`
- **THEN** el sistema responde `200 OK` solo con las reservas de ese usuario

#### Scenario: Usuario intenta ver las reservas de otro usuario
- **WHEN** un usuario `USUARIO` hace `GET /api/v1/reservas/mis?usuarioId=<id de otro usuario>`
- **THEN** el sistema responde `403 Forbidden`

#### Scenario: Acceso sin autenticación
- **WHEN** un usuario no autenticado hace `GET /api/v1/reservas/mis`
- **THEN** el sistema responde `401 Unauthorized`

### Requirement: Cancelación de reservas
El sistema SHALL permitir cancelar una reserva mediante `PATCH /api/v1/reservas/:id/cancelar`. Un usuario `USUARIO` SHALL cancelar solo sus propias reservas; `ADMINISTRADOR` SHALL poder cancelar cualquier reserva. La cancelación SHALL ser válida solo si faltan al menos 2 horas para el inicio del turno. Al cancelar, la reserva pasa a estado `CANCELADA` y el turno vuelve a `disponible = true`.

#### Scenario: Cancelar reserva propia dentro de la ventana
- **WHEN** un usuario `USUARIO` hace `PATCH /api/v1/reservas/:id/cancelar` sobre una de sus reservas cuyo turno comienza en más de 2 horas
- **THEN** el sistema responde `200 OK`, la reserva queda en estado `CANCELADA` y el turno queda con `disponible = true`

#### Scenario: Turno liberado puede reservarse de nuevo
- **WHEN** una reserva se cancela y luego un usuario hace `POST /api/v1/reservas` con el mismo `turnoId`
- **THEN** el sistema responde `201 Created`

#### Scenario: Cancelar por administrador en nombre de un usuario
- **WHEN** un usuario `ADMINISTRADOR` hace `PATCH /api/v1/reservas/:id/cancelar` sobre una reserva de otro usuario dentro de la ventana
- **THEN** el sistema responde `200 OK` y la reserva queda cancelada

#### Scenario: Cancelar fuera de la ventana de 2 horas
- **WHEN** un usuario autenticado hace `PATCH /api/v1/reservas/:id/cancelar` sobre una reserva cuyo turno comienza en menos de 2 horas o ya comenzó
- **THEN** el sistema responde `409 Conflict` y la reserva no se cancela

#### Scenario: Reserva ya cancelada
- **WHEN** un usuario autenticado hace `PATCH /api/v1/reservas/:id/cancelar` sobre una reserva en estado `CANCELADA`
- **THEN** el sistema responde `409 Conflict`

#### Scenario: Cancelar reserva ajena siendo usuario
- **WHEN** un usuario `USUARIO` hace `PATCH /api/v1/reservas/:id/cancelar` sobre una reserva que pertenece a otro usuario
- **THEN** el sistema responde `403 Forbidden` y la reserva no se cancela

#### Scenario: Reserva inexistente
- **WHEN** un usuario autenticado hace `PATCH /api/v1/reservas/:id/cancelar` con un id que no existe
- **THEN** el sistema responde `404 Not Found`

#### Scenario: Acceso sin autenticación
- **WHEN** un usuario no autenticado hace `PATCH /api/v1/reservas/:id/cancelar`
- **THEN** el sistema responde `401 Unauthorized`
