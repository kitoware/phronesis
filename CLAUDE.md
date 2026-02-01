# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Phronesis is an AI-powered research intelligence platform that:
1. Discovers and analyzes academic papers from arXiv
2. Monitors Series A+ startups to identify pain points
3. Links research findings to startup problems with actionable recommendations

## Commands

```bash
# Development
pnpm dev              # Start Next.js dev server
npx convex dev        # Start Convex backend (runs separately)

# Code Quality
pnpm lint             # ESLint check
pnpm lint:fix         # ESLint auto-fix
pnpm format           # Format with Prettier
pnpm format:check     # Check formatting
pnpm typecheck        # TypeScript check (src only, excludes convex)
pnpm typecheck:src    # TypeScript check with src-specific config

# Build
pnpm build            # Production build
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), shadcn/ui, TailwindCSS
- **Backend**: Convex (real-time serverless database)
- **Auth**: Clerk (with Convex integration via webhooks)
- **LLM**: Anthropic Claude (planned)

### Directory Structure
```
src/
├── app/
│   ├── (auth)/           # Sign-in/sign-up routes
│   ├── (dashboard)/      # Protected dashboard routes
│   ├── api/webhooks/     # Clerk webhook handler
│   └── ConvexClientProvider.tsx  # Convex + Clerk provider
├── components/
│   ├── layout/           # AppShell, Sidebar, Header
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities (cn helper)
└── types/                # TypeScript type definitions

convex/
├── schema.ts             # Database schema (all tables)
├── agents/               # AI agent implementations (stubs)
│   ├── research.ts       # ArXiv paper fetching
│   ├── problemDiscovery.ts
│   ├── researchLinking.ts
│   ├── insightGeneration.ts
│   └── trendAnalysis.ts
├── *.ts                  # Query/mutation modules per table
└── _generated/           # Auto-generated (do not edit)
```

### Key Patterns

**Convex Functions**
- Queries: Real-time data subscriptions
- Mutations: Transactional writes
- Actions: Side-effects (external APIs, LLM calls)
- Internal functions: Prefixed with `internal`, not exposed to client

**Authentication Flow**
1. Clerk handles auth UI (`/sign-in`, `/sign-up`)
2. Clerk webhooks sync user data to Convex via `/api/webhooks/clerk`
3. `ConvexClientProvider` wraps app with `ClerkProvider` + `ConvexProviderWithClerk`
4. Protected routes use Clerk middleware (`src/middleware.ts`)

**Database Schema** (convex/schema.ts)
- `papers`, `paperContent`: ArXiv paper data
- `insights`, `diagrams`: AI-generated analysis
- `startups`, `startupProblems`, `founders`, `implicitSignals`: Startup ecosystem
- `researchLinks`, `solutionReports`: Problem-research connections
- `trends`: Analytics data
- `users`, `bookmarks`: User data
- `agentRuns`: Agent execution tracking

### Path Aliases
- `@/*` maps to `./src/*`

### Separate TypeScript Configs
- `tsconfig.json`: Main config for Next.js (excludes convex/)
- Convex has its own TypeScript handling via `npx convex dev`

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CONVEX_DEPLOYMENT=
```

## Coding standards
- Use TypeScript for all new code
- Follow existing ESLint configuration
- Write tests for all new functions using Jest
- Use functional components with hooks in React
