/**
 * Runtime Zod schemas shared between client + server.
 *
 * Import a schema here to:
 * - Validate an incoming HTTP request on the server (NestJS ValidationPipe
 *   variant that delegates to `parse()`).
 * - Bind a react-hook-form to the same rules on the client.
 */

export * from './auth.schema';
export * from './product.schema';
export * from './rfq.schema';
