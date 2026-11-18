# Spec Delta

## Purpose

Define el contenido y la jerarquía visual de la Home pública y autenticada usando exclusivamente datos reales del backend y la configuración horaria del club.

## ADDED Requirements

### Requirement: Home pública con contenido real

La Home pública SHALL presentar un hero con imagen local, un CTA hacia la disponibilidad y un CTA hacia la explicación del proceso. Las disciplinas SHALL salir de `GET /disciplinas`, las canchas de `GET /canchas` y el equipamiento de `GET /equipamiento`. La sección de canchas SHALL mostrar entre 3 y 4 canchas en estado `DISPONIBLE`. El equipamiento SHALL mostrar nombre, stock disponible y precio unitario reales. Los horarios SHALL usar la única constante del club.

#### Scenario: Disciplinas reales
- **WHEN** la Home pública recibe disciplinas del backend
- **THEN** muestra cada disciplina con su imagen local, su duración típica cuando existe y una línea de sus reglas cuando existen

#### Scenario: Canchas reales
- **WHEN** la Home pública recibe canchas del backend
- **THEN** muestra hasta 4 canchas `DISPONIBLE` con nombre, ubicación, capacidad y disciplinas

#### Scenario: Equipamiento real
- **WHEN** la Home pública recibe equipamiento disponible
- **THEN** muestra su nombre, stock disponible y precio unitario sin inventar valores

#### Scenario: Horario del club
- **WHEN** la Home muestra los horarios
- **THEN** usa la constante compartida de apertura y cierre, sin duplicar valores

### Requirement: Contenido informativo de la Home pública

La Home SHALL explicar el proceso de reserva en pasos, responder preguntas frecuentes con información genérica y veraz, y cerrar con un CTA de registro. SHALL NOT mostrar datos de contacto, ubicación exacta, calificaciones ni precios de cancha que no provengan de una fuente real.

#### Scenario: Preguntas frecuentes
- **WHEN** el usuario lee la sección de preguntas frecuentes
- **THEN** encuentra respuestas sobre reserva, equipamiento, cancelación, cuenta y horario del club

#### Scenario: Sin datos inventados
- **WHEN** el backend no provee contacto o calificaciones
- **THEN** la Home omite esos datos

### Requirement: Home autenticada enriquecida

La Home autenticada SHALL destacar la próxima reserva confirmada con la imagen de su disciplina, fecha legible y acceso a Mis reservas. Los accesos rápidos SHALL mostrar imagen de disciplina y el conteo real de turnos libres. La sección de canchas SHALL mostrar canchas con turnos libres hoy y el próximo turno real.

#### Scenario: Próxima reserva
- **WHEN** el socio tiene una reserva confirmada futura
- **THEN** la Home la destaca con imagen, fecha legible y enlace a Mis reservas

#### Scenario: Turnos libres por disciplina
- **WHEN** la Home autenticada recibe los turnos de hoy
- **THEN** cada acceso rápido muestra el conteo real de turnos libres de esa disciplina

#### Scenario: Canchas con turnos libres hoy
- **WHEN** existen canchas con turnos libres hoy
- **THEN** la Home muestra hasta 3 con imagen y el próximo turno libre

### Requirement: Carga y vacíos de la Home

La Home SHALL mostrar skeletons mientras carga y SHALL conservar el hero y los CTAs si falla una sección dinámica, mostrando el error y la opción de reintentar en esa sección.

#### Scenario: Falla el backend
- **WHEN** falla la carga de disciplinas, canchas o equipamiento
- **THEN** la Home mantiene el hero y muestra un error con reintento en la sección afectada

#### Scenario: Sección vacía
- **WHEN** una sección no tiene datos
- **THEN** la Home muestra un estado vacío con una acción útil y sin datos de relleno
