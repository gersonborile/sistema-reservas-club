## Purpose

Pantalla del socio para consultar sus reservas y cancelarlas. Es una pantalla protegida por
sesión, comparte la navbar con el resto del frontend y consume la API mockeada hasta que el
backend exponga los endpoints de reservas.

## ADDED Requirements

### Requirement: Pantalla Mis reservas
El sistema SHALL ofrecer `/reservas` con el título "Mis reservas", un botón "+ Nueva
reserva" que navega a `/canchas` y una tabla con las columnas Cancha, Fecha y horario,
Equipamiento, Estado y Acciones. La pantalla SHALL mostrar solo las reservas del usuario con
sesión, ordenadas por fecha y hora ascendente.

#### Scenario: Encabezado y columnas
- **WHEN** un usuario con sesión navega a `/reservas`
- **THEN** la pantalla muestra el título, el botón "+ Nueva reserva" y la tabla con sus cinco
  columnas

#### Scenario: Solo reservas propias
- **WHEN** existen reservas de dos usuarios y uno de ellos abre `/reservas`
- **THEN** la tabla muestra únicamente las reservas de ese usuario

#### Scenario: Datos de cada fila
- **WHEN** el usuario tiene una reserva de Cancha 2 (Pádel) el 07/10 de 18:00 a 19:00 con 2
  paletas
- **THEN** la fila muestra "Cancha 2", "Pádel", "Mié 07/10 · 18:00 a 19:00" y "2 paletas"

#### Scenario: Reserva sin equipamiento
- **WHEN** una reserva no tiene equipamiento
- **THEN** la columna Equipamiento muestra "Sin equipamiento"

#### Scenario: Nueva reserva
- **WHEN** el usuario hace click en "+ Nueva reserva"
- **THEN** el sistema navega a `/canchas`

#### Scenario: Acceso sin sesión
- **WHEN** un usuario sin sesión navega a `/reservas`
- **THEN** el sistema lo redirige a `/login`

### Requirement: Filtrar reservas por estado
El sistema SHALL mostrar las pestañas "Todas", "Confirmadas" y "Canceladas" sobre la tabla,
con "Todas" activa al entrar. Cada pestaña SHALL filtrar las filas por estado, e incluir las
reservas pendientes dentro de "Confirmadas".

#### Scenario: Pestaña por defecto
- **WHEN** el usuario entra a `/reservas`
- **THEN** la pestaña "Todas" está activa y la tabla muestra todas sus reservas

#### Scenario: Filtrar confirmadas
- **WHEN** el usuario elige la pestaña "Confirmadas"
- **THEN** la tabla muestra solo las reservas confirmadas o pendientes

#### Scenario: Filtrar canceladas
- **WHEN** el usuario elige la pestaña "Canceladas"
- **THEN** la tabla muestra solo las reservas canceladas

#### Scenario: Pestaña sin reservas
- **WHEN** la pestaña activa no tiene reservas
- **THEN** la pantalla muestra un mensaje vacío y un botón "Reservar una cancha" que navega a
  `/canchas`

### Requirement: Cancelar una reserva propia
El sistema SHALL permitir cancelar una reserva confirmada o pendiente del usuario hasta 2
horas antes del inicio del turno. El botón "Cancelar" SHALL pedir confirmación en la misma
fila antes de aplicar el cambio, y SHALL estar deshabilitado si la reserva ya está cancelada
o faltan menos de 2 horas.

#### Scenario: Cancelar con tiempo suficiente
- **WHEN** el usuario cancela una reserva cuyo turno empieza en más de 2 horas y confirma
  con "Sí, cancelar"
- **THEN** el estado de la reserva pasa a "Cancelada" y su botón "Cancelar" queda
  deshabilitado

#### Scenario: Pedir confirmación
- **WHEN** el usuario hace click en "Cancelar" de una reserva
- **THEN** la fila muestra "¿Cancelar esta reserva?" con "Sí, cancelar" y "No", sin cambiar
  el estado todavía

#### Scenario: Desistir de la cancelación
- **WHEN** el usuario hace click en "No"
- **THEN** la fila vuelve a mostrar sus botones y la reserva sigue confirmada

#### Scenario: Faltan menos de 2 horas
- **WHEN** el turno de una reserva empieza en menos de 2 horas
- **THEN** su botón "Cancelar" está deshabilitado

#### Scenario: Reserva ya cancelada
- **WHEN** una reserva tiene estado "Cancelada"
- **THEN** su botón "Cancelar" está deshabilitado

#### Scenario: Se libera la franja
- **WHEN** el usuario cancela una reserva y luego abre `/canchas` en la fecha de esa reserva
- **THEN** la franja de esa cancha figura libre

#### Scenario: Se libera el equipamiento
- **WHEN** el usuario cancela una reserva con equipamiento
- **THEN** ese equipamiento deja de contarse como reservado en la disponibilidad

#### Scenario: Ver detalle es placeholder
- **WHEN** el usuario hace click en "Ver detalle"
- **THEN** no navega a ninguna pantalla nueva

### Requirement: Aviso de cancelación
El sistema SHALL mostrar al pie de la tabla la nota "Se puede cancelar hasta 2 horas antes
del turno. El equipamiento reservado vuelve al stock al cancelar."

#### Scenario: Nota visible
- **WHEN** el usuario ve `/reservas`
- **THEN** la nota de cancelación aparece debajo de la tabla
