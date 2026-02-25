# SVG Spawn

AI-powered SVG animation tool. Upload an SVG, describe the animation you want in plain text, and get production-ready animated SVGs with SMIL and CSS animations.

## Status

**MVP complete** — all 7 implementation phases done.

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Project Scaffolding + Testing Infrastructure | Done |
| 2 | Core Types, Schemas & Data Model (Zod) | Done |
| 3 | SVG Processing Pipeline | Done |
| 4 | Animation Plan Compiler (IR to SMIL/CSS) | Done |
| 5 | AI Integration (Gemini Client + Prompts) | Done |
| 6 | Frontend UI (Linear Mode + Graph View) | Done |
| 7 | Backend API, Job System & Integration | Done |

**Test coverage:** 315 unit tests (Vitest) + 22 E2E tests (Playwright) = 337 total, all passing.

## Architecture

pnpm monorepo with Turborepo:

```
svg-spawn/
  apps/
    web/                    # Next.js 15 App Router frontend
  packages/
    core/                   # Shared types, Zod schemas, constants
    svg-pipeline/           # SVG parsing, sanitization, normalization, complexity scoring
    compiler/               # AnimationPlan IR -> SMIL/CSS compilation
    ai-client/              # Gemini AI integration, prompt strategy, retry logic
  e2e/                      # Playwright E2E tests
```

**Package dependency graph:**
```
@svg-spawn/core          <- no internal deps (Zod only)
@svg-spawn/svg-pipeline  <- @svg-spawn/core
@svg-spawn/compiler      <- @svg-spawn/core
@svg-spawn/ai-client     <- @svg-spawn/core, svg-pipeline, compiler
@svg-spawn/web (app)     <- all packages
```

## Tech Stack

- **Runtime:** Node.js 20, pnpm 10, TypeScript 5.5+ (strict)
- **Framework:** Next.js 15 (App Router, Turbo dev)
- **Styling:** Tailwind CSS v4
- **State:** Zustand
- **Validation:** Zod
- **AI:** Google Gemini (with mock client for testing)
- **SVG Parsing:** fast-xml-parser
- **Database:** PostgreSQL 16, Drizzle ORM (with in-memory fallback for dev)
- **Auth:** better-auth (Google + GitHub OAuth)
- **Testing:** Vitest (unit), Playwright (E2E)
- **Build:** Turborepo
- **Infra:** Docker Compose (local Postgres), Terraform (AWS dev)

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 10
- Docker (optional, for local PostgreSQL)

### Setup

```bash
# Install dependencies
pnpm install

# Run the dev server (works without a database — uses in-memory store)
pnpm dev

# Open http://localhost:3000
```

### With PostgreSQL (optional)

```bash
# Start local Postgres via Docker Compose
docker compose up -d

# Push the database schema
DATABASE_URL=postgresql://svgspawn:svgspawn@localhost:5433/svgspawn \
  pnpm --filter @svg-spawn/web db:push

# Run dev server with persistence + auth
DATABASE_URL=postgresql://svgspawn:svgspawn@localhost:5433/svgspawn pnpm dev
```

### Environment Variables

Copy the example env file and add your Gemini API key:

```bash
cp apps/web/.env.example apps/web/.env.local
```

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | — | Google Gemini API key (optional, falls back to mock) |
| `GEMINI_MODEL_ID` | `gemini-2.5-pro` | Gemini model to use |
| `MAX_CREDITS_FREE` | `50` | Free tier generation limit per workspace |
| `DATABASE_URL` | — | PostgreSQL connection string (enables persistence + auth) |

The app works without any env vars — it falls back to mock AI generation and in-memory storage for development.

## Development

```bash
# Run all unit tests
pnpm test

# Run E2E tests
pnpm e2e

# Type check all packages
pnpm type-check

# Format code
pnpm format
```

### Test Breakdown

| Package | Tests |
|---------|-------|
| `@svg-spawn/core` | 99 |
| `@svg-spawn/svg-pipeline` | 33 |
| `@svg-spawn/compiler` | 71 |
| `@svg-spawn/ai-client` | 35 |
| `@svg-spawn/web` | 77 |
| E2E (Playwright) | 22 |
| **Total** | **337** |

The web tests include 38 API route handler tests covering all 7 endpoints (auth, validation, success paths, error cases).

## Key Features (MVP)

- **SVG Upload** — Drag-and-drop with sanitization (strips scripts, event handlers, XSS vectors)
- **Complexity Gating** — Rejects SVGs that are too complex for reliable animation
- **AI Animation** — Describe animations in plain text, get SMIL/CSS output
- **10 Effect Types** — Bounce, fade, slide, rotate, scale, draw-on, pulse, shake, float, color-cycle
- **Linear Wizard** — Step-by-step flow: Upload -> Prompt -> Preview -> Export
- **Graph View** — Node-based canvas for branching and comparing animation variations
- **Animated Preview** — Play/pause/speed controls for reviewing animations
- **Export** — Download animated SVGs directly
- **Accessibility** — `prefers-reduced-motion` variants auto-generated
- **Credit System** — Free tier with generation limits

## What's Not Yet Implemented

These are defined in the full spec (`spec.md`) but not yet built:

- Real-time SSE for job progress
- Morph animation mode (before/after SVG transitions)
- Element picker / fine-grained targeting
- S3 storage for SVG assets
- Production deployment configuration
