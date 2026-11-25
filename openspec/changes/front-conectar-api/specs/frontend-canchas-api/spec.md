# Spec Delta

## MODIFIED Requirements

### Requirement: Listado de canchas desde el backend
El frontend SHALL obtener las canchas con `GET /canchas` (y `GET /canchas/:id` para el detalle) y SHALL mostrar a los socios solo las canchas cuyo `estado` sea `DISPONIBLE`. El filtro por disciplina SHALL enviarse como `disciplina=<nombre>`. `/canchas` SHALL ser pública y de solo lectura: un visitante sin sesión SHALL poder ver canchas y turnos, pero al elegir un turno libre SHALL ser redirigido a `/login` con una ruta de retorno a la pantalla de reserva de ese turno.

#### Scenario: Listado sin filtro
- **WHEN** un socio o visitante abre `/canchas`
- **THEN** el frontend llama a `GET /canchas` y muestra una tarjeta por cada cancha en estado `DISPONIBLE`, con su nombre y sus disciplinas

#### Scenario: Filtro por disciplina
- **WHEN** el usuario elige la disciplina `tenis`
- **THEN** el frontend llama a `GET /canchas?disciplina=tenis` y muestra solo esas canchas

#### Scenario: Cancha en mantenimiento u ocupada
- **WHEN** el backend devuelve una cancha con `estado` `EN_MANTENIMIENTO` u `OCUPADA`
- **THEN** el frontend no la muestra en el listado de socios

#### Scenario: Visitante sin sesión
- **WHEN** un visitante sin token abre `/canchas`
- **THEN** ve el listado y los turnos, sin ser redirigido a `/login`

#### Scenario: Filtro de horario
- **WHEN** el usuario abre el selector de horario
- **THEN** las opciones son "Cualquiera" y las horas de inicio de los turnos cargados para la fecha, y al elegir una solo se muestran los turnos de esa hora

### Requirement: Franjas horarias desde los turnos
El frontend SHALL mostrar las franjas de todas las canchas visibles en una fecha a partir de una única llamada a `GET /turnos?fecha=<fecha>`, agrupando la respuesta por `cancha_id` en el frontend. Cada turno con `disponible: true` SHALL mostrarse como libre y el resto como ocupado, conservando el `id` del turno en cada franja. La fecha SHALL ser la fecha local del usuario en formato `YYYY-MM-DD`.

#### Scenario: Franjas con libres y ocupadas
- **WHEN** el usuario elige una fecha con turnos libres y ocupados
- **THEN** el frontend muestra cada turno con su hora de inicio, los libres seleccionables y los ocupados deshabilitados

#### Scenario: Fecha sin turnos
- **WHEN** no hay turnos cargados para la fecha elegida
- **THEN** el frontend muestra "No hay turnos cargados para esta fecha." y no muestra franjas

#### Scenario: Más turnos que una página
- **WHEN** la fecha tiene más turnos que el tamaño de página de `GET /turnos`
- **THEN** el frontend recorre todas las páginas y muestra todos los turnos

#### Scenario: Una sola llamada por fecha
- **WHEN** el usuario aplica una disciplina y una fecha
- **THEN** el frontend pide una vez `GET /turnos?fecha=<fecha>` y no una vez por cancha

### Requirement: Carga y errores
Cada pantalla conectada SHALL mostrar un estado de carga con skeleton mientras espera al backend, un estado vacío con un mensaje útil cuando no hay datos y un error con opción de reintentar si la petición falla.

#### Scenario: Backend no alcanzable
- **WHEN** falla la conexión con el backend al abrir `/canchas`
- **THEN** el frontend muestra "No se pudo conectar con el servidor." y un botón para reintentar

#### Scenario: Sin canchas o turnos
- **WHEN** la búsqueda no devuelve canchas o la fecha no tiene turnos
- **THEN** el frontend muestra un estado vacío con el mensaje correspondiente y no una pantalla en blanco

## ADDED Requirements

### Requirement: Retorno después del login
Al elegir un turno libre sin sesión, el frontend SHALL navegar a `/login?redirigir=<ruta-de-reserva>` y, después de un login exitoso, SHALL volver a esa ruta si es interna. El frontend SHALL NOT aceptar URLs externas como destino de retorno.

#### Scenario: Login con retorno
- **WHEN** un visitante elige un turno libre y se autentica
- **THEN** vuelve a la pantalla de confirmación de ese turno

#### Scenario: Retorno inválido
- **WHEN** el parámetro `redirigir` no empieza con `/` o apunta a otro sitio
- **THEN** el frontend ignora el parámetro y navega según el rol del usuario

## REMOVED Requirements

### Requirement: Canchas disponibles ahora
**Reason**: La Home autenticada ahora obtiene los turnos libres de hoy o mañana con una única llamada a `GET /turnos?fecha=` y los agrupa por cancha, en lugar de consultar `GET /disponibilidad` cancha por cancha.
**Migration**: El comportamiento se traslada a `frontend-home-api`, requisito "Canchas con turnos libres hoy o mañana". La Home ya no usa `GET /disponibilidad` ni el criterio de `hora_fin`.
