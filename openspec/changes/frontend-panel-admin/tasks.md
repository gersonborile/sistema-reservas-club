## 1. Capa mock y administrador semilla

- [x] 1.1 En `lib/mock-reservas.ts`, agregar `activa` a `Cancha` y persistir canchas y equipamiento en `localStorage` (claves `clubDeportivo.canchas` y `clubDeportivo.equipamiento`, inicializadas con los datos base); `obtenerCanchas` y `obtenerDisponiblesAhora` devuelven solo activas, `obtenerCancha` devuelve también inactivas, y agregar `obtenerTodasLasCanchas`; verificar que typecheck y lint pasan y que Canchas y Confirmar reserva siguen funcionando.
- [x] 1.2 Agregar `crearCancha`, `editarCancha`, `cambiarActivaCancha` y `actualizarStockEquipamiento` con sus validaciones (nombre obligatorio y único sin distinguir mayúsculas, stock entero mayor o igual a 0, `stockDisponible` ajustado por la diferencia), y verificar cada caso de error y de éxito.
- [x] 1.3 En `lib/api.ts`, agregar el administrador semilla `admin@club.com` / `admin123` al mock de login, sin que el registro pueda crear administradores, y verificar el login con ambos roles.

## 2. Redirección por rol y protección

- [x] 2.1 En el formulario de login, navegar a `/admin` si el rol es `administrador` y a `/` si es `usuario`, y verificar ambos recorridos.
- [x] 2.2 Crear `app/admin/layout.tsx` que exige sesión y rol `administrador` (sin sesión a `/login`, socio a `/`), con barra lateral, encabezado y "Cerrar sesión", y verificar los tres accesos.

## 3. Pantalla Panel de administración (`/admin`)

- [x] 3.1 Crear la página con la barra lateral (Resumen resaltado; "Turnos y franjas" y "Reservas" deshabilitados; "Canchas" y "Equipamiento" desplazan a su tarjeta) y las tres tarjetas de indicadores, y verificar los valores contra los datos del mock.
- [x] 3.2 Renderizar la tarjeta Canchas con la tabla, la insignia Activa/Inactiva, "Editar", "Franjas" (placeholder) y "Desactivar"/"Activar", y verificar que activar y desactivar actualiza la fila y los indicadores.
- [x] 3.3 Implementar el formulario en línea de "+ Nueva cancha" y "Editar" con validación de nombre vacío y duplicado, y verificar crear, editar, cancelar y los dos errores.
- [x] 3.4 Renderizar la tarjeta Equipamiento con "Editar stock" en línea (validación de entero mayor o igual a 0) y "+ Nuevo" como placeholder, y verificar que el indicador de poco stock cambia.
- [x] 3.5 Renderizar la tarjeta Reservas de hoy (orden por hora, solo confirmadas o pendientes, estado vacío), y verificar con reservas creadas y canceladas.

## 4. Verificación final

- [x] 4.1 Ejecutar typecheck, lint y build del frontend sin errores y recorrer a mano: login como administrador → desactivar una cancha → entrar como socio y comprobar que no aparece en Canchas ni en Disponibles ahora → reactivarla → editar un stock y ver el máximo en Confirmar reserva.
