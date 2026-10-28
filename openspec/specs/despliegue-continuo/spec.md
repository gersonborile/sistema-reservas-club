# despliegue-continuo Specification

## Purpose
Garantiza que los cambios integrados en `main` y validados por el CI se publiquen automáticamente en el servidor de producción, de modo que Matchpoint quede disponible por HTTPS bajo `matchpoint.alquilerespunilla.com.ar` sin intervención manual.

## Requirements

### Requirement: Despliegue condicionado al CI

El sistema SHALL ejecutar el despliegue a producción únicamente cuando el CI de la rama `main` haya finalizado con éxito, y MUST NOT desplegar si el CI falló, fue cancelado o corresponde a otra rama.

#### Scenario: CI exitoso en main

- **WHEN** el workflow de CI sobre `main` finaliza con éxito
- **THEN** se inicia automáticamente el despliegue a producción

#### Scenario: CI fallido

- **WHEN** el workflow de CI sobre `main` finaliza con error
- **THEN** no se ejecuta ningún paso de despliegue y la versión en producción permanece sin cambios

#### Scenario: CI de un pull request

- **WHEN** el CI corre sobre un pull request o una rama distinta de `main`
- **THEN** no se ejecuta el despliegue

### Requirement: Actualización de la aplicación en el servidor

El sistema SHALL, en cada despliegue, actualizar el código del servidor a la última versión de `main` y reconstruir y reiniciar los servicios de la aplicación, conservando los datos de la base.

#### Scenario: Despliegue completo

- **WHEN** se ejecuta un despliegue
- **THEN** el servidor queda con el código de `main`, los contenedores de frontend y backend reconstruidos y en ejecución, y los datos existentes de la base de datos intactos

#### Scenario: Fallo durante el despliegue

- **WHEN** un paso del despliegue falla (conexión, construcción o arranque)
- **THEN** el workflow termina con error visible en GitHub Actions

### Requirement: Acceso por HTTPS bajo el subdominio del proyecto

El sistema SHALL servir la aplicación en `https://matchpoint.alquilerespunilla.com.ar` con una conexión HTTPS válida, y SHALL redirigir las solicitudes HTTP a HTTPS.

#### Scenario: Acceso a la aplicación web

- **WHEN** un usuario abre `https://matchpoint.alquilerespunilla.com.ar`
- **THEN** recibe la interfaz web de Matchpoint con una conexión HTTPS válida

#### Scenario: Acceso por HTTP

- **WHEN** un usuario abre `http://matchpoint.alquilerespunilla.com.ar`
- **THEN** es redirigido a la versión HTTPS

#### Scenario: Acceso a la API

- **WHEN** el frontend o un cliente invoca un endpoint de la API bajo la ruta `/api` del mismo dominio
- **THEN** la solicitud llega al backend y responde igual que en el entorno de desarrollo, sin errores de CORS

### Requirement: Exposición mínima de servicios

El sistema SHALL exponer públicamente solo los puertos 80 y 443; la base de datos, el backend y el frontend MUST NOT ser accesibles directamente desde internet.

#### Scenario: Acceso directo a la base de datos

- **WHEN** alguien intenta conectarse al puerto de PostgreSQL de la IP pública del servidor
- **THEN** la conexión no es posible

#### Scenario: Acceso directo al backend

- **WHEN** alguien intenta acceder al puerto interno del backend desde internet
- **THEN** la conexión no es posible; solo se llega a la API a través del dominio

### Requirement: Persistencia y esquema de la base de datos

El sistema SHALL conservar los datos de PostgreSQL entre despliegues y reinicios del servidor, y SHALL aplicar las migraciones de Prisma pendientes al arrancar el backend.

#### Scenario: Reinicio de contenedores

- **WHEN** los contenedores se recrean durante un despliegue o el servidor se reinicia
- **THEN** los datos previamente guardados siguen disponibles

#### Scenario: Nueva migración

- **WHEN** un despliegue incluye una migración de Prisma nueva
- **THEN** la migración se aplica antes de que el backend atienda solicitudes

#### Scenario: Servicios se levantan solos tras reinicio

- **WHEN** la instancia se reinicia
- **THEN** los servicios de la aplicación vuelven a ejecutarse sin intervención manual

### Requirement: Configuración y secretos fuera del repositorio

El sistema SHALL tomar su configuración sensible (credenciales de la base, secreto JWT, dominio) de un archivo `.env` presente solo en el servidor, y el repositorio MUST incluir únicamente una plantilla `.env.production` sin valores secretos.

#### Scenario: Plantilla versionada

- **WHEN** se revisa el repositorio
- **THEN** existe `.env.production` con los nombres de las variables requeridas y sin valores secretos, y ningún `.env` real está versionado

#### Scenario: Falta una variable obligatoria

- **WHEN** el backend arranca sin `JWT_SECRET` o sin `DATABASE_URL`
- **THEN** el arranque falla de forma explícita en lugar de iniciar con valores inseguros por defecto
