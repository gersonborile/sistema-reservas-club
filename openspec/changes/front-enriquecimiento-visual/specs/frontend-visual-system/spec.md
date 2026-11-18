# Spec Delta

## Purpose

Define el sistema visual compartido que da identidad, imagen, accesibilidad y estados consistentes a todas las pantallas del frontend sin introducir datos simulados.

## ADDED Requirements

### Requirement: Imágenes locales por disciplina

El frontend SHALL resolver la imagen de una disciplina desde archivos locales incluidos en la aplicación, normalizando mayúsculas, espacios y tildes, y SHALL usar una imagen por defecto cuando no encuentre una coincidencia. SHALL NOT depender de imágenes provistas por el backend, descargarlas en tiempo de ejecución ni enlazarlas desde dominios externos.

#### Scenario: Disciplina con imagen propia
- **WHEN** una disciplina se llama `Fútbol`, `futbol` o ` FÚTBOL `
- **THEN** la interfaz muestra la imagen local de fútbol

#### Scenario: Disciplina sin imagen propia
- **WHEN** una disciplina no tiene una imagen específica
- **THEN** la interfaz intenta la imagen por defecto

#### Scenario: Archivo de imagen faltante
- **WHEN** la imagen resuelta no existe o falla al cargar
- **THEN** la interfaz muestra un placeholder propio con gradiente e ícono SVG, sin dejar un ícono roto

### Requirement: Imágenes accesibles y responsive

Toda imagen de contenido SHALL tener un texto alternativo descriptivo, SHALL adaptarse al contenedor sin deformarse y SHALL usar tamaños de carga adecuados al ancho visible. La imagen principal del hero SHALL cargarse con prioridad y el resto SHALL cargarse de forma diferida.

#### Scenario: Tarjeta en móvil y escritorio
- **WHEN** una tarjeta con imagen se muestra entre 320 px y 1440 px de ancho
- **THEN** la imagen cubre su espacio sin deformarse y mantiene su texto alternativo

#### Scenario: Hero
- **WHEN** se carga la Home pública
- **THEN** la imagen del hero es la única imagen de la pantalla marcada como prioritaria

### Requirement: Accesibilidad visual y movimiento

La interfaz SHALL mantener foco visible, contraste AA en texto y controles, navegación por teclado y áreas táctiles utilizables. Las transiciones SHALL ser sutiles y SHALL desactivarse cuando el usuario prefiere movimiento reducido.

#### Scenario: Navegación por teclado
- **WHEN** el usuario recorre la pantalla con `Tab`
- **THEN** cada enlace, botón y control muestra un foco visible

#### Scenario: Movimiento reducido
- **WHEN** el sistema operativo informa `prefers-reduced-motion: reduce`
- **THEN** la interfaz evita animaciones y desplazamientos suaves no esenciales

### Requirement: Estados globales consistentes

Las pantallas conectadas SHALL mostrar skeletons durante la carga, estados vacíos con ilustración y una acción útil cuando no hay contenido, y errores con un mensaje claro y opción de reintentar. Las confirmaciones y avisos SHALL presentarse con un patrón de toast consistente y anunciarse a tecnologías de asistencia.

#### Scenario: Carga de listado
- **WHEN** una pantalla espera datos del backend
- **THEN** muestra un skeleton con la forma del contenido esperado

#### Scenario: Listado vacío
- **WHEN** el backend devuelve una lista vacía
- **THEN** muestra una ilustración, una explicación y una acción para cambiar la búsqueda o reintentar

#### Scenario: Error de red
- **WHEN** falla una petición al backend
- **THEN** muestra un mensaje claro y un botón para reintentar

#### Scenario: Aviso de resultado
- **WHEN** una acción termina con éxito o error
- **THEN** aparece un toast anunciado con `aria-live` y se puede cerrar

### Requirement: Navegación y contenido veraz

El header y el footer SHALL enlazar solo a rutas o secciones existentes y SHALL NOT mostrar dirección, teléfono, correo, redes sociales, calificaciones ni precios de cancha que no provengan del backend o de la configuración del club.

#### Scenario: Enlaces del footer
- **WHEN** el usuario recorre los enlaces del footer
- **THEN** cada enlace lleva a una ruta o sección existente

#### Scenario: Datos no disponibles
- **WHEN** el backend no provee un dato de contacto o una calificación
- **THEN** la interfaz omite ese dato en lugar de inventarlo
