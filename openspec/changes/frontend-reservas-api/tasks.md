## 1. Capa de API y adaptadores

- [ ] 1.1 Agregar `crearReserva`, `obtenerMisReservas`, `cancelarReserva`, `obtenerEquipamiento` (recorre páginas) y `crearAlquiler` sobre `peticion`, y el adaptador `aReservaUI` (cancha y hora desde `turno`, estado, alquiler), y verificar con typecheck que compilan

## 2. Pantallas

- [ ] 2.1 Conectar "Confirmar reserva" a `POST /reservas` con el `turnoId` de la franja (botón deshabilitado en curso, `409` → "Ese turno ya no está disponible." y refresco de franjas) y verificar contra el backend local
- [ ] 2.2 Conectar la tarjeta de equipamiento a `GET /equipamiento` (por disciplina, con stock) y el alquiler posterior a la reserva (`POST /reservas/:id/alquiler`), incluyendo el aviso con reintento si falla tras crear la reserva, y verificar con stock suficiente e insuficiente
- [ ] 2.3 Conectar "Mis reservas" a `GET /reservas/mis` mostrando estado, alquiler (ítems y total) y cancelar con `PATCH` (mensaje del backend ante `409`), y verificar contra el backend local (spec-alquiler 4.2)
- [ ] 2.4 Agregar la acción "Alquilar equipamiento" en reservas `CONFIRMADA` sin alquiler del usuario, y verificar que no aparece en reservas canceladas ni con alquiler (spec-alquiler 4.1 y 4.3)
- [ ] 2.5 Conectar "Próxima reserva" de la Home a `GET /reservas/mis` y quitar el estado `pendiente` y el monto placeholder, y verificar con reservas futuras, pasadas y canceladas

## 3. Integración y verificación

- [ ] 3.1 Correr `typecheck`, `lint` y `build` del frontend y verificar que terminan sin errores
- [ ] 3.2 Con backend y Postgres locales, recorrer a mano reservar con y sin equipamiento, ver "Mis reservas", cancelar dentro y fuera de la ventana de 2 horas, y verificar que el stock vuelve al cancelar; verificar los escenarios de `specs/frontend-reservas-api/spec.md`
- [ ] 3.3 Tildar 4.1, 4.2 y 4.3 de `openspec/changes/spec-alquiler/tasks.md`
- [ ] 3.4 Tras el deploy, verificar en `https://matchpoint.alquilerespunilla.com.ar` que se puede reservar y cancelar
