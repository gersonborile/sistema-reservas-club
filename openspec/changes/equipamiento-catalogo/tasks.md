## 1. Modelo y contrato

- [x] 1.1 Verificar que el modelo `Equipamiento` del `schema.prisma` (`nombre`, `disciplinaId`, `stockTotal`, `stockDisponible`, `precioUnitario`, `activo`) coincide con la spec y que el cliente de Prisma ya incluye `equipamiento` y `reservaEquipamiento`
- [x] 1.2 Alinear `proposal.md`, `design.md` y `spec.md` con el schema: camelCase, `PUT` parcial, `stockDisponible` no aceptado desde el cliente y precio serializado como número JSON
- [x] 1.3 Crear el serializador público del módulo con `disponible = stockDisponible > 0`, `disciplina: { id, nombre }` y `precioUnitario` numérico

## 2. Consulta del catálogo

- [x] 2.1 Crear el módulo `Equipamiento` (controller + servicio + DTOs) en `backend/src/equipamiento` y registrarlo en `AppModule`
- [x] 2.2 Implementar `GET /equipamiento` con filtros `disciplinaId`, `disponible`, `incluirInactivos` (default `false`) y paginación `page`/`limit`, devolviendo solo activos por defecto
- [x] 2.3 Implementar `GET /equipamiento/:id` público con 200 para un id existente (incluso inactivo) y 404 para un id inexistente

## 3. Stock e inventario

- [x] 3.1 Verificar que el listado público no incluye ítems con `activo = false` y que `incluirInactivos=true` sí los incluye
- [x] 3.2 Verificar que `disponible` se deriva de `stockDisponible` y que el filtro `disponible=true` excluye ítems con `stockDisponible = 0`
- [x] 3.3 Implementar la actualización atómica de `stockTotal`: leer el estado vigente, calcular alquiladas (`stockTotal - stockDisponible`), rechazar con 409 si el nuevo total es menor y ejecutar `updateMany` condicionado por `id` + `stockTotal` + `stockDisponible`, reintentando si el `count` es 0

## 4. Mutaciones de equipamiento (admin)

- [x] 4.1 Crear `CrearEquipamientoDto` y `ActualizarEquipamientoDto` (parcial) con `class-validator`: `nombre` no vacío, `disciplinaId` UUID, `stockTotal` entero entre 0 y 2147483647, `precioUnitario` entre 0 y 99999999.99 con hasta 2 decimales y `activo` booleano opcional; ningún DTO acepta `stockDisponible`
- [x] 4.2 Implementar `POST /equipamiento` (disciplina inexistente → 422; `stockDisponible = stockTotal`; `activo = true` por defecto; `disponible` calculado) y verificar cada caso con tests
- [x] 4.3 Implementar `PUT /equipamiento/:id` parcial (404 si no existe, 422 si la disciplina no existe, 409 si el stock baja por debajo de lo alquilado, 400 por límites) y verificar la desactivación con `activo = false`
- [x] 4.4 Implementar `DELETE /equipamiento/:id` (204 sin alquileres, 404 si no existe, 409 con alquileres asociados y mensaje que sugiere `activo = false`; red de seguridad para `P2003`)

## 5. Autorización

- [x] 5.1 Aplicar `@Public()` a `GET /equipamiento` y `GET /equipamiento/:id`, y `@Roles(RolUsuario.ADMINISTRADOR)` a `POST`, `PUT` y `DELETE`
- [x] 5.2 Verificar con e2e que las mutaciones sin token responden 401, con rol `USUARIO` responden 403 y con `ADMINISTRADOR` funcionan

## 6. Tests y calidad

- [x] 6.1 Unitarios de `EquipamientoService` con Vitest y `PrismaService` mockeado: listar/filtrar, crear con `stockDisponible = stockTotal`, disciplina inexistente, actualizar con ajuste de stock, reducir `stockTotal` por debajo de lo alquilado, equipamiento inexistente, eliminar y eliminar con alquileres asociados
- [x] 6.2 E2E con Supertest y `PrismaService` mockeado: GET público, POST 401/403/201, validaciones 400, PUT 200/404/409/422 y DELETE 204/404/409
- [x] 6.3 Correr `npm run build`, `npm run lint`, `npm test` y `npm run test:e2e` en `/backend`, y `npx @fission-ai/openspec validate --all --strict`
- [x] 6.4 Revisar cada escenario de `specs/equipamiento-catalogo/spec.md` contra la implementación y los tests
