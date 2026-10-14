## Purpose

Panel del administrador del club para consultar el resumen del día y gestionar canchas y
stock de equipamiento. Es una pantalla protegida por sesión y por rol, con su propia
estructura (barra lateral) y consume la capa mock hasta que el backend exponga los
endpoints.

## ADDED Requirements

### Requirement: Acceso restringido al administrador
El sistema SHALL permitir el acceso a `/admin` solo a usuarios con sesión y rol
`administrador`. Tras iniciar sesión, el administrador SHALL ser llevado a `/admin` y el
socio a `/`.

#### Scenario: Administrador entra al panel
- **WHEN** un usuario con rol `administrador` navega a `/admin`
- **THEN** el sistema muestra el Panel de administración

#### Scenario: Socio no puede entrar
- **WHEN** un usuario con rol `usuario` navega a `/admin`
- **THEN** el sistema lo redirige a `/` y no muestra el panel

#### Scenario: Sin sesión
- **WHEN** un usuario sin sesión navega a `/admin`
- **THEN** el sistema lo redirige a `/login`

#### Scenario: Login del administrador
- **WHEN** el administrador inicia sesión con `admin@club.com` y `admin123`
- **THEN** el sistema navega a `/admin`

#### Scenario: Login del socio
- **WHEN** un socio inicia sesión
- **THEN** el sistema navega a `/`

### Requirement: Estructura del panel
El sistema SHALL mostrar en `/admin` una barra lateral con el título "Club · Admin" y los
ítems "Resumen", "Canchas", "Turnos y franjas", "Equipamiento" y "Reservas", un encabezado
con el título "Panel de administración" y el nombre del usuario, y el botón "Cerrar sesión"
al pie de la barra. "Turnos y franjas" y "Reservas" SHALL mostrarse deshabilitados.

#### Scenario: Barra lateral y encabezado
- **WHEN** el administrador abre `/admin`
- **THEN** ve la barra lateral con sus cinco ítems, "Resumen" resaltado, el título
  "Panel de administración" y su nombre en el encabezado

#### Scenario: Ítems sin pantalla
- **WHEN** el administrador hace click en "Turnos y franjas" o en "Reservas"
- **THEN** no navega a ninguna pantalla nueva

#### Scenario: Ir a una sección
- **WHEN** el administrador hace click en "Canchas" o en "Equipamiento" de la barra lateral
- **THEN** la página se desplaza a la tarjeta correspondiente

#### Scenario: Cerrar sesión
- **WHEN** el administrador hace click en "Cerrar sesión"
- **THEN** el sistema borra la sesión y navega a `/login`

### Requirement: Indicadores del resumen
El sistema SHALL mostrar tres tarjetas con los indicadores "Reservas de hoy", "Canchas
activas" y "Equipamiento con poco stock". Un ítem de equipamiento SHALL contarse como "con
poco stock" cuando su stock total es 5 o menos.

#### Scenario: Reservas de hoy
- **WHEN** hay 3 reservas confirmadas o pendientes con la fecha de hoy y 1 cancelada
- **THEN** la tarjeta "Reservas de hoy" muestra 3

#### Scenario: Canchas activas
- **WHEN** hay 5 canchas y 1 está inactiva
- **THEN** la tarjeta "Canchas activas" muestra 4

#### Scenario: Equipamiento con poco stock
- **WHEN** hay 2 ítems con stock total de 5 o menos
- **THEN** la tarjeta "Equipamiento con poco stock" muestra 2

#### Scenario: Indicadores al cambiar datos
- **WHEN** el administrador desactiva una cancha o edita un stock
- **THEN** los indicadores se actualizan sin recargar la página

### Requirement: Gestión de canchas
El sistema SHALL mostrar en la tarjeta "Canchas" una tabla con nombre, disciplina, estado y
acciones de cada cancha, y SHALL permitir al administrador crear una cancha, editar su
nombre y disciplina, y activarla o desactivarla. El nombre SHALL ser obligatorio y único sin
distinguir mayúsculas.

#### Scenario: Listado de canchas
- **WHEN** el administrador abre `/admin`
- **THEN** la tabla muestra todas las canchas, activas e inactivas, con la insignia "Activa"
  o "Inactiva" y los botones "Editar", "Franjas" y "Desactivar" o "Activar"

#### Scenario: Desactivar una cancha
- **WHEN** el administrador hace click en "Desactivar" de una cancha activa
- **THEN** la cancha pasa a "Inactiva" y su botón cambia a "Activar"

#### Scenario: Activar una cancha
- **WHEN** el administrador hace click en "Activar" de una cancha inactiva
- **THEN** la cancha pasa a "Activa" y su botón cambia a "Desactivar"

#### Scenario: Crear una cancha
- **WHEN** el administrador hace click en "+ Nueva cancha", completa nombre y disciplina y
  hace click en "Guardar"
- **THEN** la cancha aparece en la tabla como "Activa" y el formulario se cierra

#### Scenario: Editar una cancha
- **WHEN** el administrador hace click en "Editar", cambia el nombre o la disciplina y hace
  click en "Guardar"
- **THEN** la fila muestra los datos actualizados y el formulario se cierra

#### Scenario: Cancelar el formulario
- **WHEN** el administrador hace click en "Cancelar" en el formulario de cancha
- **THEN** el formulario se cierra sin guardar cambios

#### Scenario: Nombre vacío
- **WHEN** el administrador intenta guardar una cancha sin nombre
- **THEN** el formulario muestra un mensaje de error y no guarda

#### Scenario: Nombre duplicado
- **WHEN** el administrador intenta guardar una cancha con el nombre de otra, aunque difiera
  en mayúsculas
- **THEN** el formulario muestra un mensaje de error y no guarda

#### Scenario: Franjas es placeholder
- **WHEN** el administrador hace click en "Franjas"
- **THEN** no navega a ninguna pantalla nueva

#### Scenario: Cambios persisten
- **WHEN** el administrador crea, edita o desactiva una cancha y recarga la página
- **THEN** los cambios siguen reflejados

### Requirement: Gestión de stock de equipamiento
El sistema SHALL mostrar en la tarjeta "Equipamiento" cada ítem con su nombre y su stock, y
SHALL permitir al administrador editar el stock total de un ítem. El stock SHALL ser un
número entero mayor o igual a 0.

#### Scenario: Listado de equipamiento
- **WHEN** el administrador abre `/admin`
- **THEN** la tarjeta muestra cada ítem con su nombre, su stock y el botón "Editar stock"

#### Scenario: Editar stock
- **WHEN** el administrador hace click en "Editar stock", ingresa un valor válido y hace
  click en "Guardar"
- **THEN** la fila muestra el nuevo stock y el campo se cierra

#### Scenario: Cancelar la edición
- **WHEN** el administrador hace click en "Cancelar" mientras edita un stock
- **THEN** la fila vuelve a mostrar el stock anterior

#### Scenario: Stock inválido
- **WHEN** el administrador ingresa un valor negativo, decimal o vacío
- **THEN** el sistema muestra un mensaje de error y no guarda

#### Scenario: El nuevo stock llega al socio
- **WHEN** el administrador fija el stock de un ítem en 3 y un socio abre Confirmar reserva
  de una cancha de esa disciplina
- **THEN** el máximo reservable de ese ítem es 3 si no hay reservas que lo ocupen

#### Scenario: Nuevo es placeholder
- **WHEN** el administrador hace click en "+ Nuevo"
- **THEN** no navega ni abre ningún formulario

### Requirement: Reservas de hoy
El sistema SHALL mostrar en la tarjeta "Reservas de hoy" las reservas confirmadas o
pendientes con la fecha de hoy, ordenadas por hora, con la hora y el nombre de la cancha.

#### Scenario: Hay reservas hoy
- **WHEN** existen reservas de hoy a las 17:00 en Cancha 1 y a las 20:00 en Cancha 3
- **THEN** la tarjeta lista primero "17:00 Cancha 1" y después "20:00 Cancha 3"

#### Scenario: Sin reservas hoy
- **WHEN** no hay reservas confirmadas ni pendientes para hoy
- **THEN** la tarjeta muestra "No hay reservas para hoy"

#### Scenario: Reservas canceladas
- **WHEN** una reserva de hoy está cancelada
- **THEN** no aparece en la tarjeta

### Requirement: Datos del panel desde el mock
El sistema SHALL persistir el catálogo de canchas y de equipamiento en `localStorage`,
inicializándolo con los datos base cuando no existe, y SHALL incluir un usuario
administrador semilla en el mock de autenticación.

#### Scenario: Catálogo inicial
- **WHEN** el navegador no tiene catálogo guardado y se abre cualquier pantalla que lo usa
- **THEN** las canchas y el equipamiento base están disponibles, todas las canchas activas

#### Scenario: Administrador semilla
- **WHEN** no existe ningún usuario registrado en el mock
- **THEN** el login con `admin@club.com` y `admin123` inicia sesión con rol `administrador`

#### Scenario: Registro no crea administradores
- **WHEN** alguien se registra desde el formulario público
- **THEN** su rol es `usuario`
