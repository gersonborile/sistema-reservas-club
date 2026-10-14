## 1. Capa mock y regla de cancelación

- [x] 1.1 Agregar en `lib/mock-reservas.ts` las funciones `obtenerReservasDeUsuario(usuarioId)` (ordenadas por fecha y hora) y `cancelarReserva(id, usuarioId)`, y una función `puedeCancelar(reserva, ahora)` que aplica la regla de 2 horas, y verificar que typecheck y lint pasan.
- [x] 1.2 Verificar que `cancelarReserva` rechaza reservas ajenas, ya canceladas o con menos de 2 horas, y que al cancelar la franja vuelve a figurar libre en `obtenerFranjas`.

## 2. Navbar

- [x] 2.1 Hacer que el link "Mis reservas" de la navbar navegue a `/reservas` y se subraye cuando la ruta empieza con `/reservas`, y verificar que "Inicio" y "Canchas" siguen subrayándose en sus rutas.

## 3. Pantalla Mis reservas (`/reservas`)

- [x] 3.1 Crear `app/(protegido)/reservas/` con el encabezado "Mis reservas", el botón "+ Nueva reserva" hacia `/canchas` y las pestañas Todas, Confirmadas y Canceladas, y verificar que la pestaña activa se resalta y que el botón navega.
- [x] 3.2 Renderizar la tabla con columnas Cancha, Fecha y horario, Equipamiento, Estado y Acciones, mostrando solo las reservas del usuario, y verificar el formato de fecha ("Mié 07/10 · 18:00 a 19:00"), el texto de equipamiento y "Sin equipamiento".
- [x] 3.3 Aplicar el filtro de las pestañas (Confirmadas incluye pendientes) y el estado vacío con el botón "Reservar una cancha", y verificar cada pestaña.
- [x] 3.4 Implementar "Cancelar" con confirmación en la fila ("¿Cancelar esta reserva?", "Sí, cancelar", "No"), deshabilitado si la reserva está cancelada o faltan menos de 2 horas, y verificar los cinco casos (cancelar, desistir, menos de 2 horas, ya cancelada, franja liberada).
- [x] 3.5 Agregar "Ver detalle" como placeholder y la nota al pie con el ícono de información, y verificar que "Ver detalle" no navega.

## 4. Verificación final

- [x] 4.1 Ejecutar typecheck, lint y build del frontend sin errores y recorrer a mano: login → Canchas → Confirmar reserva → Mis reservas → Cancelar → Canchas (franja libre).
