# Spec Delta

## Purpose

Define cómo la Home pública y la Home autenticada se alimentan del backend real, sin datos simulados, y cómo muestran sus estados de carga, vacío y error.

## ADDED Requirements

### Requirement: Home pública desde el backend
La Home pública SHALL mostrar las disciplinas obtenidas de `GET /disciplinas`, capitalizando el nombre recibido. SHALL mostrar el horario único del club de 08:00 a 22:00 y SHALL NOT mostrar precios, imágenes, ratings, cantidad de socios ni datos de contacto inventados. Los botones "Reservar" y "Ver disponibilidad" SHALL llevar a `/canchas`.

#### Scenario: Disciplinas reales
- **WHEN** un visitante sin sesión abre `/`
- **THEN** las tarjetas de disciplinas corresponden a la respuesta de `GET /disciplinas` y no a una lista fija

#### Scenario: Horario y llamados a la acción
- **WHEN** el visitante recorre la Home pública
- **THEN** ve el horario 08:00–22:00 y los botones "Reservar" y "Ver disponibilidad" navegan a `/canchas`

#### Scenario: Backend no disponible en la Home pública
- **WHEN** falla `GET /disciplinas`
- **THEN** la sección muestra un error con botón para reintentar y no inventa disciplinas

### Requirement: Saludo con el usuario real
La Home autenticada SHALL usar el nombre del usuario guardado en `localStorage` si existe y SHALL refrescarlo en segundo plano con `GET /auth/perfil`. Si no hay usuario guardado, SHALL esperar el perfil antes de mostrar el saludo. El saludo SHALL usar el nombre real y SHALL NOT mostrar números de socio ni ubicaciones inventadas.

#### Scenario: Usuario guardado con refresco
- **WHEN** el socio abre la Home con un usuario guardado
- **THEN** el saludo aparece de inmediato con ese nombre y luego se actualiza si `GET /auth/perfil` devuelve otro nombre

#### Scenario: Sin usuario guardado
- **WHEN** el socio abre la Home con token válido pero sin usuario en `localStorage`
- **THEN** el frontend obtiene `GET /auth/perfil` y muestra el saludo con el nombre devuelto

### Requirement: Próxima reserva real
La Home autenticada SHALL mostrar como "Próxima reserva" la reserva `CONFIRMADA` con inicio mayor o igual a ahora y menor inicio, tomada de `GET /reservas/mis`. Si no hay ninguna, SHALL mostrar un estado vacío con un enlace a `/canchas`.

#### Scenario: Con reserva futura
- **WHEN** el socio tiene reservas `CONFIRMADA` futuras
- **THEN** la Home muestra la de inicio más cercano con cancha, fecha y horario reales

#### Scenario: Sin reserva futura
- **WHEN** no hay reservas `CONFIRMADA` futuras
- **THEN** la Home muestra un mensaje de estado vacío y un botón para explorar canchas

### Requirement: Accesos rápidos por disciplina
Los accesos rápidos de la Home autenticada SHALL generarse con `GET /disciplinas`, SHALL usar el nombre real capitalizado y SHALL navegar a `/canchas?disciplina=<nombre>`. El conteo de turnos libres de cada acceso SHALL calcularse con los turnos reales de la fecha mostrada. SHALL NOT haber disciplinas, íconos por disciplina ni cantidades hardcodeadas.

#### Scenario: Acceso rápido navegable
- **WHEN** el socio hace clic en un acceso rápido
- **THEN** navega a `/canchas` con el filtro de esa disciplina

#### Scenario: Conteo real
- **WHEN** la Home muestra los turnos libres de hoy o mañana
- **THEN** cada acceso rápido indica cuántos turnos libres tiene esa disciplina en esa fecha, o que no hay turnos cargados

### Requirement: Canchas con turnos libres hoy o mañana
La Home autenticada SHALL obtener los turnos de una fecha con una única llamada a `GET /turnos?fecha=<fecha>` y SHALL agruparlos por cancha en el frontend. SHALL mostrar los turnos libres de hoy desde la hora actual; si hoy no hay turnos libres, SHALL consultar y mostrar los de mañana. Las tarjetas SHALL mostrar el nombre real de la cancha, sus disciplinas y el próximo turno libre, y SHALL llevar a la pantalla de reserva de ese turno.

#### Scenario: Turnos libres hoy
- **WHEN** hay turnos libres hoy con hora de inicio mayor o igual a la hora actual
- **THEN** la Home muestra hasta 3 canchas con su próximo turno libre de hoy

#### Scenario: Sin turnos libres hoy
- **WHEN** hoy no quedan turnos libres desde la hora actual
- **THEN** la Home consulta los turnos de mañana y muestra los libres de esa fecha

#### Scenario: Sin turnos cargados
- **WHEN** no hay turnos cargados para hoy ni para mañana
- **THEN** la Home muestra "No hay turnos cargados para esta fecha" y un enlace a `/canchas`

#### Scenario: Una sola llamada por fecha
- **WHEN** la Home necesita los turnos de una fecha
- **THEN** llama una vez a `GET /turnos?fecha=<fecha>` y agrupa la respuesta por `cancha_id`, sin una llamada por cancha

### Requirement: Estados de la Home
La Home SHALL mostrar un skeleton mientras carga, un estado vacío con mensaje útil cuando no hay datos y un error con botón para reintentar cuando falla una petición.

#### Scenario: Carga
- **WHEN** la Home espera disciplinas, reservas o turnos
- **THEN** muestra skeletons en las secciones correspondientes

#### Scenario: Error con reintento
- **WHEN** falla una petición de la Home
- **THEN** muestra el mensaje de error y un botón "Reintentar" que vuelve a pedir los datos

### Requirement: Sin contenido inventado en la Home
La Home SHALL NOT mostrar precios de cancha, fotos por cancha, superficies, amenities, códigos de reserva, QR, check-in digital, ratings, "Socio Activo #N", nombres ni cantidades fijas. SHALL usar solo datos devueltos por el backend o textos genéricos de interfaz.

#### Scenario: Tarjeta de cancha
- **WHEN** se muestra una cancha en la Home
- **THEN** solo aparecen datos reales de cancha, disciplinas y turnos, sin precio ni equipamiento inventado

#### Scenario: Sin datos de contacto reales
- **WHEN** no hay datos de contacto en el backend
- **THEN** la Home no muestra dirección, teléfono, email ni redes inventadas
