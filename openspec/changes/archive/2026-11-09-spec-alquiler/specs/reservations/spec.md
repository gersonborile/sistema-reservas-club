## MODIFIED Requirements

### Requirement: Consulta de reservas
El sistema SHALL permitir consultar reservas mediante `GET /api/v1/reservas/mis`. Un usuario `USUARIO` SHALL ver únicamente sus propias reservas, en cualquier estado. Un usuario `ADMINISTRADOR` SHALL ver las reservas de todos los usuarios y podrá filtrar con `?usuarioId=`. Cada reserva SHALL incluir su estado, los datos del turno (`fecha`, `horaInicio`, `horaFin`, cancha) y su `alquiler` (con `id`, `total` y los items con `equipamientoId`, `cantidad` y `precioUnitario`), o `null` si no tiene.

#### Scenario: Usuario consulta sus reservas
- **WHEN** un usuario `USUARIO` autenticado hace `GET /api/v1/reservas/mis`
- **THEN** el sistema responde `200 OK` con solo sus reservas, cada una con su estado, los datos del turno y su alquiler (o `null`)

#### Scenario: Reserva con alquiler
- **WHEN** un usuario autenticado hace `GET /api/v1/reservas/mis` y una de sus reservas tiene un alquiler
- **THEN** esa reserva incluye el `alquiler` con su `total` y los items con `equipamientoId`, `cantidad` y `precioUnitario`

#### Scenario: Reserva sin alquiler
- **WHEN** un usuario autenticado hace `GET /api/v1/reservas/mis` y una de sus reservas no tiene alquiler
- **THEN** esa reserva incluye `alquiler: null`

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
El sistema SHALL permitir cancelar una reserva mediante `PATCH /api/v1/reservas/:id/cancelar`. Un usuario `USUARIO` SHALL cancelar solo sus propias reservas; `ADMINISTRADOR` SHALL poder cancelar cualquier reserva. La cancelación SHALL ser válida solo si faltan al menos 2 horas para el inicio del turno. Al cancelar, la reserva pasa a estado `CANCELADA`, el turno vuelve a `disponible = true` y el stock de los equipamientos del alquiler asociado, si existe, vuelve al catálogo (capacidad `rentals`), todo en la misma transacción.

#### Scenario: Cancelar reserva propia dentro de la ventana
- **WHEN** un usuario `USUARIO` hace `PATCH /api/v1/reservas/:id/cancelar` sobre una de sus reservas cuyo turno comienza en más de 2 horas
- **THEN** el sistema responde `200 OK`, la reserva queda en estado `CANCELADA` y el turno queda con `disponible = true`

#### Scenario: Cancelar una reserva con alquiler restituye el stock
- **WHEN** un usuario cancela, dentro de la ventana, una reserva que tiene un alquiler
- **THEN** el sistema responde `200 OK` y el `stockDisponible` de los equipamientos del alquiler se incrementa en las cantidades alquiladas

#### Scenario: Cancelar una reserva sin alquiler no toca stock
- **WHEN** un usuario cancela, dentro de la ventana, una reserva que no tiene alquiler
- **THEN** el sistema responde `200 OK` y el stock de ningún equipamiento cambia

#### Scenario: Turno liberado puede reservarse de nuevo
- **WHEN** una reserva se cancela y luego un usuario hace `POST /api/v1/reservas` con el mismo `turnoId`
- **THEN** el sistema responde `201 Created`

#### Scenario: Cancelar por administrador en nombre de un usuario
- **WHEN** un usuario `ADMINISTRADOR` hace `PATCH /api/v1/reservas/:id/cancelar` sobre una reserva de otro usuario dentro de la ventana
- **THEN** el sistema responde `200 OK` y la reserva queda cancelada

#### Scenario: Cancelar fuera de la ventana de 2 horas
- **WHEN** un usuario autenticado hace `PATCH /api/v1/reservas/:id/cancelar` sobre una reserva cuyo turno comienza en menos de 2 horas o ya comenzó
- **THEN** el sistema responde `409 Conflict` y la reserva no se cancela ni se restituye stock

#### Scenario: Reserva ya cancelada
- **WHEN** un usuario autenticado hace `PATCH /api/v1/reservas/:id/cancelar` sobre una reserva en estado `CANCELADA`
- **THEN** el sistema responde `409 Conflict` y no restituye stock otra vez

#### Scenario: Cancelar reserva ajena siendo usuario
- **WHEN** un usuario `USUARIO` hace `PATCH /api/v1/reservas/:id/cancelar` sobre una reserva que pertenece a otro usuario
- **THEN** el sistema responde `403 Forbidden` y la reserva no se cancela

#### Scenario: Reserva inexistente
- **WHEN** un usuario autenticado hace `PATCH /api/v1/reservas/:id/cancelar` con un id que no existe
- **THEN** el sistema responde `404 Not Found`

#### Scenario: Acceso sin autenticación
- **WHEN** un usuario no autenticado hace `PATCH /api/v1/reservas/:id/cancelar`
- **THEN** el sistema responde `401 Unauthorized`
