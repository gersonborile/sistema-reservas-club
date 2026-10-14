## ADDED Requirements

### Requirement: Solo canchas activas para reservar
El sistema SHALL ofrecer a los socios únicamente las canchas activas: las pantallas Canchas
y Home no deben listar ni sugerir una cancha desactivada. Las reservas ya hechas sobre una
cancha desactivada SHALL seguir apareciendo en Mis reservas y en la Home.

#### Scenario: Cancha desactivada fuera de Canchas
- **WHEN** el administrador desactiva una cancha y un socio abre `/canchas`
- **THEN** la lista no incluye esa cancha

#### Scenario: Cancha desactivada fuera de Disponibles ahora
- **WHEN** el administrador desactiva una cancha con franjas libres hoy
- **THEN** la sección "Disponibles ahora" de la Home no la sugiere

#### Scenario: Cancha reactivada
- **WHEN** el administrador vuelve a activar la cancha
- **THEN** la cancha vuelve a aparecer en `/canchas`

#### Scenario: Reservas previas se conservan
- **WHEN** un socio tiene una reserva sobre una cancha que luego se desactiva
- **THEN** la reserva sigue visible en Mis reservas con el nombre de esa cancha
