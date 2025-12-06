# 4G3N7 Agent Development Guidelines

## Build & Test Commands

### Agent (NestJS)
- `cd packages/4g3n7-agent`
- Build: `npm run build`
- Dev: `npm run start:dev` 
- Lint: `npm run lint`
- Test: `npm run test`
- Single test: `npm run test -- --testNamePattern="test_name"`
- Test coverage: `npm run test:cov`
- E2E: `npm run test:e2e`

### UI (Next.js)
- `cd packages/4g3n7-ui`
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`

### Shared
- `cd packages/shared`
- Build: `npm run build`

## Code Style

### Imports
- External libraries first, then internal modules
- Use absolute imports for shared types: `@4g3n7/shared`
- Group related imports with blank lines

### Formatting
- Single quotes, trailing commas
- Prettier config: `{"singleQuote": true, "trailingComma": "all"}`
- ESLint with TypeScript rules, prettier integration

### TypeScript
- Strict mode enabled in shared package
- Use interfaces for public APIs, types for internal
- Prefer explicit return types
- Use `@nestjs/common` decorators

### Naming
- Classes: PascalCase (AgentProcessor)
- Methods/variables: camelCase (currentTaskId)
- Constants: UPPER_SNAKE_CASE (AGENT_SYSTEM_PROMPT)
- Files: kebab-case (agent.processor.ts)

### Error Handling
- Use NestJS built-in exceptions (NotFoundException, etc.)
- Log errors with LoggerService
- Implement proper try/catch in async methods
- Use Zod for input validation

### Database
- Prisma ORM for database operations
- Use PrismaService for database access
- Run migrations: `npm run prisma:dev`
- Generate client: `npx prisma generate`

### File Structure
- Follow NestJS module structure (controller, service, module)
- Shared types in `packages/shared`
- Feature-based organization (agent/, tasks/, messages/)
- Test files co-located with `.spec.ts` suffix

### Dependencies
- Use workspace protocol for internal packages: `@4g3n7/shared`
- Check existing packages before adding new dependencies
- Prefer established libraries (NestJS, Prisma, Zod)