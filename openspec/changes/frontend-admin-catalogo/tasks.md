## 1. Capa de API

- [ ] 1.1 Agregar `crearCancha`, `editarCancha`, `cambiarEstadoCancha`, `crearEquipamiento` y `editarEquipamiento` sobre `peticion` (con adaptadores) y verificar con typecheck que compilan

## 2. Panel de administración

- [ ] 2.1 Conectar la tarjeta de canchas: tabla desde `GET /canchas`, formulario con Ubicación, Capacidad y selector de disciplina (`GET /disciplinas`), crear con `POST` y editar con `PUT` preservando las disciplinas existentes, y verificar contra el backend local incluidos `400` y `409`
- [ ] 2.2 Implementar "Desactivar"/"Activar" con `PUT { estado }` (`EN_MANTENIMIENTO` / `DISPONIBLE`) y verificar que la cancha desactivada desaparece del listado de socios
- [ ] 2.3 Conectar "Editar stock" a `PUT /equipamiento/:id` mostrando el `409` del backend y "+ Nuevo" a `POST /equipamiento` (nombre, disciplina, stock, precio), y verificar con un stock por debajo de lo alquilado
- [ ] 2.4 Calcular las métricas del Resumen (canchas activas, poco stock, reservas de hoy) desde el backend y verificar que "Reservas de hoy" cuenta las de todos los socios
- [ ] 2.5 Agregar estados de carga y error en el panel y mensaje de permisos ante `403`, deshabilitando los botones de guardar mientras la petición está en curso

## 3. Integración y verificación

- [ ] 3.1 Correr `typecheck`, `lint` y `build` del frontend y verificar que terminan sin errores
- [ ] 3.2 Con backend y Postgres locales, recorrer a mano el panel como administrador y verificar los escenarios de `specs/frontend-admin-catalogo/spec.md`, incluido que un socio no accede a `/admin`
- [ ] 3.3 Tras el deploy, verificar en `https://matchpoint.alquilerespunilla.com.ar` que el administrador puede crear una cancha y editar stock
