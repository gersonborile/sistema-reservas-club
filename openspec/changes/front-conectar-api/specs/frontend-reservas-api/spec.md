# Spec Delta

## MODIFIED Requirements

### Requirement: Crear reserva sobre un turno
El frontend SHALL crear la reserva con `POST /reservas` enviando el `turnoId` de la franja elegida. Al confirmar, SHALL deshabilitar el botón mientras la petición está en curso y, si la reserva se crea, SHALL navegar a `/reservas` con un aviso de reserva confirmada. SHALL manejar `409` como turno ocupado, `400` como turno pasado o inválido, y `401` redirigiendo al login con retorno a la pantalla actual.

#### Scenario: Reserva exitosa
- **WHEN** el socio elige una franja libre y confirma la reserva sin equipamiento
- **THEN** el frontend llama a `POST /reservas` con el `turnoId`, recibe `201`, navega a `/reservas` y muestra un aviso de reserva confirmada

#### Scenario: Turno ya ocupado
- **WHEN** el backend responde `409` porque el turno dejó de estar libre
- **THEN** el frontend muestra "Ese turno ya no está disponible.", vuelve a pedir las franjas y no crea la reserva

#### Scenario: Turno pasado
- **WHEN** el backend responde `400` porque el turno ya pasó o no es válido
- **THEN** el frontend muestra el mensaje del backend y no navega como si la reserva se hubiera creado

#### Scenario: Sesión vencida
- **WHEN** el backend responde `401` al crear la reserva
- **THEN** el frontend cierra la sesión y redirige a `/login` con retorno a la pantalla de reserva

#### Scenario: Doble clic
- **WHEN** el socio hace clic dos veces seguidas en "Confirmar reserva"
- **THEN** el frontend envía una sola petición porque el botón se deshabilita mientras espera

### Requirement: Alquilar equipamiento al reservar
Si el socio eligió equipamiento, el frontend SHALL crear el alquiler con `POST /reservas/:id/alquiler` inmediatamente después de crear la reserva, con `items` de `{ equipamientoId, cantidad }`. El equipamiento ofrecido SHALL salir de `GET /equipamiento` filtrado por la disciplina del turno, con stock disponible, y la cantidad SHALL estar entre 1 y `stockDisponible`. Si la reserva y el alquiler se crean, SHALL navegar a `/reservas` con un aviso de reserva confirmada.

#### Scenario: Reserva con alquiler
- **WHEN** el socio confirma una reserva con raquetas seleccionadas
- **THEN** el frontend crea la reserva, crea el alquiler con esos ítems y navega a `/reservas` con un aviso

#### Scenario: Falla el alquiler tras crear la reserva
- **WHEN** la reserva se crea pero `POST /reservas/:id/alquiler` responde `409` por stock insuficiente
- **THEN** el frontend conserva la reserva, muestra el mensaje del backend y ofrece reintentar el alquiler desde "Mis reservas"

#### Scenario: Cantidad fuera de límites
- **WHEN** el socio ingresa una cantidad mayor al stock disponible o menor a 1
- **THEN** el frontend no permite confirmar y muestra el límite
