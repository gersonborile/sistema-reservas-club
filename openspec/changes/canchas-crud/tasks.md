## 1. Scaffold del backend

- [x] 1.1 Inicializar el proyecto NestJS en `backend/` (Nest CLI, TypeScript strict, oxlint/Prettier) y verificar que `npm run start` levanta el health default en `/` *(mergeado en main desde el cambio de auth)*
- [x] 1.2 Configurar Vitest + Supertest para tests e2e y verificar que `npm run test:e2e` corre el spec de ejemplo (`app.e2e-spec.ts`)*(mergeado en main desde el cambio de auth)*
- [x] 1.3 Instalar y configurar `prisma`/`@prisma/client`, `class-validator`/`class-transformer` y verificar que el `ValidationPipe` global está registrado en `main.ts` y `test/setup.ts` *(mergeado en main desde el cambio de auth)*
- [x] 1.4 Documentar en `backend/README.md` cómo levantar PostgreSQL y ejecutar migraciones/seed, y verificar que el documento refleja los comandos reales *(mergeado en main desde el cambio de auth)*

## 2. Modelo de datos y seed

- [x] 2.1 Definir en `schema.prisma` los modelos `Cancha` (id UUID, nombre único, ubicacion, capacidad, estado enum `EstadoCancha`) y `Disciplina` (id UUID, nombre único) con relación many-to-many implícita, y verificar que `prisma generate` compila el schema *(mergeado en main)*
- [x] 2.2 Aplicar migración inicial y verificar que las tablas `canchas`, `disciplinas` y la tabla intermedia existen en la BD *(mergeado en main)*
- [x] 2.3 Implementar el seed idempotente (upsert por nombre) de las disciplinas tenis, futbol y padel, y verificar ejecutando el seed dos veces seguidas sin duplicados *(mergeado en main)*

## 3. Consulta de disciplinas

- [x] 3.1 Implementar `GET /disciplinas` (controller + servicio + PrismaService) y verificar que devuelve tenis, futbol y padel con status 200 en los tests e2e

## 4. CRUD de canchas

- [x] 4.1 Crear DTO `CreateCanchaDto` (nombre, ubicacion, capacidad > 0, estado enum `EstadoCancha`, `disciplinaIds` con UUIDs no vacíos) con `class-validator` y DTO `UpdateCanchaDto` parcial campo a campo, y verificar que el ValidationPipe rechaza payloads inválidos con 400
- [x] 4.2 Implementar `GET /canchas` con filtros opcionales `disciplina` y `estado` (acepta `en-mantenimiento`) y paginación `page`/`limit`, y verificar con tests e2e que los filtros y la paginación devuelven el subconjunto esperado
- [x] 4.3 Implementar `GET /canchas/:id` (`ParseUUIDPipe`) y verificar que responde 200 con las disciplinas embebidas para un id existente, 404 para un id inexistente y 400 para un id con formato inválido
- [x] 4.4 Implementar `POST /canchas` en el servicio (validación de nombre duplicado case-insensitive → 409; disciplina inexistente → 422; estado válido) y verificar cada caso con tests unitarios y e2e
- [x] 4.5 Implementar `PUT /canchas/:id` con actualización parcial (mismas validaciones, 404 si no existe, 409 si el nombre pasa a duplicarse) y verificar con tests unitarios y e2e
- [x] 4.6 Implementar `DELETE /canchas/:id` (204 si se borra, 404 si no existe, 409 si hay turnos referenciando la cancha, traduciendo también el `P2003` de Prisma a 409) y verificar con tests unitarios y e2e

## 5. Autorización admin-only

- [x] 5.1 Reutilizar el `JwtAuthGuard` y el `RolesGuard` globales del módulo `auth` mergeado, marcando las mutaciones con `@Roles(RolUsuario.ADMINISTRADOR)`, y verificar que el guard se aplica en POST, PUT y DELETE
- [x] 5.2 Verificar con tests e2e que las mutaciones sin token → 401 y con rol `USUARIO` → 403 (tokens emitidos por `/auth/login` contra el PrismaService mockeado)
- [x] 5.3 Verificar que los endpoints de lectura (`GET /canchas*`, `GET /disciplinas`) siguen accesibles sin autenticación mediante `@Public()`

## 6. Calidad y cierre

- [x] 6.1 Correr el suite completo (`npm run build`, `npm run lint`, `npm test`, `npm run test:e2e`) y verificar que pasa en verde
- [x] 6.2 Revisar que los tests e2e cubren cada escenario del spec `specs/canchas/spec.md` y agregar los faltantes (verificar cobertura escenario a escenario)
