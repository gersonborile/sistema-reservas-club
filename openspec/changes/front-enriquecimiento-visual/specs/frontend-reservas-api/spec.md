# Spec Delta

## ADDED Requirements

### Requirement: Presentación del flujo de reserva

El flujo de reserva SHALL presentarse con tres pasos visibles: turno, equipamiento y confirmación. SHALL mostrar un panel lateral de resumen con cancha, fecha, horario y estado, y SHALL listar el equipamiento con su stock disponible y precio unitario reales. La presentación SHALL conservar el comportamiento de `POST /reservas`, `POST /reservas/:id/alquiler` y el manejo de `409`, `400` y `401`.

#### Scenario: Resumen de la reserva
- **WHEN** el socio abre la confirmación de un turno
- **THEN** ve el paso activo, la cancha, la fecha, el horario y el estado del turno en un panel de resumen

#### Scenario: Equipamiento con precio y stock
- **WHEN** el turno tiene equipamiento disponible
- **THEN** cada ítem muestra su precio unitario y su stock, y la cantidad se limita al stock disponible

#### Scenario: Turno ocupado
- **WHEN** `POST /reservas` responde `409`
- **THEN** se mantiene el mensaje de turno no disponible y se refresca la disponibilidad

### Requirement: Presentación visual de Mis reservas

Mis reservas SHALL mostrar cada reserva como una tarjeta con imagen de la disciplina, estado con color, fecha legible —incluyendo “hoy” o “mañana” cuando corresponda— y el alquiler de equipamiento visible cuando exista. La cancelación SHALL pedir confirmación en contexto y SHALL anunciar el resultado con un toast.

#### Scenario: Tarjeta con imagen y estado
- **WHEN** el socio abre Mis reservas
- **THEN** cada reserva muestra la imagen de su disciplina, el estado con color y una fecha legible

#### Scenario: Alquiler visible
- **WHEN** una reserva tiene equipamiento alquilado
- **THEN** la tarjeta muestra los ítems y el total devueltos por el backend

#### Scenario: Cancelar con confirmación
- **WHEN** el socio pulsa cancelar en una reserva confirmada
- **THEN** la interfaz pide confirmación antes de llamar a `PATCH /reservas/:id/cancelar`

#### Scenario: Resultado de cancelación
- **WHEN** la cancelación termina
- **THEN** la interfaz muestra un toast de éxito o el mensaje de error del backend
