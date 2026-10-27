# Sistema de Reserva de Canchas

Proyecto para Ingeniería de Software II — sistema de reservas de un club deportivo (canchas de tenis, fútbol y pádel), con especificación API-first mediante OpenSpec y CI/CD con GitHub Actions.

## Integrantes
- Gerson Borile
- Valentin Justel

## Stack
- Frontend: Next.js (React + TypeScript)
- Backend: NestJS (Node.js + TypeScript)
- Base de datos: PostgreSQL
- ORM: Prisma
- Especificación: OpenSpec
- CI/CD: GitHub Actions
## Despliegue

Producción: https://matchpoint.alquilerespunilla.com.ar (EC2 de AWS, Ubuntu, Docker Compose).

```text
caddy     :80/:443   HTTPS automático; /api/* → backend (sin el prefijo /api), resto → frontend
backend   NestJS     aplica las migraciones de Prisma al arrancar
frontend  Next.js    build standalone
db        PostgreSQL 16, datos en el volumen db-data
```

Solo Caddy publica puertos; la base, el backend y el frontend quedan en la red interna de Compose.

### Despliegue continuo

Cada push a `main` con el CI en verde dispara `.github/workflows/cd.yml`, que entra por SSH a la EC2 y ejecuta `git reset --hard origin/main` y `docker compose up -d --build` en `/opt/matchpoint`. Usa los secrets `SERVER_HOST` (la IP, no el dominio), `SERVER_USER`, `SERVER_PORT` y `SSH_PRIVATE_KEY`.

### Puesta en marcha del servidor (solo la primera vez)

```bash
sudo mkdir -p /opt/matchpoint && sudo chown $USER /opt/matchpoint
cd /opt/matchpoint
git clone https://github.com/gersonborile/sistema-reservas-club.git .   # el punto final es parte del comando
cp .env.production .env                                                 # completar los valores reales
docker compose up -d --build
docker compose exec backend npx prisma db seed                          # cargar disciplinas, una sola vez
```

Variables de `.env` (plantilla en `.env.production`): `DOMINIO`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL` (debe coincidir con las tres anteriores), `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL`. El `.env` real nunca se versiona.
