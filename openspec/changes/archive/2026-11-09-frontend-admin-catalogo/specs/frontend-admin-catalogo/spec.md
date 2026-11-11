## Purpose

Define cómo el panel de administración gestiona canchas y equipamiento y calcula las métricas del Resumen contra el backend real.

## ADDED Requirements

### Requirement: Crear y editar canchas
El panel SHALL crear canchas con `POST /canchas` y editarlas con `PUT /canchas/:id`, enviando `nombre`, `ubicacion`, `capacidad`, `estado` y `disciplinaIds`. El formulario SHALL incluir los campos Ubicación y Capacidad y un selector de disciplina alimentado por `GET /disciplinas`.

#### Scenario: Crear cancha válida
- **WHEN** el administrador completa nombre, ubicación, capacidad y disciplina y guarda
- **THEN** el panel llama a `POST /canchas`, recibe `201` y la cancha aparece en la tabla tras volver a pedir la lista

#### Scenario: Datos inválidos
- **WHEN** el backend responde `400` con `campos`
- **THEN** cada mensaje se muestra junto a su campo y la cancha no se crea

#### Scenario: Nombre repetido
- **WHEN** el backend responde `409` porque el nombre ya existe
- **THEN** el panel muestra el mensaje del backend junto al campo nombre

#### Scenario: Editar conservando disciplinas
- **WHEN** el administrador edita el nombre de una cancha que tiene varias disciplinas
- **THEN** el panel conserva sus disciplinas existentes y solo modifica lo editado

### Requirement: Activar y desactivar canchas
"Desactivar" SHALL enviar `PUT /canchas/:id` con `estado` `EN_MANTENIMIENTO` y "Activar" SHALL enviar `estado` `DISPONIBLE`. El panel SHALL mostrar "Activa" cuando `estado` no sea `EN_MANTENIMIENTO` e "Inactiva" en caso contrario.

#### Scenario: Desactivar
- **WHEN** el administrador desactiva una cancha activa
- **THEN** el panel llama a `PUT /canchas/:id` con `estado: "EN_MANTENIMIENTO"` y la fila pasa a "Inactiva"

#### Scenario: Activar
- **WHEN** el administrador activa una cancha inactiva
- **THEN** el panel llama a `PUT /canchas/:id` con `estado: "DISPONIBLE"` y la fila pasa a "Activa"

### Requirement: Editar stock de equipamiento
"Editar stock" SHALL enviar `PUT /equipamiento/:id` con `stockTotal` entero mayor o igual a 0. Si el backend responde `409` porque el valor es menor a lo alquilado, el panel SHALL mostrar su mensaje y conservar el valor anterior.

#### Scenario: Stock válido
- **WHEN** el administrador cambia el stock de "Pelotas de tenis" a 30
- **THEN** el panel llama a `PUT /equipamiento/:id` y muestra "30 en stock" tras volver a pedir la lista

#### Scenario: Stock por debajo de lo alquilado
- **WHEN** el backend responde `409` al intentar bajar el stock
- **THEN** el panel muestra el mensaje del backend y el stock mostrado no cambia

#### Scenario: Valor inválido
- **WHEN** el administrador ingresa un valor vacío, decimal o negativo
- **THEN** el panel muestra "El stock debe ser un entero mayor o igual a 0." y no envía la petición

### Requirement: Nuevo equipamiento
"+ Nuevo" SHALL crear un equipamiento con `POST /equipamiento` enviando `nombre`, `disciplinaId`, `stockTotal` y `precioUnitario`, y SHALL mostrar los errores `400` junto a cada campo.

#### Scenario: Alta válida
- **WHEN** el administrador completa nombre, disciplina, stock y precio y guarda
- **THEN** el panel llama a `POST /equipamiento` y el ítem aparece en la lista

#### Scenario: Precio inválido
- **WHEN** el backend responde `400` por un precio inválido
- **THEN** el mensaje aparece junto al campo precio

### Requirement: Métricas del Resumen
El Resumen SHALL mostrar "Canchas activas" (canchas con `estado` distinto de `EN_MANTENIMIENTO`, de `GET /canchas`), "Equipamiento con poco stock" (equipamiento con `stockTotal` menor o igual a 5, de `GET /equipamiento`) y "Reservas de hoy" (reservas `CONFIRMADA` con la fecha local de hoy, de `GET /reservas/mis` como administrador).

#### Scenario: Métricas con datos
- **WHEN** el administrador abre el Resumen
- **THEN** cada tarjeta muestra el conteo calculado desde las respuestas del backend

#### Scenario: Reservas de hoy incluye a todos los socios
- **WHEN** existen reservas de hoy de varios socios
- **THEN** "Reservas de hoy" las cuenta todas, no solo las del administrador

### Requirement: Acceso restringido al administrador
Las pantallas del panel SHALL ser accesibles solo con rol `administrador`; un socio que las abra SHALL ser redirigido a la Home. Si una petición de administración recibe `403`, el panel SHALL mostrar un error de permisos sin cambiar los datos mostrados.

#### Scenario: Socio en el panel
- **WHEN** un socio abre `/admin`
- **THEN** es redirigido a la Home

#### Scenario: `403` del backend
- **WHEN** el backend responde `403` a una operación de administración
- **THEN** el panel muestra un mensaje de permisos insuficientes y no modifica la lista mostrada
