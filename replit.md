# Bot WS Store

Painel de administração web + Discord bot para gerenciar um servidor Discord brasileiro, com moderação, tickets, sorteios, cargos selecionáveis, XP/gamificação e anúncios.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/bot-dashboard run dev` — run the web dashboard (port 25712)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (`artifacts/api-server`)
- Web: React + Vite + Tailwind + shadcn/ui (`artifacts/bot-dashboard`)
- DB: PostgreSQL + Drizzle ORM (`lib/db`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Generated Zod schemas: `@workspace/api-zod` (`lib/api-zod`)
- Generated React Query hooks: `@workspace/api-client-react` (`lib/api-client-react`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — all DB table definitions (warns, tickets, sorteios, roles, xp, anuncios, config, logs, activity)
- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/bot-dashboard/src/pages/` — all dashboard pages
- `artifacts/bot-dashboard/src/components/layout.tsx` — sidebar nav

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → Zod schemas + React Query hooks
- All frontend API calls use generated hooks from `@workspace/api-client-react`; never raw fetch
- All server-side validations use Zod schemas from `@workspace/api-zod`
- Permanent dark mode — deep navy (`222 47% 7%`) + electric blue (`223 100% 65%`)
- Bot dashboard at previewPath `/`; API server at `/api`

## Product

- **Dashboard**: visão geral com stats em tempo real (membros, tickets, warns, XP, sorteios)
- **Membros**: lista paginada com busca, XP e warns por membro
- **Moderação**: criar/remover warns, ver logs de moderação
- **Tickets**: abrir/fechar/reabrir tickets de suporte
- **Sorteios**: criar giveaways, sortear vencedores
- **Cargos**: cargos selecionáveis com emoji e cor
- **Gamificação**: leaderboard XP, editar XP/level por membro
- **Anúncios**: enviar comunicados com embed colorido e ping de cargo
- **Config**: prefixo do bot, canais, cargos, XP multiplier

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After adding new DB schema files, always run `pnpm run typecheck:libs` before leaf artifact checks — stale lib declarations cause missing export errors
- Dynamic imports (`import("drizzle-orm")`) in route handlers don't work; always import at top of file
- Bot dashboard uses `wouter` for routing; `<Link>` renders as `<a>` so never nest another `<a>` inside it

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
