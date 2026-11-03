# Frontend — Sistema de reservas del club

Aplicación web (Next.js 16, React 19, TypeScript y Tailwind CSS 4) para que los socios reserven canchas y alquilen equipamiento, y para que el administrador gestione canchas, equipamiento, turnos, reservas y pagos.

La aplicación **necesita el backend en ejecución**: no guarda datos propios, todo lo lee y lo escribe a través de su API.

## Requisitos

- Node.js 20 o superior.
- El backend (carpeta `backend/`) levantado, con su base de datos PostgreSQL. Por defecto escucha en `http://localhost:3001`. Para tener datos de prueba, ejecutar el seed del backend.

## Configuración

La URL del backend se indica con la variable `NEXT_PUBLIC_API_URL`:

```bash
cp .env.example .env.local
```

| Entorno | Valor |
| --- | --- |
| Desarrollo | `http://localhost:3001` (es el valor por defecto si no se define la variable) |
| Producción | `https://matchpoint.alquilerespunilla.com.ar/api` |

En producción la variable es **obligatoria** y se fija al compilar (`next build`); en Docker se pasa como argumento de construcción (`NEXT_PUBLIC_API_URL`).

## Cómo levantarlo

```bash
npm install
npm run dev
```

Abrir <http://localhost:3000>. Si el backend no está disponible, las pantallas muestran «No se pudo conectar con el servidor.» con un botón para reintentar.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run start` | Sirve la compilación de producción |
| `npm run typecheck` | Verifica los tipos de TypeScript |
| `npm run lint` | Análisis con ESLint |
| `npm test` | Tests con Vitest (`lib/**/*.test.ts`) |

## Estructura

```text
app/
├── (protegido)/   # pantallas del socio: canchas, reservar, mis reservas
├── admin/         # panel del administrador: resumen, canchas, equipamiento, turnos y reservas
├── componentes/   # componentes compartidos
├── login/ registro/
lib/
├── api.ts            # cliente HTTP del backend y sus funciones
├── adaptadores.ts    # conversión de las respuestas del backend a lo que muestra la interfaz
├── sesion.ts · almacen-sesion.ts · use-sesion.ts   # sesión del usuario
└── fechas.ts         # fechas y horas locales
```

## Sesión

El inicio de sesión devuelve un token que se guarda en `localStorage` junto con los datos del usuario (claves `clubDeportivo.token` y `clubDeportivo.usuario`). Es lo único que el frontend guarda en el navegador. Al cargar la aplicación se borran las claves antiguas de versiones anteriores (reservas, canchas y equipamiento locales), sin tocar la sesión.

> Esta versión de Next.js tiene cambios incompatibles con versiones anteriores: antes de escribir código específico de Next, consultar la guía en `node_modules/next/dist/docs/`.
