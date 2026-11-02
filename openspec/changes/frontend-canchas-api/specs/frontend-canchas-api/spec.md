## Purpose

Define cómo el frontend obtiene canchas, disciplinas, turnos y disponibilidad desde el backend real y cómo los presenta (listado, franjas y "disponibles ahora").

## ADDED Requirements

### Requirement: Listado de canchas desde el backend
El frontend SHALL obtener las canchas con `GET /canchas` (y `GET /canchas/:id` para el detalle) y SHALL mostrar a los socios solo las canchas cuyo `estado` no sea `EN_MANTENIMIENTO`. El filtro por disciplina SHALL enviarse como `disciplina=<nombre>`.

#### Scenario: Listado sin filtro
- **WHEN** un socio abre `/canchas`
- **THEN** el frontend llama a `GET /canchas` y muestra una tarjeta por cada cancha que no está en mantenimiento, con su nombre y sus disciplinas

#### Scenario: Filtro por disciplina
- **WHEN** el socio elige la disciplina `tenis`
- **THEN** el frontend llama a `GET /canchas?disciplina=tenis` y muestra solo esas canchas

#### Scenario: Cancha en mantenimiento
- **WHEN** el backend devuelve una cancha con `estado` `EN_MANTENIMIENTO`
- **THEN** el frontend no la muestra en el listado de socios

### Requirement: Disciplinas como datos
El frontend SHALL obtener las disciplinas de `GET /disciplinas` y SHALL NOT depender de una lista fija de disciplinas. Los accesos rápidos de la Home y el filtro del listado SHALL generarse con esa respuesta.

#### Scenario: Accesos rápidos
- **WHEN** el socio abre la Home
- **THEN** los accesos rápidos corresponden a las disciplinas devueltas por `GET /disciplinas` y cada uno navega a `/canchas?disciplina=<nombre>`

### Requirement: Franjas horarias desde los turnos
El frontend SHALL mostrar las franjas de una cancha en una fecha a partir de `GET /turnos?cancha_id=&fecha=`, marcando como libre cada turno con `disponible: true` y como ocupado el resto, y SHALL conservar el `id` del turno en cada franja. La fecha SHALL ser la fecha local del usuario en formato `YYYY-MM-DD`.

#### Scenario: Franjas con libres y ocupadas
- **WHEN** el socio elige una cancha y una fecha con turnos libres y ocupados
- **THEN** el frontend muestra cada turno con su hora de inicio, los libres seleccionables y los ocupados deshabilitados

#### Scenario: Fecha sin turnos
- **WHEN** la cancha no tiene turnos en la fecha elegida
- **THEN** el frontend muestra "No hay turnos para esta fecha." y no muestra franjas

#### Scenario: Más turnos que una página
- **WHEN** la cancha tiene más turnos que el tamaño de página de `GET /turnos`
- **THEN** el frontend recorre todas las páginas y muestra todos los turnos

### Requirement: Canchas disponibles ahora
La Home SHALL mostrar hasta 3 canchas con `estado` `DISPONIBLE` que tengan un turno libre hoy cuyo `hora_fin` sea posterior a la hora actual, obtenido con `GET /disponibilidad?cancha_id=&fecha=<hoy>`. Cada tarjeta SHALL mostrar el nombre, la disciplina y la hora de inicio del primer turno libre, y "Reservar" SHALL llevar a la confirmación con ese turno.

#### Scenario: Hay turnos libres hoy
- **WHEN** la Home carga y existen canchas con turnos libres que aún no terminaron
- **THEN** se muestran hasta 3 tarjetas con "Libre HH:MM"

#### Scenario: No hay turnos libres hoy
- **WHEN** ninguna cancha tiene turnos libres que no hayan terminado
- **THEN** la sección muestra un mensaje de que no hay canchas disponibles ahora

### Requirement: Carga y errores
Cada pantalla conectada SHALL mostrar un estado de carga mientras espera al backend y un mensaje con opción de reintentar si la petición falla.

#### Scenario: Backend no alcanzable
- **WHEN** falla la conexión con el backend al abrir `/canchas`
- **THEN** el frontend muestra "No se pudo conectar con el servidor." y un botón para reintentar

### Requirement: Sin imágenes de cancha
El frontend SHALL NOT mostrar imágenes de cancha, porque el backend no las provee, y SHALL usar el ícono placeholder existente.

#### Scenario: Tarjeta de cancha
- **WHEN** se muestra una cancha
- **THEN** la tarjeta usa el ícono placeholder y no intenta cargar una imagen
