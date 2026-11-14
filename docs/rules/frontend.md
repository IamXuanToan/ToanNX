# Rule frontend (Next.js 16)

Đọc trước: [common.md](common.md). Next.js 16 có thay đổi lớn: đọc `frontend/node_modules/next/dist/docs/`
trước khi dùng API mới (middleware → `src/proxy.ts`, error boundary dùng `retry`...).

## 1. Luồng xử lý (bắt buộc)

```
app/[locale]/.../page.tsx → modules/<m>/views → components/<c>/<c>.tsx (+ hooks/use-<c>.ts)
  → modules/<m>/hooks (React Query) → services → repositories → shares/lib/api/api-client.ts
```

| Lớp | Được làm | Không được làm |
| --- | --- | --- |
| `page.tsx` | Metadata, lấy params, render View | Logic, gọi API |
| View | Bố cục, ghép component, i18n | Logic nghiệp vụ, gọi API |
| Component | Nhận props, gọi hook riêng, render | `fetch`, state phức tạp |
| Hook của component | State, sự kiện, form | Gọi `apiClient` trực tiếp |
| Hook module | `useQuery`/`useMutation`, invalidate cache | JSX |
| Service | Chuẩn hóa dữ liệu, quy tắc FE | JSX, React hook |
| Repository | Gọi `apiClient` | React hook, UI state |

UI primitive thuần (Button, Separator...) không cần hook riêng.

## 2. Cấu trúc module

```
src/modules/<m>/
  views/  components/<c>/{<c>.tsx, hooks/use-<c>.ts}  hooks/  services/  repositories/
  schemas/  types/  constants/  messages/{vi,en}.json  navigation.ts
```

## 3. Quy ước

- Path API: `shares/constants/api-endpoints.ts`. Route: `APP_ROUTES` + `LOCALIZED_PATHNAMES`
  (`shares/constants/routes.ts`). Query key: `shares/constants/query-keys.ts`. Không hardcode.
- Điều hướng: `Link`/`useRouter`/`redirect` từ `@/i18n/navigation` (không dùng `next/link`).
- Mọi text qua next-intl; message theo module; thêm khóa phải thêm đủ vi + en.
- Schema Zod là factory nhận hàm dịch (`createLoginSchema(t)`).
- Màu dùng token semantic (`bg-primary`, `text-muted-foreground`); không hardcode màu.
- UI primitive thêm bằng `pnpm dlx shadcn@latest add <name>` vào `shares/components/ui`.
- `PermissionGate`/`usePermission` chỉ để ẩn/hiện; backend luôn enforce.
- URL file/ảnh/icon từ API là URL tuyệt đối: dùng trực tiếp (`<img src={url}>`), không nối domain/basePath.
- Icon module render bằng `ModuleIcon` (`modules/system/components/module-icon`): ưu tiên `iconUrl` (SVG),
  sau đó tên lucide qua `DynamicIcon` (`lucide-react/dynamic`); tên lạ → icon mặc định.
- Module FE theo đúng module BE (`account`, `iam`, `system`...). Module nền không import module phụ thuộc nó;
  page ghép giao diện nhiều module qua prop slot (ví dụ `UserDetailView aside={<UserRolesCard />}`).
- Không barrel `index.ts`; thứ tự import: React/Next → thư viện → `@/shares` → module khác → tương đối.
- Exported function/hook/component có JSDoc tiếng Việt.

## 4. Auth & API

- Gọi API cùng origin `/api/v1/*` (Next rewrite sang Django); cookie HttpOnly, không lưu token ở JS.
- `apiClient` tự gắn CSRF, request id, chuyển case, silent refresh single-flight; không tự viết lại.
- Logout/đổi quyền: xóa/invalidate cache React Query.

## 5. Test

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build && pnpm e2e
```

- Unit (Vitest): `tests/unit`. E2E (Playwright): `tests/e2e`, chạy trên server thật.
