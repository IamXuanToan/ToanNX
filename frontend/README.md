# TOANNX frontend

Next.js 16 (App Router) + TypeScript strict + Tailwind 4 + shadcn/ui (Radix) + next-intl.

```bash
cp .env.example .env.local    # BACKEND_ORIGIN=http://localhost:8000
pnpm install
pnpm dev                      # http://localhost:3000
```

| Lệnh                              | Mục đích                          |
| --------------------------------- | --------------------------------- |
| `pnpm lint` / `pnpm format:check` | ESLint / Prettier                 |
| `pnpm typecheck`                  | `next typegen` + `tsc --noEmit`   |
| `pnpm test`                       | Vitest (unit, i18n)               |
| `pnpm build`                      | Build production                  |
| `pnpm e2e`                        | Playwright (cần backend + DB dev) |

Cấu trúc và quy tắc: xem [../AGENTS.md](../AGENTS.md), [../docs/architecture.md](../docs/architecture.md).
