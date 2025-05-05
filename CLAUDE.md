# CLAUDE.md - Guidelines for Claude and Other Coding Agents

## Build/Test/Lint Commands
- Build: `npm run build` (compiles TypeScript to JS in dist/)
- Run: `npm start` (executes src/index.js)
- Test all: `npm test` (runs Jest tests)
- Test single: `npx jest path/to/test.test.ts` or `npm test -- -t "test name pattern"`
- Lint: `npm run lint` (use this before commits)
- Search: `npm run search` (executes test-search.sh)

## Code Style Guidelines
- **TypeScript**: Use strict mode, ES2020 features, proper type annotations
- **Imports**: Group imports (built-in, external, internal), sort alphabetically
- **Formatting**: 2-space indentation, semicolons required, max 100 chars per line
- **Naming**: camelCase for variables/functions, PascalCase for classes/interfaces
- **Error Handling**: Use try/catch with specific error types, avoid generic catches
- **Types**: Prefer interfaces for objects, avoid `any`, use proper return types
- **Functions**: Keep functions small, use descriptive names, add JSDoc for complex logic
- **File Organization**: One component per file, group related functionality
- **Testing**: Write unit tests for all business logic, mock external dependencies