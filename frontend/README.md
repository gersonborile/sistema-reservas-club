This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Variables de entorno

El frontend toma la URL del backend de `NEXT_PUBLIC_API_URL` (sin sufijo de versión,
porque el backend no tiene prefijo global). Copiá `frontend/.env.example` a
`frontend/.env.local` y ajustá el valor según el entorno:

- **Desarrollo local**: `http://localhost:3001`. Si la variable no está definida, el
  frontend usa ese valor por defecto solo fuera de producción.
- **Producción**: `https://matchpoint.alquilerespunilla.com.ar/api` (Caddy quita el
  prefijo `/api` antes de llegar al backend).

En producción la variable es obligatoria: sin ella el cliente no puede armar las
peticiones. Después de cambiar el valor hay que reiniciar `npm run dev` o volver a
construir con `npm run build`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
