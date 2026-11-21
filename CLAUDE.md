# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Personal site **toannx.com** — monorepo: `backend/` (Django 6 + DRF, PostgreSQL, uv) and `frontend/`
(Next.js 16 App Router, React 19, Tailwind 4, shadcn/ui, TanStack Query, Zustand, next-intl, pnpm).
Docs are written in Vietnamese. Before writing code, read [AGENTS.md](AGENTS.md) (step-by-step recipe for adding a
module on both sides; keep it in sync with this file), [SYSTEM_CONTEXT.md](SYSTEM_CONTEXT.md) (locked-in decisions), and the relevant
`docs/rules/{common,backend,frontend,git}.md`, and [docs/common-catalog.md](docs/common-catalog.md) (every shared
BE/FE piece that already exists).

**Next.js 16 has breaking changes vs. training data** — read the relevant guide in
`frontend/node_modules/next/dist/docs/` before writing Next code (see [frontend/AGENTS.md](frontend/AGENTS.md)).
Note `src/proxy.ts` replaces middleware.

## Core rules (mirror of AGENTS.md "Quy tắc cốt lõi")

- **Keep `AGENTS.md` and `CLAUDE.md` in sync**: when you edit one, update the matching part of the other in the
  same change; the rules in both must agree. If a `docs/rules/` change touches something summarized here, update both.
- **No git actions unless explicitly asked** (no branch, commit, push, merge, branch delete); work on the current
  branch and only suggest a commit message when asked.
- **One unit per file**: one class / component / hook per file, non-exported ones included. Exceptions: an APIView
  file holding `XxxView` + `XxxObjectView`, a model file holding the model + its own field enums, shadcn
  `shares/components/ui/*`, Next special-file exports. Nested classes inside a parent class (`Meta`, enum inside the
  model) are allowed system-wide. Details: rule backend §2.2, rule frontend §2.1.
- **Right layer at every entry point**: views, tasks, commands, signals, middleware, authentication, permission
  classes and recorders call services only, never repositories/ORM. Services/repositories a class uses are created in
  `__init__` (`self.<name>_service`); no `XxxService().method()`/`XxxService.method()` inside methods (rule backend §1, §4, §5.2).
- **Reuse commons, keep the catalog current**: look up [docs/common-catalog.md](docs/common-catalog.md) before
  writing code; if it exists use it, if something close exists extend it, never write a second copy. Adding,
  renaming, removing or changing what a common does (`app/core/`, `src/shares/`, shared parts of `system`/`manage-app`)
  means updating the catalog in the same change (rule common §3.3).
- **SVGs live in `public/`, referenced by path**: save as `frontend/public/<group>/<name>.svg` and render with
  `<Image src={ICON_PATHS.google} />` (constant in `shares/lib/asset-paths.ts` or the module's `constants/asset-paths.ts`);
  no `<svg>`/`<path>` in `.tsx`, no inline-SVG wrapper components, no SVG data URIs (rule frontend §3.2).
- **No `toannx` prefix in technical names**: cookie names, localStorage/sessionStorage keys, the variables/constants
  holding those keys, headers, query/cache keys and env vars never use `toannx_`/`toannx-`/`toannx:`/`TOANNX_`
  (`access_token`, `novel_reader_settings`, `READER_SETTINGS_KEY`). The project name only appears in visible content,
  the domain, the DB name and seed data (rule common §3).
- **Check the rules of every file you open**: fix violations in a file you open or edit and list them in the report;
  if the fix spreads to many files or changes the API contract, report first.
- **Only check what you changed**: format/lint/typecheck the edited files and run the related tests only (the
  endpoint's `test_<resource>_<action>_api.py`, the matching Vitest file / E2E spec). Run the whole suite
  (`scripts/check-all.*`, full `pnpm e2e`) only when the user asks (rule common §7).
- Stay in scope, no new dependencies without approval, docstrings/comments in Vietnamese. Task prompt template:
  [prompt.md](prompt.md).
- **Single-row bulk action bar**: `TableBulkBar` and any multi-select bulk bar must stay on a single row (`min-h-12 w-full flex items-center justify-between gap-3 rounded-xl border px-3.5 py-1.5`), never wrap in a `<Card>` or flex-col container that causes a 2-tier centered layout; left has count badge + divider + Deselect, right has action buttons.
- **Run `graphify update .` only after a large change** (module added/removed/merged, folder restructure, ~10+ files
  moved/renamed, architectural refactor) **or when the graph is stale** (`graphify-out/graph.json` older than 7 days,
  or `graphify query` returns files/symbols that no longer exist). Skip it for small edits.

## Commands

Backend (run from `backend/`; needs PostgreSQL and `backend/.env` — tests never use SQLite):
```bash
uv sync
uv run python manage.py runserver 8000
uv run python manage.py migrate            # also syncs permissions/system roles (post_migrate)
uv run python manage.py sync_iam           # re-sync permissions/roles manually
uv run python manage.py seed_local         # local only (DEBUG): sync_iam + superuser toannx / nxtoan2k4@gmail.com
uv run pytest -q                           # all tests (creates test_toannx DB)
uv run pytest app/system/tests/test_role_api.py::test_name   # single test
uv run ruff format --check . && uv run ruff check . && uv run mypy .
uv run python manage.py spectacular --validate --fail-on-warn     # OpenAPI must be warning-free
```

Frontend (run from `frontend/`):
```bash
pnpm dev                                   # http://localhost:3000 → /vi
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build
pnpm test tests/unit/<file>.test.ts        # single Vitest file
pnpm e2e                                   # Playwright; own DB toannx_e2e (prepare_e2e), backend 8001 + frontend 3001 (.next-e2e)
pnpm api:types                             # regenerate src/shares/types/api-schema.gen.ts from OpenAPI (CI fails if stale)
pnpm e2e tests/e2e/auth.spec.ts            # single spec
```

Whole repo (only when the user asks): `./scripts/check-all.sh` (or `pwsh scripts/check-all.ps1`) — format →
lint/type → backend tests → frontend lint/typecheck/unit/build; E2E runs separately. On Windows, `scripts\dev.bat` migrates and starts both servers.

## Architecture

Topology: browser only talks to `toannx.com`; Next rewrites `/api/v1/*` to Django (`api.toannx.com`). Cookies are
host-only, no CORS in production. Auth = access JWT (10 min, cookie `access_token`, tied to a session `sid`) +
rotating refresh token stored as HMAC; every request checks the session is still live. Django CSRF
(`csrftoken` cookie + `X-CSRFToken`) on all state-changing cookie requests.

### Backend layering — `url → view → service → repository → ORM`
- **One class per file**, snake_case file named after the class — no serializers inside views (rule backend §2.2).
  Exceptions: an APIView file `<resource>_view.py` holds exactly `XxxView` + `XxxObjectView`; a model file
  `models/<model>.py` may hold the model plus its own field enums. Nested classes (`Meta`, `class Status(TextChoices)`
  inside the model) are allowed everywhere; enums shared across models go in `constants/`.
- **Every entry point calls services only**: views, tasks, management commands, signals, middleware,
  authentication/permission classes, recorders never touch repositories/ORM. Every service/repository a class uses is
  created in `__init__` (`self.<name>_service`) — no `XxxService().method()` or static `XxxService.method()` calls inside
  methods (e.g. `AuthCookieService` too).
  `app/core/` holds base classes and is not a Django app.
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
  Models get change history by inheriting `JournalTracker` before `CoreModel`. Soft delete appends
  `_deleted_<ms>` to unique text fields. Every route is called by `core/tests/test_endpoint_access.py`
  (anonymous 401, no permission 403); public/login-only views must be listed there. Lists paginate only when
  `page`/`page_size` is sent. Input via `@validate_request` + `serializers/validates/`; output via `serializers/responses/`.
- Responses use a fixed envelope (`{success, data, meta}` / `{success:false, error:{code,...}}`) with stable
  error codes (core `ErrorCode` + per-module `constants/<m>_error_code.py`); the frontend translates by code.
- **Module registry**: each app in `app/` subclasses `CoreModuleConfig` (label = module code) and exposes a
  `ModuleDescriptor` in `module.py` (permissions, dependencies); registration is automatic. Installed modules are
  always on: there is no module table, runtime enable/disable or icon on the backend. How modules are shown
  (groups, icons, order) is declared statically in the FE `manage-app` module.
- Permissions source of truth is the IAM tables (`system_role`, `system_permission`, ...), not Django groups/`PermissionsMixin`.
  Superuser bypasses permission checks; `is_staff` only gates the FE admin shell and is never checked by the API.

### Frontend layering — `page → View → component(+own hook) → module hook (React Query) → service → apiClient`
- No repository layer on the FE. Services are split **one file per backend model** (`system/services/role.service.ts`
  ↔ `system/services/role_service.py`); never one merged `<module>.service.ts`. CRUD comes from `createCrudService`,
  keys from `createResourceKeys`, writes via `useResourceMutation`, lists via `useListQuery`.
- **One component per `.tsx`, one hook per `use-*.ts`, one class per file** — private sub-components and hooks
  included; no hooks inside `.tsx`; context split into `-context.ts` / `-provider.tsx` / `use-*.ts`. Only
  shadcn `ui/*` and Next special-file exports are exempt (rule frontend §2.1).
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
  Record load errors use `QueryErrorState` (404 → "not found" + back link, no retry). FE types must match
  OpenAPI field sets (`tests/unit/api-contract.test.ts`, `ApiModel<"…Response">`).
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

**Agents never create branches, commit, push, merge or delete branches unless explicitly asked** — work on the
current branch and only suggest a commit message when asked. When the user does ask: branches from `develop` as `feat|fix|ref|docs|test|chore/...-<short-name>` (lowercase ASCII). Commits:
`<type>(<scope>): <imperative english, lowercase, no period, ≤72 chars>`, types include `ref` (refactor); scopes are
module names with hyphens (`utilities`, `manage-app`) or `core`/`shares`/`i18n`/`backend`/`frontend`/`repo`.
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
- Run `graphify update .` (AST-only, no API cost) only after a large change or when the graph is stale — see
  "Core rules" above; small edits do not need it.
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
