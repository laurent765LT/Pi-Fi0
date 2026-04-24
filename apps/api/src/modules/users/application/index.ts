// Application barrel.
//
// Dependency rule: this layer may import ONLY from `../domain/*` (and
// framework plumbing like `@nestjs/common` for `@Injectable` / `@Inject`).
// It must not import from `infrastructure/` or `presentation/`.

export * from './commands';
export * from './queries';
export * from './dtos';
export * from './mappers';
export * from './ports';
