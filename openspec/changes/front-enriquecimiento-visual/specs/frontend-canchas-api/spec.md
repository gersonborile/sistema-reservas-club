# Spec Delta

## ADDED Requirements

### Requirement: Presentación visual del listado de canchas

El listado de `/canchas` SHALL mostrar una tarjeta por cancha con imagen local según su disciplina, badges de disciplina, capacidad y estado, y chips con los próximos horarios libres de la fecha elegida. Cada tarjeta SHALL ofrecer un enlace al detalle público de la cancha. Los chips libres SHALL conservar el enlace al flujo de reserva existente.

#### Scenario: Tarjeta con imagen y badges
- **WHEN** se muestra una cancha con una disciplina reconocida
- **THEN** la tarjeta usa la imagen local de esa disciplina y muestra badges de disciplina, capacidad y estado

#### Scenario: Sin imagen reconocida
- **WHEN** la cancha no tiene una disciplina con imagen propia
- **THEN** la tarjeta usa la imagen por defecto o el placeholder sin dejar un ícono roto

#### Scenario: Próximos horarios libres
- **WHEN** la cancha tiene turnos libres en la fecha elegida
- **THEN** la tarjeta muestra sus próximos horarios libres como chips enlazados a la reserva

#### Scenario: Detalle de cancha
- **WHEN** el socio quiere ver todos los turnos
- **THEN** la tarjeta ofrece un enlace a `/canchas/:id`

### Requirement: Estados del listado de canchas

El listado SHALL mostrar un skeleton mientras carga, un estado vacío con ilustración y una acción para cambiar la búsqueda cuando no haya resultados, y un error con reintento cuando falle la petición.

#### Scenario: Carga
- **WHEN** el listado espera canchas o turnos
- **THEN** muestra skeletons con la forma de las tarjetas

#### Scenario: Sin resultados
- **WHEN** no hay canchas o turnos para los filtros elegidos
- **THEN** muestra una ilustración, explica la situación y ofrece limpiar o cambiar los filtros

#### Scenario: Error
- **WHEN** falla la conexión con el backend
- **THEN** muestra el mensaje de error y un botón para reintentar

### Requirement: Detalle público de cancha

El frontend SHALL ofrecer una ruta pública `/canchas/:id` que obtenga la cancha con `GET /canchas/:id` y sus turnos con `GET /turnos?cancha_id=&fecha=`. El detalle SHALL mostrar una imagen grande, nombre, ubicación, capacidad, estado y disciplinas con su duración y reglas. SHALL mostrar un selector de 7 días y una grilla de turnos con libres seleccionables y ocupados deshabilitados. Al elegir un turno libre SHALL continuar el flujo de reserva existente, pasando por login con retorno si no hay sesión.

#### Scenario: Detalle con datos reales
- **WHEN** el socio abre `/canchas/:id`
- **THEN** ve la imagen grande y los datos de la cancha y sus disciplinas provenientes del backend

#### Scenario: Selector de 7 días
- **WHEN** el socio cambia de fecha en la franja de 7 días
- **THEN** el detalle vuelve a pedir los turnos de esa cancha y fecha

#### Scenario: Turnos libres y ocupados
- **WHEN** la fecha tiene turnos libres y ocupados
- **THEN** los libres son seleccionables y los ocupados aparecen deshabilitados

#### Scenario: Elegir un turno sin sesión
- **WHEN** el socio elige un turno libre sin sesión iniciada
- **THEN** el flujo lo lleva a login conservando el retorno a la reserva de ese turno

#### Scenario: Cancha inexistente
- **WHEN** `GET /canchas/:id` responde `404`
- **THEN** el detalle muestra que la cancha no existe y ofrece volver al listado

## MODIFIED Requirements

### Requirement: Canchas disponibles ahora
La Home autenticada SHALL mostrar hasta 3 canchas con `estado` `DISPONIBLE` que tengan un turno libre hoy cuyo `hora_fin` sea posterior a la hora actual, obtenido con `GET /turnos?fecha=<hoy>`. Cada tarjeta SHALL mostrar la imagen de su disciplina, el nombre, la disciplina y la hora de inicio del primer turno libre, y "Reservar" SHALL llevar a la confirmación con ese turno.

#### Scenario: Hay turnos libres hoy
- **WHEN** la Home carga y existen canchas con turnos libres que aún no terminaron
- **THEN** se muestran hasta 3 tarjetas con imagen, disciplina y "Libre HH:MM"

#### Scenario: No hay turnos libres hoy
- **WHEN** ninguna cancha tiene turnos libres que no hayan terminado
- **THEN** la sección muestra un mensaje de que no hay canchas disponibles ahora

## REMOVED Requirements

### Requirement: Sin imágenes de cancha
**Reason**: El backend sigue sin proveer imágenes, pero el frontend ahora usa imágenes deportivas locales asociadas a la disciplina y un placeholder propio.

**Migration**: Usar la imagen local de la disciplina o el placeholder del sistema visual; no solicitar ni esperar imágenes del backend.
