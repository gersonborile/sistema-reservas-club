## Purpose

Hace que el `400 Bad Request` de validación del backend indique a qué campo corresponde cada error, para que los formularios del frontend lo muestren junto al campo.

## ADDED Requirements

### Requirement: Errores de validación identifican el campo
El sistema SHALL responder `400 Bad Request` ante un body que no cumple las reglas del DTO e incluir, además de `statusCode`, `error` y `message` (arreglo de textos), un arreglo `campos` con un elemento `{ campo, mensaje }` por cada error de validación. `campo` SHALL ser el nombre de la propiedad inválida (con notación de puntos para propiedades anidadas) y `mensaje` el texto del error.

#### Scenario: Un campo inválido
- **WHEN** un cliente hace `POST /auth/login` con un `email` sin formato válido
- **THEN** el sistema responde `400` y `campos` contiene `{ campo: "email", mensaje: "El email no tiene un formato válido." }`

#### Scenario: Varios campos inválidos
- **WHEN** un cliente hace `POST /auth/register` con `nombre` vacío y `contrasena` de menos de 8 caracteres
- **THEN** el sistema responde `400` y `campos` contiene un elemento para `nombre` y otro para `contrasena`

#### Scenario: Propiedad no permitida
- **WHEN** un cliente envía una propiedad que el DTO no declara
- **THEN** el sistema responde `400` y `campos` incluye esa propiedad con su mensaje

#### Scenario: Compatibilidad con `message`
- **WHEN** el sistema responde un `400` de validación
- **THEN** `message` sigue siendo un arreglo de textos con el mismo contenido que antes de este change
