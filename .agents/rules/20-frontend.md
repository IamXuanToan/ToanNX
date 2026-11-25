---
trigger: glob
globs: frontend/src/**/*.ts, frontend/src/**/*.tsx
description: Kiến trúc và quy ước frontend Next.js 16 (tóm tắt docs/rules/frontend.md).
---

# Frontend (Next.js 16)

Chi tiết: `docs/rules/frontend.md`, `docs/common-catalog.md` mục 4–5. Đọc `frontend/node_modules/next/dist/docs/`
trước khi dùng API Next. Khi viết/review React hoặc Next.js, tham khảo skill `vercel-react-best-practices`
về hiệu năng; kiến trúc Client-only và rule repo luôn được ưu tiên.

## Lớp

`page → View → component (+ hook riêng) → hook module (React Query) → service → apiClient`. FE không có repository.

- `app/**/page.tsx`, `layout.tsx`: chỉ metadata (`createPageMetadata`), `await params`, render View của module.
  Trang lấy dữ liệu 100% ở Client qua React Query (`useQuery`) → service → `apiClient`; không gọi API ngầm
  trong Server Component để dựng trang. API call phải thấy trên Network của trình duyệt.
- **View chỉ ghép component và kiểm quyền**: chỉ gọi `usePermission`, `useTranslations`, `useEditMode`. Không
  query, state, `useRouter`, `useEffect`. Chi tiết bản ghi: component `<model>-profile.tsx` tự tải dữ liệu; chuyển
  trang sau khi tạo nằm trong hook form.
- Component gọi hook riêng; hook component không gọi service/`apiClient` trực tiếp mà qua hook module.

## Cấu trúc module (`tests/unit/module-structure.test.ts`)

- `components/<model>/<tên>.tsx` + `components/<model>/hooks/use-<tên>.ts`; `views/<model>/<tên>-view.tsx`.
- `<model>` trùng tên `services/<model>.service.ts`; màn không gắn model theo chức năng (`auth`, `current-user`,
  `reader`, `dashboard`, `shell`, `errors`...).
- Không file ở gốc `components/`/`views/`, không `components/hooks/` cấp gốc, không `views/hooks/`, không nhóm
  `shared`/`common` (dùng chung → nhóm dùng nhiều nhất; toàn app → `shares/`).
- Một component / một hook / một class mỗi file; không khai hook trong `.tsx`; context tách
  `-context.ts` / `-provider.tsx` / `use-*.ts`.
- Service **một file một model BE** (`role.service.ts` ↔ `role_service.py`), CRUD từ `createCrudService`, key từ
  `createResourceKeys`, ghi qua `useResourceMutation`, danh sách qua `useListQuery`.
- Route, endpoint, query key do module tự khai trong `constants/{routes,api-endpoints,query-keys}.ts`. URL quản trị
  có tiền tố module (`/quan-tri/<module-vi>/...`), chỉ sửa `<M>_PATHNAMES`.
- `shares/` không import module.

## Dữ liệu và i18n

- Truyền `signal` của React Query vào `apiClient`; không tự abort `fetch`; không để promise rơi.
- Link dùng `<Link />` từ `@/i18n/navigation` (kể cả URL ngoài với `href={url as never}`; `next/link` chỉ dùng
  ngoài cây `[locale]` như `app/not-found.tsx`); ảnh dùng `<Image />` từ `next/image`. Không dùng `<a>`/`<img>` trần.
  UI primitive dùng `@/shares/components/ui/`.
- Hằng số dùng chung (locale, timezone, tiền tệ, phân trang, ID toast) lấy từ `shares/constants/` và
  `shares/lib/{number-format,localized-route}.ts`; không lặp `locale === "en" ? "en-US" : "vi-VN"`,
  `.toLocaleString("vi-VN")` hay `export const UPPER_CASE` trong `.tsx` (`tests/unit/code-conventions.test.ts`).
- Kiểu khớp OpenAPI (`ApiModel<"…Response">`, `tests/unit/api-contract.test.ts`); không sửa tay `api-schema.gen.ts`.
- Mọi chuỗi hiển thị qua i18n (`vi`, `en`); namespace mới đăng ký ở `src/i18n/messages.ts` và `src/global.d.ts`.
- Không `any`, không `console.log`, không đọc `process.env` ngoài `shares/config`.

## Kiểm tra

`pnpm exec eslint <file>`, `pnpm exec prettier --check <file>`, `pnpm typecheck`, Vitest đúng file. Với UI hoặc
luồng đã đổi, thêm/cập nhật test liên quan và kiểm bằng Playwright trên UI thật, có ảnh chụp để phân tích;
không chạy toàn bộ suite nếu chưa được yêu cầu. Giao diện: rule `frontend-ui`.
