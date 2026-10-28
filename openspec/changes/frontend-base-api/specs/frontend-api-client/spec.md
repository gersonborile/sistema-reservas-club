## Purpose

Define cómo el frontend se comunica con el backend real: URL por entorno, token de sesión, errores tipados, traducción de roles y la sesión (registro, login, perfil) contra `/auth/*`.

## ADDED Requirements

### Requirement: URL base por entorno
El frontend SHALL tomar el origen del backend de `NEXT_PUBLIC_API_URL`, sin sufijo de versión. En desarrollo, si la variable no está definida, SHALL usar `http://localhost:3001`. En producción SHALL usar el valor configurado (`https://matchpoint.alquilerespunilla.com.ar/api`).

#### Scenario: Desarrollo sin variable
- **WHEN** el frontend corre en desarrollo sin `NEXT_PUBLIC_API_URL`
- **THEN** las peticiones van a `http://localhost:3001` (por ejemplo `POST http://localhost:3001/auth/login`)

#### Scenario: Producción
- **WHEN** el frontend se construye con `NEXT_PUBLIC_API_URL=https://matchpoint.alquilerespunilla.com.ar/api`
- **THEN** las peticiones van a ese origen (por ejemplo `POST https://matchpoint.alquilerespunilla.com.ar/api/auth/login`)

### Requirement: Peticiones autenticadas
El cliente HTTP SHALL enviar `Authorization: Bearer <token>` en toda petición cuando haya un token guardado, y SHALL enviar y recibir JSON.

#### Scenario: Con sesión
- **WHEN** hay un token guardado y el frontend llama a `GET /auth/perfil`
- **THEN** la petición incluye la cabecera `Authorization: Bearer <token>`

#### Scenario: Sin sesión
- **WHEN** no hay token guardado y el frontend llama a un endpoint público
- **THEN** la petición no incluye cabecera `Authorization`

### Requirement: Errores tipados
El cliente HTTP SHALL lanzar un `ApiError` con `status`, `mensaje` y `campos` ante una respuesta no exitosa. `campos` SHALL tomarse del cuerpo del backend (`campos`) y ser un arreglo vacío si no viene. Ante un fallo de red SHALL lanzar un `ApiError` con `status` 0 y el mensaje "No se pudo conectar con el servidor.".

#### Scenario: Validación
- **WHEN** el backend responde `400` con `campos`
- **THEN** el `ApiError` tiene `status` 400 y los mismos `campos`

#### Scenario: Error sin campos
- **WHEN** el backend responde `409` con `message` "El email ya está en uso."
- **THEN** el `ApiError` tiene `status` 409, ese `mensaje` y `campos` vacío

#### Scenario: Sin conexión
- **WHEN** el backend no es alcanzable
- **THEN** el `ApiError` tiene `status` 0 y el mensaje "No se pudo conectar con el servidor."

### Requirement: Registro real
El frontend SHALL registrar usuarios con `POST /auth/register` enviando `nombre`, `contacto`, `email` y `contrasena`, y SHALL mostrar los errores `400` junto a cada campo y el `409` de email duplicado en el campo `email`.

#### Scenario: Registro exitoso
- **WHEN** el usuario completa el formulario con datos válidos
- **THEN** el frontend llama a `POST /auth/register`, recibe `201` y lo lleva a `/login`

#### Scenario: Email ya usado
- **WHEN** el backend responde `409` al registrar
- **THEN** el formulario muestra el mensaje junto al campo `email`

#### Scenario: Datos inválidos
- **WHEN** el backend responde `400` con `campos`
- **THEN** cada mensaje aparece junto a su campo

### Requirement: Login real
El frontend SHALL iniciar sesión con `POST /auth/login`, guardar el `token` y el usuario recibidos, y llevar al usuario a su pantalla según el rol. Ante credenciales inválidas (`401`) SHALL mostrar un mensaje genérico sin revelar qué dato falló y SHALL NOT cerrar ninguna sesión previa ni redirigir.

#### Scenario: Login de socio
- **WHEN** un `USUARIO` inicia sesión con credenciales válidas
- **THEN** el frontend guarda el token, el usuario con `rol: "usuario"` y navega a la Home

#### Scenario: Login de administrador
- **WHEN** un `ADMINISTRADOR` inicia sesión con credenciales válidas
- **THEN** el frontend guarda el token, el usuario con `rol: "administrador"` y navega al panel admin

#### Scenario: Credenciales inválidas
- **WHEN** el backend responde `401` a `POST /auth/login`
- **THEN** el formulario muestra "Credenciales inválidas." y permanece en `/login`

### Requirement: Traducción de roles y nombre de usuario
El frontend SHALL traducir el rol del backend (`USUARIO` / `ADMINISTRADOR`) a `usuario` / `administrador` en un único punto y SHALL obtener el nombre del usuario de la respuesta de login o de `GET /auth/perfil`, no del token. La lectura del token SHALL exigir `userId`, `email` y `rol`, y SHALL NOT exigir `nombre`.

#### Scenario: Token real
- **WHEN** el frontend lee un token emitido por el backend con claims `userId`, `email` y `rol`
- **THEN** la lectura es válida y devuelve esos datos con el rol traducido

#### Scenario: Token ilegible
- **WHEN** el token guardado no tiene tres segmentos, no es JSON válido o no trae un `rol` conocido
- **THEN** el frontend lo trata como sesión inexistente y redirige a `/login`

### Requirement: Sesión vencida
Ante una respuesta `401` en una petición enviada con token, el frontend SHALL borrar el token y el usuario guardados y llevar al usuario a `/login`.

#### Scenario: Token vencido
- **WHEN** el backend responde `401` a una petición autenticada
- **THEN** el frontend borra la sesión guardada y navega a `/login`

### Requirement: Sin datos simulados de autenticación
El frontend SHALL NOT conservar usuarios, administrador semilla ni tokens simulados en `localStorage`; la autenticación SHALL depender solo del backend.

#### Scenario: Administrador semilla eliminado
- **WHEN** alguien intenta iniciar sesión con `admin@club.com` / `admin123` y esa cuenta no existe en el backend
- **THEN** el backend responde `401` y el frontend muestra "Credenciales inválidas."
