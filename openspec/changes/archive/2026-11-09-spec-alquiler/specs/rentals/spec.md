## Purpose

Modela el alquiler de equipamiento como entidad propia asociada a una reserva confirmada: se crea contra la reserva, descuenta stock, registra montos del catálogo y el stock vuelve al catálogo al cancelar la reserva.

## ADDED Requirements

### Requirement: Alquiler de equipamiento para una reserva
El sistema SHALL permitir crear un alquiler de equipamiento mediante `POST /api/v1/reservas/:id/alquiler` con `items` (arreglo no vacío de `{ equipamientoId, cantidad }`, `cantidad >= 1`, sin repetir equipamiento). La reserva SHALL estar `CONFIRMADA`, el equipamiento SHALL existir y estar activo, y una reserva SHALL tener a lo sumo un alquiler. `USUARIO` SHALL alquilar solo sobre sus reservas; `ADMINISTRADOR`, sobre cualquiera.

#### Scenario: Crear alquiler válido
- **WHEN** un usuario autenticado hace `POST /api/v1/reservas/:id/alquiler` sobre una reserva `CONFIRMADA` con items válidos y stock suficiente
- **THEN** el sistema responde `201 Created` con el alquiler, sus items con cantidades y montos, y el total

#### Scenario: Items inválidos
- **WHEN** un usuario autenticado hace `POST /api/v1/reservas/:id/alquiler` con `items` ausente o vacío, con una `cantidad` menor a 1 o no entera, con un `equipamientoId` que no es UUID o con un `equipamientoId` repetido
- **THEN** el sistema responde `400 Bad Request` y no crea el alquiler

#### Scenario: Reserva inexistente
- **WHEN** un usuario autenticado hace `POST /api/v1/reservas/:id/alquiler` con un id de reserva que no existe
- **THEN** el sistema responde `404 Not Found` y no crea el alquiler

#### Scenario: Reserva cancelada
- **WHEN** un usuario autenticado hace `POST /api/v1/reservas/:id/alquiler` sobre una reserva `CANCELADA`
- **THEN** el sistema responde `409 Conflict` y no crea el alquiler

#### Scenario: La reserva ya tiene un alquiler
- **WHEN** un usuario autenticado hace `POST /api/v1/reservas/:id/alquiler` sobre una reserva que ya tiene un alquiler
- **THEN** el sistema responde `409 Conflict`, no crea un segundo alquiler y no descuenta stock

#### Scenario: Equipamiento inexistente
- **WHEN** un usuario autenticado hace `POST /api/v1/reservas/:id/alquiler` con un `equipamientoId` que no existe
- **THEN** el sistema responde `404 Not Found`, no crea el alquiler y no descuenta stock

#### Scenario: Equipamiento inactivo
- **WHEN** un usuario autenticado hace `POST /api/v1/reservas/:id/alquiler` con un equipamiento que tiene `activo = false`
- **THEN** el sistema responde `409 Conflict`, no crea el alquiler y no descuenta stock

#### Scenario: Stock insuficiente
- **WHEN** un usuario autenticado hace `POST /api/v1/reservas/:id/alquiler` con un item cuya `cantidad` supera el `stockDisponible`
- **THEN** el sistema responde `409 Conflict`, no crea el alquiler y no descuenta stock de ningún item

#### Scenario: Usuario intenta alquilar sobre una reserva ajena
- **WHEN** un usuario `USUARIO` hace `POST /api/v1/reservas/:id/alquiler` sobre una reserva que pertenece a otro usuario
- **THEN** el sistema responde `403 Forbidden` y no crea el alquiler

#### Scenario: Administrador alquila sobre una reserva ajena
- **WHEN** un usuario `ADMINISTRADOR` hace `POST /api/v1/reservas/:id/alquiler` sobre una reserva de otro usuario
- **THEN** el sistema responde `201 Created`

#### Scenario: Acceso sin autenticación
- **WHEN** un usuario no autenticado hace `POST /api/v1/reservas/:id/alquiler`
- **THEN** el sistema responde `401 Unauthorized`

### Requirement: Montos del alquiler
El sistema SHALL registrar para cada item del alquiler el `precioUnitario` vigente del catálogo de equipamiento en el momento de la creación y SHALL calcular el `total` de cada item como `precioUnitario * cantidad`. El alquiler SHALL exponer su `total` como la suma de los `total` de sus items. El precio SHALL quedar congelado en el alquiler aunque el catálogo cambie luego.

#### Scenario: Monto calculado del catálogo
- **WHEN** se crea un alquiler con un item de `cantidad: 2` y `precioUnitario: 500` en el catálogo
- **THEN** la respuesta incluye `total: 1000` para el item y el `total` del alquiler es `1000`

#### Scenario: El precio queda congelado en el alquiler
- **WHEN** el `precioUnitario` del equipamiento cambia en el catálogo después de crear el alquiler
- **THEN** el alquiler conserva el `precioUnitario` y los totales registrados al momento de su creación

### Requirement: Stock del alquiler
El sistema SHALL descontar `cantidad` del `stockDisponible` de cada equipamiento al crear el alquiler, y SHALL restituirlo al cancelar la reserva asociada sin superar nunca el `stockTotal`.

#### Scenario: Descuento de stock al crear el alquiler
- **WHEN** un alquiler se crea con un item de `cantidad: 3`
- **THEN** el `stockDisponible` de ese equipamiento en el catálogo queda reducido en `3`

#### Scenario: Restitución de stock al cancelar la reserva
- **WHEN** la reserva asociada a un alquiler se cancela mediante `PATCH /api/v1/reservas/:id/cancelar`
- **THEN** el `stockDisponible` de los equipamientos del alquiler se incrementa en las cantidades alquiladas

#### Scenario: La restitución no supera el stock total
- **WHEN** se cancela la reserva de un alquiler y el `stockTotal` del equipamiento fue reducido por un `ADMINISTRADOR` después de crearlo
- **THEN** el `stockDisponible` queda como máximo en el `stockTotal` vigente
