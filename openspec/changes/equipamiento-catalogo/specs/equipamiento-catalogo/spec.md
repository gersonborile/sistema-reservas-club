## Purpose

Permite al club administrar el catálogo de equipamiento deportivo (raquetas, pelotas, redes, etc.) por disciplina, con stock total y disponible, precio unitario, disponibilidad derivada del stock disponible y lectura pública; como base previa para futuros préstamos o alquileres.

## ADDED Requirements

### Requirement: Consultar catálogo de equipamiento

El sistema SHALL permitir listar los ítems de equipamiento del club y consultar el detalle de un ítem individual sin requerir autenticación. Cada ítem SHALL incluir `id`, `nombre`, `disciplinaId`, `disciplina` (objeto con `id` y `nombre`), `stockTotal`, `stockDisponible`, `precioUnitario` (número JSON), `activo` y `disponible`. `disponible` SHALL ser un campo calculado —nunca persistido— que vale `true` si y solo si `stockDisponible > 0`.

El catálogo público por defecto SHALL devolver únicamente ítems con `activo = true`. El listado SHALL aceptar los siguientes parámetros opcionales:

- `disciplinaId`: UUID de una disciplina existente; si el formato es inválido responde 400.
- `disponible`: booleano; `true` filtra `stockDisponible > 0`, `false` filtra `stockDisponible = 0` y omitirlo no filtra por stock.
- `incluirInactivos`: booleano, por defecto `false`; al ser el catálogo público, cualquier cliente puede usarlo. Con `true` incluye ítems activos e inactivos; con `false` u omitido devuelve solo activos.
- `page`: entero mayor o igual a 1, por defecto 1.
- `limit`: entero entre 1 y 100, por defecto 20.

#### Scenario: Listado público por defecto

- **WHEN** cualquier cliente, autenticado o no, consulta `GET /equipamiento`
- **THEN** el sistema responde 200 con los ítems activos, cada uno con `id`, `nombre`, `disciplinaId`, `disciplina`, `stockTotal`, `stockDisponible`, `precioUnitario`, `activo` y `disponible`

#### Scenario: Listado filtrado por disciplina

- **WHEN** un cliente consulta `GET /equipamiento?disciplinaId=<uuid>`
- **THEN** el sistema responde 200 solo con los ítems activos de la disciplina indicada

#### Scenario: Listado filtrado por disponibilidad

- **WHEN** un cliente consulta `GET /equipamiento?disponible=true`
- **THEN** el sistema responde 200 solo con los ítems activos cuyo `stockDisponible` es mayor que 0
- **AND** si consulta `disponible=false`, responde solo con los ítems activos cuyo `stockDisponible` es 0

#### Scenario: Listado que incluye ítems inactivos

- **WHEN** un cliente consulta `GET /equipamiento?incluirInactivos=true`
- **THEN** el sistema responde 200 incluyendo también los ítems con `activo = false`

#### Scenario: Listado paginado

- **WHEN** un cliente consulta `GET /equipamiento?page=2&limit=5`
- **THEN** el sistema responde 200 con hasta 5 ítems correspondientes a la segunda página

#### Scenario: Listado con parámetros inválidos

- **WHEN** un cliente consulta `GET /equipamiento` con un `disciplinaId` que no es UUID, un `limit` mayor que 100 o un `page` menor que 1
- **THEN** el sistema responde 400

#### Scenario: Detalle de un ítem existente

- **WHEN** un cliente consulta `GET /equipamiento/:id` con un id existente
- **THEN** el sistema responde 200 con el ítem solicitado, incluyendo `disciplina`, `stockTotal`, `stockDisponible`, `precioUnitario`, `activo` y `disponible`, aunque el ítem esté inactivo

#### Scenario: Detalle de un ítem inexistente

- **WHEN** un cliente consulta `GET /equipamiento/:id` con un id que no existe
- **THEN** el sistema responde 404 sin exponer detalles del ítem

### Requirement: Crear ítem de equipamiento

El sistema SHALL permitir al administrador crear un ítem de equipamiento con `nombre` no vacío, una `disciplinaId` existente, un `stockTotal` entero entre 0 y 2147483647, un `precioUnitario` entre 0 y 99999999.99 con hasta 2 decimales y un `activo` booleano opcional que por defecto es `true`.

El cliente SHALL NOT enviar `stockDisponible`: el sistema SHALL inicializarlo igual a `stockTotal` y SHALL rechazar con 400 cualquier body que incluya ese campo.

#### Scenario: Crear un ítem válido

- **WHEN** un administrador envía `POST /equipamiento` con un `nombre` no vacío, una `disciplinaId` existente, un `stockTotal` y un `precioUnitario` válidos
- **THEN** el sistema responde 201 con el ítem creado, con `stockDisponible` igual a `stockTotal`, `disponible` igual a `stockDisponible > 0` y `activo` igual a `true`

#### Scenario: Crear ítem con disciplina inexistente

- **WHEN** un administrador envía `POST /equipamiento` referenciando una disciplina que no existe en el sistema
- **THEN** el sistema responde 422 y no crea el ítem

#### Scenario: Crear ítem con stock negativo

- **WHEN** un administrador envía `POST /equipamiento` con un `stockTotal` menor que 0
- **THEN** el sistema responde 400 y no crea el ítem

#### Scenario: Crear ítem con stock fuera del rango de un entero de 32 bits

- **WHEN** un administrador envía `POST /equipamiento` con un `stockTotal` mayor que 2147483647
- **THEN** el sistema responde 400 y no crea el ítem

#### Scenario: Crear ítem con precio inválido

- **WHEN** un administrador envía `POST /equipamiento` con un `precioUnitario` menor que 0, mayor que 99999999.99 o con más de 2 decimales
- **THEN** el sistema responde 400 y no crea el ítem

#### Scenario: Crear ítem con nombre faltante

- **WHEN** un administrador envía `POST /equipamiento` sin `nombre` o con un nombre vacío
- **THEN** el sistema responde 400 y no crea el ítem

#### Scenario: Crear ítem con datos faltantes

- **WHEN** un administrador envía `POST /equipamiento` sin `nombre`, `disciplinaId`, `stockTotal` o `precioUnitario`
- **THEN** el sistema responde 400 y no crea el ítem

#### Scenario: Crear ítem enviando stock disponible

- **WHEN** un administrador envía `POST /equipamiento` incluyendo `stockDisponible` en el body
- **THEN** el sistema responde 400 y no crea el ítem

### Requirement: Modificar ítem de equipamiento

El sistema SHALL permitir al administrador modificar parcialmente un ítem existente mediante `PUT /equipamiento/:id`, revalidando nombre, disciplina, stock, precio y estado activo cuando se envían. Los campos no enviados SHALL conservarse.

El cliente SHALL NOT enviar `stockDisponible`. Cuando se envía `stockTotal`, el sistema SHALL calcular las unidades alquiladas como `stockTotal - stockDisponible` del ítem vigente y SHALL aplicar la misma diferencia al `stockDisponible` (`nuevo stockDisponible = nuevo stockTotal - unidades alquiladas`). Si el nuevo `stockTotal` es menor que las unidades alquiladas, SHALL responder 409 sin modificar el ítem. El cálculo y la verificación SHALL realizarse de forma atómica frente a cambios concurrentes de `stockDisponible`, reintentando la operación condicional si el ítem cambió durante el proceso.

#### Scenario: Modificar un ítem existente

- **WHEN** un administrador envía `PUT /equipamiento/:id` con datos válidos para un ítem existente
- **THEN** el sistema responde 200 con el ítem actualizado, incluyendo su `disponible` recalculado según el nuevo `stockDisponible`

#### Scenario: Modificar ítem inexistente

- **WHEN** un administrador envía `PUT /equipamiento/:id` con un id que no existe
- **THEN** el sistema responde 404

#### Scenario: Modificar stock total ajustando el disponible

- **WHEN** un administrador envía `PUT /equipamiento/:id` con un nuevo `stockTotal` mayor o igual a las unidades alquiladas
- **THEN** el sistema responde 200 y el `stockDisponible` resultante es `nuevo stockTotal - unidades alquiladas`

#### Scenario: Reducir stock total por debajo de las unidades alquiladas

- **WHEN** un administrador envía `PUT /equipamiento/:id` con un `stockTotal` menor que `stockTotal - stockDisponible` del ítem vigente
- **THEN** el sistema responde 409 con un mensaje claro y no modifica el ítem

#### Scenario: Modificar ítem con stock negativo o fuera de rango

- **WHEN** un administrador envía `PUT /equipamiento/:id` con un `stockTotal` menor que 0 o mayor que 2147483647
- **THEN** el sistema responde 400 y no modifica el ítem

#### Scenario: Modificar ítem con precio inválido

- **WHEN** un administrador envía `PUT /equipamiento/:id` con un `precioUnitario` menor que 0, mayor que 99999999.99 o con más de 2 decimales
- **THEN** el sistema responde 400 y no modifica el ítem

#### Scenario: Modificar ítem con disciplina inexistente

- **WHEN** un administrador envía `PUT /equipamiento/:id` referenciando una disciplina que no existe
- **THEN** el sistema responde 422 y no modifica el ítem

#### Scenario: Modificar ítem enviando stock disponible

- **WHEN** un administrador envía `PUT /equipamiento/:id` incluyendo `stockDisponible` en el body
- **THEN** el sistema responde 400 y no modifica el ítem

#### Scenario: Desactivar un ítem

- **WHEN** un administrador envía `PUT /equipamiento/:id` con `activo = false`
- **THEN** el sistema responde 200 con el ítem actualizado y deja de mostrarlo en los listados públicos que no usan `incluirInactivos`

### Requirement: Eliminar ítem de equipamiento

El sistema SHALL permitir al administrador eliminar un ítem siempre que no tenga alquileres asociados en `ReservaEquipamiento`. La eliminación SHALL ser física. Si el ítem tiene alquileres asociados, SHALL responder 409 con un mensaje que sugiera desactivarlo con `activo = false`. El backend SHALL responder 409 —nunca un error interno— cuando la base de datos restrinja el borrado por referencias existentes.

#### Scenario: Eliminar ítem sin alquileres asociados

- **WHEN** un administrador envía `DELETE /equipamiento/:id` para un ítem sin alquileres asociados
- **THEN** el sistema responde 204 y el ítem deja de existir

#### Scenario: Eliminar ítem inexistente

- **WHEN** un administrador envía `DELETE /equipamiento/:id` con un id que no existe
- **THEN** el sistema responde 404

#### Scenario: Eliminar ítem con alquileres asociados

- **WHEN** un administrador envía `DELETE /equipamiento/:id` para un ítem que tiene al menos un registro en `ReservaEquipamiento`
- **THEN** el sistema responde 409, el ítem no se elimina y el mensaje sugiere desactivarlo con `activo = false`

### Requirement: Gestionar stock e inventario

El sistema SHALL mantener `stockTotal` y `stockDisponible` de cada ítem con el invariante `0 <= stockDisponible <= stockTotal`, derivar `disponible` de `stockDisponible` y permitir ocultarlo del catálogo público sin eliminarlo mediante `activo = false`.

#### Scenario: Disponibilidad derivada del stock

- **WHEN** un ítem tiene `stockDisponible` mayor que 0
- **THEN** el sistema reporta `disponible = true` para ese ítem en toda consulta; si el `stockDisponible` es 0, reporta `disponible = false`

#### Scenario: Ítem inactivo oculto del listado público

- **WHEN** un cliente consulta `GET /equipamiento` sin `incluirInactivos` y existe un ítem con `activo = false`
- **THEN** el sistema responde 200 sin incluir ese ítem

#### Scenario: El stock de un ítem nunca es negativo

- **WHEN** se intenta crear o modificar un ítem con un `stockTotal` menor que 0
- **THEN** el sistema responde 400 y no crea ni modifica el ítem

### Requirement: Acceso administrativo a mutaciones

El sistema SHALL requerir un usuario autenticado con rol administrador para crear, modificar o eliminar ítems de equipamiento. Las consultas `GET /equipamiento` y `GET /equipamiento/:id` SHALL ser públicas.

#### Scenario: Cliente sin autenticación intenta mutar

- **WHEN** un cliente no autenticado envía `POST /equipamiento`, `PUT /equipamiento/:id` o `DELETE /equipamiento/:id`
- **THEN** el sistema responde 401 sin realizar la operación

#### Scenario: Usuario autenticado sin rol administrador intenta mutar

- **WHEN** un usuario autenticado cuyo rol no es administrador envía una mutación sobre el catálogo de equipamiento
- **THEN** el sistema responde 403 sin realizar la operación
