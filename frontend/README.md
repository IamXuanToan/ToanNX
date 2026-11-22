# ToanNX frontend

Next.js 16 (App Router) + TypeScript strict + Tailwind 4 + shadcn/ui (Radix) + next-intl.

```bash
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:8001
pnpm install
pnpm dev -p 3001              # http://localhost:3001
```

| Lệnh                              | Mục đích                          |
| --------------------------------- | --------------------------------- |
| `pnpm lint` / `pnpm format:check` | ESLint / Prettier                 |
| `pnpm typecheck`                  | `next typegen` + `tsc --noEmit`   |
| `pnpm test`                       | Vitest (unit, i18n)               |
| `pnpm build`                      | Build production                  |
| `pnpm e2e`                        | Playwright (cần backend + DB dev) |

Cấu trúc và quy tắc: xem [../AGENTS.md](../AGENTS.md), [../docs/architecture/architecture.md](../docs/architecture/architecture.md).
