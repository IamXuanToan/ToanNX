# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Personal site **toannx.com** — monorepo: `backend/` (Django 6 + DRF, PostgreSQL, uv) and `frontend/`
(Next.js 16 App Router, React 19, Tailwind 4, shadcn/ui, TanStack Query, Zustand, next-intl, pnpm).
Docs are written in Vietnamese. Before writing code, read [AGENTS.md](AGENTS.md) (step-by-step recipe for adding a
module on both sides), [SYSTEM_CONTEXT.md](SYSTEM_CONTEXT.md) (locked-in decisions), and the relevant
`docs/rules/{common,backend,frontend,git}.md`.

**Next.js 16 has breaking changes vs. training data** — read the relevant guide in
`frontend/node_modules/next/dist/docs/` before writing Next code (see [frontend/AGENTS.md](frontend/AGENTS.md)).
Note `src/proxy.ts` replaces middleware.

## Commands

Backend (run from `backend/`; needs PostgreSQL and `backend/.env` — tests never use SQLite):
```bash
uv sync
uv run python manage.py runserver 8000
uv run python manage.py migrate            # also syncs permissions/system roles (post_migrate)
uv run python manage.py sync_iam           # re-sync permissions/roles manually
uv run python manage.py seed_local         # local only (DEBUG): sync_iam + superuser toannx / nxtoan2k4@gmail.com
uv run pytest -q                           # all tests (creates test_toannx DB)
uv run pytest app/modules/iam/tests/test_role_api.py::test_name   # single test
uv run ruff format --check . && uv run ruff check . && uv run mypy .
uv run python manage.py spectacular --validate --fail-on-warn     # OpenAPI must be warning-free
```

Frontend (run from `frontend/`):
```bash
pnpm dev                                   # http://localhost:3000 → /vi
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build
pnpm test tests/unit/<file>.test.ts        # single Vitest file
pnpm e2e                                   # Playwright; auto-starts backend 8000 + frontend 3000 against dev DB
pnpm e2e tests/e2e/auth.spec.ts            # single spec
```

Whole repo: `./scripts/check-all.sh` (or `pwsh scripts/check-all.ps1`) — format → lint/type → backend tests →
frontend lint/typecheck/unit/build; E2E runs separately. On Windows, `scripts\dev.bat` migrates and starts both servers.

## Architecture

Topology: browser only talks to `toannx.com`; Next rewrites `/api/v1/*` to Django (`api.toannx.com`). Cookies are
host-only, no CORS in production. Auth = access JWT (10 min, cookie `access_token`, tied to a session `sid`) +
rotating refresh token stored as HMAC; every request checks the session is still live. Django CSRF
(`csrftoken` cookie + `X-CSRFToken`) on all state-changing cookie requests.

### Backend layering — `url → view → service → repository → ORM`
- **One class per file**, snake_case file named after the class. `app/core/` holds base classes and is not a Django app.
- Views never touch repositories/ORM; services hold business rules and get dependencies via constructor;
  repositories (subclass `CoreRepository`) are the only DB layer and set audit fields (`created_by`/`updated_by`/
  `deleted_by`) — `Model.save()`, `QuerySet.update()` and `bulk_update()` do not.
  Delete is soft by default (`delete`/`delete_where`; base `get_queryset` hides soft-deleted rows); hard delete
  only when truly needed, via explicit `hard_delete`/`hard_delete_where`.
- Only two view bases: `CoreApiView` (non-CRUD, `@require_permission` per method) and `CoreModelViewSet`
  (CRUD + opt-in `bulk-update`/`bulk-delete`/`history` actions, `action_permissions` default DENY). Defaults come from
  settings (`IsActiveAuthenticated` + `HasIamPermission`, `BucketThrottle` + `RATE_LIMITS`); public or login-only
  views override `permission_classes` per the table in `core_api_view.py` — never add new base view classes.
  Services subclass `CoreCrudService` and declare `owner_field`/`manage_all_permission`/`owner_quota_setting`.
  Models get change history by inheriting `JournalTracker` before `CoreModel`. Lists paginate only when
  `page`/`page_size` is sent. Input via `@validate_request` + `serializers/validates/`; output via `serializers/responses/`.
- Responses use a fixed envelope (`{success, data, meta}` / `{success:false, error:{code,...}}`) with stable
  error codes (core `ErrorCode` + per-module `constants/<m>_error_code.py`); the frontend translates by code.
- **Module registry**: each app in `app/modules/` subclasses `CoreModuleConfig` (label = module code) and exposes a
  `ModuleDescriptor` in `module.py` (permissions, dependencies); registration is automatic. Installed modules are
  always on: there is no module table, runtime enable/disable or icon on the backend. How modules are shown
  (groups, icons, order) is declared statically in the FE `manage-app` module.
- Permissions source of truth is the IAM tables (`iam_role`, `iam_permission`, ...), not Django groups/`PermissionsMixin`.
  Superuser bypasses permission checks; `is_staff` only gates the FE admin shell and is never checked by the API.

### Frontend layering — `page → View → component(+own hook) → module hook (React Query) → service → apiClient`
- No repository layer on the FE. Services are split **one file per backend model** (`iam/services/role.service.ts`
  ↔ `iam/services/role_service.py`); never one merged `<module>.service.ts`. CRUD comes from `createCrudService`,
  keys from `createResourceKeys`, writes via `useResourceMutation`, lists via `useListQuery`.
- `app/**/page.tsx` and `layout.tsx` only declare metadata (`createPageMetadata` from `shares/lib/seo.ts`), await
  params and render a module View/Layout — no hooks, state or UI markup. Views only compose components and check
  permissions (`usePermission`/`PermissionGate`); data fetching, loading and error states live in components + hooks.
- Feature code lives in `src/modules/<module>/{views,components,hooks,services,constants,schemas,types,messages}`
  plus `navigation.ts`. Each module owns `constants/{routes,api-endpoints,query-keys}.ts` (`<M>_ROUTES`,
  `<M>_PATHNAMES`, `<M>_API_ENDPOINTS`, `<m>Keys`); nothing of that lives in `shares/`. The only shared API paths are
  `shares/lib/api/session-paths.ts`, used by `apiClient` itself for CSRF/refresh.
- UI standards (rule frontend §3.1): every control is 40px (`h-10`, `rounded-xl`); every select is `SelectField`
  (auto-searchable from 8 options); every table filter is a multi-select `FilterSelect` (backend filters accept
  comma-separated values via `app/core/filters/*`); every table is `DataTable` (one card per row below `md`,
  pagination via its `pagination` prop → `DataPagination`, extra row actions via `rowActions`, status toggles via
  `TableStatusSwitch` only); create/edit/detail share ONE form component per resource (`UserForm`, `RoleForm`)
  built with `FormPage` (sticky header card, no back arrow — Cancel goes back) + `FormLayout` + `FormSection` + `FormActions`
  (buttons portal into the sticky page header; submit via `FormSubmitButton`; required fields use
  `FormField required` → red `*`), never dialogs;
  relations (roles, permissions) are picked with checkboxes and synced on Save via `useSync…`; any
  list of selectable items (roles, permissions, flags) renders through `ChoiceList` / `ChoiceGroups`; other modules plug into a form through an `extensions` slot + `useFormExtension`;
  missing shared UI goes into a new `shares/components/common/<name>/` folder; no intro/policy sentences under titles.
  Rich text is Tiptap JSON only: `TiptapEditor` to edit, `TiptapContent` to render; modules add editor inserts
  through the `editorPlugins` slot (`useTiptapInsertItem`). Inline create of a related resource uses `FormDialog`
  around that resource's single form.
- `src/shares/` holds only module-agnostic code and must not import modules. Admin shell (`AdminShell`, sidebar,
  launcher, `admin-navigation.ts`) lives in `modules/manage-app`; public pages, header and 404 in `modules/home`.
- `apiClient` (`src/shares/lib/api/`) converts camelCase ⇄ snake_case, attaches CSRF/request id, does single-flight
  refresh on 401 and one CSRF retry on 403 `AUTH_CSRF_FAILED`.
- i18n: `vi` default, `en`; URLs are translated (`/vi/quan-tri` ↔ `/en/admin`); `src/i18n/routing.ts` merges every
  module's `<M>_PATHNAMES`.
  New message namespaces must be registered in `src/i18n/messages.ts` and `src/global.d.ts`.
- Admin navigation: each module's `navigation.ts` exports an `AdminModuleNavigation` registered in
  `ADMIN_MODULE_NAVIGATION` (`modules/manage-app/constants/admin-navigation.ts`), keyed by backend module code;
  each module declares its own `group` and lucide `icon`. `tests/unit/module-registry.test.ts` fails if a module is
  not registered everywhere.

## Git

Branches from `develop` as `feat|fix|ref|docs|test|chore/...-<short-name>` (lowercase ASCII). Commits:
`<type>(<scope>): <imperative english, lowercase, no period, ≤72 chars>`, types include `ref` (refactor); scopes are
module names with hyphens (`short-links`, `custom-pages`) or `core`/`shares`/`i18n`/`backend`/`frontend`/`repo`.
Hooks in `.githooks` enforce this (`git config core.hooksPath .githooks`). See [docs/rules/git.md](docs/rules/git.md).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

`graphify` (PyPI `graphifyy`) is installed per-project as a backend dev dependency (`uv sync` in `backend/`), not
globally. If `backend/.venv/Scripts` is not on PATH, run it as `uv run --project backend graphify <command>` from the
repo root.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
