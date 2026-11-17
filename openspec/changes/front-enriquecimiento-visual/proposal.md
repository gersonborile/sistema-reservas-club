# Proposal: front-enriquecimiento-visual

## Why

La aplicación ya consume el backend real, pero la presentación quedó visualmente plana: faltan imágenes, jerarquía, densidad útil y recursos para entender la cancha antes de reservar. Este cambio sube el nivel visual sin alterar el contrato de la API ni introducir datos inventados.

## What Changes

La identidad actual se conserva: superficies claras, verde de club, tipografía Plus Jakarta Sans y el lenguaje de tarjetas ya usado en la Home. La dirección visual suma fotografía deportiva local, jerarquía editorial y detalles de “club” en lugar de una estética genérica de SaaS.

### Home pública

- Hero con imagen local, título claro, CTA principal “Ver disponibilidad” y CTA secundario “Cómo funciona”.
- Disciplinas reales de `GET /disciplinas`: imagen local por disciplina, nombre, `duracionTipicaMinutos` y una línea de `reglas`.
- Sección “Canchas” con 3 o 4 canchas reales de `GET /canchas`: imagen por disciplina, nombre, ubicación, capacidad y disciplinas.
- Sección “Alquilá equipamiento” con `GET /equipamiento`: nombre, disciplina, stock disponible y `precioUnitario` real.
- “Cómo funciona” con íconos propios y pasos existentes; FAQ corta con contenido genérico y veraz.
- Horarios desde `APERTURA`/`CIERRE`; CTA final. Sin dirección, teléfono, email, redes ni ratings inventados.

### `/canchas`

- Tarjetas con imagen local según disciplina, nombre, ubicación, capacidad y badges de disciplina y estado.
- Chips con los próximos horarios libres de la fecha elegida, conservando el enlace actual a la reserva.
- Skeleton de tarjetas, vacío con ilustración y acción para cambiar fecha, y error con reintento.
- El filtro, los turnos y la fecha siguen saliendo de `GET /canchas` y `GET /turnos?fecha=`.

### `/canchas/[id]` (nueva ruta pública)

- Imagen grande de la disciplina, datos reales de `GET /canchas/:id` y sus disciplinas.
- Selector de fecha en una franja horizontal de 7 días.
- Grilla de turnos de `GET /turnos?cancha_id=&fecha=`: libres seleccionables y ocupados deshabilitados.
- Al elegir un turno se mantiene el flujo actual: sin sesión va a login con retorno; con sesión va a reservar.

### Reservar

- Stepper visual de tres pasos: turno, equipamiento y confirmación.
- Panel lateral de resumen persistente con cancha, fecha, horario y estado.
- Equipamiento con nombre, disciplina, stock y precio unitario reales; cantidades limitadas por stock.
- Se conservan `POST /reservas`, `POST /reservas/:id/alquiler` y el manejo de `409`, `400` y `401`.

### Home autenticada

- Próxima reserva destacada con imagen de la disciplina, fecha legible y CTA a Mis reservas.
- Accesos rápidos con imagen por disciplina y conteo real de turnos libres.
- “Canchas con turnos libres hoy” con imagen y próximo turno real.

### Mis reservas

- Tarjetas con imagen de disciplina, estado con color, fecha legible (“mañana 18:00”) y alquiler visible.
- Cancelación con confirmación en contexto y aviso de resultado.
- Se mantienen `GET /reservas/mis`, `PATCH /reservas/:id/cancelar` y el reintento de alquiler.

### Globales

- Módulo único `lib/imagenes.ts`: normaliza nombre de disciplina (minúsculas, sin tildes) y resuelve imagen o fallback.
- `next/image` con `alt` descriptivo, `sizes` correctos y `priority` solo en el hero.
- Placeholder propio con gradiente e ícono SVG por disciplina cuando falte el archivo.
- Toasts consistentes, transiciones sutiles, `prefers-reduced-motion`, foco visible y contraste AA.
- Header y footer completos, sin enlaces muertos.

### Recursos visuales esperados

La carpeta `frontend/public/img/` todavía no existe. Se esperan estos archivos locales, sin descargas ni hotlinking:

- `frontend/public/img/hero.webp`
- `frontend/public/img/disciplinas/tenis.webp`
- `frontend/public/img/disciplinas/futbol.webp`
- `frontend/public/img/disciplinas/padel.webp`
- `frontend/public/img/disciplinas/default.webp`

Hasta que existan, cada tarjeta usa el placeholder ilustrado; el informe final listará los archivos faltantes.

## Capabilities

### New Capabilities

- `frontend-visual-system`: sistema visual compartido, módulo de imágenes locales, placeholders, toasts, transiciones, accesibilidad, responsive y header/footer sin enlaces muertos.
- `frontend-home-visual`: enriquecimiento visual de la Home pública y autenticada usando solo datos reales de disciplinas, canchas, turnos, reservas y equipamiento.

### Modified Capabilities

- `frontend-canchas-api`: se reemplaza la restricción de “sin imágenes de cancha” por imágenes locales por disciplina y se agrega el detalle público `/canchas/[id]` con selector de 7 días y grilla de turnos.
- `frontend-reservas-api`: la creación de reserva se presenta con stepper y resumen, y Mis reservas usa tarjetas con imagen, estado, fecha relativa y alquiler visible, sin cambiar endpoints ni reglas de error.
- `frontend-retirar-mocks`: se agrega que las imágenes son solo locales y que ningún dato visual (precio, rating, contacto, disponibilidad) puede inventarse.

## Impact

- Rutas y componentes de `frontend/app/`: Home pública/autenticada, `/canchas`, nueva `/canchas/[id]`, reservar y Mis reservas.
- Nuevo `frontend/lib/imagenes.ts` y assets en `frontend/public/img/`.
- Ajustes visuales en `frontend/app/componentes/` (header, footer, tarjetas, estados, toasts).
- Posibles helpers de presentación en `frontend/lib/adaptadores.ts` y `frontend/lib/fechas.ts`, con tests Vitest.
- Sin cambios de backend, dependencias pesadas, pagos online, precios de cancha, ratings, mapas, admin ni despliegue.
- El cierre exige `openspec validate --all --strict --no-interactive`, `lint`, `typecheck`, `test` y `build` en verde, y un informe de pantalla → endpoints → cambios y assets faltantes.
