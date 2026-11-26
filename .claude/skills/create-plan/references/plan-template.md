# Khung mẫu Plan chuẩn ToanNX (`docs/plans/<YYYY>/<MM>/<DD>/<ten>-plan.md`)

Điều chỉnh linh hoạt cho tính năng nhỏ, module mới hoặc refactor lớn; mục không áp dụng thì ghi rõ *Không áp dụng* thay vì xóa mù thông tin quan trọng.

```markdown
# Kế hoạch <Tên tính năng / module / refactor>

Trạng thái: **Nháp — chờ review và chốt quyết định** | Ngày lập: `<YYYY-MM-DD>`
Cơ sở đối chiếu: `SYSTEM_CONTEXT.md`, `docs/rules/*`, `docs/common-catalog.md`, `docs/architecture/infrastructure.md`, `<file source/plan liên quan>`.

Mục lục:
1. Mục tiêu, phạm vi & ngoài phạm vi
2. Quyết định cần chốt & dependency
3. Hiện trạng codebase & thành phần tái sử dụng
4. Ngân sách hạ tầng Free-tier
5. Kiến trúc Backend & mô hình dữ liệu
6. Phân quyền, bảo mật, bí mật & tệp đính kèm
7. Hợp đồng API & thông báo
8. Kiến trúc Frontend, UI/UX & i18n
9. Xử lý biên, lỗi & fallback
10. Kế hoạch kiểm thử (BE, FE, E2E, giao diện thật)
11. Lộ trình từng giai đoạn & cập nhật tài liệu

---

## 1. Mục tiêu, phạm vi & ngoài phạm vi
- **Mục tiêu nghiệp vụ**: ...
- **Trong phạm vi**: ...
- **Ngoài phạm vi (Non-goals)**: ...

## 2. Quyết định cần chốt & dependency

### 2.1 Quyết định kiến trúc (`D1`, `D2`...)
| Mã | Chủ đề | Các phương án | Đề xuất & lý do | Trạng thái |
| --- | --- | --- | --- | --- |
| D1 | ... | A: ... / B: ... | Đề xuất A vì ... | Chờ duyệt |

### 2.2 Dependency mới (nếu có — bắt buộc chờ duyệt trước khi cài)
| Phía | Gói đề xuất | Lý do không dùng gói sẵn có | Tác động bundle/cold start | Trạng thái |
| --- | --- | --- | --- | --- |
| BE / FE | `...` | ... | ... | Chờ duyệt |

## 3. Hiện trạng codebase & thành phần tái sử dụng
- **Module/file hiện có liên quan** (đã kiểm chứng trên source): ...
- **Common dùng lại (`docs/common-catalog.md`)**:
  - Backend: `CoreModel`, `JournalTracker`, `CoreRepository`, `CoreCrudService`, `CoreModelViewSet`/`CoreApiView`, `Core*InFilter`, `SecretCipher`, `CacheService`, `NotificationService`...
  - Frontend: `DataTable`, `useTableState`, `useBulkActions`, `FormPage`, `useEditMode`, `useTabState`, `SelectField`, `FilterSelect`, `QueryErrorState`, `AttachmentPicker`, `TiptapEditor`...
- **Common mới / mở rộng cần cập nhật `docs/common-catalog.md`**: ...

## 4. Ngân sách hạ tầng Free-tier (`docs/architecture/infrastructure.md`)
| Dịch vụ | Tác động ước lượng | Cơ chế kiểm soát / fallback |
| --- | --- | --- |
| Neon Free (1 GB, 100 CU-h/tháng) | Số lần đánh thức/ngày, dung lượng ước tính | Cache/cờ Redis ngăn cron/khách chạm DB; partial index |
| Vercel Hobby (4h Active CPU/tháng) | Lượt function, CPU, streaming WSGI | Outbox + timeout ≤ 5s; không loop blocking |
| Upstash Redis (500k lệnh/tháng) | Số lệnh/ngày, TTL, key (không prefix `toannx`) | Dự phòng DB khi Redis down, không 500 |
| Upstash QStash / Cron | Tần suất trigger, tin/ngày | ... |
| Cloudflare R2 (10 GB) | Public vs Private bucket | ... |

## 5. Kiến trúc Backend & mô hình dữ liệu (`backend/app/<module>/`)
- **Module & `ModuleDescriptor`**: `dependencies`, `cleanup_tasks`, `notification_events`, `webhooks`, `callbacks`.
- **Mô hình dữ liệu** (kế thừa `JournalTracker, CoreModel`, `db_table`, enum lồng, `DecimalField`, UTC, `UniqueConstraint(condition=Q(deleted_at__isnull=True))` thay cho `OneToOneField`/unique ngắn khi có soft delete, partial index theo `owner_field`, `verbose_name`/`help_text`/`db_comment`):
  - Bảng / sơ đồ ER + chi tiết từng field.
- **Tầng Repository & Service**: các method đặc thù (không ORM ngoài repository; phụ thuộc khai trong `__init__`; không staticmethod công khai trên service; dùng `owner_field`, `manage_all_permission`, `owner_quota_setting`).
- **Tầng View, Filter & Serializer**: `CoreModelViewSet` / `CoreApiView`, `filterset_class` (`Core*InFilter`), `search_fields`, `ordering_fields`, `bulk_delete_enabled`, `bulk_update_serializer_class`, `action_rate_limits`, `serializers/validates/` & `serializers/responses/`.
- **Migration & Tương thích ngược**: bước `makemigrations`, `sqlmigrate`, an toàn dữ liệu cũ.

## 6. Phân quyền, bảo mật, bí mật & tệp đính kèm
- **Ma trận quyền & `MEMBER`**: từng file `permissions/<model>_permission.py`, mã `<m>.<res>.<action>`, tập `MEMBER` (tuyệt đối không có `manage_all`/`read_private`), hành vi 401/403/404 (`owner_isolation`), không kiểm `is_staff` ở API.
- **Ranh giới tin cậy & chống tấn công**: validation, SSRF (`validate_public_url` + chặn IP nội bộ nếu backend fetch URL ngoài), HMAC/constant-time, replay ±300s, rate limit, prompt injection/XSS.
- **Bí mật & Env**:
  - Tự sinh/kiểm nội bộ: dẫn xuất `salted_hmac` từ `DJANGO_SECRET_KEY`.
  - Hệ thống bên thứ ba: biến mới trong `.env.example` (chú thích tiếng Việt) + `docs/guides/deployment.md`.
  - Theo từng user: lưu DB qua `SecretCipher` (API trả 4 ký tự cuối).
- **Tệp đính kèm**: phân loại rõ `public` vs `private` (`visibility="private" lockVisibility`, không lộ storage URL thật).

## 7. Hợp đồng API & thông báo
- **Danh sách Endpoint**: Method | Path (`/api/v1/...`) | Quyền | Rate limit | Input serializer | Output serializer | Error codes (`<MODULE>_*`).
- **OpenAPI**: chạy `spectacular --validate --fail-on-warn` và `pnpm api:types` (`api-schema.gen.ts`).
- **Thông báo (`NotificationService.notify`)**: bảng `NotificationEventDefinition` (`code`, `scope`, `audience`, `permission`, `icon`, `default_channels`, `details`), không gửi đồng bộ trong request.
- **Webhook / Callback**: khai báo `WebhookDefinition` / `CallbackDefinition` trong `ModuleDescriptor`, dùng `build_backend_url` / `get_frontend_origin`.

## 8. Kiến trúc Frontend, UI/UX & i18n (`frontend/src/modules/<module>/`)
- **Cấu trúc file đúng model BE**: `routes.ts` (`<M>_ROUTES`, `<M>_PATHNAMES` vi/en), `navigation.ts` (Admin có `section` nếu > 5 mục vs Portal), `permissions/<model>-permission.ts`, `services/<model>.service.ts`, `hooks/use-<action>.ts`, `views/<model>/*-view.tsx`, `components/<model>/*` (+ `hooks/`).
- **Tải dữ liệu & State**: 100% Client-side React Query + `signal` (không SSR fetch ngầm); bảng dùng `useTableState`; tab dùng `useTabState`.
- **Quyền 3 tầng & UI chuẩn**: Menu ẩn `read`; View có `ForbiddenView`; Detail mặc định chỉ xem (`useEditMode` + `EditModeProvider`); bảng `DataTable` (`onView`/`onEdit`/`onDelete` + `can`, `onBulkDelete`, `bulkStatus`, `TableBulkBar` 1 dòng); form dùng `FormPage` trang riêng.
- **Token màu, Primitive, Asset & i18n**: các token `--color-*` cần thêm vào `globals.css` (`:root`, `.dark`, `@theme inline` — không màu Tailwind thô), primitive shadcn, `<Image />`, `<Link />` từ `@/i18n/navigation`, SVG `public/`, namespace `vi.json`/`en.json` + `messages.ts` + `global.d.ts` + mã lỗi BE + `journal-field-prefixes.ts`.

## 9. Xử lý biên, lỗi & fallback
| Tình huống biên / lỗi | Hành vi xử lý BE & FE | Mã lỗi / Thông điệp |
| --- | --- | --- |
| ... | ... | ... |

## 10. Kế hoạch kiểm thử
- **Backend (`app/<m>/tests/`)**: liệt kê rõ từng file `test_<resource>_<action>_api.py` (đủ `full_data`, `min_data`, `validation_errors`, `401`, `403`, `owner_isolation`, envelope, list features) + `test_endpoint_access.py` + `test_list_query_count.py`. Chạy trên PostgreSQL local `--reuse-db`.
- **Frontend (`frontend/tests/`)**: Vitest (`unit`), test quy ước kiến trúc, E2E Playwright spec, kiểm UI thật `playwright-cli` (desktop/mobile 375px, light/dark, keyboard, đa vai trò `_VIEWER`/`_MEMBER`/`_MANAGER`).

## 11. Lộ trình từng giai đoạn & cập nhật tài liệu
- Chia phase tuần tự không phụ thuộc ngược (Phase 1 DB/BE → `api:types` → Phase 2 FE → Phase 3 Kiểm thử/UI/CI).
- Danh sách tài liệu cần cập nhật cùng lần code: `docs/modules/<m>/README.md`, `docs/features/*.md`, `docs/common-catalog.md`, `docs/guides/deployment.md`, `.env.example`, `docs/README.md`.
```
