## Purpose

Permite al administrador del club gestionar las canchas disponibles (tenis, fútbol, pádel) y permite a cualquier usuario consultarlas, como base previa para el sistema de reservas.

## ADDED Requirements

### Requirement: Consultar canchas

El sistema SHALL permitir listar las canchas del club con sus disciplinas y estado, y consultar el detalle de una cancha individual, sin requerir autenticación.

#### Scenario: Listado de todas las canchas

- **WHEN** un cliente consulta `GET /canchas`
- **THEN** el sistema responde 200 con la lista de canchas; cada cancha incluye `id`, `nombre`, `ubicacion`, `capacidad`, `estado` y sus `disciplinas`

#### Scenario: Listado filtrado por disciplina

- **WHEN** un cliente consulta `GET /canchas?disciplina=futbol`
- **THEN** el sistema responde 200 solo con las canchas asociadas a la disciplina fútbol

#### Scenario: Listado filtrado por estado

- **WHEN** un cliente consulta `GET /canchas?estado=en-mantenimiento`
- **THEN** el sistema responde 200 solo con las canchas cuyo estado es "en mantenimiento"

#### Scenario: Detalle de una cancha existente

- **WHEN** un cliente consulta `GET /canchas/:id` con un id existente
- **THEN** el sistema responde 200 con la cancha solicitada, incluyendo sus disciplinas

#### Scenario: Detalle de una cancha inexistente

- **WHEN** un cliente consulta `GET /canchas/:id` con un id que no existe
- **THEN** el sistema responde 404 sin exponer detalles de la cancha

### Requirement: Crear cancha

El sistema SHALL permitir al administrador crear una cancha con nombre, ubicación, capacidad, estado y al menos una disciplina existente.

El body acepta `nombre`, `ubicacion`, `capacidad`, `estado` y `disciplinaIds`. Las disciplinas se referencian por sus identificadores UUID (`disciplinaIds`, lista no vacía); el `estado` usa los valores del enumerado del sistema: `DISPONIBLE`, `OCUPADA` o `EN_MANTENIMIENTO`.

#### Scenario: Crear una cancha válida

- **WHEN** un administrador envía `POST /canchas` con un `nombre` no duplicado, `ubicacion`, `capacidad` mayor que 0, un `estado` válido y al menos una disciplina existente en `disciplinaIds`
- **THEN** el sistema responde 201 con la cancha creada, incluyendo su `id` y sus `disciplinas`

#### Scenario: Crear cancha con nombre duplicado

- **WHEN** un administrador envía `POST /canchas` con un `nombre` que ya existe (ignorando mayúsculas/minúsculas)
- **THEN** el sistema responde 409 sin crear la cancha

#### Scenario: Crear cancha con datos inválidos

- **WHEN** un administrador envía `POST /canchas` sin `nombre`, con `capacidad` menor o igual a 0, con un `estado` fuera del conjunto permitido, sin ninguna disciplina en `disciplinaIds`, o con un `disciplinaIds` que no sea una lista de UUIDs
- **THEN** el sistema responde 400 y no crea la cancha

#### Scenario: Crear cancha con disciplina inexistente

- **WHEN** un administrador envía `POST /canchas` con `disciplinaIds` que incluye un UUID que no corresponde a una disciplina del sistema
- **THEN** el sistema responde 422 y no crea la cancha

### Requirement: Modificar cancha

El sistema SHALL permitir al administrador modificar los datos de una cancha existente mediante `PUT /canchas/:id`, aplicando las mismas validaciones que en la creación sobre los campos enviados (la actualización es parcial: los campos no enviados se conservan).

#### Scenario: Modificar una cancha existente

- **WHEN** un administrador envía `PUT /canchas/:id` con datos válidos para una cancha existente
- **THEN** el sistema responde 200 con la cancha actualizada

#### Scenario: Modificar cancha inexistente

- **WHEN** un administrador envía `PUT /canchas/:id` con un id que no existe
- **THEN** el sistema responde 404

#### Scenario: Modificar con nombre duplicado

- **WHEN** un administrador renombra una cancha a un `nombre` que ya posee otra cancha
- **THEN** el sistema responde 409 y no modifica la cancha

### Requirement: Dar de baja cancha

El sistema SHALL permitir al administrador eliminar una cancha siempre que no tenga turnos (y por lo tanto reservas) asociados. El backend responde 409 —nunca un error interno— cuando la base de datos restringe el borrado por las referencias existentes.

#### Scenario: Eliminar cancha sin referencias activas

- **WHEN** un administrador envía `DELETE /canchas/:id` para una cancha sin turnos ni reservas activas asociados
- **THEN** el sistema responde 204 y la cancha deja de existir

#### Scenario: Eliminar cancha inexistente

- **WHEN** un administrador envía `DELETE /canchas/:id` con un id que no existe
- **THEN** el sistema responde 404

#### Scenario: Eliminar cancha con referencias activas

- **WHEN** un administrador envía `DELETE /canchas/:id` para una cancha que tiene turnos o reservas activas asociados
- **THEN** el sistema responde 409 y la cancha no se elimina

### Requirement: Disciplinas base del club

El sistema SHALL proveer las disciplinas "tenis", "fútbol" y "pádel" como datos de solo lectura, disponibles desde el primer despliegue.

#### Scenario: Consultar disciplinas

- **WHEN** un cliente consulta `GET /disciplinas`
- **THEN** el sistema responde 200 con las disciplinas tenis, fútbol y pádel

#### Scenario: Disciplinas presentes sin configuración manual

- **WHEN** el sistema se despliega por primera vez
- **THEN** las disciplinas tenis, fútbol y pádel existen y pueden ser usadas como referencia al crear o modificar canchas

### Requirement: Acceso administrativo a mutaciones

El sistema SHALL requerir un usuario autenticado con rol administrador para crear, modificar o eliminar canchas.

#### Scenario: Cliente sin autenticación intenta mutar

- **WHEN** un cliente no autenticado envía `POST /canchas`, `PUT /canchas/:id` o `DELETE /canchas/:id`
- **THEN** el sistema responde 401 sin realizar la operación

#### Scenario: Usuario autenticado sin rol administrador intenta mutar

- **WHEN** un usuario autenticado cuyo rol no es administrador envía una mutación sobre canchas
- **THEN** el sistema responde 403 sin realizar la operación