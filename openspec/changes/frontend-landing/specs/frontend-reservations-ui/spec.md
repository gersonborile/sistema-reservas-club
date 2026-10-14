## MODIFIED Requirements

### Requirement: Rutas protegidas por sesión
El sistema SHALL redirigir a `/login` a todo usuario sin sesión activa que intente acceder
a `/canchas` o `/canchas/[id]/reservar`. La ruta `/` SHALL mostrar la landing pública a quien
no tiene sesión y la Home a quien sí la tiene. La sesión SHALL leerse del almacenamiento del
cliente (`localStorage`).

#### Scenario: Acceso a la Home sin sesión
- **WHEN** un usuario sin sesión navega a `/`
- **THEN** el sistema muestra la landing pública y no lo redirige

#### Scenario: Acceso a la Home con sesión
- **WHEN** un usuario con sesión navega a `/`
- **THEN** el sistema muestra la Home con la navbar

#### Scenario: Acceso a canchas sin sesión
- **WHEN** un usuario sin sesión navega a `/canchas`
- **THEN** el sistema lo redirige a `/login`

#### Scenario: Acceso a la confirmación sin sesión
- **WHEN** un usuario sin sesión navega a `/canchas/[id]/reservar`
- **THEN** el sistema lo redirige a `/login`

#### Scenario: Acceso con sesión
- **WHEN** un usuario con sesión activa navega a una ruta protegida
- **THEN** el sistema muestra la pantalla solicitada con la navbar
