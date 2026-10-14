## MODIFIED Requirements

### Requirement: Navbar compartida
El sistema SHALL mostrar en todas las pantallas protegidas una navbar con el logo "CD" y
"Club Deportivo" a la izquierda, los links "Inicio", "Canchas" y "Mis reservas" centrados
(el de la ruta actual subrayado) y un avatar circular con la inicial del usuario a la
derecha. "Mis reservas" SHALL navegar a `/reservas`. El avatar SHALL abrir un menú con la
opción "Cerrar sesión".

#### Scenario: Elementos de la navbar
- **WHEN** un usuario con sesión ve cualquier pantalla protegida
- **THEN** la navbar muestra "CD" y "Club Deportivo", los links "Inicio", "Canchas" y "Mis
  reservas", y un avatar circular con la inicial del usuario

#### Scenario: Link activo subrayado
- **WHEN** el usuario está en `/canchas`
- **THEN** el link "Canchas" se muestra subrayado

#### Scenario: Mis reservas navega a su pantalla
- **WHEN** el usuario hace click en "Mis reservas"
- **THEN** el sistema navega a `/reservas` y el link se muestra subrayado

#### Scenario: Cerrar sesión desde el avatar
- **WHEN** el usuario abre el menú del avatar y elige "Cerrar sesión"
- **THEN** el sistema elimina la sesión y redirige a `/login`
