## Why

Hoy el proyecto solo tiene integración continua (`ci.yml`): no existe ningún mecanismo para publicar la aplicación en un servidor, por lo que Matchpoint no es accesible para nadie fuera del entorno de desarrollo. La consigna de la materia exige despliegue continuo, y ya están listos los prerrequisitos de infraestructura (instancia EC2 con IP elástica, Docker, swap, claves SSH de deploy, secrets en GitHub y el subdominio `matchpoint.alquilerespunilla.com.ar`).

## What Changes

- Dockerfiles para el backend (NestJS + Prisma) y el frontend (Next.js) del monorepo.
- `docker-compose.yml` en la raíz con cuatro servicios: `caddy`, `frontend`, `backend` y `db` (PostgreSQL), con datos de la base en un volumen persistente.
- `Caddyfile` que sirve el dominio `matchpoint.alquilerespunilla.com.ar` con HTTPS automático y enruta el tráfico al frontend y al backend.
- `.env.production` como plantilla versionada de variables de entorno (sin valores secretos); el `.env` real vive solo en el servidor.
- Workflow `.github/workflows/cd.yml` que se ejecuta solo cuando el CI de `main` terminó con éxito, se conecta por SSH a la EC2 y actualiza la aplicación.
- Aplicación automática de migraciones de Prisma al arrancar el backend en producción.
- Documentación breve del procedimiento de puesta en marcha del servidor (clonado en `/opt/matchpoint`, creación del `.env`).

## Capabilities

### New Capabilities
- `despliegue-continuo`: publicación automática de la aplicación (frontend, backend y base de datos) en el servidor de producción tras un CI exitoso en `main`, accesible por HTTPS bajo el subdominio del proyecto.

### Modified Capabilities
- Ninguna (no cambia el comportamiento funcional de las capabilities existentes).

## Impact

- **Repositorio**: nuevos archivos en la raíz (`docker-compose.yml`, `Caddyfile`, `.env.production`), `backend/Dockerfile`, `frontend/Dockerfile`, `.dockerignore` y `.github/workflows/cd.yml`.
- **Código existente**: mínimo; el frontend lee la URL de la API de `NEXT_PUBLIC_API_URL` (ya soportado) y el backend ya lee `PORT`, `DATABASE_URL`, `JWT_SECRET` y `CORS_ORIGIN` del entorno.
- **Infraestructura**: la EC2 `SistemaReserva` (Ubuntu, 1 GB de RAM + 2 GB de swap) pasa a correr los cuatro contenedores; puertos 80 y 443 ya abiertos en el security group.
- **GitHub**: usa los secrets existentes `SERVER_HOST`, `SERVER_USER`, `SERVER_PORT` y `SSH_PRIVATE_KEY`.
- **Fuera de alcance**: publicación en un registro de imágenes (GHCR), entornos de staging, backups de la base, monitoreo, y Playwright en CI.
