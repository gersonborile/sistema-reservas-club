## Purpose

Define cómo el administrador gestiona turnos, reservas y pagos desde el panel contra el backend real.

## ADDED Requirements

### Requirement: Turnos y franjas habilitado
El ítem "Turnos y franjas" de la barra lateral SHALL estar habilitado y SHALL permitir al administrador elegir una cancha y una fecha y ver los turnos de esa combinación con su hora de inicio, hora de fin y estado (libre u ocupado), obtenidos de `GET /turnos`.

#### Scenario: Ver turnos
- **WHEN** el administrador elige una cancha y una fecha con turnos
- **THEN** la pantalla lista cada turno con su horario y estado

#### Scenario: Sin turnos
- **WHEN** la cancha no tiene turnos en esa fecha
- **THEN** la pantalla muestra "No hay turnos para esta fecha." y la opción de crear uno

### Requirement: Crear y editar turnos
El administrador SHALL crear turnos con `POST /turnos` (cancha, disciplina, fecha, hora de inicio y hora de fin) y editarlos con `PATCH /turnos/:id`. Los errores del backend SHALL mostrarse en el formulario.

#### Scenario: Crear turno válido
- **WHEN** el administrador completa fecha, hora de inicio, hora de fin y disciplina y guarda
- **THEN** la pantalla llama a `POST /turnos`, recibe `201` y el turno aparece en la lista

#### Scenario: Turno superpuesto
- **WHEN** el backend responde `409` porque ya existe un turno superpuesto
- **THEN** el formulario muestra "Ya existe un turno superpuesto en esa cancha y fecha." y no crea el turno

#### Scenario: Rango horario inválido o fecha pasada
- **WHEN** el backend responde `400` por hora de fin anterior al inicio o fecha anterior a hoy
- **THEN** el formulario muestra el mensaje del backend

### Requirement: Eliminar turnos
El administrador SHALL eliminar un turno con `DELETE /turnos/:id` tras confirmar. Si el turno tiene una reserva activa, el backend responde `409` y la pantalla SHALL conservar el turno y mostrar el motivo.

#### Scenario: Eliminar turno libre
- **WHEN** el administrador confirma eliminar un turno sin reservas
- **THEN** la pantalla llama a `DELETE /turnos/:id`, recibe `204` y el turno desaparece de la lista

#### Scenario: Turno con reserva activa
- **WHEN** el backend responde `409` al eliminar
- **THEN** la pantalla muestra "El turno tiene una reserva activa y no puede eliminarse." y el turno permanece

### Requirement: Reservas habilitado
El ítem "Reservas" de la barra lateral SHALL estar habilitado y SHALL listar todas las reservas obtenidas de `GET /reservas/mis` (que para un administrador devuelve las de todos los socios), ordenadas por fecha y hora, con cancha, fecha, hora, estado y filtro por estado. El administrador SHALL poder cancelar una reserva `CONFIRMADA` con `PATCH /reservas/:id/cancelar`.

#### Scenario: Listado completo
- **WHEN** el administrador abre "Reservas" y existen reservas de varios socios
- **THEN** la lista las muestra todas

#### Scenario: Filtrar por estado
- **WHEN** el administrador filtra por "Canceladas"
- **THEN** la lista muestra solo reservas `CANCELADA`

#### Scenario: Cancelar como administrador
- **WHEN** el administrador cancela una reserva `CONFIRMADA`
- **THEN** la pantalla llama a `PATCH /reservas/:id/cancelar` y la reserva pasa a "Cancelada"

### Requirement: Gestión del pago de una reserva
Desde el detalle de una reserva, el administrador SHALL poder: registrar el pago (`POST /reservas/:id/pagos` con `monto` y `metodoPago`) si la reserva está `CONFIRMADA` y no tiene pago; confirmar el cobro de un pago `PENDIENTE` (`PATCH /pagos/:id/pagar`); y anular un pago `PENDIENTE` o `PAGADO` (`PATCH /pagos/:id/anular`). Un pago `ANULADO` SHALL ser de solo lectura. Los errores del backend SHALL mostrarse sin cambiar el estado mostrado.

#### Scenario: Registrar pago
- **WHEN** el administrador registra un pago de una reserva confirmada con monto y método
- **THEN** la pantalla llama a `POST /reservas/:id/pagos` y muestra el pago como `PENDIENTE`

#### Scenario: Confirmar cobro
- **WHEN** el administrador confirma el cobro de un pago `PENDIENTE`
- **THEN** la pantalla llama a `PATCH /pagos/:id/pagar` y el pago pasa a `PAGADO`

#### Scenario: Anular pago
- **WHEN** el administrador anula un pago `PAGADO`
- **THEN** la pantalla llama a `PATCH /pagos/:id/anular` y el pago pasa a `ANULADO`

#### Scenario: Reserva ya tiene pago
- **WHEN** el backend responde `409` porque la reserva ya tiene un pago registrado
- **THEN** la pantalla muestra "La reserva ya tiene un pago registrado." y no cambia el pago mostrado

#### Scenario: Monto sugerido
- **WHEN** la reserva tiene un alquiler y el administrador abre el formulario de pago
- **THEN** el monto se propone con el total del alquiler y puede editarse

### Requirement: Solo administrador
Las pantallas "Turnos y franjas" y "Reservas" SHALL ser accesibles solo con rol `administrador`; un socio SHALL ser redirigido a la Home y una respuesta `403` SHALL mostrarse como error de permisos.

#### Scenario: Socio intenta entrar
- **WHEN** un socio abre `/admin/turnos` o `/admin/reservas`
- **THEN** es redirigido a la Home
