// Domain barrel. The layers above import from this single entry point.
//
// CRITICAL: nothing under `domain/` may import anything from `application/`,
// `infrastructure/`, `presentation/`, `@nestjs/*`, `@prisma/client`, or any
// HTTP/ORM library. Keep this layer pure TypeScript.

export * from './entities';
export * from './value-objects';
export * from './events';
export * from './errors';
export * from './repositories';
