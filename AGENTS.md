# AGENTS.md — TOANNX

Đọc theo thứ tự trước khi viết code:

1. [SYSTEM_CONTEXT.md](SYSTEM_CONTEXT.md) — bối cảnh và quyết định đã chốt.
2. [docs/rules/common.md](docs/rules/common.md) — rule chung (code sạch, bảo mật, API contract, test).
3. [docs/rules/backend.md](docs/rules/backend.md) — Django: `url → view (decorator) → service → repository`.
4. [docs/rules/frontend.md](docs/rules/frontend.md) — Next.js: `page → view → component+hook → hook → service → repository`.
5. [docs/rules/git.md](docs/rules/git.md) — tên nhánh, commit và quy trình push.

Tài liệu chi tiết: [docs/architecture.md](docs/architecture.md), [docs/authentication.md](docs/authentication.md),
[docs/authorization.md](docs/authorization.md), [docs/i18n.md](docs/i18n.md), [docs/deployment.md](docs/deployment.md),
[docs/testing.md](docs/testing.md).

## Thêm module mới (ví dụ `links`)

Backend:
1. `uv run python manage.py startapp links app/modules/links`; sửa `apps.py`: kế thừa `CoreModuleConfig`,
   `default = True`, `name = "app.modules.links"`, `label = "links"` (label = mã module).
2. `permissions/links_permission.py` (PermissionCatalog, mỗi quyền có name + description) và `module.py`
   (`ModuleDescriptor(..., group=ModuleGroup.<NHÓM>, icon="link", permissions=LinksPermission.all(), dependencies=(...))`);
   — `CoreModuleConfig` tự đăng ký, không viết `ready()` để đăng ký.
3. `models/` (mọi field có `help_text`) → `makemigrations` → `repositories/` (kế thừa `CoreRepository`) →
   `services/` (kế thừa `CoreCrudService`) → `filters/` → `serializers/{validates,responses}/` → `views/`:
   CRUD quản trị kế thừa `AdminModelViewSet`; CRUD tài nguyên của người dùng kế thừa `OwnedModelViewSet`
   với service kế thừa `OwnedCrudService` (đều khai báo `action_permissions`, filter/search/ordering).
   Tài nguyên con dùng `AdminApiView` khi cần `is_staff`; nếu người dùng tự quản lý, dùng
   `MemberApiView` (cùng `@require_permission`, `@extend_schema`, `@validate_request`, service tạo trong
   `__init__`). Không khai `module_code`/`ModuleEnabled`: core tự chặn API khi module tắt.
4. Thêm vào `INSTALLED_APPS` và `config/urls.py`; `migrate` (quyền mới tự đồng bộ, vai trò `auto_grant` tự nhận quyền).
5. Test trong `app/modules/links/tests/`; `spectacular --validate --fail-on-warn` phải sạch.

Frontend:
1. `src/modules/links/{views,components,hooks,services,repositories,types,messages}` + `navigation.ts`.
2. Namespace message trong `src/i18n/messages.ts` và `src/global.d.ts`.
3. Route trong `LOCALIZED_PATHNAMES`/`APP_ROUTES`, page trong `src/app/[locale]/(admin)/admin/...`.
4. Thêm navigation vào `ADMIN_NAVIGATION` (`use-admin-shell.ts`).

Không cần sửa IAM core.
