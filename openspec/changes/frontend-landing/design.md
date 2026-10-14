## Context

Ver proposal.md. `/` es hoy la Home y vive en `app/(protegido)/page.tsx`, bajo un layout que
redirige a `/login` si no hay sesión. La sesión está en `localStorage`, así que la decisión
de qué mostrar en `/` solo puede tomarse en el cliente. Wireframe:
`docs/wireframes/landing-web.png`.

## Goals / Non-Goals

**Goals:**
- Una landing fiel al wireframe, pública y sin sesión.
- Que `/` siga mostrando la Home exactamente igual a quien tiene sesión.
- Que las rutas `/canchas`, `/reservas` y `/canchas/[id]/reservar` sigan protegidas.

**Non-Goals:**
- Imágenes reales: la portada y las disciplinas usan cuadros placeholder.
- Datos reales de contacto y redes del club.
- Redirigir a la Home a quien tiene sesión y abre `/login` o `/registro`.
- Backend real.

## Decisions

1. **`app/page.tsx` decide.** Es una página de servidor con `metadata` que renderiza un
   componente cliente. Ese componente lee la sesión (`leerToken` y `leerClaims`): con claims
   válidos muestra la Home; si no, la landing. Mientras lee la sesión no renderiza nada, para
   evitar un parpadeo de la landing a quien tiene sesión.
2. **Home fuera del layout protegido.** Se elimina `app/(protegido)/page.tsx` (dos páginas no
   pueden resolver a `/`) y `home-client.tsx` pasa a `app/home-client.tsx`, sin cambios de
   comportamiento.
3. **Estructura compartida.** Se extrae `ShellSocio` (navbar y `main` con fondo gris claro) a
   `app/componentes/shell-socio.tsx`. Lo usan el layout protegido, después de su guard, y la
   Home en `/`. Así la Home se ve idéntica a hoy.
4. **Administrador en `/`.** Un administrador con sesión ve la Home, como hasta ahora.
5. **Destinos de los botones, sin sesión:**
   - "Iniciar sesión" y "Ver disponibilidad" llevan a `/login`.
   - "Registrate", "Reservá tu cancha" y "Crear cuenta" llevan a `/registro`.
   - "Ver canchas" de cada disciplina lleva a `/canchas?disciplina=<disciplina>`, que sin
     sesión redirige a `/login` por el guard existente.
6. **Navegación por secciones.** "Disciplinas", "Cómo funciona", "Horarios" y "Contacto" son
   anclas (`#disciplinas`, `#como-funciona`, `#horarios`, `#contacto`) con desplazamiento
   suave. "Contacto" y "Horarios" apuntan al pie.
7. **Texto de Horarios.** "Todos los días, de 16:00 a 22:00", que coincide con las franjas
   del sistema (16:00 a 21:00, de una hora cada una).
8. **Contacto y redes.** El club no definió datos reales: las columnas "Contacto" y "Seguinos"
   muestran "Próximamente" en gris.
9. **Nombre de la disciplina.** La tarjeta de fútbol dice "Fútbol 5", igual que el resto de
   la aplicación, aunque el wireframe diga "Fútbol", para que coincida con el filtro de
   Canchas.
10. **Diseño adaptable.** En pantallas angostas las columnas se apilan y los links de sección
    de la barra se ocultan; "Iniciar sesión" y "Registrate" quedan siempre visibles.

## Risks / Trade-offs

- [Riesgo] Quien tiene sesión ve un instante en blanco al abrir `/` → Mitigación: es el mismo
  comportamiento que ya tiene el layout protegido.
- [Riesgo] Mover la Home puede cambiar su aspecto → Mitigación: se reutiliza la misma
  estructura (`ShellSocio`) y se verifica que la Home no cambia.
- [Riesgo] La decisión por sesión en el cliente no se puede hacer en el servidor → Mitigación:
  aceptable mientras la sesión viva en `localStorage`; al integrar el backend podrá pasar a
  una cookie.
- [Riesgo] "Ver disponibilidad" promete algo que exige sesión → Mitigación: lleva a `/login`;
  se anota como pregunta abierta.

## Estructura visual (`/` sin sesión)

- Todas las secciones en una columna centrada de ancho máximo, fondo blanco salvo "Cómo
  funciona", y separadas por una línea fina.
- **Barra superior:** a la izquierda logo "CD" y "Club Deportivo"; al centro los links
  "Disciplinas", "Cómo funciona", "Horarios" y "Contacto"; a la derecha el botón secundario
  "Iniciar sesión" y el primario oscuro "Registrate".
- **Portada:** dos columnas. A la izquierda, el texto chico en mayúsculas y gris "TENIS ·
  FÚTBOL · PÁDEL", el título grande "Reservá tu cancha en pocos pasos", un párrafo corto en
  gris y dos botones: "Reservá tu cancha" (primario oscuro) y "Ver disponibilidad"
  (secundario). A la derecha, un cuadro placeholder gris con el texto chico "Imagen principal
  (cancha / club)".
- **Nuestras disciplinas** (`#disciplinas`): título centrado y tres tarjetas con borde fino.
  Cada una tiene un cuadro placeholder, el nombre en negrita (Tenis, Fútbol 5, Pádel), una
  línea de descripción en gris y el link subrayado "Ver canchas".
- **Cómo funciona** (`#como-funciona`): banda de fondo gris claro, título centrado y tres
  columnas, cada una con un círculo numerado (1, 2, 3), un título en negrita ("Elegí cancha y
  turno", "Sumá equipamiento si lo necesitás", "Confirmá tu reserva") y dos líneas de
  descripción en gris.
- **Llamado final:** título centrado "Creá tu cuenta y reservá tu primer turno" y el botón
  primario "Crear cuenta".
- **Pie** (`#horarios` y `#contacto`): cuatro columnas. Logo y "Club Deportivo" con una breve
  descripción; "HORARIOS" con el horario; "CONTACTO" y "SEGUINOS" con "Próximamente". Los
  títulos de columna van en mayúsculas, chicos y con espaciado.

## Open Questions

- Datos reales de contacto, redes e imágenes del club.
- Si "Ver disponibilidad" debería mostrar disponibilidad pública sin sesión.
