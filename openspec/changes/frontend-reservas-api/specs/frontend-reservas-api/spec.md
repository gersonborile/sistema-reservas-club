## Purpose

Define cómo el frontend crea, consulta y cancela reservas y alquila equipamiento contra el backend real, y cómo presenta la reserva y su alquiler.

## ADDED Requirements

### Requirement: Crear reserva sobre un turno
El frontend SHALL crear la reserva con `POST /reservas` enviando el `turnoId` de la franja elegida. Al confirmar, SHALL deshabilitar el botón mientras la petición está en curso y SHALL llevar al usuario a la Home si la reserva se crea.

#### Scenario: Reserva exitosa
- **WHEN** el socio elige una franja libre y confirma la reserva sin equipamiento
- **THEN** el frontend llama a `POST /reservas` con el `turnoId`, recibe `201` y navega a la Home

#### Scenario: Turno ya ocupado
- **WHEN** el backend responde `409` porque el turno dejó de estar libre
- **THEN** el frontend muestra "Ese turno ya no está disponible.", vuelve a pedir las franjas y no crea la reserva

#### Scenario: Doble clic
- **WHEN** el socio hace clic dos veces seguidas en "Confirmar reserva"
- **THEN** el frontend envía una sola petición porque el botón se deshabilita mientras espera

### Requirement: Alquilar equipamiento al reservar
Si el socio eligió equipamiento, el frontend SHALL crear el alquiler con `POST /reservas/:id/alquiler` inmediatamente después de crear la reserva, con `items` de `{ equipamientoId, cantidad }`. El equipamiento ofrecido SHALL salir de `GET /equipamiento` filtrado por la disciplina del turno, con stock disponible, y la cantidad SHALL estar entre 1 y `stockDisponible`.

#### Scenario: Reserva con alquiler
- **WHEN** el socio confirma una reserva con raquetas seleccionadas
- **THEN** el frontend crea la reserva, crea el alquiler con esos ítems y navega a la Home

#### Scenario: Falla el alquiler tras crear la reserva
- **WHEN** la reserva se crea pero `POST /reservas/:id/alquiler` responde `409` por stock insuficiente
- **THEN** el frontend conserva la reserva, muestra el mensaje del backend y ofrece reintentar el alquiler desde "Mis reservas"

#### Scenario: Cantidad fuera de límites
- **WHEN** el socio ingresa una cantidad mayor al stock disponible o menor a 1
- **THEN** el frontend no permite confirmar y muestra el límite

### Requirement: Mis reservas desde el backend
El frontend SHALL listar las reservas con `GET /reservas/mis`, mostrando para cada una la cancha, la fecha, la hora de inicio, el estado ("Confirmada" o "Cancelada") y, si existe, el alquiler con sus ítems y el total. El estado `pendiente` y los montos placeholder SHALL NOT mostrarse.

#### Scenario: Listado con alquiler
- **WHEN** el socio abre "Mis reservas" y una reserva tiene alquiler
- **THEN** la reserva muestra los ítems alquilados con sus cantidades y el total del alquiler que devolvió el backend

#### Scenario: Sin reservas
- **WHEN** el backend devuelve una lista vacía
- **THEN** el frontend muestra el mensaje de que no hay reservas

### Requirement: Cancelar reserva
El frontend SHALL cancelar con `PATCH /reservas/:id/cancelar` y SHALL mostrar el mensaje del backend ante `409` (por ejemplo, faltan menos de 2 horas), recargando la lista. La acción SHALL estar disponible solo para reservas `CONFIRMADA`.

#### Scenario: Cancelación válida
- **WHEN** el socio cancela una reserva `CONFIRMADA` con más de 2 horas de anticipación
- **THEN** el frontend llama a `PATCH /reservas/:id/cancelar` y la reserva pasa a "Cancelada"

#### Scenario: Fuera de la ventana
- **WHEN** el backend responde `409` porque faltan menos de 2 horas
- **THEN** el frontend muestra el mensaje del backend y la reserva sigue "Confirmada"

### Requirement: Alquilar sobre una reserva existente
El frontend SHALL mostrar la acción "Alquilar equipamiento" solo en reservas `CONFIRMADA` sin alquiler que pertenezcan al usuario autenticado (o a cualquier reserva si el usuario es administrador), y SHALL usar `POST /reservas/:id/alquiler`.

#### Scenario: Acción visible
- **WHEN** el socio ve una de sus reservas `CONFIRMADA` sin alquiler
- **THEN** la reserva muestra "Alquilar equipamiento"

#### Scenario: Acción oculta
- **WHEN** la reserva está `CANCELADA` o ya tiene alquiler
- **THEN** la reserva no muestra "Alquilar equipamiento"

#### Scenario: Un socio no ve reservas ajenas
- **WHEN** un socio abre "Mis reservas"
- **THEN** solo ve reservas propias, porque `GET /reservas/mis` devuelve únicamente las del usuario

### Requirement: Próxima reserva en la Home
La Home SHALL mostrar como "Próxima reserva" la reserva `CONFIRMADA` con inicio mayor o igual a ahora y menor inicio, tomada de `GET /reservas/mis`, o un mensaje si no hay ninguna.

#### Scenario: Con reservas futuras
- **WHEN** el socio tiene dos reservas `CONFIRMADA` futuras
- **THEN** la Home muestra la de inicio más cercano

#### Scenario: Sin reservas futuras
- **WHEN** todas las reservas están canceladas o ya pasaron
- **THEN** la Home muestra el mensaje de que no hay próximas reservas
