import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    // Mismo motivo que en `vitest.config.ts`: metadata de decoradores para el DI de NestJS.
    swc.vite({ module: { type: 'es6' } }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    root: './',
    setupFiles: ['./test/setup-integration.ts'],
    include: ['**/*.integration-spec.ts'],
    // Comparten una base real: no se corren en paralelo.
    fileParallelism: false,
  },
});
