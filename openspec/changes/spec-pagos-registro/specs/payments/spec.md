## Purpose

Modela el registro de pagos de reservas de cancha: el administrador registra, confirma y anula un pago único por reserva confirmada, y los usuarios pueden consultar el pago de sus propias reservas.

## ADDED Requirements

### Requirement: Registro de pago de una reserva
El sistema SHALL permitir registrar el pago de una reserva mediante `POST /api/v1/reservas/:id/pagos` con `monto` (mayor a 0) y `metodoPago` (`EFECTIVO`, `TRANSFERENCIA` o `TARJETA`). La reserva SHALL existir y estar `CONFIRMADA`, y SHALL tener a lo sumo un pago. El pago SHALL crearse en estado `PENDIENTE`.

#### Scenario: Registrar pago de una reserva confirmada
- **WHEN** un `ADMINISTRADOR` hace `POST /api/v1/reservas/:id/pagos` con un `monto` mayor a 0 y un `metodoPago` válido sobre una reserva `CONFIRMADA`
- **THEN** el sistema responde `201 Created` con el pago en estado `PENDIENTE`

#### Scenario: Registrar pago con monto inválido
- **WHEN** un `ADMINISTRADOR` hace `POST /api/v1/reservas/:id/pagos` con `monto` menor o igual a 0, o sin `monto`
- **THEN** el sistema responde `400 Bad Request` y no crea el pago

#### Scenario: Registrar pago con método de pago inválido
- **WHEN** un `ADMINISTRADOR` hace `POST /api/v1/reservas/:id/pagos` con un `metodoPago` fuera de `EFECTIVO`/`TRANSFERENCIA`/`TARJETA`
- **THEN** el sistema responde `400 Bad Request` y no crea el pago

#### Scenario: Registrar pago de una reserva inexistente
- **WHEN** un `ADMINISTRADOR` hace `POST /api/v1/reservas/:id/pagos` con un id de reserva que no existe
- **THEN** el sistema responde `404 Not Found` y no crea el pago

#### Scenario: Registrar pago de una reserva cancelada
- **WHEN** un `ADMINISTRADOR` hace `POST /api/v1/reservas/:id/pagos` sobre una reserva `CANCELADA`
- **THEN** el sistema responde `409 Conflict` y no crea el pago

#### Scenario: Registrar un segundo pago para la misma reserva
- **WHEN** un `ADMINISTRADOR` hace `POST /api/v1/reservas/:id/pagos` sobre una reserva que ya tiene un pago (en cualquier estado)
- **THEN** el sistema responde `409 Conflict` y no crea un segundo pago

### Requirement: Confirmación del cobro de un pago
El sistema SHALL permitir confirmar el cobro de un pago `PENDIENTE` mediante `PATCH /api/v1/pagos/:id/pagar`. Al confirmarlo, el pago SHALL pasar a `PAGADO` y registrar `fechaPago` con la fecha actual. Un pago que no esté `PENDIENTE` SHALL no poder confirmarse.

#### Scenario: Confirmar el cobro de un pago pendiente
- **WHEN** un `ADMINISTRADOR` hace `PATCH /api/v1/pagos/:id/pagar` sobre un pago `PENDIENTE`
- **THEN** el sistema responde `200 OK` y el pago queda `PAGADO` con su `fechaPago` registrada

#### Scenario: Confirmar un pago inexistente
- **WHEN** un `ADMINISTRADOR` hace `PATCH /api/v1/pagos/:id/pagar` con un id de pago que no existe
- **THEN** el sistema responde `404 Not Found`

#### Scenario: Confirmar un pago no pendiente
- **WHEN** un `ADMINISTRADOR` hace `PATCH /api/v1/pagos/:id/pagar` sobre un pago `PAGADO` o `ANULADO`
- **THEN** el sistema responde `409 Conflict` y el estado del pago no cambia

### Requirement: Anulación de un pago
El sistema SHALL permitir anular un pago `PENDIENTE` o `PAGADO` mediante `PATCH /api/v1/pagos/:id/anular`, pasándolo a `ANULADO`. Un pago `ANULADO` SHALL ser terminal: no puede reanularse ni volver a otro estado.

#### Scenario: Anular un pago pendiente
- **WHEN** un `ADMINISTRADOR` hace `PATCH /api/v1/pagos/:id/anular` sobre un pago `PENDIENTE`
- **THEN** el sistema responde `200 OK` y el pago queda `ANULADO`

#### Scenario: Anular un pago confirmado
- **WHEN** un `ADMINISTRADOR` hace `PATCH /api/v1/pagos/:id/anular` sobre un pago `PAGADO`
- **THEN** el sistema responde `200 OK` y el pago queda `ANULADO`

#### Scenario: Anular un pago inexistente
- **WHEN** un `ADMINISTRADOR` hace `PATCH /api/v1/pagos/:id/anular` con un id de pago que no existe
- **THEN** el sistema responde `404 Not Found`

#### Scenario: Anular un pago ya anulado
- **WHEN** un `ADMINISTRADOR` hace `PATCH /api/v1/pagos/:id/anular` sobre un pago `ANULADO`
- **THEN** el sistema responde `409 Conflict` y el pago no cambia de estado

### Requirement: Consulta del pago de una reserva
El sistema SHALL permitir consultar el pago de una reserva mediante `GET /api/v1/reservas/:id/pagos`. Un `USUARIO` SHALL ver solo el pago de sus propias reservas; un `ADMINISTRADOR`, el de cualquier reserva. La respuesta SHALL incluir `id`, `reservaId`, `monto`, `metodoPago`, `estado` y `fechaPago` (si existe). Reserva inexistente o sin pago SHALL responder `404`.

#### Scenario: Usuario consulta el pago de su propia reserva
- **WHEN** un `USUARIO` autenticado hace `GET /api/v1/reservas/:id/pagos` sobre una de sus reservas que tiene un pago
- **THEN** el sistema responde `200 OK` con el pago, incluyendo `estado`, `monto` y `metodoPago`

#### Scenario: Administrador consulta el pago de cualquier reserva
- **WHEN** un `ADMINISTRADOR` autenticado hace `GET /api/v1/reservas/:id/pagos` sobre cualquier reserva que tiene un pago
- **THEN** el sistema responde `200 OK` con el pago de la reserva

#### Scenario: Usuario consulta el pago de una reserva ajena
- **WHEN** un `USUARIO` hace `GET /api/v1/reservas/:id/pagos` sobre una reserva de otro usuario
- **THEN** el sistema responde `403 Forbidden`

#### Scenario: Consultar el pago de una reserva sin pago
- **WHEN** un usuario autenticado hace `GET /api/v1/reservas/:id/pagos` sobre una reserva existente sin pago
- **THEN** el sistema responde `404 Not Found`

#### Scenario: Consultar el pago de una reserva inexistente
- **WHEN** un usuario autenticado hace `GET /api/v1/reservas/:id/pagos` con un id de reserva que no existe
- **THEN** el sistema responde `404 Not Found`

### Requirement: Autorización de operaciones de pago
El sistema SHALL requerir autenticación para todas las operaciones de pago. Registrar, confirmar y anular SHALL estar reservado al rol `ADMINISTRADOR`; el rol `USUARIO` SHALL no poder ejecutarlas. Las consultas SHALL estar disponibles para `USUARIO` (solo sobre sus reservas) y `ADMINISTRADOR`.

#### Scenario: Registrar, confirmar o anular sin autenticación
- **WHEN** un cliente no autenticado hace `POST /api/v1/reservas/:id/pagos`, `PATCH /api/v1/pagos/:id/pagar` o `PATCH /api/v1/pagos/:id/anular`
- **THEN** el sistema responde `401 Unauthorized` sin realizar la operación

#### Scenario: Usuario intenta registrar un pago
- **WHEN** un `USUARIO` autenticado hace `POST /api/v1/reservas/:id/pagos`
- **THEN** el sistema responde `403 Forbidden` y no crea el pago

#### Scenario: Usuario intenta confirmar un pago
- **WHEN** un `USUARIO` autenticado hace `PATCH /api/v1/pagos/:id/pagar`
- **THEN** el sistema responde `403 Forbidden` y el pago no cambia de estado

#### Scenario: Consultar un pago sin autenticación
- **WHEN** un cliente no autenticado hace `GET /api/v1/reservas/:id/pagos`
- **THEN** el sistema responde `401 Unauthorized`
