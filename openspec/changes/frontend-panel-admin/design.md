## Context

Ver proposal.md. La sesión ya expone el rol (`leerClaims(token).rol`). El catálogo de canchas y
de equipamiento vive hoy como constantes en `lib/mock-reservas.ts`, sin persistencia, y el
mock de login solo registra usuarios con rol `usuario`. El panel necesita catálogo mutable y
un administrador con quien probarlo. Wireframe: `docs/wireframes/panel-admin-web.png`.

## Goals / Non-Goals

**Goals:**
- Una pantalla `/admin` fiel al wireframe, accesible solo para administradores.
- Gestionar canchas (alta, edición, activar/desactivar) y stock de equipamiento.
- Que desactivar una cancha tenga efecto visible en la pantalla del socio.

**Non-Goals:**
- Pantallas "Turnos y franjas" y "Reservas" del menú lateral y el botón "Franjas" de cada
  cancha: quedan como placeholders.
- Alta de equipamiento ("+ Nuevo") y baja de canchas o equipamiento.
- Cancelar o mover reservas existentes cuando se desactiva una cancha.
- Backend real: se usa el mock.

## Decisions

1. **Una sola ruta `/admin`** (el "Resumen" del wireframe) con todo el contenido. En la barra
   lateral, "Canchas" y "Equipamiento" llevan a su sección dentro de la misma página;
   "Turnos y franjas" y "Reservas" se muestran deshabilitados.
2. **Layout propio `app/admin/layout.tsx`**, fuera de `(protegido)`, con barra lateral y
   encabezado "Panel de administración". No usa la navbar del socio. El layout exige sesión
   y rol `administrador`: sin sesión redirige a `/login`; con rol `usuario`, a `/`.
3. **Redirección tras login por rol:** `administrador` va a `/admin`, `usuario` a `/`. Un
   administrador que abre `/` ve la Home normal (no se lo expulsa).
4. **Administrador semilla en el mock** (`admin@club.com` / `admin123`, nombre "Admin"),
   presente siempre en la lista de usuarios mock aunque no haya registros. Es solo para el
   mock y se elimina al integrar el backend.
5. **Catálogo persistido.** Las canchas y el equipamiento pasan a leerse de `localStorage`
   (claves `clubDeportivo.canchas` y `clubDeportivo.equipamiento`), inicializándose con los
   datos base si no existen. Las funciones públicas actuales (`obtenerCanchas`,
   `obtenerCancha`, `obtenerEquipamiento`) mantienen su firma.
6. **Campo `activa`** en `Cancha` (booleano, `true` por defecto). `obtenerCanchas` y
   `obtenerDisponiblesAhora` devuelven solo canchas activas; `obtenerCancha(id)` sigue
   devolviendo también las inactivas, para no romper reservas ya hechas. El panel usa
   `obtenerTodasLasCanchas()`.
7. **Funciones de administración en el mock:** `crearCancha({nombre, disciplina})`,
   `editarCancha(id, {nombre, disciplina})`, `cambiarActivaCancha(id, activa)` y
   `actualizarStockEquipamiento(id, stockTotal)`. El nombre es obligatorio y único
   (sin distinguir mayúsculas); `stockTotal` es un entero mayor o igual a 0.
8. **Poco stock:** un ítem está "con poco stock" si `stockTotal` es 5 o menos
   (`UMBRAL_POCO_STOCK = 5`). Al actualizar `stockTotal`, `stockDisponible` se ajusta por la
   misma diferencia, sin bajar de 0.
9. **Indicadores:** "Reservas de hoy" cuenta las reservas confirmadas o pendientes con la
   fecha de hoy; "Canchas activas" cuenta las canchas con `activa`; "Equipamiento con poco
   stock" cuenta los ítems según la decisión 8.
10. **Reservas de hoy** (tarjeta lateral): lista ordenada por hora con hora y cancha; sin
    reservas, "No hay reservas para hoy". No se muestra el socio porque el mock de reservas
    solo guarda su id.
11. **Formularios en línea, sin modal:** "+ Nueva cancha" y "Editar" abren un formulario
    sobre la tabla (nombre y disciplina) con "Guardar" y "Cancelar". "Editar stock"
    convierte el stock de la fila en un campo numérico con "Guardar" y "Cancelar".
12. **Desactivar** no pide confirmación (es reversible con "Activar").

## Risks / Trade-offs

- [Riesgo] Credenciales de administrador visibles en el código del mock → Mitigación: son
  solo para desarrollo, se documentan como semilla del mock y se retiran con el backend.
- [Riesgo] La protección por rol en el cliente no es seguridad real → Mitigación: la
  autorización autoritativa queda en el backend (ya exige rol en las mutaciones).
- [Riesgo] Desactivar una cancha con reservas futuras las deja vigentes → Mitigación: fuera
  de alcance; las reservas existentes se conservan y se anota como pendiente.
- [Riesgo] Persistir el catálogo cambia el origen de datos de las pantallas del socio →
  Mitigación: las funciones mantienen su firma y se verifica el recorrido de reserva.

## Estructura visual (`/admin`)

- Columna lateral izquierda, fondo blanco y borde derecho: logo y "Club · Admin" arriba;
  ítems "Resumen" (activo, con borde), "Canchas", "Turnos y franjas", "Equipamiento" y
  "Reservas"; los dos últimos y "Turnos y franjas" en gris, deshabilitados; "Cerrar sesión"
  al pie, en gris.
- Encabezado superior con el título "Panel de administración" a la izquierda y, a la
  derecha, el nombre de la sesión y un círculo de avatar.
- Fila de tres tarjetas con borde fino: "RESERVAS DE HOY", "CANCHAS ACTIVAS" y
  "EQUIPAMIENTO CON POCO STOCK", etiqueta chica en mayúsculas y gris, número grande debajo.
- Debajo, dos columnas: a la izquierda (más ancha) la tarjeta "Canchas"; a la derecha las
  tarjetas "Equipamiento" y "Reservas de hoy" apiladas.
- Tarjeta Canchas: título y botón primario oscuro "+ Nueva cancha"; encabezado de tabla
  NOMBRE, DISCIPLINA, ESTADO, ACCIONES (alineado a la derecha); por fila el nombre en
  negrita, la disciplina, una insignia "Activa" (borde oscuro) o "Inactiva" (borde y texto
  grises) y tres botones secundarios: "Editar", "Franjas" (placeholder) y "Desactivar" o
  "Activar".
- Tarjeta Equipamiento: título y botón secundario "+ Nuevo" (placeholder); por fila el
  nombre, el stock en gris chico ("8 en stock") y el botón "Editar stock".
- Tarjeta Reservas de hoy: filas con la hora en negrita y la cancha.

## Open Questions

- Cuándo se agregan el alta de equipamiento y las pantallas de Turnos y franjas y de
  Reservas.
