import { defineConfig } from 'vitest/config';

/**
 * Vitest config for @strickin/shared.
 *
 * Only unit tests on pure utilities (formatters, validators, schemas).
 * No Node / DOM env is required — the default `node` env is fine.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{spec,test}.ts'],
  },
});
