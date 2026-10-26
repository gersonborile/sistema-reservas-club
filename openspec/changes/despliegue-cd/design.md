## Context

Ver `proposal.md` — Why. El monorepo tiene `backend/` (NestJS 12 + Prisma 7, ESM, escucha en `PORT`, por defecto 3001, sin prefijo global; CORS por `CORS_ORIGIN`) y `frontend/` (Next.js, URL de la API por `NEXT_PUBLIC_API_URL`). El servidor es una EC2 t3.micro con Ubuntu, ~900 MB de RAM y 2 GB de swap, con Docker y Compose instalados, IP elástica `3.142.110.19` y los puertos 80/443 abiertos. El dominio `matchpoint.alquilerespunilla.com.ar` resuelve hoy a IPs de Cloudflare (proxy activo) en la cuenta de la docente. La guía de la cátedra fija el esquema: Compose con Caddy, CD por SSH condicionado al CI, proyecto en `/opt/<nombre>`.

## Goals / Non-Goals

**Goals:**
- Un único `docker compose up -d --build` levanta toda la pila en el servidor.
- Un solo origen (el dominio) para frontend y API, evitando CORS.
- Despliegue automático sin intervención tras un CI verde en `main`.

**Non-Goals:**
- Registro de imágenes (GHCR), staging, despliegues sin caída, backups, monitoreo, rollback automático.

## Decisions

- **Cuatro servicios en un Compose**: `caddy` (único con puertos publicados, 80 y 443), `frontend` (Next), `backend` (Nest) y `db` (`postgres:16`, igual que el CI). Los tres últimos solo se ven en la red interna de Compose. Alternativa descartada: Nginx + Certbot en el host, por más pasos manuales y porque la guía propone Caddy.
- **Enrutamiento por ruta en un solo dominio**: Caddy envía `/api/*` al backend quitando el prefijo (`handle_path`) y todo lo demás al frontend. El backend no tiene prefijo global, así que no se modifica. El frontend se construye con `NEXT_PUBLIC_API_URL=https://matchpoint.alquilerespunilla.com.ar/api`. Alternativa: subdominio separado para la API — descartada porque exige otro registro DNS y CORS.
- **HTTPS lo resuelve Caddy** (Let's Encrypt automático), como indica la docente. Como Cloudflare está delante, queda un punto a validar en el primer despliegue (ver Riesgos).
- **Construir las imágenes en el servidor** con `docker compose up -d --build`, siguiendo la guía. Alternativa: construir en Actions y publicar en GHCR; más robusta para RAM chica, pero agrega credenciales de registro y no está pedida.
- **Dockerfiles multi-etapa**: backend con etapas de dependencias, build (`prisma generate` + `nest build`) y ejecución solo con lo necesario; frontend con `output: 'standalone'` de Next para reducir la imagen y el consumo de RAM. Imagen base `node:20-alpine`, la misma versión de Node que usa el CI.
- **Migraciones al arrancar**: el contenedor del backend ejecuta `prisma migrate deploy` y luego `node dist/main`. El seed no corre automáticamente; se ejecuta a mano la primera vez. `db` tiene `healthcheck` (`pg_isready`) y `backend` espera a que esté sano (`depends_on: condition: service_healthy`).
- **Persistencia**: volumen con nombre para `/var/lib/postgresql/data`; volúmenes de Caddy para conservar certificados entre reinicios. `restart: unless-stopped` en todos los servicios para que vuelvan solos tras reiniciar la instancia.
- **Variables**: `.env.production` versionado como plantilla (nombres sin secretos); en el servidor se copia a `.env`. Variables: `DOMINIO`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL`. `.env` se agrega al `.gitignore`.
- **Workflow `cd.yml`**: dispara con `workflow_run` del workflow `CI`, `types: [completed]`, `branches: [main]`, y el job corre solo si `conclusion == 'success'` y el evento original fue un `push`. Se conecta con `appleboy/ssh-action` usando los 4 secrets existentes y ejecuta en `/opt/matchpoint`: `git fetch` + `git reset --hard origin/main`, `docker compose up -d --build` y `docker image prune -f`. `SERVER_HOST` debe ser la IP, no el dominio: el proxy de Cloudflare no deja pasar SSH. Con `concurrency` se evita que dos despliegues corran a la vez.

## Risks / Trade-offs

- [Cloudflare con proxy en modo "Flexible" provoca un bucle de redirecciones con Caddy] → Probar en el primer despliegue; si ocurre, configurar Caddy para servir HTTP simple en el puerto 80 para ese dominio (Cloudflare termina el HTTPS hacia el usuario). No requiere cambios del lado de la docente.
- [El proxy de Cloudflare puede interferir con la emisión del certificado de Caddy] → Si falla el desafío HTTP, usar `tls internal` con Cloudflare en modo Full, o pedir "solo DNS" en el registro.
- [La compilación de Next/Nest en 1 GB de RAM puede agotar memoria] → 2 GB de swap ya activos; construir un servicio por vez si hace falta; opción de respaldo: construir en Actions y publicar en GHCR.
- [Los PRs de backend (#30–#32) no están en `main`, por lo que el despliegue inicial no incluiría reservas ni pagos] → La implementación usa lo que haya en `main`; cada merge posterior se despliega solo.
- [Una migración defectuosa puede dejar el backend caído] → El workflow falla visiblemente y se corrige con un nuevo commit; no hay rollback automático (no objetivo).
- [`git reset --hard` en el servidor descarta cambios locales] → Aceptable: el servidor no se edita a mano; el `.env` está ignorado por git y no se toca.

## Migration Plan

1. Mergear este cambio a `main` con los archivos de Docker y el workflow.
2. En el servidor: clonar el repo en `/opt/matchpoint` (con el punto final), copiar `.env.production` a `.env` y completar valores reales.
3. Primer arranque manual con `docker compose up -d --build` para validar HTTPS y la conexión a la base; correr el seed una vez.
4. A partir de ahí, cada push a `main` con CI verde despliega solo.
- Rollback: `git revert` del commit problemático en `main`, que redespliega la versión anterior.

## Open Questions

- Ninguna que cambie el alcance: el modo SSL de Cloudflare se resuelve probando en el primer despliegue, con las alternativas ya previstas arriba.
