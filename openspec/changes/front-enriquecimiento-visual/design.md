# Design

## Context

El frontend ya usa el backend real y la Home autenticada tiene una base visual más rica que la Home pública. La landing, el listado de canchas y la confirmación todavía usan una paleta `slate`/`emerald` suelta, placeholders textuales y estados mínimos. Ver `proposal.md` para la motivación y `specs/` para el contrato.

Restricciones que moldean la solución:

- Las imágenes son locales. Existen `hero.webp`, `tenis.webp`, `futbol.webp`, `padel.webp` y `default.webp`.
- No se agregan dependencias.
- No se toca backend, admin, CI ni Docker.
- El frontend usa Next.js 16 con App Router, React 19, Tailwind 4 y TypeScript estricto.
- Los datos de dominio solo salen de la API; la única configuración local es el horario del club.

## Goals / Non-Goals

**Goals:**

- Unificar la identidad visual alrededor de los tokens existentes sin reescribir el admin.
- Dar a la Home pública, `/canchas` y `/canchas/[id]` imagen, jerarquía y estados completos.
- Resolver imágenes de disciplina con una única función normalizada y un fallback seguro.
- Establecer componentes visuales reutilizables por la Tanda B sin implementar aún Reservar, Home autenticada ni Mis reservas.

**Non-Goals:**

- Rediseñar el admin.
- Cambiar el contrato de la API o el manejo de sesión.
- Implementar la Tanda B en esta entrega.
- Generar, descargar o versionar imágenes faltantes.

## Decisions

### 1. Identidad: club impreso, no SaaS genérico

La base visual conserva la paleta actual y la lleva a un lenguaje de “programa de club”: titulares grandes alineados a la izquierda, fotografía deportiva como marcador principal, líneas finas y chips de horario que parecen una pizarra de turnos.

| Token | Valor | Uso |
|---|---|---|
| `surface` | `#f7f9fb` | Fondo general |
| `surface-container` | `#eceef0` | Bloques y skeletons |
| `primary` | `#1a1c1c` | Texto principal, footer oscuro |
| `secondary` | `#006c49` | Verde de club, CTAs y enlaces |
| `secondary-container` | `#6cf8bb` | Acento de reserva y foco suave |
| `on-surface-variant` | `#3e4942` | Texto secundario |
| `outline-variant` | `#bdc9c0` | Líneas y bordes |

Se agregan tokens semánticos para error y aviso, sin cambiar la identidad. Se mantiene Plus Jakarta Sans como única familia: 800 para display, 700 para títulos, 600 para controles, 400/500 para cuerpo. Se evita el patrón de “todo en tarjetas iguales”: la Home alterna bloques editoriales, listas y una franja de horarios.

### 2. Hero asimétrico con franja de club

El hero ocupa un ancho de 12 columnas: texto en 5, imagen en 7. La imagen lleva un degradado verde oscuro y una franja inferior con disciplinas reales y duración, no estadísticas inventadas. Es el único momento visual fuerte; el resto baja intensidad.

```
┌──────────────────────────────┬─────────────────────────┐
│ Disciplinas del club         │                         │
│ Reservá tu cancha            │      hero.webp          │
│ en pocos pasos               │                         │
│ [Ver disponibilidad] [Cómo]  │  franja: Tenis · 60 min │
└──────────────────────────────┴─────────────────────────┘
```

En móvil se apila: texto, CTAs, imagen 4:3 y franja de disciplinas.

### 3. Imágenes: módulo único + componente tolerante a faltantes

`lib/imagenes.ts` normaliza con `NFD`, quita diacríticos, baja a minúsculas y colapsa espacios. Devuelve la ruta local de la disciplina o la ruta por defecto. No usa `fs` ni red.

`ImagenDisciplina` es un componente cliente pequeño que envuelve `next/image` con `fill`, `sizes` y `alt`. Si la imagen falla, cambia a un placeholder SVG propio con gradiente y el ícono del deporte. Esto deja una red de seguridad si un asset se mueve o falta en el futuro. El hero usa `priority`; el resto queda diferido.

### 4. Home pública: una carga tolerante por sección

La landing mantiene el hero estático y hace `Promise.allSettled` para disciplinas, canchas y equipamiento. Cada sección guarda su propio error y comparte el botón de reintento. Así una falla de equipamiento no borra las disciplinas ni el hero.

- Disciplinas: `GET /disciplinas`.
- Canchas: `GET /canchas`, filtrar `DISPONIBLE`, tomar 4.
- Equipamiento: `GET /equipamiento?disponible=true`, filtrar stock y activo, tomar 4.
- Horarios: `APERTURA`/`CIERRE` de `lib/franjas.ts`.

### 5. `/canchas`: tarjeta editorial con disponibilidad accionable

Cada cancha se presenta como una fila/tarjeta ancha en escritorio y una tarjeta apilada en móvil. La imagen ocupa 16:9 o 4:3 según el breakpoint; los datos y chips van al lado. Los chips muestran solo turnos libres de la fecha y hora filtradas, con un máximo de cuatro, y enlazan al flujo de reserva existente. “Ver detalle” lleva a la nueva ruta.

Se conserva la carga actual: disciplinas, canchas filtradas y todos los turnos de la fecha en paralelo. Se mantiene el filtro por hora y se agrega el estado vacío contextual.

### 6. `/canchas/[id]`: detalle público con selector de 7 días

La página es un Server Component que renderiza metadata y un cliente `DetalleCanchaClient`. El cliente pide en paralelo `GET /canchas/:id` y `GET /turnos?cancha_id=&fecha=`. La fecha elegida vive en estado local; al cambiarla se vuelve a pedir la grilla. Un `404` se trata como cancha inexistente.

La franja de 7 días se genera desde `obtenerFechaLocalHoy()` y `sumarDias()`. Cada día muestra día abreviado y número. La grilla usa botones/enlaces: libres en verde y ocupados deshabilitados. El enlace de reserva conserva `fecha`, `hora` y `turnoId`; el layout protegido de reservar ya resuelve login con retorno.

### 7. Sistema de componentes base

Se crean componentes chicos en `app/componentes/ui/`:

- `iconos.tsx`: SVG propios para pasos, disciplinas y estados; cero dependencias.
- `insignia.tsx`: badges de disciplina, capacidad, estado y disponibilidad.
- `esqueleto.tsx`: bloques de carga con la forma del contenido.
- `estado.tsx`: vacío con ilustración y error con reintento.
- `imagen-disciplina.tsx`: imagen o placeholder.
- `toast.tsx`: proveedor global con `aria-live`, cierre y tonos éxito/error/info.

El proveedor de toasts se monta en `app/layout.tsx`; la Tanda A lo deja listo y la Tanda B lo usa para cancelaciones y alquileres.

### 8. Accesibilidad y movimiento

Se mantiene `*:focus-visible` global y se amplía a `prefers-reduced-motion` en `globals.css`. Las transiciones se limitan a color, borde y opacidad; no hay entradas escalonadas por sección. Los textos sobre imagen llevan degradado oscuro para contraste AA. Los controles tienen nombres accesibles y los estados se anuncian.

## Risks / Trade-offs

- **Asset local faltante o corrupto** → El componente cae a placeholder SVG; no se genera ni descarga nada.
- **Imágenes locales pesadas** → `next/image` con `sizes` y `priority` solo en hero; las tarjetas cargan diferido.
- **Tres fetches en la Home** → `Promise.allSettled` aísla fallas; el costo es una carga ligeramente más compleja, aceptable para una landing.
- **Duplicación de estilos con la Home autenticada** → Los tokens y componentes base se comparten; la Tanda B reutiliza en lugar de reescribir.
- **El spec principal de canchas está desfasado por el change anterior sin archivar** → El delta de este change se limita a lo visual y al detalle; no se reescribe la navegación ya implementada.

## Migration Plan

No hay migración de datos. El cambio es incremental y solo frontend. Rollback: revertir los archivos de la Tanda A; los endpoints y la sesión no cambian. La Tanda B queda bloqueada hasta el OK del usuario.

## Open Questions

Ninguna que cambie specs, enfoque o tareas. Los cinco assets locales están presentes; el placeholder queda como red de seguridad para futuros faltantes.
