import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest config for the NestJS API.
 *
 * The NestJS DI/decorator machinery relies on `reflect-metadata` and on the
 * `emitDecoratorMetadata` flag which isn't part of Vitest's default
 * transform. We compile the tests through esbuild (default) and load
 * `reflect-metadata` in the setup file.
 *
 * DB-heavy tests are mocked via Vitest's `vi.fn()` — we don't start a real
 * Postgres / Redis for unit tests. E2E tests that need a DB should use a
 * separate config.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
