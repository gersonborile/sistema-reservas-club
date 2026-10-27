## 1. Contenedores de la aplicación

- [x] 1.1 Crear `backend/Dockerfile` multi-etapa (instala dependencias, `prisma generate`, `nest build`, ejecuta `prisma migrate deploy` y `node dist/main`) y `backend/.dockerignore`; verificar con `docker build ./backend` que la imagen se construye y que arranca contra una base local
- [x] 1.2 Habilitar `output: 'standalone'` en `frontend/next.config.ts`, crear `frontend/Dockerfile` multi-etapa con `NEXT_PUBLIC_API_URL` como argumento de build y `frontend/.dockerignore`; verificar con `docker build ./frontend` y que el contenedor sirve la página de inicio

## 2. Orquestación y proxy

- [x] 2.1 Crear `docker-compose.yml` en la raíz con los servicios `db` (postgres:16 con healthcheck y volumen persistente), `backend` (espera a `db` sano), `frontend` y `caddy` (únicos puertos publicados 80 y 443), todos con `restart: unless-stopped`; verificar con `docker compose config` sin errores y con `docker compose up` local que los cuatro servicios quedan en ejecución
- [x] 2.2 Crear el `Caddyfile` para `{$DOMINIO}`: `/api/*` hacia el backend sin el prefijo (`handle_path`) y el resto hacia el frontend; verificar localmente que `/api/` responde desde el backend y `/` desde el frontend
- [x] 2.3 Crear `.env.production` con los nombres de variables (`DOMINIO`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL`) sin valores secretos, y agregar `.env` al `.gitignore`; verificar con `git status` que un `.env` de prueba no queda versionado
- [x] 2.4 Verificar que el backend falla al arrancar sin `JWT_SECRET` o `DATABASE_URL` (levantar el contenedor sin esas variables y comprobar el error explícito)

## 3. Workflow de despliegue continuo

- [x] 3.1 Crear `.github/workflows/cd.yml` con trigger `workflow_run` del workflow `CI` (`completed`, rama `main`), condición `conclusion == 'success'` y evento `push`, `concurrency` para un despliegue a la vez, y el paso SSH que actualiza `/opt/matchpoint` (`git fetch` + `git reset --hard origin/main`, `docker compose up -d --build`, `docker image prune -f`) con los secrets `SERVER_HOST`, `SERVER_USER`, `SERVER_PORT` y `SSH_PRIVATE_KEY`; verificar con `actionlint` o revisando que el workflow aparece sin errores de sintaxis en la pestaña Actions
- [ ] 3.2 Verificar que el CD no se dispara en un pull request ni cuando el CI falla (revisar en Actions que el job queda omitido)

## 4. Puesta en marcha en el servidor

- [x] 4.1 En la EC2, clonar el repo en `/opt/matchpoint` (con el punto final) y crear `.env` desde `.env.production` con valores reales; verificar con `ls -la /opt/matchpoint` que existen `docker-compose.yml` y `.env`
- [x] 4.2 Primer arranque manual con `docker compose up -d --build`; verificar con `docker compose ps` que los cuatro servicios están en ejecución y que `https://matchpoint.alquilerespunilla.com.ar` abre con certificado válido; si hay bucle de redirecciones o falla el certificado, aplicar la alternativa de Cloudflare indicada en `design.md`
- [x] 4.3 Ejecutar el seed una vez dentro del contenedor del backend y verificar que la API devuelve las disciplinas (`GET /api/disciplinas` o el endpoint equivalente)
- [x] 4.4 Verificar la exposición mínima: desde fuera de la instancia, los puertos de PostgreSQL y del backend no responden; solo 80 y 443

## 5. Prueba de extremo a extremo y documentación

- [ ] 5.1 Hacer un cambio trivial en `main` vía PR y verificar en Actions que el CI pasa, el CD se dispara solo y el cambio se ve en producción
- [x] 5.2 Reiniciar la instancia y verificar que los servicios vuelven solos y que los datos de la base siguen presentes
- [ ] 5.3 Documentar en el `README.md` la URL de producción, la estructura de Docker/Caddy, las variables de entorno y el procedimiento de puesta en marcha del servidor; verificar que otra persona puede seguirlo sin ayuda
