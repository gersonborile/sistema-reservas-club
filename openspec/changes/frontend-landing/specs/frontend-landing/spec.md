## Purpose

Página pública de presentación del club en `/`, para quien no tiene sesión. Explica qué
disciplinas ofrece y cómo se reserva, y lleva a iniciar sesión o a registrarse. No requiere
sesión ni backend.

## ADDED Requirements

### Requirement: Landing pública en la raíz
El sistema SHALL mostrar la landing en `/` a todo usuario sin sesión válida, sin
redirigirlo, y SHALL mostrar la Home a todo usuario con sesión válida. La landing SHALL
incluir una barra superior, la portada, "Nuestras disciplinas", "Cómo funciona", un llamado a
crear cuenta y un pie de página.

#### Scenario: Visitante sin sesión
- **WHEN** un usuario sin sesión navega a `/`
- **THEN** la pantalla muestra la landing con todas sus secciones

#### Scenario: Socio con sesión
- **WHEN** un usuario con sesión navega a `/`
- **THEN** la pantalla muestra la Home con la navbar y no la landing

#### Scenario: Sesión ilegible
- **WHEN** el almacenamiento contiene un token que no se puede leer y el usuario navega a `/`
- **THEN** la pantalla muestra la landing

#### Scenario: Cerrar sesión desde la Home
- **WHEN** un usuario con sesión cierra sesión y vuelve a `/`
- **THEN** la pantalla muestra la landing

### Requirement: Barra superior de la landing
El sistema SHALL mostrar en la landing una barra superior con el logo y "Club Deportivo", los
links "Disciplinas", "Cómo funciona", "Horarios" y "Contacto", y los botones "Iniciar sesión"
y "Registrate".

#### Scenario: Elementos de la barra
- **WHEN** un visitante abre `/`
- **THEN** la barra muestra el logo con "Club Deportivo", los cuatro links y los dos botones

#### Scenario: Ir a una sección
- **WHEN** el visitante hace click en "Disciplinas", "Cómo funciona", "Horarios" o "Contacto"
- **THEN** la página se desplaza a la sección correspondiente

#### Scenario: Iniciar sesión
- **WHEN** el visitante hace click en "Iniciar sesión"
- **THEN** el sistema navega a `/login`

#### Scenario: Registrarse
- **WHEN** el visitante hace click en "Registrate"
- **THEN** el sistema navega a `/registro`

### Requirement: Portada
El sistema SHALL mostrar en la portada el texto "TENIS · FÚTBOL · PÁDEL", el título "Reservá
tu cancha en pocos pasos", un párrafo descriptivo, los botones "Reservá tu cancha" y "Ver
disponibilidad", y una imagen placeholder.

#### Scenario: Contenido de la portada
- **WHEN** un visitante abre `/`
- **THEN** la portada muestra el texto de disciplinas, el título, el párrafo, los dos botones
  y la imagen placeholder

#### Scenario: Reservá tu cancha
- **WHEN** el visitante hace click en "Reservá tu cancha"
- **THEN** el sistema navega a `/registro`

#### Scenario: Ver disponibilidad
- **WHEN** el visitante hace click en "Ver disponibilidad"
- **THEN** el sistema navega a `/login`

### Requirement: Nuestras disciplinas
El sistema SHALL mostrar la sección "Nuestras disciplinas" con una tarjeta por cada
disciplina del club (Tenis, Fútbol 5 y Pádel), cada una con imagen placeholder, nombre, una
línea de descripción y el link "Ver canchas".

#### Scenario: Tarjetas de disciplinas
- **WHEN** un visitante abre `/`
- **THEN** la sección muestra tres tarjetas, Tenis, Fútbol 5 y Pádel, cada una con su link
  "Ver canchas"

#### Scenario: Ver canchas de una disciplina
- **WHEN** el visitante hace click en "Ver canchas" de la tarjeta de Pádel
- **THEN** el sistema navega a `/canchas?disciplina=Pádel`, que sin sesión redirige a
  `/login`

### Requirement: Cómo funciona
El sistema SHALL mostrar la sección "Cómo funciona" con tres pasos numerados: "Elegí cancha
y turno", "Sumá equipamiento si lo necesitás" y "Confirmá tu reserva", cada uno con una
descripción breve.

#### Scenario: Tres pasos
- **WHEN** un visitante abre `/`
- **THEN** la sección muestra los pasos 1, 2 y 3 con su título y su descripción, en ese orden

### Requirement: Llamado a crear cuenta
El sistema SHALL mostrar, después de "Cómo funciona", el título "Creá tu cuenta y reservá tu
primer turno" y un botón "Crear cuenta".

#### Scenario: Crear cuenta
- **WHEN** el visitante hace click en "Crear cuenta"
- **THEN** el sistema navega a `/registro`

### Requirement: Pie de página
El sistema SHALL mostrar un pie con el logo y "Club Deportivo" con una breve descripción, la
columna "Horarios" con "Todos los días, de 16:00 a 22:00", y las columnas "Contacto" y
"Seguinos" con el texto "Próximamente".

#### Scenario: Contenido del pie
- **WHEN** un visitante llega al final de `/`
- **THEN** el pie muestra las cuatro columnas con el horario y los textos indicados

### Requirement: Diseño adaptable
El sistema SHALL adaptar la landing a pantallas angostas: las columnas se apilan, los links de
sección de la barra pueden ocultarse y los botones "Iniciar sesión" y "Registrate" siguen
visibles.

#### Scenario: Pantalla angosta
- **WHEN** un visitante abre `/` en una pantalla de 375 px de ancho
- **THEN** no hay desplazamiento horizontal, las secciones se apilan y los dos botones de la
  barra siguen visibles
