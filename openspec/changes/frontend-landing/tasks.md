## 1. Raíz que decide entre landing y Home

- [x] 1.1 Extraer `ShellSocio` (navbar y `main` con fondo gris claro) a `app/componentes/shell-socio.tsx` y usarlo en `app/(protegido)/layout.tsx`, y verificar que las pantallas protegidas se ven igual y que sin sesión siguen redirigiendo a `/login`.
- [x] 1.2 Mover `home-client.tsx` a `app/home-client.tsx`, eliminar `app/(protegido)/page.tsx` y crear `app/page.tsx` (con `metadata`) que renderiza un componente cliente: con sesión válida muestra la Home dentro de `ShellSocio`, sin sesión una landing provisoria; no renderiza nada mientras lee la sesión. Verificar la Home con sesión y que `/` ya no redirige sin sesión.

## 2. Landing (`/` sin sesión)

- [x] 2.1 Crear `app/componentes/landing.tsx` con la barra superior (links por ancla con desplazamiento suave, "Iniciar sesión" y "Registrate") y la portada, y verificar los destinos de los botones y los links.
- [x] 2.2 Agregar la sección "Nuestras disciplinas" con las tres tarjetas y sus links `/canchas?disciplina=...`, y verificar cada link.
- [x] 2.3 Agregar "Cómo funciona" con los tres pasos y el llamado "Crear cuenta", y verificar el destino del botón.
- [x] 2.4 Agregar el pie de página con las columnas Horarios, Contacto y Seguinos, y verificar que las anclas `#horarios` y `#contacto` llevan al pie.
- [x] 2.5 Verificar el diseño en 375 px de ancho: sin desplazamiento horizontal, secciones apiladas y botones de la barra visibles.

## 3. Verificación final

- [x] 3.1 Ejecutar typecheck, lint y build del frontend sin errores y recorrer: `/` sin sesión (landing) → Registrate → login → `/` (Home) → cerrar sesión → `/` (landing), y comprobar que `/canchas` sin sesión redirige a `/login`.
