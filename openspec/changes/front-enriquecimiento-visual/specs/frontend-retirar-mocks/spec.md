# Spec Delta

## ADDED Requirements

### Requirement: Contenido visual sin datos inventados

El frontend SHALL usar solo imágenes locales incluidas en la aplicación y SHALL NOT descargar imágenes ni enlazarlas desde dominios externos. La interfaz SHALL NOT inventar calificaciones, datos de contacto, precios de cancha, disponibilidad ni descripciones de disciplinas que el backend no provea.

#### Scenario: Imagen de disciplina
- **WHEN** la interfaz necesita una imagen para una disciplina
- **THEN** usa un archivo local o el placeholder propio, sin hotlinking

#### Scenario: Dato ausente
- **WHEN** el backend no devuelve un dato de contacto, calificación o precio
- **THEN** la interfaz omite ese dato y no muestra un valor de relleno
