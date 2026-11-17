# Tasks

## 1. Planificación

- [x] 1.1 Crear las specs delta de `frontend-visual-system`, `frontend-home-visual` y las modificaciones de canchas, reservas y retiro de mocks, y verificar con `openspec validate --all --strict --no-interactive`.
- [x] 1.2 Escribir `design.md` con tokens, layout, decisiones de imágenes, estados y límites de Tanda A/B, y verificar que `openspec status --change front-enriquecimiento-visual` marque specs y design como completos.
- [x] 1.3 Escribir `tasks.md` con la división Tanda A/B y verificar que `openspec status --change front-enriquecimiento-visual` marque la planificación completa.

## 2. Tanda A — Fundación visual

- [ ] 2.1 Extender `frontend/app/globals.css` con tokens semánticos, foco, scroll y `prefers-reduced-motion`; verificar con `npm run typecheck` y revisión de teclado en navegador.
- [ ] 2.2 Crear `frontend/lib/imagenes.ts` con normalización de disciplina, mapa local y fallback; verificar con `npm test -- imagenes` y casos `Fútbol`, `fútbol`, `FÚTBOL` y desconocida.
- [ ] 2.3 Crear `ImagenDisciplina` con `next/image`, `alt`, `sizes`, `priority` opcional y placeholder SVG ante error; verificar con `npm run typecheck` y prueba visual de una disciplina sin archivo.
- [ ] 2.4 Crear iconos SVG propios, insignias, skeletons, estados vacío/error y proveedor de toasts; verificar con `npm run lint` y `npm run typecheck`.
- [ ] 2.5 Montar el proveedor de toasts en `frontend/app/layout.tsx` y revisar que no rompa Home, canchas, login ni admin; verificar con `npm run build`.

## 3. Tanda A — Home pública

- [ ] 3.1 Reescribir el hero de `landing.tsx` con imagen `hero.webp`, CTAs y franja de disciplinas reales; verificar que el hero use `priority` y que las disciplinas salgan de `GET /disciplinas`.
- [ ] 3.2 Cargar disciplinas, canchas y equipamiento con estados independientes y skeletons; verificar que una sección pueda fallar sin borrar el hero.
- [ ] 3.3 Implementar disciplinas con imagen, duración y reglas; canchas reales con imagen, ubicación, capacidad y disciplinas; equipamiento con stock y precio reales; verificar contra la API local y que no haya datos inventados.
- [ ] 3.4 Implementar “Cómo funciona” con iconos, FAQ veraz, horarios desde `APERTURA`/`CIERRE`, CTA final, navbar y footer sin links muertos ni contacto inventado; verificar con teclado y `npm run lint`.

## 4. Tanda A — Listado `/canchas`

- [ ] 4.1 Reemplazar las tarjetas por tarjetas con imagen por disciplina, badges y chips de próximos turnos libres; verificar que los chips libres abran el flujo de reserva existente.
- [ ] 4.2 Agregar enlace “Ver detalle” a `/canchas/[id]` y conservar el filtro por disciplina, fecha y horario; verificar navegación y filtros contra la API local.
- [ ] 4.3 Implementar skeletons, vacío con ilustración y acción, y error con reintento; verificar los tres estados en navegador y con `npm run typecheck`.

## 5. Tanda A — Detalle `/canchas/[id]`

- [ ] 5.1 Crear `frontend/app/canchas/[id]/page.tsx` y `detalle-canchas-client.tsx` con `GET /canchas/:id`; verificar que una cancha existente muestre imagen grande, ubicación, capacidad, estado y disciplinas.
- [ ] 5.2 Implementar la franja de 7 días y la grilla de `GET /turnos?cancha_id=&fecha=`, con libres accionables y ocupados deshabilitados; verificar el cambio de fecha y el enlace a reservar.
- [ ] 5.3 Manejar `404`, error de red, cancha sin turnos y reintento; verificar cada caso en navegador y con `npm run typecheck`.
- [ ] 5.4 Agregar tests de `generarDiasCalendario` o del helper de fechas usado por la franja y verificar con `npm test`.

## 6. Tanda A — Cierre

- [ ] 6.1 Ejecutar `openspec validate --all --strict --no-interactive`, `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`; registrar resultados completos.
- [ ] 6.2 Revisar `git status` y `git diff --stat`, listar archivos nuevos/modificados y confirmar que la skill `frontend-design` no está dentro del repo.
- [ ] 6.3 Preparar la tabla pantalla → endpoints → cambios, el paso a paso de prueba local, los assets faltantes y pendientes; frenar y esperar OK antes de la Tanda B.

## 7. Tanda B — Reservar

- [ ] 7.1 Implementar stepper turno/equipamiento/confirmación y panel lateral de resumen; verificar con `npm run typecheck` y prueba manual.
- [ ] 7.2 Mostrar equipamiento con stock y precio reales, límites de cantidad y total previsto; verificar que `POST /reservas/:id/alquiler` siga funcionando.
- [ ] 7.3 Conservar `POST /reservas`, `409`, `400`, `401` y la navegación a Mis reservas; verificar con backend local y tests existentes.
- [ ] 7.4 Agregar o ajustar tests de presentación/validación y verificar con `npm test`.

## 8. Tanda B — Home autenticada y Mis reservas

- [ ] 8.1 Destacar la próxima reserva con imagen y fecha legible, accesos rápidos con imagen y canchas con turnos libres hoy; verificar contra la API local.
- [ ] 8.2 Convertir Mis reservas en tarjetas con imagen, estado con color, fecha relativa y alquiler visible; verificar con reservas con y sin alquiler.
- [ ] 8.3 Agregar cancelación con confirmación y toasts de resultado, conservando `PATCH /reservas/:id/cancelar` y el reintento de alquiler; verificar casos éxito y `409`.
- [ ] 8.4 Agregar o ajustar tests de fechas/estado y verificar con `npm test`.

## 9. Cierre final

- [ ] 9.1 Ejecutar `openspec validate --all --strict --no-interactive`, `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`; registrar resultados completos.
- [ ] 9.2 Revisar `git status`, `git diff --stat`, assets faltantes, pendientes y fuera de alcance; no commitear y esperar OK.
