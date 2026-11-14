# Graph Report - toannx  (2026-11-14)

## Corpus Check
- 594 files · ~88,364 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 6, .example 1, .lock 1)

## Summary
- 3276 nodes · 8160 edges · 254 communities (76 shown, 178 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 640 edges (avg confidence: 0.93)
- Token cost: 173,764 input · 0 output

## Community Hubs (Navigation)
- IAM Sync & Filters
- short_link_service.py
- typing
- use-iam-mutations.ts
- BusinessRuleError
- user_service.py
- package.json
- RolePermissionService
- CoreRepository Methods
- FE Auth & Admin Navigation
- django_db
- auth_service.py
- Role
- Sidebar & Sheet UI
- next-intl
- PermissionDefinition
- CoreValidateSerializer
- FE Forms & Dialogs
- FE Tooling Dev Deps
- BaseApiTestCase
- Attachment
- use-modules.ts
- role_permission_view.py
- page_block_collection_view.py
- permission_helper.py
- PageBlockService
- response_body.py
- user-table.tsx
- FE API Client
- auth_result.py
- Health Checks
- Pytest Fixtures
- SystemModuleService
- cookie_jwt_authentication.py
- OpenAPI Schema Tests
- PermissionRule Tests
- User
- Admin Shell Layout
- user.py
- ShortLink
- shadcn Config
- TestModuleConventions
- User Context
- user_factory.py
- Test Me
- ValidationError
- SystemModule
- Page
- Test Attachment Api
- Tsconfig
- global.d.ts
- .assert_success
- system_module_service.py
- AuthSession
- Core Page Number Pagination
- svg_inspector.py
- current_user_response_serializer.py
- Requirements
- Readme
- Response Envelope
- Test Admin Access
- TestPageApi
- routing.ts
- Case Conversion
- Alert Dialog
- Architecture
- OwnedCrudService
- Request Context Middleware
- test_module_conventions.py
- Cookie Jwt Authentication Scheme
- CoreResponse
- Manage
- Backend rules (Django + DRF)
- Architecture 2
- normalize_slug
- Test Login
- I18N
- Architecture 3
- Core Auto Schema
- dropdown-menu.tsx
- ShortLinkService
- Authorization
- Package
- grant
- module_permissions.py
- CoreValidator
- AuthorizationError
- select.tsx
- Foundation Report
- Request Context Filter
- Test Responses
- Frontend contract — Short Links & Custom Pages
- OwnedModelViewSet
- Common rules (backend + frontend)
- CoreErrorResponse
- enforce_csrf
- messages.test.ts
- handler404
- Any
- CsrfProtected
- Pnpm Workspace
- .Prettierrc
- RefreshTokenRepository
- 0002_seed_system_roles.py
- Proxy
- Vercel
- Check All
- Authorization 2
- Pyproject
- System Context
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `User` - 127 edges
2. `CoreResponse` - 66 edges
3. `Role` - 60 edges
4. `CoreRepository` - 58 edges
5. `ErrorCode` - 54 edges
6. `next-intl` - 52 edges
7. `NotFoundError` - 50 edges
8. `AuthSession` - 48 edges
9. `UserFactory` - 46 edges
10. `react` - 46 edges

## Surprising Connections (you probably didn't know these)
- `Lỗi và trạng thái giao diện` --references--> `hasPermission()`  [INFERRED]
  docs/reports/frontend-module-contract.md → frontend/src/modules/auth/services/auth.service.ts
- `django-cors-headers 4.9.0` --conceptually_related_to--> `Single-origin topology (Next.js rewrite to Django)`  [AMBIGUOUS]
  backend/requirements.txt → SYSTEM_CONTEXT.md
- `TOANNX Foundation Report (HTML)` --references--> `Favicon app/icon.svg: T logo icon`  [EXTRACTED]
  docs/reports/foundation-report.html → frontend/src/app/icon.svg
- `Backend flow url -> view -> service -> repository` --semantically_similar_to--> `View / Service / Repository layering`  [INFERRED] [semantically similar]
  AGENTS.md → docs/architecture.md
- `Frontend rules (Next.js 16)` --conceptually_related_to--> `Frontend AGENTS.md (Next.js agent rules)`  [INFERRED]
  docs/rules/frontend.md → frontend/AGENTS.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Backend API view base class hierarchy** — docs_architecture_coreapiview, docs_architecture_publicapiview, docs_architecture_csrfpublicapiview, docs_architecture_authenticatedapiview, docs_architecture_adminapiview, docs_architecture_coremodelviewset, docs_architecture_adminmodelviewset [EXTRACTED 1.00]
- **Architecture decisions derived from PMS audit** — docs_reference_audit_coremodel, docs_reference_audit_corerepository, docs_reference_audit_request_context, docs_reference_audit_single_exception_handler, docs_reference_audit_rbac_default_deny, docs_reference_audit_explicit_soft_delete [EXTRACTED 1.00]
- **Cookie session authentication and refresh flow** — docs_authentication_access_token, docs_authentication_refresh_token, docs_authentication_refresh_rotation, docs_authentication_cookiejwtauthentication, docs_authentication_csrf, docs_authentication_silent_refresh, docs_architecture_api_client [EXTRACTED 1.00]
- **TOANNX T brand logo variants** — frontend_public_brand_logo_icon, frontend_public_brand_logo_horizontal, frontend_public_brand_logo_mono, frontend_src_app_icon [EXTRACTED 1.00]
- **Default-deny permission enforcement chain** — docs_rules_backend_require_permission, docs_rules_backend_module_descriptor, docs_rules_backend_auto_grant, docs_rules_frontend_permission_gate, docs_rules_common_backend_enforces_auth [INFERRED 0.85]
- **Permission declaration and enforcement pipeline** — docs_architecture_moduledescriptor, docs_architecture_permissiondefinition, system_context_sync_iam, docs_authorization_auto_grant, docs_authorization_permissionchecker, docs_authorization_require_permission, docs_authorization_permissionrule [INFERRED 0.85]

## Communities (254 total, 178 thin omitted)

### Community 0 - "IAM Sync & Filters"
Cohesion: 0.04
Nodes (10): CurrentUserService, IamPermissionBackend, RoleFilter, Meta, Command, RoleAutoGrant, IamSyncService, _code() (+2 more)

### Community 2 - "typing"
Cohesion: 0.06
Nodes (14): CsrfPublicApiView, CurrentUserResponseSerializer, LogoutAllResponseSerializer, LoginValidateSerializer, AuthCookieService, AuthSessionService, LoginView, LogoutAllView (+6 more)

### Community 3 - "use-iam-mutations.ts"
Cohesion: 0.10
Nodes (30): useUser(), useRoleForm(), useRolePermissionsCard(), useRoleTable(), useUserRolesCard(), useCreateRole(), useIamMutationHandlers(), useRolePermissionMutation() (+22 more)

### Community 4 - "BusinessRuleError"
Cohesion: 0.04
Nodes (15): BusinessRuleError, CoreModel, Meta, PermissionFilter, Meta, Permission, Meta, RolePermission (+7 more)

### Community 5 - "user_service.py"
Cohesion: 0.05
Nodes (5): CoreCrudService, UserRepository, PasswordValidator, AttachmentRepository, AttachmentService

### Community 6 - "package.json"
Cohesion: 0.06
Nodes (54): dependencies, class-variance-authority@^0.7.1, cn@^0.5.2, @hookform/resolvers@^7.0.6, lucide-react@^1.72.0, next-intl@^4.15.1, next-themes@^0.4.6, radix-ui@^1.8.1 (+46 more)

### Community 9 - "FE Auth & Admin Navigation"
Cohesion: 0.12
Nodes (24): useAdminShell(), useRouter, useLoginForm(), useUserMenu(), useCurrentUser(), useLogin(), useLogout(), useHasRole() (+16 more)

### Community 10 - "django_db"
Cohesion: 0.05
Nodes (15): Migration, Migration, Migration, attachment_upload_path(), Migration, RateLimitBucket, Meta, RefreshToken (+7 more)

### Community 11 - "auth_service.py"
Cohesion: 0.08
Nodes (4): AuthenticationError, AccessTokenService, AccessClaims, get_client_ip()

### Community 12 - "Role"
Cohesion: 0.04
Nodes (22): ErrorCode, AppException, ConflictError, NotFoundError, RateLimitError, test_audit_from_context(), test_bulk_create_sets_audit(), test_create_and_update_audit() (+14 more)

### Community 13 - "Sidebar & Sheet UI"
Cohesion: 0.10
Nodes (26): AppSidebar(), Sheet(), SheetContent(), SheetDescription(), SheetHeader(), SheetOverlay(), SheetPortal(), SheetTitle() (+18 more)

### Community 14 - "next-intl"
Cohesion: 0.10
Nodes (41): nextConfig, withNextIntl, next@16.4.6, ModulesPage(), AdminDashboardPage(), RoleDetailPage(), UserDetailPage(), NotFound() (+33 more)

### Community 15 - "PermissionDefinition"
Cohesion: 0.11
Nodes (6): ModuleDescriptor, ModuleRegistry, PermissionDefinition, test_rejects_invalid_code(), test_rejects_permission_of_other_module(), registry()

### Community 16 - "CoreValidateSerializer"
Cohesion: 0.04
Nodes (22): CoreValidateSerializer, CoreModelViewSet, UserCreateValidateSerializer, UserUpdateValidateSerializer, UserViewSet, AttachmentUploadValidateSerializer, AttachmentViewSet, PageCreateValidateSerializer (+14 more)

### Community 18 - "FE Forms & Dialogs"
Cohesion: 0.16
Nodes (36): CreateUserDialog(), FLAGS, UserEditForm(), LoginForm(), CreateRoleDialog(), useCreateRoleDialog(), RoleForm(), ModuleIconDialog() (+28 more)

### Community 19 - "FE Tooling Dev Deps"
Cohesion: 0.07
Nodes (26): eslintConfig, devDependencies, eslint@^9, eslint-config-next@16.4.6, @playwright/test@^1.65.0, prettier@^3.10.1, prettier-plugin-tailwindcss@^0.8.1, tailwindcss@4.3.3 (+18 more)

### Community 20 - "BaseApiTestCase"
Cohesion: 0.11
Nodes (6): BaseApiTestCase, TestSelfProtection, RoleFactory, Meta, TestRoleApi, TestUserRoleApi

### Community 21 - "Attachment"
Cohesion: 0.09
Nodes (4): AttachmentFilter, Meta, Attachment, Meta

### Community 22 - "use-modules.ts"
Cohesion: 0.16
Nodes (17): SVG_ACCEPT, useModuleIconDialog(), ICON_NAMES, isLucideIconName(), ModuleIcon(), useModuleTable(), useModuleMutationHandlers(), useModules() (+9 more)

### Community 23 - "role_permission_view.py"
Cohesion: 0.04
Nodes (15): validate_request(), decorator(), CoreApiView, require_permission(), decorator(), IamPermission, IsAdminArea, RoleSummaryResponseSerializer (+7 more)

### Community 24 - "page_block_collection_view.py"
Cohesion: 0.10
Nodes (5): PageBlockCreateValidateSerializer, PageBlockCollectionView, HasDeclaredPermission, IsActiveAuthenticated, MemberApiView

### Community 25 - "permission_helper.py"
Cohesion: 0.09
Nodes (4): PermissionCatalog, AccountPermission, ShortLinksPermission, SystemPermission

### Community 26 - "PageBlockService"
Cohesion: 0.04
Nodes (26): build_absolute_url(), RateLimitService, PageFilter, Meta, PageBlock, Meta, Type, Page (+18 more)

### Community 27 - "response_body.py"
Cohesion: 0.14
Nodes (3): get_request_id(), build_error_body(), build_meta()

### Community 29 - "user-table.tsx"
Cohesion: 0.12
Nodes (27): RolesPage(), UsersPage(), LocaleError(), useUserTable(), UserTable(), ACCOUNT_PERMISSIONS, useUsers(), UserDetailView() (+19 more)

### Community 30 - "FE API Client"
Cohesion: 0.13
Nodes (21): attachmentRepository, Attachment, API_ENDPOINTS, AUTH_ENDPOINTS_WITHOUT_REFRESH, apiClient, buildUrl(), HttpMethod, isRawBody() (+13 more)

### Community 33 - "Pytest Fixtures"
Cohesion: 0.12
Nodes (12): StaffFactory, SuperuserFactory, client(), csrf_client(), _fast_hasher(), login(), refresh_cookie(), staff() (+4 more)

### Community 34 - "SystemModuleService"
Cohesion: 0.11
Nodes (3): SystemModuleService, TestSystemModuleService, ModuleState

### Community 36 - "OpenAPI Schema Tests"
Cohesion: 0.11
Nodes (4): _json_schema(), schema(), TestOpenApiSchema, test_production_hasher_is_argon2()

### Community 37 - "PermissionRule Tests"
Cohesion: 0.12
Nodes (6): _is_owner(), _request(), TestPermissionRule, _View, permission_rule(), PermissionRule

### Community 38 - "User"
Cohesion: 0.07
Nodes (6): UserFilter, Meta, User, Meta, TestAccountAuthBackend, TestUserApi

### Community 39 - "Admin Shell Layout"
Cohesion: 0.12
Nodes (27): AdminShell(), ShellSkeleton(), useBreadcrumb(), ADMIN_NAVIGATION, AdminLayout(), metadata, accountNavigation, dashboardNavigation (+19 more)

### Community 41 - "ShortLink"
Cohesion: 0.08
Nodes (9): ShortLinkFilter, Meta, ShortLink, Meta, RedirectType, Status, ShortLinkRepository, ShortLinkDetailResponseSerializer (+1 more)

### Community 42 - "shadcn Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 43 - "TestModuleConventions"
Cohesion: 0.10
Nodes (6): _iter_view_classes(), _module_app_configs(), TestModuleConventions, PagePublicView, ModuleEnabled, resolve_module_code()

### Community 44 - "User Context"
Cohesion: 0.16
Nodes (7): get_current_request(), get_current_user(), get_user_id(), request_context(), set_current_user(), test_request_id_resets(), test_user_resets_after_scope()

### Community 46 - "Test Me"
Cohesion: 0.16
Nodes (3): TestLogout, TestMe, TestSession

### Community 47 - "ValidationError"
Cohesion: 0.18
Nodes (9): ValidationError, validate_public_url(), _contrast(), _items(), _keys(), _plain(), _uuid(), validate_block_content() (+1 more)

### Community 48 - "SystemModule"
Cohesion: 0.11
Nodes (3): SystemModule, Meta, SystemModuleRepository

### Community 49 - "Page"
Cohesion: 0.21
Nodes (10): generateMetadata(), LoginPage(), generateMetadata(), PUBLIC_PATHS, sitemap(), getPathname, AppPathname, LOCALES (+2 more)

### Community 50 - "Test Attachment Api"
Cohesion: 0.16
Nodes (4): _media_root(), TestAttachmentApi, TestUserAvatar, _upload()

### Community 51 - "Tsconfig"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 52 - "global.d.ts"
Cohesion: 0.22
Nodes (4): AppConfig, Messages, next-intl, routing

### Community 53 - ".assert_success"
Cohesion: 0.16
Nodes (3): TestCsrf, TestRefresh, TestModuleIntegrity

### Community 56 - "AuthSession"
Cohesion: 0.06
Nodes (9): AuthSession, Meta, AuthSessionRepository, SessionListResponseSerializer, Meta, AuthService, test_concurrent_refresh_only_one_rotation(), worker() (+1 more)

### Community 60 - "svg_inspector.py"
Cohesion: 0.11
Nodes (3): detect_content_type(), find_svg_problem(), looks_like_svg()

### Community 61 - "current_user_response_serializer.py"
Cohesion: 0.07
Nodes (10): UserDetailResponseSerializer, Meta, UserListResponseSerializer, Meta, AttachmentDetailResponseSerializer, Meta, AttachmentSummaryResponseSerializer, Meta (+2 more)

### Community 62 - "Requirements"
Cohesion: 0.14
Nodes (12): argon2-cffi 25.1.0, django 6.0.10, django-cors-headers 4.9.0, django-environ 0.14.0, djangorestframework 3.18.3, psycopg 3.3.9, pyjwt 2.15.1, Backend runtime requirements (uv export) (+4 more)

### Community 63 - "Readme"
Cohesion: 0.17
Nodes (16): AGENTS.md development rules, TOANNX backend README, Architecture doc, proxy.ts (next-intl + optimistic admin check), Authentication doc, auth_rate_limit_bucket, Refresh token (random, HMAC-SHA256 hashed), Authorization (IAM / RBAC) doc (+8 more)

### Community 68 - "routing.ts"
Cohesion: 0.19
Nodes (7): inter, LocaleLayout(), AppMessages, loadMessages(), AppLocale, DEFAULT_LOCALE, LOCALIZED_PATHNAMES

### Community 69 - "Case Conversion"
Cohesion: 0.47
Nodes (7): convertKeys(), ConvertOptions, isPlainObject(), keysToCamel(), keysToSnake(), toCamelKey(), toSnakeKey()

### Community 70 - "Alert Dialog"
Cohesion: 0.18
Nodes (5): AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogOverlay(), AlertDialogPortal()

### Community 71 - "Architecture"
Cohesion: 0.21
Nodes (11): ADMIN_NAVIGATION (use-admin-shell.ts), PermissionCatalog, Module registry (Installed / Enabled / Permissions), ModuleDescriptor, ModuleEnabled permission (MODULE_DISABLED), PermissionDefinition, @validate_request decorator, Role.auto_grant (all / read_only / none) (+3 more)

### Community 74 - "test_module_conventions.py"
Cohesion: 0.05
Nodes (11): CoreModuleConfig, AccountConfig, AttachmentConfig, AuthenticationConfig, _revoke_sessions_on_credentials_change(), CustomPagesConfig, HealthConfig, IamConfig (+3 more)

### Community 76 - "CoreResponse"
Cohesion: 0.04
Nodes (12): CoreResponse, PublicApiView, CsrfResponseSerializer, CsrfView, PagePublicResponseSerializer, HealthResponseSerializer, ReadinessResponseSerializer, HealthView (+4 more)

### Community 78 - "Backend rules (Django + DRF)"
Cohesion: 0.10
Nodes (17): CoreModel (refactored from PMS BaseModel), CoreRepository[M] generic, Minimal User on AbstractBaseUser with lowercase unique email, PMS reference backend (Django 5.1, DRF, simplejwt), PyJWT + hashed refresh tokens (replacing simplejwt), Authentication: 10-min access JWT, rotating HMAC refresh, CSRF, PG rate limit, Backend rules (Django + DRF), Role.auto_grant (all / read_only / none) (+9 more)

### Community 79 - "Architecture 2"
Cohesion: 0.18
Nodes (8): AdminApiView, Frontend apiClient, Zustand auth-store (session expired flag), AuthenticatedApiView, CoreApiView, CsrfPublicApiView, PublicApiView, IsActiveAuthenticated (default permission class)

### Community 82 - "I18N"
Cohesion: 0.20
Nodes (10): drf-spectacular 0.30.0, CoreAutoSchema (OpenAPI envelope), ErrorCode (StrEnum), Standard response envelope (success/data/meta/error), i18n doc (next-intl), LanguageSwitcher, LOCALIZED_PATHNAMES / APP_ROUTES, Per-module message namespaces (+2 more)

### Community 83 - "Architecture 3"
Cohesion: 0.29
Nodes (4): CoreCrudService[M, R], CoreModel, CoreRepository[M], UserContext (contextvars)

### Community 85 - "dropdown-menu.tsx"
Cohesion: 0.16
Nodes (7): UserMenu(), Avatar(), AvatarFallback(), AvatarImage(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuSeparator()

### Community 87 - "Authorization"
Cohesion: 0.18
Nodes (11): django-filter 26.2, AdminModelViewSet, CoreModelViewSet, action_permissions (default DENY), HasDeclaredPermission / HasActionPermission, IamAuthBackend, PermissionChecker, PermissionGate / usePermission (FE display-only) (+3 more)

### Community 88 - "Package"
Cohesion: 0.20
Nodes (10): scripts, build, dev, e2e, format, format:check, lint, start (+2 more)

### Community 93 - "AuthorizationError"
Cohesion: 0.07
Nodes (4): AuthorizationError, AccountAuthBackend, UserService, UserRoleService

### Community 94 - "select.tsx"
Cohesion: 0.22
Nodes (3): SelectContent(), SelectScrollDownButton(), SelectScrollUpButton()

### Community 95 - "Foundation Report"
Cohesion: 0.13
Nodes (14): TOANNX Foundation Report (HTML), Vercel/Neon deployment (BLOCKED: no credentials), IAM/RBAC: Role, Permission, UserRole, RolePermission, PermissionChecker, Known issues (Vercel Python runtime, proxy IP, no cleanup cron), Module registry + System API, Same-origin architecture: Next.js rewrites /api/v1 to Django, Foundation test results (pytest 89, Vitest 11, Playwright 13), @require_permission / permission_rule decorator (+6 more)

### Community 99 - "Frontend contract — Short Links & Custom Pages"
Cohesion: 0.20
Nodes (9): Block contract, Custom Pages, Frontend contract — Short Links & Custom Pages, Lỗi và trạng thái giao diện, Màn hình và luồng, Màn hình và luồng, Quy ước chung, Short Links (+1 more)

### Community 101 - "Common rules (backend + frontend)"
Cohesion: 0.11
Nodes (14): Reference audit — PMS & Medoly, Medoly reference frontend (Next 16, shadcn new-york), Inherited Medoly shared components (PasswordInput, EmptyState, ErrorState, DataPagination, LanguageSwitcher), Tiptap editor integration plan for Novel/CMS, Common rules (backend + frontend), Frontend rules (Next.js 16), PermissionGate / usePermission (UI hide/show only), Zod schema factory taking translate fn (createLoginSchema(t)) (+6 more)

### Community 102 - "CoreErrorResponse"
Cohesion: 0.25
Nodes (3): app_exception_handler(), _field_errors(), CoreErrorResponse

### Community 103 - "enforce_csrf"
Cohesion: 0.28
Nodes (3): _CsrfCheck, _empty_response(), enforce_csrf()

### Community 104 - "messages.test.ts"
Cohesion: 0.22
Nodes (4): vitest@^5.1.0, flatten(), Tree, vitest

### Community 106 - "Any"
Cohesion: 0.16
Nodes (4): _media_root(), TestModuleApi, TestModuleIcon, _upload()

### Community 108 - "Pnpm Workspace"
Cohesion: 0.33
Nodes (5): allowBuilds, @parcel/watcher, sharp, @swc/core, unrs-resolver

### Community 109 - ".Prettierrc"
Cohesion: 0.33
Nodes (5): plugins, printWidth, semi, singleQuote, trailingComma

### Community 114 - "Proxy"
Cohesion: 0.60
Nodes (4): config, intlProxy, localizedPath(), proxy()

### Community 118 - "Vercel"
Cohesion: 0.50
Nodes (3): builds, routes, $schema

### Community 120 - "Check All"
Cohesion: 0.67
Nodes (3): PYTHONUTF8, check-all.sh script, step()

## Ambiguous Edges - Review These
- `django-cors-headers 4.9.0` → `Single-origin topology (Next.js rewrite to Django)`  [AMBIGUOUS]
  backend/requirements.txt · relation: conceptually_related_to

## Knowledge Gaps
- **34 isolated node(s):** `toannx-backend`, `PYTHONUTF8`, `Tiptap editor integration plan for Novel/CMS`, `Zod schema factory taking translate fn (createLoginSchema(t))`, `Frontend AGENTS.md (Next.js agent rules)` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1444 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **178 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `IAM Sync & Filters`, `BusinessRuleError`, `user_service.py`, `RolePermissionService`, `auth_service.py`, `Role`, `CoreValidateSerializer`, `BaseApiTestCase`, `permission_helper.py`, `auth_result.py`, `Pytest Fixtures`, `PermissionRule Tests`, `user.py`, `user_factory.py`, `system_module_service.py`, `AuthSession`, `current_user_response_serializer.py`, `Test Admin Access`, `grant`, `AuthorizationError`, `.get_editable_role`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Are the 29 inferred relationships involving `User` (e.g. with `AccountAuthBackend` and `UserFilter`) actually correct?**
  _`User` has 29 INFERRED edges - model-reasoned connections that need verification._
- **What connects `toannx-backend`, `PYTHONUTF8`, `Tiptap editor integration plan for Novel/CMS` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `IAM Sync & Filters` be split into smaller, more focused modules?**
  _Cohesion score 0.04101161995898838 - nodes in this community are weakly interconnected._
- **Why does `CoreResponse` connect `CoreResponse` to `Health Checks`, `typing`, `OwnedModelViewSet`, `response_body.py`, `TestModuleConventions`, `CoreValidateSerializer`, `normalize_slug`, `role_permission_view.py`, `page_block_collection_view.py`, `._handle_reuse`, `PageBlockService`, `.post`, `CoreModelViewSet`, `current_user_response_serializer.py`, `auth_result.py`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Are the 19 inferred relationships involving `CoreResponse` (e.g. with `CoreModelViewSet` and `CsrfView`) actually correct?**
  _`CoreResponse` has 19 INFERRED edges - model-reasoned connections that need verification._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `django-cors-headers 4.9.0` and `Single-origin topology (Next.js rewrite to Django)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._