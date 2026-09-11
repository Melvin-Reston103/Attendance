# Project Guidelines

This is an Angular 21 application (`Attendance`) using standalone components, the new signals API, and Vitest for unit tests.

## Code Style

- TypeScript: single quotes, no semicolons omitted (standard Angular CLI style), 2-space indent — see [.editorconfig](../.editorconfig) and [.prettierrc](../.prettierrc) (printWidth 100, singleQuote).
- Components are standalone (no `NgModule`); use the `imports` array on `@Component` (see [app.ts](../src/app/app.ts)).
- Prefer `signal()` for local component state over plain fields, following [app.ts](../src/app/app.ts).
- `tsconfig.json` enables `strict`, `strictTemplates`, `strictInjectionParameters`, and `noImplicitReturns` — keep new code compliant with these (no `any`, handle all code paths).

## Architecture

- Bootstrap/config lives in [app.config.ts](../src/app/app.config.ts) via `ApplicationConfig` — register new providers (routing, HTTP, etc.) here.
- Routes are declared in [app.routes.ts](../src/app/app.routes.ts) as a flat `Routes` array; currently empty, add feature routes there using lazy `loadComponent`/`loadChildren` where practical.
- The app is newly scaffolded (Angular CLI default structure) — no feature modules, services, or state management exist yet, so new features should establish their own convention (e.g. `src/app/<feature>/`).

## Build and Test

- Install: `npm install`
- Dev server: `npm start` (`ng serve`, http://localhost:4200)
- Build: `npm run build`
- Unit tests: `npm test` (runs `ng test` via Vitest)

## Conventions

- Generate new pieces with Angular CLI schematics (`ng generate component ...`) rather than hand-crafting files, to keep spec files and naming consistent.
- Templates (`.html`) are formatted with Prettier's `angular` parser — don't hand-format inline styles that conflict with it.
