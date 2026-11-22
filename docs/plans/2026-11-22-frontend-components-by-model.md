# Plan: chia `components/` và `views/` của frontend theo model

Ngày: 2026-11-22 · Phạm vi: **chỉ frontend**, chỉ `components/` và `views/` của các module · Trạng thái: **đã làm
xong 2026-11-22**

Đã chốt với chủ dự án:
1. Tên nhóm: theo model BE; phần không gắn model dùng `auth`, `auth-session`, `current-user`, `reader`, `layout`,
   `landing`, `errors`, `shell`, `sidebar`, `launcher`. **Không có nhóm `shared`/`common`**: component dùng chung
   đặt vào nhóm dùng nó nhiều nhất (`money-text`, `tax-status-badge` → `income`; `year-select` → `dashboard`).
2. Dashboard tài chính là nhóm riêng `dashboard`, tách khỏi `finance-report`.
3. Bước cuối chạy `pnpm test` đầy đủ, `pnpm build` và các spec E2E chính.
4. Xong thì cập nhật rule (`docs/rules/frontend.md`, `CLAUDE.md`, `AGENTS.md`) và `prompt.md`.

Không đổi: URL, nhãn, giao diện, hành vi, API, `hooks/` (React Query), `services/`, `constants/`, `types/`,
`schemas/`, `messages/`, backend.

## 1. Hiện trạng

| Module | Component | Hook component | View | Hook sai chỗ (`views/hooks/`) |
| --- | --- | --- | --- | --- |
| system | 70 | 48 | 34 | 2 |
| finance | 30 | 15 | 15 | 0 |
| novel | 23 | 19 | 20 | 0 |
| utilities | 20 | 13 | 17 | 2 |
| manage-app | 18 + 1 file `.ts` | 5 | 1 | 0 |
| home | 8 | 5 | 4 | 1 |
| **Tổng** | | | | **371 file phải chuyển** |

Mọi thư mục đều phẳng. Script kiểm ánh xạ (`fe_mapping.py`, mục 6) xác nhận **371/371 file được gán đúng một
nhóm**, không sót, không trùng.

## 2. Cấu trúc đích

```
src/modules/<m>/
  components/
    <nhóm>/
      <nhóm>-table.tsx
      <nhóm>-form.tsx
      <nhóm>-profile.tsx
      hooks/
        use-<nhóm>-table.ts        # hook riêng của component, cạnh component
  views/
    <nhóm>/
      <nhóm>-list-view.tsx         # chỉ ghép component + kiểm quyền
  hooks/ services/ constants/ ...  # giữ nguyên
```

Quy định mới (đưa vào rule frontend §2, quy tắc cốt lõi CLAUDE.md/AGENTS.md, checklist `prompt.md`):

1. Component nằm trong `components/<nhóm>/`, hook của nó trong `components/<nhóm>/hooks/`. Không có `.tsx` ở gốc
   `components/`, không có `components/hooks/` cấp gốc.
2. `<nhóm>` = tên model BE (trùng `services/<nhóm>.service.ts`); màn không gắn model thì nhóm theo chức năng. Không
   tạo nhóm `shared`/`common` trong module: component dùng chung đặt ở nhóm dùng nhiều nhất; phần dùng chung toàn
   app nằm ở `shares/`.
3. View nằm trong `views/<nhóm>/`, cùng tên nhóm với component. **Không có `views/hooks/`**. View chỉ được gọi
   `usePermission`, `useTranslations`, `useEditMode`; query, state, `useRouter`, `useEffect` thuộc component + hook.
4. Một cấp nhóm, không tạo thư mục cho từng component. Tên file giữ nguyên. Import đường dẫn đầy đủ tới file, không
   barrel `index.ts`.
5. Module mới tạo thẳng theo cấu trúc này.

## 3. Sửa các chỗ sai rule (làm tay, trước khi chuyển file của module đó)

### 3.1 Hook trong `views/hooks/` (5 file)

| Hook | Đang được dùng ở | Chuyển tới |
| --- | --- | --- |
| `home/views/hooks/use-app-error-view.ts` | `views/app-error-view.tsx` | `components/errors/hooks/use-app-error-view.ts`, dùng bởi component mới `app-error-content.tsx` |
| `system/views/hooks/use-library-image-insert.ts` | `components/library-image-insert.tsx` | `components/attachment/hooks/use-library-image-insert.ts` |
| `system/views/hooks/use-verify-email.ts` | `views/verify-email-view.tsx` | `components/auth/hooks/use-verify-email.ts`, dùng bởi component mới `verify-email-status.tsx` |
| `utilities/views/hooks/use-qr-code-insert.ts` | `components/qr-code-insert.tsx` | `components/qr-code/hooks/use-qr-code-insert.ts` |
| `utilities/views/hooks/use-short-link-button-insert.ts` | `components/short-link-button-insert.tsx` | `components/short-link/hooks/use-short-link-button-insert.ts` |

### 3.2 View có logic (15 file)

| View | Sai | Sửa | File mới |
| --- | --- | --- | --- |
| `home/views/app-error-view.tsx` | gọi `useAppErrorView` | View chỉ render `<AppErrorContent error reset />` | `components/errors/app-error-content.tsx` |
| `home/views/global-error-view.tsx` | gọi `useReportClientError` | View render `<GlobalErrorContent />`; hook ghi lỗi nằm trong component | `components/errors/global-error-content.tsx` + `hooks/use-global-error-content.ts` |
| `home/views/not-found-view.tsx` | `useRouter` cho nút quay lại | View render `<NotFoundContent />` | `components/errors/not-found-content.tsx` + `hooks/use-not-found-content.ts` |
| `system/views/verify-email-view.tsx` | gọi `useVerifyEmail` | View render `<VerifyEmailStatus />` | `components/auth/verify-email-status.tsx` |
| `system/views/social-auth-callback-view.tsx` | 304 dòng: `useState`, `useRef`, `useEffect`, `useSearchParams`, gọi API | Giao diện → `SocialAuthCallback`, logic → `useSocialAuthCallback`; View còn khoảng 20 dòng | `components/auth/social-auth-callback.tsx` + `hooks/use-social-auth-callback.ts` |
| `novel/views/author-detail-view.tsx`, `chapter-detail-view.tsx`, `genre-detail-view.tsx`, `tag-detail-view.tsx`, `novel-edit-view.tsx` | query (`useAuthor`…), loading, lỗi ngay trong View | Theo mẫu `system` (`UserProfile`): View render `<AuthorProfile id canEdit history />`; hook `use-author-profile` gọi `useAuthor`; component lo Skeleton/`QueryErrorState` | `components/<nhóm>/<nhóm>-profile.tsx` + `hooks/use-<nhóm>-profile.ts` cho `author`, `chapter`, `genre`, `tag`, `novel` |
| `novel/views/author-create-view.tsx`, `chapter-create-view.tsx`, `genre-create-view.tsx`, `novel-create-view.tsx`, `tag-create-view.tsx` | `useRouter` để chuyển trang sau khi tạo | Chuyển trang nằm trong hook form (như `use-user-form.ts`: tạo xong thì `router.push`); View chỉ render `<AuthorForm />` | không (sửa `use-<nhóm>-form.ts`) |

Kiểm sau bước này: Vitest của module (đặc biệt `social-auth-callback-view.test.tsx`, không sửa kỳ vọng) và
`pnpm typecheck`.

Tổng file mới: 3 component + 2 hook (`errors`), 2 component + 1 hook (`auth`), 5 component + 5 hook profile
(`novel`) = **18 file**.

## 4. Bảng chuyển file

Cột "Số file import" là số file trong `src/` và `tests/` đang import file đó, tức số chỗ import phải viết lại. Hook
luôn đi cùng component cùng tên.

### home — 18 file, 3 nhóm

**`errors`** (4 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/app-error-view.tsx` | `views/errors/app-error-view.tsx` | 1 |
| View | `views/global-error-view.tsx` | `views/errors/global-error-view.tsx` | 1 |
| View | `views/not-found-view.tsx` | `views/errors/not-found-view.tsx` | 1 |
| Hook ⚠ từ views/hooks | `views/hooks/use-app-error-view.ts` | `components/errors/hooks/use-app-error-view.ts` | 1 |
| **Mới** | — | `components/errors/app-error-content.tsx` | Nội dung trang lỗi app (mã digest, nút sao chép) — lấy từ app-error-view |
| **Mới** | — | `components/errors/global-error-content.tsx` | Nội dung lỗi gốc, gọi useReportClientError — lấy từ global-error-view |
| **Mới** | — | `components/errors/not-found-content.tsx` | Nội dung 404 + nút quay lại (useRouter) — lấy từ not-found-view |
| **Mới** | — | `components/errors/hooks/use-not-found-content.ts` | Điều hướng quay lại của trang 404 |
| **Mới** | — | `components/errors/hooks/use-global-error-content.ts` | Gọi useReportClientError, trả dữ liệu hiển thị |

**`landing`** (12 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/home-view.tsx` | `views/landing/home-view.tsx` | 1 |
| Component | `components/chill-audio.tsx` | `components/landing/chill-audio.tsx` | 1 |
| Component | `components/clock-widget.tsx` | `components/landing/clock-widget.tsx` | 1 |
| Component | `components/home-hero.tsx` | `components/landing/home-hero.tsx` | 1 |
| Component | `components/weather-canvas.tsx` | `components/landing/weather-canvas.tsx` | 2 |
| Component | `components/weather-icon.tsx` | `components/landing/weather-icon.tsx` | 1 |
| Component | `components/weather-widget.tsx` | `components/landing/weather-widget.tsx` | 1 |
| Hook | `components/hooks/use-chill-audio.ts` | `components/landing/hooks/use-chill-audio.ts` | 1 |
| Hook | `components/hooks/use-clock.ts` | `components/landing/hooks/use-clock.ts` | 1 |
| Hook | `components/hooks/use-home-hero.ts` | `components/landing/hooks/use-home-hero.ts` | 1 |
| Hook | `components/hooks/use-weather-canvas.ts` | `components/landing/hooks/use-weather-canvas.ts` | 1 |
| Hook | `components/hooks/use-weather-widget.ts` | `components/landing/hooks/use-weather-widget.ts` | 2 |

**`layout`** (2 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| Component | `components/public-header.tsx` | `components/layout/public-header.tsx` | 2 |
| Component | `components/public-layout.tsx` | `components/layout/public-layout.tsx` | 1 |

### manage-app — 25 file, 3 nhóm

**`launcher`** (9 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/module-launcher-view.tsx` | `views/launcher/module-launcher-view.tsx` | 1 |
| Component | `components/launcher-footer.tsx` | `components/launcher/launcher-footer.tsx` | 1 |
| Component | `components/launcher-header.tsx` | `components/launcher/launcher-header.tsx` | 1 |
| Component | `components/launcher-layout.tsx` | `components/launcher/launcher-layout.tsx` | 1 |
| Component | `components/launcher-skeleton.tsx` | `components/launcher/launcher-skeleton.tsx` | 1 |
| Component | `components/module-group-card-more-items.tsx` | `components/launcher/module-group-card-more-items.tsx` | 1 |
| Component | `components/module-group-card.tsx` | `components/launcher/module-group-card.tsx` | 2 |
| Component | `components/module-launcher.tsx` | `components/launcher/module-launcher.tsx` | 1 |
| Hook | `components/hooks/use-module-launcher.ts` | `components/launcher/hooks/use-module-launcher.ts` | 1 |

**`shell`** (11 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| Component | `components/admin-attachment-picker-slot.tsx` | `components/shell/admin-attachment-picker-slot.tsx` | 2 |
| Component | `components/admin-breadcrumb.tsx` | `components/shell/admin-breadcrumb.tsx` | 2 |
| Component | `components/admin-modules-context.ts` | `components/shell/admin-modules-context.ts` | 2 |
| Component | `components/admin-modules-provider.tsx` | `components/shell/admin-modules-provider.tsx` | 1 |
| Component | `components/admin-shell.tsx` | `components/shell/admin-shell.tsx` | 3 |
| Component | `components/header-actions.tsx` | `components/shell/header-actions.tsx` | 2 |
| Component | `components/workspace-layout.tsx` | `components/shell/workspace-layout.tsx` | 1 |
| Component | `components/workspace-skeleton.tsx` | `components/shell/workspace-skeleton.tsx` | 1 |
| Hook | `components/hooks/use-admin-groups.ts` | `components/shell/hooks/use-admin-groups.ts` | 1 |
| Hook | `components/hooks/use-admin-shell.ts` | `components/shell/hooks/use-admin-shell.ts` | 1 |
| Hook | `components/hooks/use-group-breadcrumb.ts` | `components/shell/hooks/use-group-breadcrumb.ts` | 1 |

**`sidebar`** (5 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| Component | `components/module-sidebar.tsx` | `components/sidebar/module-sidebar.tsx` | 1 |
| Component | `components/module-switcher.tsx` | `components/sidebar/module-switcher.tsx` | 1 |
| Component | `components/sidebar-module-group.tsx` | `components/sidebar/sidebar-module-group.tsx` | 1 |
| Component | `components/sidebar-nav-section.tsx` | `components/sidebar/sidebar-nav-section.tsx` | 1 |
| Hook | `components/hooks/use-sidebar-module-group.ts` | `components/sidebar/hooks/use-sidebar-module-group.ts` | 1 |

### utilities — 52 file, 4 nhóm

**`page`** (14 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/page-create-view.tsx` | `views/page/page-create-view.tsx` | 1 |
| View | `views/page-detail-view.tsx` | `views/page/page-detail-view.tsx` | 1 |
| View | `views/page-list-view.tsx` | `views/page/page-list-view.tsx` | 1 |
| View | `views/public-page-view.tsx` | `views/page/public-page-view.tsx` | 1 |
| Component | `components/page-button-dialog.tsx` | `components/page/page-button-dialog.tsx` | 1 |
| Component | `components/page-form.tsx` | `components/page/page-form.tsx` | 2 |
| Component | `components/page-profile.tsx` | `components/page/page-profile.tsx` | 1 |
| Component | `components/page-table.tsx` | `components/page/page-table.tsx` | 1 |
| Component | `components/preview-notice.tsx` | `components/page/preview-notice.tsx` | 1 |
| Component | `components/public-page.tsx` | `components/page/public-page.tsx` | 1 |
| Hook | `components/hooks/use-page-button-dialog.ts` | `components/page/hooks/use-page-button-dialog.ts` | 1 |
| Hook | `components/hooks/use-page-form.ts` | `components/page/hooks/use-page-form.ts` | 1 |
| Hook | `components/hooks/use-page-table.ts` | `components/page/hooks/use-page-table.ts` | 1 |
| Hook | `components/hooks/use-preview-notice.ts` | `components/page/hooks/use-preview-notice.ts` | 1 |

**`page-path`** (10 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/page-path-create-view.tsx` | `views/page-path/page-path-create-view.tsx` | 1 |
| View | `views/page-path-detail-view.tsx` | `views/page-path/page-path-detail-view.tsx` | 1 |
| View | `views/page-path-list-view.tsx` | `views/page-path/page-path-list-view.tsx` | 1 |
| Component | `components/page-path-form.tsx` | `components/page-path/page-path-form.tsx` | 3 |
| Component | `components/page-path-profile.tsx` | `components/page-path/page-path-profile.tsx` | 1 |
| Component | `components/page-path-select.tsx` | `components/page-path/page-path-select.tsx` | 1 |
| Component | `components/page-path-table.tsx` | `components/page-path/page-path-table.tsx` | 1 |
| Hook | `components/hooks/use-page-path-form.ts` | `components/page-path/hooks/use-page-path-form.ts` | 1 |
| Hook | `components/hooks/use-page-path-select.ts` | `components/page-path/hooks/use-page-path-select.ts` | 1 |
| Hook | `components/hooks/use-page-path-table.ts` | `components/page-path/hooks/use-page-path-table.ts` | 1 |

**`qr-code`** (13 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/qr-code-create-view.tsx` | `views/qr-code/qr-code-create-view.tsx` | 1 |
| View | `views/qr-code-detail-view.tsx` | `views/qr-code/qr-code-detail-view.tsx` | 1 |
| View | `views/qr-code-list-view.tsx` | `views/qr-code/qr-code-list-view.tsx` | 1 |
| View | `views/qr-code-tiptap-plugin.tsx` | `views/qr-code/qr-code-tiptap-plugin.tsx` | 1 |
| Component | `components/qr-code-form.tsx` | `components/qr-code/qr-code-form.tsx` | 2 |
| Component | `components/qr-code-insert.tsx` | `components/qr-code/qr-code-insert.tsx` | 1 |
| Component | `components/qr-code-picker.tsx` | `components/qr-code/qr-code-picker.tsx` | 1 |
| Component | `components/qr-code-profile.tsx` | `components/qr-code/qr-code-profile.tsx` | 1 |
| Component | `components/qr-code-table.tsx` | `components/qr-code/qr-code-table.tsx` | 1 |
| Hook | `components/hooks/use-qr-code-form.ts` | `components/qr-code/hooks/use-qr-code-form.ts` | 1 |
| Hook | `components/hooks/use-qr-code-picker.ts` | `components/qr-code/hooks/use-qr-code-picker.ts` | 1 |
| Hook | `components/hooks/use-qr-code-table.ts` | `components/qr-code/hooks/use-qr-code-table.ts` | 1 |
| Hook ⚠ từ views/hooks | `views/hooks/use-qr-code-insert.ts` | `components/qr-code/hooks/use-qr-code-insert.ts` | 1 |

**`short-link`** (15 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/link-unavailable-view.tsx` | `views/short-link/link-unavailable-view.tsx` | 2 |
| View | `views/short-link-create-view.tsx` | `views/short-link/short-link-create-view.tsx` | 1 |
| View | `views/short-link-detail-view.tsx` | `views/short-link/short-link-detail-view.tsx` | 1 |
| View | `views/short-link-landing-view.tsx` | `views/short-link/short-link-landing-view.tsx` | 1 |
| View | `views/short-link-list-view.tsx` | `views/short-link/short-link-list-view.tsx` | 1 |
| View | `views/short-link-tiptap-plugin.tsx` | `views/short-link/short-link-tiptap-plugin.tsx` | 1 |
| Component | `components/short-link-button-insert.tsx` | `components/short-link/short-link-button-insert.tsx` | 1 |
| Component | `components/short-link-form.tsx` | `components/short-link/short-link-form.tsx` | 2 |
| Component | `components/short-link-landing-card.tsx` | `components/short-link/short-link-landing-card.tsx` | 1 |
| Component | `components/short-link-profile.tsx` | `components/short-link/short-link-profile.tsx` | 1 |
| Component | `components/short-link-table.tsx` | `components/short-link/short-link-table.tsx` | 1 |
| Hook | `components/hooks/use-short-link-form.ts` | `components/short-link/hooks/use-short-link-form.ts` | 1 |
| Hook | `components/hooks/use-short-link-landing.ts` | `components/short-link/hooks/use-short-link-landing.ts` | 1 |
| Hook | `components/hooks/use-short-link-table.ts` | `components/short-link/hooks/use-short-link-table.ts` | 1 |
| Hook ⚠ từ views/hooks | `views/hooks/use-short-link-button-insert.ts` | `components/short-link/hooks/use-short-link-button-insert.ts` | 1 |

### finance — 60 file, 7 nhóm

**`classification-rule`** (10 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/classification-rule-create-view.tsx` | `views/classification-rule/classification-rule-create-view.tsx` | 1 |
| View | `views/classification-rule-detail-view.tsx` | `views/classification-rule/classification-rule-detail-view.tsx` | 1 |
| View | `views/classification-rule-list-view.tsx` | `views/classification-rule/classification-rule-list-view.tsx` | 1 |
| Component | `components/classification-rule-form.tsx` | `components/classification-rule/classification-rule-form.tsx` | 2 |
| Component | `components/classification-rule-profile.tsx` | `components/classification-rule/classification-rule-profile.tsx` | 1 |
| Component | `components/classification-rule-table.tsx` | `components/classification-rule/classification-rule-table.tsx` | 1 |
| Component | `components/rule-tester.tsx` | `components/classification-rule/rule-tester.tsx` | 1 |
| Hook | `components/hooks/use-classification-rule-form.ts` | `components/classification-rule/hooks/use-classification-rule-form.ts` | 1 |
| Hook | `components/hooks/use-classification-rule-table.ts` | `components/classification-rule/hooks/use-classification-rule-table.ts` | 1 |
| Hook | `components/hooks/use-rule-tester.ts` | `components/classification-rule/hooks/use-rule-tester.ts` | 1 |

**`dashboard`** (12 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/finance-dashboard-view.tsx` | `views/dashboard/finance-dashboard-view.tsx` | 1 |
| Component | `components/finance-count-chart.tsx` | `components/dashboard/finance-count-chart.tsx` | 1 |
| Component | `components/finance-cumulative-chart.tsx` | `components/dashboard/finance-cumulative-chart.tsx` | 1 |
| Component | `components/finance-dashboard.tsx` | `components/dashboard/finance-dashboard.tsx` | 1 |
| Component | `components/finance-growth-chart.tsx` | `components/dashboard/finance-growth-chart.tsx` | 1 |
| Component | `components/finance-kpi-cards.tsx` | `components/dashboard/finance-kpi-cards.tsx` | 1 |
| Component | `components/finance-platform-area-chart.tsx` | `components/dashboard/finance-platform-area-chart.tsx` | 1 |
| Component | `components/finance-share-donut.tsx` | `components/dashboard/finance-share-donut.tsx` | 1 |
| Component | `components/finance-tax-chart.tsx` | `components/dashboard/finance-tax-chart.tsx` | 1 |
| Component | `components/finance-trend-chart.tsx` | `components/dashboard/finance-trend-chart.tsx` | 1 |
| Component | `components/year-select.tsx` | `components/dashboard/year-select.tsx` | 2 |
| Hook | `components/hooks/use-finance-dashboard.ts` | `components/dashboard/hooks/use-finance-dashboard.ts` | 1 |

**`finance-report`** (3 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/finance-report-view.tsx` | `views/finance-report/finance-report-view.tsx` | 1 |
| Component | `components/finance-report.tsx` | `components/finance-report/finance-report.tsx` | 1 |
| Hook | `components/hooks/use-finance-report.ts` | `components/finance-report/hooks/use-finance-report.ts` | 1 |

**`income`** (10 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/income-create-view.tsx` | `views/income/income-create-view.tsx` | 1 |
| View | `views/income-detail-view.tsx` | `views/income/income-detail-view.tsx` | 1 |
| View | `views/income-list-view.tsx` | `views/income/income-list-view.tsx` | 1 |
| Component | `components/income-form.tsx` | `components/income/income-form.tsx` | 2 |
| Component | `components/income-profile.tsx` | `components/income/income-profile.tsx` | 1 |
| Component | `components/income-table.tsx` | `components/income/income-table.tsx` | 2 |
| Component | `components/money-text.tsx` | `components/income/money-text.tsx` | 6 |
| Component | `components/tax-status-badge.tsx` | `components/income/tax-status-badge.tsx` | 2 |
| Hook | `components/hooks/use-income-form.ts` | `components/income/hooks/use-income-form.ts` | 1 |
| Hook | `components/hooks/use-income-table.ts` | `components/income/hooks/use-income-table.ts` | 1 |

**`invoice`** (10 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/invoice-create-view.tsx` | `views/invoice/invoice-create-view.tsx` | 1 |
| View | `views/invoice-detail-view.tsx` | `views/invoice/invoice-detail-view.tsx` | 1 |
| View | `views/invoice-list-view.tsx` | `views/invoice/invoice-list-view.tsx` | 1 |
| Component | `components/invoice-attachments-field.tsx` | `components/invoice/invoice-attachments-field.tsx` | 1 |
| Component | `components/invoice-form.tsx` | `components/invoice/invoice-form.tsx` | 2 |
| Component | `components/invoice-profile.tsx` | `components/invoice/invoice-profile.tsx` | 1 |
| Component | `components/invoice-table.tsx` | `components/invoice/invoice-table.tsx` | 1 |
| Hook | `components/hooks/use-invoice-attachments-field.ts` | `components/invoice/hooks/use-invoice-attachments-field.ts` | 1 |
| Hook | `components/hooks/use-invoice-form.ts` | `components/invoice/hooks/use-invoice-form.ts` | 1 |
| Hook | `components/hooks/use-invoice-table.ts` | `components/invoice/hooks/use-invoice-table.ts` | 1 |

**`platform`** (10 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/platform-create-view.tsx` | `views/platform/platform-create-view.tsx` | 1 |
| View | `views/platform-detail-view.tsx` | `views/platform/platform-detail-view.tsx` | 1 |
| View | `views/platform-list-view.tsx` | `views/platform/platform-list-view.tsx` | 1 |
| Component | `components/platform-form.tsx` | `components/platform/platform-form.tsx` | 2 |
| Component | `components/platform-profile.tsx` | `components/platform/platform-profile.tsx` | 1 |
| Component | `components/platform-table.tsx` | `components/platform/platform-table.tsx` | 1 |
| Component | `components/platform-tax-rates-section.tsx` | `components/platform/platform-tax-rates-section.tsx` | 1 |
| Hook | `components/hooks/use-platform-form.ts` | `components/platform/hooks/use-platform-form.ts` | 1 |
| Hook | `components/hooks/use-platform-table.ts` | `components/platform/hooks/use-platform-table.ts` | 1 |
| Hook | `components/hooks/use-platform-tax-rates-section.ts` | `components/platform/hooks/use-platform-tax-rates-section.ts` | 1 |

**`sepay-connection`** (5 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/sepay-view.tsx` | `views/sepay-connection/sepay-view.tsx` | 1 |
| Component | `components/sepay-connection.tsx` | `components/sepay-connection/sepay-connection.tsx` | 1 |
| Component | `components/sepay-import.tsx` | `components/sepay-connection/sepay-import.tsx` | 1 |
| Hook | `components/hooks/use-sepay-connection.ts` | `components/sepay-connection/hooks/use-sepay-connection.ts` | 1 |
| Hook | `components/hooks/use-sepay-import.ts` | `components/sepay-connection/hooks/use-sepay-import.ts` | 1 |

### novel — 62 file, 8 nhóm

**`author`** (7 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/author-create-view.tsx` | `views/author/author-create-view.tsx` | 1 |
| View | `views/author-detail-view.tsx` | `views/author/author-detail-view.tsx` | 1 |
| View | `views/author-list-view.tsx` | `views/author/author-list-view.tsx` | 1 |
| Component | `components/author-form.tsx` | `components/author/author-form.tsx` | 2 |
| Component | `components/author-table.tsx` | `components/author/author-table.tsx` | 1 |
| Hook | `components/hooks/use-author-form.ts` | `components/author/hooks/use-author-form.ts` | 1 |
| Hook | `components/hooks/use-author-table.ts` | `components/author/hooks/use-author-table.ts` | 1 |
| **Mới** | — | `components/author/author-profile.tsx` | Tải author bằng useAuthor, Skeleton/QueryErrorState, render AuthorForm — lấy từ author-detail-view |
| **Mới** | — | `components/author/hooks/use-author-profile.ts` | Gọi useAuthor(id, canRead) cho author-profile |

**`chapter`** (9 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/chapter-create-view.tsx` | `views/chapter/chapter-create-view.tsx` | 1 |
| View | `views/chapter-detail-view.tsx` | `views/chapter/chapter-detail-view.tsx` | 1 |
| View | `views/chapter-list-view.tsx` | `views/chapter/chapter-list-view.tsx` | 1 |
| Component | `components/chapter-form.tsx` | `components/chapter/chapter-form.tsx` | 2 |
| Component | `components/chapter-list.tsx` | `components/chapter/chapter-list.tsx` | 1 |
| Component | `components/chapter-table.tsx` | `components/chapter/chapter-table.tsx` | 1 |
| Hook | `components/hooks/use-chapter-form.ts` | `components/chapter/hooks/use-chapter-form.ts` | 1 |
| Hook | `components/hooks/use-chapter-list.ts` | `components/chapter/hooks/use-chapter-list.ts` | 1 |
| Hook | `components/hooks/use-chapter-table.ts` | `components/chapter/hooks/use-chapter-table.ts` | 1 |
| **Mới** | — | `components/chapter/chapter-profile.tsx` | Tải chapter bằng useChapter, Skeleton/QueryErrorState, render ChapterForm — lấy từ chapter-detail-view |
| **Mới** | — | `components/chapter/hooks/use-chapter-profile.ts` | Gọi useChapter(id, canRead) cho chapter-profile |

**`favorite`** (3 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/novel-favorites-view.tsx` | `views/favorite/novel-favorites-view.tsx` | 1 |
| Component | `components/novel-favorites.tsx` | `components/favorite/novel-favorites.tsx` | 1 |
| Hook | `components/hooks/use-novel-favorites-component.ts` | `components/favorite/hooks/use-novel-favorites-component.ts` | 1 |

**`genre`** (7 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/genre-create-view.tsx` | `views/genre/genre-create-view.tsx` | 1 |
| View | `views/genre-detail-view.tsx` | `views/genre/genre-detail-view.tsx` | 1 |
| View | `views/genre-list-view.tsx` | `views/genre/genre-list-view.tsx` | 1 |
| Component | `components/genre-form.tsx` | `components/genre/genre-form.tsx` | 2 |
| Component | `components/genre-table.tsx` | `components/genre/genre-table.tsx` | 1 |
| Hook | `components/hooks/use-genre-form.ts` | `components/genre/hooks/use-genre-form.ts` | 1 |
| Hook | `components/hooks/use-genre-table.ts` | `components/genre/hooks/use-genre-table.ts` | 1 |
| **Mới** | — | `components/genre/genre-profile.tsx` | Tải genre bằng useGenre, Skeleton/QueryErrorState, render GenreForm — lấy từ genre-detail-view |
| **Mới** | — | `components/genre/hooks/use-genre-profile.ts` | Gọi useGenre(id, canRead) cho genre-profile |

**`novel`** (18 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/admin-novel-list-view.tsx` | `views/novel/admin-novel-list-view.tsx` | 1 |
| View | `views/novel-create-view.tsx` | `views/novel/novel-create-view.tsx` | 1 |
| View | `views/novel-detail-view.tsx` | `views/novel/novel-detail-view.tsx` | 1 |
| View | `views/novel-edit-view.tsx` | `views/novel/novel-edit-view.tsx` | 1 |
| View | `views/novel-list-view.tsx` | `views/novel/novel-list-view.tsx` | 1 |
| Component | `components/novel-card.tsx` | `components/novel/novel-card.tsx` | 1 |
| Component | `components/novel-catalog.tsx` | `components/novel/novel-catalog.tsx` | 1 |
| Component | `components/novel-detail.tsx` | `components/novel/novel-detail.tsx` | 1 |
| Component | `components/novel-form.tsx` | `components/novel/novel-form.tsx` | 2 |
| Component | `components/novel-guard.tsx` | `components/novel/novel-guard.tsx` | 5 |
| Component | `components/novel-import-dialog.tsx` | `components/novel/novel-import-dialog.tsx` | 1 |
| Component | `components/novel-table.tsx` | `components/novel/novel-table.tsx` | 1 |
| Hook | `components/hooks/use-novel-catalog.ts` | `components/novel/hooks/use-novel-catalog.ts` | 1 |
| Hook | `components/hooks/use-novel-detail.ts` | `components/novel/hooks/use-novel-detail.ts` | 1 |
| Hook | `components/hooks/use-novel-form.ts` | `components/novel/hooks/use-novel-form.ts` | 1 |
| Hook | `components/hooks/use-novel-guard.ts` | `components/novel/hooks/use-novel-guard.ts` | 1 |
| Hook | `components/hooks/use-novel-import-dialog.ts` | `components/novel/hooks/use-novel-import-dialog.ts` | 1 |
| Hook | `components/hooks/use-novel-table.ts` | `components/novel/hooks/use-novel-table.ts` | 1 |
| **Mới** | — | `components/novel/novel-profile.tsx` | Tải novel bằng useNovel, Skeleton/QueryErrorState, render NovelForm — lấy từ novel-edit-view |
| **Mới** | — | `components/novel/hooks/use-novel-profile.ts` | Gọi useNovel(id, canRead) cho novel-profile |

**`reader`** (8 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/novel-reader-view.tsx` | `views/reader/novel-reader-view.tsx` | 1 |
| Component | `components/novel-reader.tsx` | `components/reader/novel-reader.tsx` | 1 |
| Component | `components/reader-content.tsx` | `components/reader/reader-content.tsx` | 1 |
| Component | `components/reader-footer.tsx` | `components/reader/reader-footer.tsx` | 1 |
| Component | `components/reader-header.tsx` | `components/reader/reader-header.tsx` | 1 |
| Component | `components/reader-settings-dialog.tsx` | `components/reader/reader-settings-dialog.tsx` | 1 |
| Hook | `components/hooks/use-novel-reader.ts` | `components/reader/hooks/use-novel-reader.ts` | 1 |
| Hook | `components/hooks/use-reader-content.ts` | `components/reader/hooks/use-reader-content.ts` | 1 |

**`reading-history`** (3 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/reading-history-view.tsx` | `views/reading-history/reading-history-view.tsx` | 1 |
| Component | `components/reading-history.tsx` | `components/reading-history/reading-history.tsx` | 1 |
| Hook | `components/hooks/use-reading-history.ts` | `components/reading-history/hooks/use-reading-history.ts` | 2 |

**`tag`** (7 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/tag-create-view.tsx` | `views/tag/tag-create-view.tsx` | 1 |
| View | `views/tag-detail-view.tsx` | `views/tag/tag-detail-view.tsx` | 1 |
| View | `views/tag-list-view.tsx` | `views/tag/tag-list-view.tsx` | 1 |
| Component | `components/tag-form.tsx` | `components/tag/tag-form.tsx` | 2 |
| Component | `components/tag-table.tsx` | `components/tag/tag-table.tsx` | 1 |
| Hook | `components/hooks/use-tag-form.ts` | `components/tag/hooks/use-tag-form.ts` | 1 |
| Hook | `components/hooks/use-tag-table.ts` | `components/tag/hooks/use-tag-table.ts` | 1 |
| **Mới** | — | `components/tag/tag-profile.tsx` | Tải tag bằng useTag, Skeleton/QueryErrorState, render TagForm — lấy từ tag-detail-view |
| **Mới** | — | `components/tag/hooks/use-tag-profile.ts` | Gọi useTag(id, canRead) cho tag-profile |

### system — 154 file, 22 nhóm

**`announcement`** (6 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/announcement-create-view.tsx` | `views/announcement/announcement-create-view.tsx` | 1 |
| View | `views/announcement-list-view.tsx` | `views/announcement/announcement-list-view.tsx` | 1 |
| Component | `components/announcement-form.tsx` | `components/announcement/announcement-form.tsx` | 1 |
| Component | `components/announcement-table.tsx` | `components/announcement/announcement-table.tsx` | 1 |
| Hook | `components/hooks/use-announcement-form.ts` | `components/announcement/hooks/use-announcement-form.ts` | 1 |
| Hook | `components/hooks/use-announcement-table.ts` | `components/announcement/hooks/use-announcement-table.ts` | 1 |

**`attachment`** (38 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/attachment-image-upload-view.tsx` | `views/attachment/attachment-image-upload-view.tsx` | 5 |
| View | `views/attachment-library-view.tsx` | `views/attachment/attachment-library-view.tsx` | 1 |
| View | `views/attachment-tiptap-image-plugin.tsx` | `views/attachment/attachment-tiptap-image-plugin.tsx` | 1 |
| View | `views/file-access-view.tsx` | `views/attachment/file-access-view.tsx` | 1 |
| Component | `components/attachment-detail-content.tsx` | `components/attachment/attachment-detail-content.tsx` | 1 |
| Component | `components/attachment-detail-dialog.tsx` | `components/attachment/attachment-detail-dialog.tsx` | 3 |
| Component | `components/attachment-details.tsx` | `components/attachment/attachment-details.tsx` | 0 |
| Component | `components/attachment-edit-dialog.tsx` | `components/attachment/attachment-edit-dialog.tsx` | 2 |
| Component | `components/attachment-edit-form.tsx` | `components/attachment/attachment-edit-form.tsx` | 1 |
| Component | `components/attachment-grid.tsx` | `components/attachment/attachment-grid.tsx` | 2 |
| Component | `components/attachment-image-editor-lazy.tsx` | `components/attachment/attachment-image-editor-lazy.tsx` | 1 |
| Component | `components/attachment-image-editor.tsx` | `components/attachment/attachment-image-editor.tsx` | 2 |
| Component | `components/attachment-image-upload.tsx` | `components/attachment/attachment-image-upload.tsx` | 1 |
| Component | `components/attachment-library.tsx` | `components/attachment/attachment-library.tsx` | 1 |
| Component | `components/attachment-media-filters.tsx` | `components/attachment/attachment-media-filters.tsx` | 2 |
| Component | `components/attachment-move-dialog.tsx` | `components/attachment/attachment-move-dialog.tsx` | 2 |
| Component | `components/attachment-picker.tsx` | `components/attachment/attachment-picker.tsx` | 4 |
| Component | `components/attachment-preview.tsx` | `components/attachment/attachment-preview.tsx` | 5 |
| Component | `components/attachment-upload.tsx` | `components/attachment/attachment-upload.tsx` | 1 |
| Component | `components/attachment-video-player.tsx` | `components/attachment/attachment-video-player.tsx` | 2 |
| Component | `components/attachment-view-mode-toggle.tsx` | `components/attachment/attachment-view-mode-toggle.tsx` | 2 |
| Component | `components/attachment-visibility-toggle.tsx` | `components/attachment/attachment-visibility-toggle.tsx` | 2 |
| Component | `components/file-access-gate.tsx` | `components/attachment/file-access-gate.tsx` | 1 |
| Component | `components/library-image-insert.tsx` | `components/attachment/library-image-insert.tsx` | 1 |
| Hook | `components/hooks/use-attachment-detail-dialog.ts` | `components/attachment/hooks/use-attachment-detail-dialog.ts` | 1 |
| Hook | `components/hooks/use-attachment-details.ts` | `components/attachment/hooks/use-attachment-details.ts` | 1 |
| Hook | `components/hooks/use-attachment-edit-dialog.ts` | `components/attachment/hooks/use-attachment-edit-dialog.ts` | 1 |
| Hook | `components/hooks/use-attachment-image-editor.ts` | `components/attachment/hooks/use-attachment-image-editor.ts` | 1 |
| Hook | `components/hooks/use-attachment-image-upload.ts` | `components/attachment/hooks/use-attachment-image-upload.ts` | 1 |
| Hook | `components/hooks/use-attachment-library.ts` | `components/attachment/hooks/use-attachment-library.ts` | 1 |
| Hook | `components/hooks/use-attachment-move-dialog.ts` | `components/attachment/hooks/use-attachment-move-dialog.ts` | 1 |
| Hook | `components/hooks/use-attachment-picker.ts` | `components/attachment/hooks/use-attachment-picker.ts` | 1 |
| Hook | `components/hooks/use-attachment-preview.ts` | `components/attachment/hooks/use-attachment-preview.ts` | 1 |
| Hook | `components/hooks/use-attachment-upload.ts` | `components/attachment/hooks/use-attachment-upload.ts` | 1 |
| Hook | `components/hooks/use-attachment-video-player.ts` | `components/attachment/hooks/use-attachment-video-player.ts` | 1 |
| Hook | `components/hooks/use-attachment-view-mode.ts` | `components/attachment/hooks/use-attachment-view-mode.ts` | 4 |
| Hook | `components/hooks/use-file-access.ts` | `components/attachment/hooks/use-file-access.ts` | 1 |
| Hook ⚠ từ views/hooks | `views/hooks/use-library-image-insert.ts` | `components/attachment/hooks/use-library-image-insert.ts` | 1 |

**`attachment-folder`** (3 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| Component | `components/attachment-folder-filter.tsx` | `components/attachment-folder/attachment-folder-filter.tsx` | 2 |
| Component | `components/attachment-folder-manager.tsx` | `components/attachment-folder/attachment-folder-manager.tsx` | 3 |
| Hook | `components/hooks/use-attachment-folder-manager.ts` | `components/attachment-folder/hooks/use-attachment-folder-manager.ts` | 1 |

**`auth`** (16 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/forgot-password-view.tsx` | `views/auth/forgot-password-view.tsx` | 1 |
| View | `views/invitation-view.tsx` | `views/auth/invitation-view.tsx` | 1 |
| View | `views/login-view.tsx` | `views/auth/login-view.tsx` | 1 |
| View | `views/reset-password-view.tsx` | `views/auth/reset-password-view.tsx` | 1 |
| View | `views/social-auth-callback-view.tsx` | `views/auth/social-auth-callback-view.tsx` | 2 |
| View | `views/verify-email-view.tsx` | `views/auth/verify-email-view.tsx` | 1 |
| Component | `components/auth-shell.tsx` | `components/auth/auth-shell.tsx` | 7 |
| Component | `components/forgot-password-form.tsx` | `components/auth/forgot-password-form.tsx` | 1 |
| Component | `components/invitation-form.tsx` | `components/auth/invitation-form.tsx` | 1 |
| Component | `components/login-form.tsx` | `components/auth/login-form.tsx` | 2 |
| Component | `components/reset-password-form.tsx` | `components/auth/reset-password-form.tsx` | 1 |
| Hook | `components/hooks/use-forgot-password-form.ts` | `components/auth/hooks/use-forgot-password-form.ts` | 1 |
| Hook | `components/hooks/use-invitation-form.ts` | `components/auth/hooks/use-invitation-form.ts` | 1 |
| Hook | `components/hooks/use-login-form.ts` | `components/auth/hooks/use-login-form.ts` | 1 |
| Hook | `components/hooks/use-reset-password-form.ts` | `components/auth/hooks/use-reset-password-form.ts` | 1 |
| Hook ⚠ từ views/hooks | `views/hooks/use-verify-email.ts` | `components/auth/hooks/use-verify-email.ts` | 1 |
| **Mới** | — | `components/auth/social-auth-callback.tsx` | Toàn bộ giao diện callback OAuth (đang 304 dòng trong View) |
| **Mới** | — | `components/auth/hooks/use-social-auth-callback.ts` | State, useEffect, useSearchParams, gọi API đăng nhập/liên kết |
| **Mới** | — | `components/auth/verify-email-status.tsx` | Giao diện đang xác minh / thành công / lỗi + nút thử lại |

**`auth-session`** (3 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/session-list-view.tsx` | `views/auth-session/session-list-view.tsx` | 1 |
| Component | `components/session-table.tsx` | `components/auth-session/session-table.tsx` | 1 |
| Hook | `components/hooks/use-session-table.ts` | `components/auth-session/hooks/use-session-table.ts` | 1 |

**`callback`** (2 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/callback-list-view.tsx` | `views/callback/callback-list-view.tsx` | 1 |
| Component | `components/callback-list.tsx` | `components/callback/callback-list.tsx` | 1 |

**`currency`** (8 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/currency-create-view.tsx` | `views/currency/currency-create-view.tsx` | 1 |
| View | `views/currency-detail-view.tsx` | `views/currency/currency-detail-view.tsx` | 1 |
| View | `views/currency-list-view.tsx` | `views/currency/currency-list-view.tsx` | 1 |
| Component | `components/currency-form.tsx` | `components/currency/currency-form.tsx` | 2 |
| Component | `components/currency-profile.tsx` | `components/currency/currency-profile.tsx` | 1 |
| Component | `components/currency-table.tsx` | `components/currency/currency-table.tsx` | 1 |
| Hook | `components/hooks/use-currency-form.ts` | `components/currency/hooks/use-currency-form.ts` | 1 |
| Hook | `components/hooks/use-currency-table.ts` | `components/currency/hooks/use-currency-table.ts` | 1 |

**`current-user`** (5 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| Component | `components/account-email.tsx` | `components/current-user/account-email.tsx` | 1 |
| Component | `components/profile-dialog.tsx` | `components/current-user/profile-dialog.tsx` | 2 |
| Component | `components/user-menu.tsx` | `components/current-user/user-menu.tsx` | 3 |
| Hook | `components/hooks/use-profile-dialog.ts` | `components/current-user/hooks/use-profile-dialog.ts` | 1 |
| Hook | `components/hooks/use-user-menu.ts` | `components/current-user/hooks/use-user-menu.ts` | 2 |

**`exchange-rate`** (6 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/exchange-rate-create-view.tsx` | `views/exchange-rate/exchange-rate-create-view.tsx` | 1 |
| View | `views/exchange-rate-list-view.tsx` | `views/exchange-rate/exchange-rate-list-view.tsx` | 1 |
| Component | `components/exchange-rate-form.tsx` | `components/exchange-rate/exchange-rate-form.tsx` | 1 |
| Component | `components/exchange-rate-table.tsx` | `components/exchange-rate/exchange-rate-table.tsx` | 1 |
| Hook | `components/hooks/use-exchange-rate-form.ts` | `components/exchange-rate/hooks/use-exchange-rate-form.ts` | 1 |
| Hook | `components/hooks/use-exchange-rate-table.ts` | `components/exchange-rate/hooks/use-exchange-rate-table.ts` | 1 |

**`journal-entry`** (10 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/journal-entry-detail-view.tsx` | `views/journal-entry/journal-entry-detail-view.tsx` | 1 |
| View | `views/journal-list-view.tsx` | `views/journal-entry/journal-list-view.tsx` | 1 |
| View | `views/record-history-view.tsx` | `views/journal-entry/record-history-view.tsx` | 15 |
| Component | `components/journal-entry-detail.tsx` | `components/journal-entry/journal-entry-detail.tsx` | 1 |
| Component | `components/journal-table.tsx` | `components/journal-entry/journal-table.tsx` | 1 |
| Component | `components/journal-value.tsx` | `components/journal-entry/journal-value.tsx` | 1 |
| Component | `components/record-history.tsx` | `components/journal-entry/record-history.tsx` | 1 |
| Hook | `components/hooks/use-journal-entry-detail.ts` | `components/journal-entry/hooks/use-journal-entry-detail.ts` | 1 |
| Hook | `components/hooks/use-journal-table.ts` | `components/journal-entry/hooks/use-journal-table.ts` | 1 |
| Hook | `components/hooks/use-record-history-items.ts` | `components/journal-entry/hooks/use-record-history-items.ts` | 1 |

**`notification`** (4 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| Component | `components/notification-bell.tsx` | `components/notification/notification-bell.tsx` | 1 |
| Component | `components/notification-item.tsx` | `components/notification/notification-item.tsx` | 1 |
| Hook | `components/hooks/use-notification-bell.ts` | `components/notification/hooks/use-notification-bell.ts` | 1 |
| Hook | `components/hooks/use-notification-realtime.ts` | `components/notification/hooks/use-notification-realtime.ts` | 1 |

**`notification-delivery`** (3 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/notification-delivery-view.tsx` | `views/notification-delivery/notification-delivery-view.tsx` | 1 |
| Component | `components/notification-delivery-table.tsx` | `components/notification-delivery/notification-delivery-table.tsx` | 1 |
| Hook | `components/hooks/use-notification-delivery-table.ts` | `components/notification-delivery/hooks/use-notification-delivery-table.ts` | 1 |

**`notification-preference`** (3 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| Component | `components/notification-preference-matrix.tsx` | `components/notification-preference/notification-preference-matrix.tsx` | 1 |
| Component | `components/notification-settings-tab.tsx` | `components/notification-preference/notification-settings-tab.tsx` | 1 |
| Hook | `components/hooks/use-notification-preference-matrix.ts` | `components/notification-preference/hooks/use-notification-preference-matrix.ts` | 1 |

**`permission`** (4 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/permission-list-view.tsx` | `views/permission/permission-list-view.tsx` | 1 |
| Component | `components/permission-catalog.tsx` | `components/permission/permission-catalog.tsx` | 1 |
| Component | `components/permission-gate.tsx` | `components/permission/permission-gate.tsx` | 17 |
| Hook | `components/hooks/use-permission-catalog.ts` | `components/permission/hooks/use-permission-catalog.ts` | 1 |

**`push-device`** (2 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| Component | `components/push-device-card.tsx` | `components/push-device/push-device-card.tsx` | 1 |
| Hook | `components/hooks/use-push-registration.ts` | `components/push-device/hooks/use-push-registration.ts` | 2 |

**`role`** (11 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/role-create-view.tsx` | `views/role/role-create-view.tsx` | 1 |
| View | `views/role-detail-view.tsx` | `views/role/role-detail-view.tsx` | 1 |
| View | `views/role-list-view.tsx` | `views/role/role-list-view.tsx` | 1 |
| Component | `components/role-create-form.tsx` | `components/role/role-create-form.tsx` | 1 |
| Component | `components/role-form.tsx` | `components/role/role-form.tsx` | 2 |
| Component | `components/role-profile.tsx` | `components/role/role-profile.tsx` | 1 |
| Component | `components/role-table.tsx` | `components/role/role-table.tsx` | 1 |
| Hook | `components/hooks/use-role-create-form.ts` | `components/role/hooks/use-role-create-form.ts` | 1 |
| Hook | `components/hooks/use-role-form.ts` | `components/role/hooks/use-role-form.ts` | 1 |
| Hook | `components/hooks/use-role-profile.ts` | `components/role/hooks/use-role-profile.ts` | 1 |
| Hook | `components/hooks/use-role-table.ts` | `components/role/hooks/use-role-table.ts` | 1 |

**`setting`** (6 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/system-settings-view.tsx` | `views/setting/system-settings-view.tsx` | 1 |
| Component | `components/setting-edit-dialog.tsx` | `components/setting/setting-edit-dialog.tsx` | 1 |
| Component | `components/setting-edit-form.tsx` | `components/setting/setting-edit-form.tsx` | 1 |
| Component | `components/setting-social-auth-card.tsx` | `components/setting/setting-social-auth-card.tsx` | 1 |
| Component | `components/setting-table.tsx` | `components/setting/setting-table.tsx` | 1 |
| Hook | `components/hooks/use-setting-table.ts` | `components/setting/hooks/use-setting-table.ts` | 1 |

**`telegram-bot`** (2 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| Component | `components/telegram-bot-card.tsx` | `components/telegram-bot/telegram-bot-card.tsx` | 1 |
| Hook | `components/hooks/use-telegram-bot-card.ts` | `components/telegram-bot/hooks/use-telegram-bot-card.ts` | 1 |

**`telegram-chat`** (2 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| Component | `components/telegram-chat-list.tsx` | `components/telegram-chat/telegram-chat-list.tsx` | 1 |
| Hook | `components/hooks/use-telegram-chat-list.ts` | `components/telegram-chat/hooks/use-telegram-chat-list.ts` | 1 |

**`user`** (12 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/user-create-view.tsx` | `views/user/user-create-view.tsx` | 1 |
| View | `views/user-detail-view.tsx` | `views/user/user-detail-view.tsx` | 1 |
| View | `views/user-list-view.tsx` | `views/user/user-list-view.tsx` | 1 |
| Component | `components/user-activity-section.tsx` | `components/user/user-activity-section.tsx` | 1 |
| Component | `components/user-form.tsx` | `components/user/user-form.tsx` | 2 |
| Component | `components/user-profile.tsx` | `components/user/user-profile.tsx` | 1 |
| Component | `components/user-social-account-card.tsx` | `components/user/user-social-account-card.tsx` | 1 |
| Component | `components/user-social-accounts-section.tsx` | `components/user/user-social-accounts-section.tsx` | 2 |
| Component | `components/user-table.tsx` | `components/user/user-table.tsx` | 1 |
| Hook | `components/hooks/use-user-form.ts` | `components/user/hooks/use-user-form.ts` | 1 |
| Hook | `components/hooks/use-user-profile.ts` | `components/user/hooks/use-user-profile.ts` | 1 |
| Hook | `components/hooks/use-user-table.ts` | `components/user/hooks/use-user-table.ts` | 1 |

**`user-role`** (6 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/user-role-filter-view.tsx` | `views/user-role/user-role-filter-view.tsx` | 1 |
| View | `views/user-role-picker-view.tsx` | `views/user-role/user-role-picker-view.tsx` | 2 |
| Component | `components/user-role-filter.tsx` | `components/user-role/user-role-filter.tsx` | 1 |
| Component | `components/user-role-picker.tsx` | `components/user-role/user-role-picker.tsx` | 1 |
| Hook | `components/hooks/use-user-role-filter.ts` | `components/user-role/hooks/use-user-role-filter.ts` | 1 |
| Hook | `components/hooks/use-user-role-picker.ts` | `components/user-role/hooks/use-user-role-picker.ts` | 1 |

**`webhook`** (2 file)

| Loại | Đường cũ | Đường mới | Số file import |
| --- | --- | --- | --- |
| View | `views/webhook-list-view.tsx` | `views/webhook/webhook-list-view.tsx` | 1 |
| Component | `components/webhook-list.tsx` | `components/webhook/webhook-list.tsx` | 1 |

## 5. Sửa test quy ước

| File | Thay đổi |
| --- | --- |
| `tests/unit/table-conventions.test.ts` | Đọc đệ quy `components/**/*.tsx`. Hiện chỉ đọc cấp gốc, sau khi chuyển sẽ không thấy bảng nào (assert `TABLE_FILES.length > 10` sẽ báo đỏ) |
| `tests/unit/module-structure.test.ts` (mới) | (1) không có `.tsx`/`.ts` ở gốc `components/` và `views/`; (2) không có `components/hooks/` cấp gốc, không có `views/**/hooks/`; (3) hook `use-*.ts` chỉ nằm trong `components/<nhóm>/hooks/` hoặc `hooks/` của module; (4) View chỉ gọi `usePermission`, `useTranslations`, `useEditMode`; (5) không có nhóm `shared`/`common` trong module |
| `tests/unit/one-unit-per-file.test.ts` | Đã đọc đệ quy, không sửa |
| 11 file test import component/view | Đổi đường import và chuỗi `vi.mock(...)` (script làm) |

## 6. Script chuyển file

Script nằm trong scratchpad, không đưa vào repo:
- `fe_mapping.py`: dữ liệu ánh xạ của mục 4 (nguồn duy nhất).
- `fe_plan_table.py`: kiểm độ phủ, sinh bảng.
- `fe_move.py`: viết khi làm.

`fe_move.py` chạy theo từng module (`--module home`):

1. Lập bảng `đường cũ → đường mới` (tuyệt đối) cho mọi file của module. Dừng nếu đích đã tồn tại.
2. Với **mọi** file `.ts/.tsx` trong `src/` và `tests/`:
   - import tương đối (`./x`, `../hooks/use-y`): giải thành đường tuyệt đối theo vị trí **cũ** của file đang sửa,
     ánh xạ đích nếu đích cũng được chuyển, rồi tính lại đường tương đối từ vị trí **mới**. Có khoảng 1.060 import
     tương đối trong `components/` và `views/`. Ví dụ `../hooks/use-author` thành `../../hooks/use-author`, còn
     `./hooks/use-author-form` giữ nguyên.
   - import `@/modules/<m>/components/...` và `@/modules/<m>/views/...`: đổi theo bảng (khoảng 130 dòng, gồm 84
     `page.tsx`/`layout.tsx` trong `app/` và 11 file test).
   - chuỗi trong `vi.mock("...")` và `import("...")` (ví dụ `attachment-image-editor-lazy.tsx`) cũng đổi.
3. Di chuyển file bằng lệnh hệ điều hành thường (**không dùng `git mv`**, không thao tác git), xóa thư mục rỗng.
4. In báo cáo: số file đã chuyển, số import đã đổi, import không giải được (phải bằng 0).
5. Chạy `prettier --write` và `eslint --fix` cho file bị sửa (thứ tự import có thể đổi).

## 7. Thứ tự làm

| Bước | Module | File | Việc | Kiểm |
| --- | --- | --- | --- | --- |
| 1 | home | 18 + 5 mới | Sửa 3 View lỗi (3.2), chuyển hook `views/hooks/`, chuyển file | typecheck, lint, Vitest home + quy ước |
| 2 | manage-app | 25 | Chuyển file (`shell`, `sidebar`, `launcher`) | như trên + `module-registry` |
| 3 | utilities | 52 | Chuyển 2 hook `views/hooks/`, chuyển file | Vitest utilities |
| 4 | finance | 60 | Chuyển file (`dashboard` riêng) | Vitest finance |
| 5 | novel | 62 + 10 mới | Tạo 5 `*-profile` + hook, dời chuyển trang vào hook form, chuyển file | Vitest novel |
| 6 | system | 154 + 3 mới | Tách `SocialAuthCallback`, `VerifyEmailStatus`, chuyển 2 hook, chuyển file. Để cuối vì module khác import `permission-gate` (17 file), `attachment-picker`, `record-history`... | Vitest system |
| 7 | — | — | Sửa `table-conventions`, thêm `module-structure.test.ts` | 2 test này |
| 8 | — | — | Rule, CLAUDE.md/AGENTS.md, `prompt.md`, docs (mục 8) | grep đường cũ = 0 |
| 9 | — | — | Kiểm toàn bộ (mục 9), `graphify update .` | |

Mỗi bước 1–6 phải xong và đạt kiểm tra mới sang bước sau. Lỗi thì sửa trong bước đó, không dồn.

## 8. Tài liệu cập nhật cùng lần

| File | Nội dung |
| --- | --- |
| `docs/rules/frontend.md` §1 | Sơ đồ luồng `views/<nhóm>/ → components/<nhóm>/<c>.tsx (+ components/<nhóm>/hooks/use-<c>.ts)` |
| `docs/rules/frontend.md` §2, §2.1 | Cây thư mục mới, 5 quy định ở mục 2, danh sách thư mục hook hợp lệ |
| `CLAUDE.md` + `AGENTS.md` | Quy tắc cốt lõi mới "Components and views are grouped by model" / "Component và view chia theo model" (hai file khớp nhau); sửa sơ đồ "Frontend layering" |
| `prompt.md` | Mục quy ước FE và checklist: đặt file vào `components/<nhóm>/`, không `views/hooks/`, View không có logic |
| `docs/common-catalog.md` | Khoảng 60 đường dẫn component/view của `system`, `manage-app` |
| `docs/features/*.md`, `docs/modules/*/README.md` | Đường dẫn file chính |
| `frontend/AGENTS.md` | Nếu có nhắc cấu trúc thư mục |

Kiểm: grep dạng phẳng cũ `modules/<m>/components/<tên>.tsx` và `components/hooks/` cấp gốc trong `docs/`,
`CLAUDE.md`, `AGENTS.md`, `prompt.md` phải trả về rỗng (trừ `docs/reports/` là lịch sử).

## 9. Kiểm tra cuối (đã chốt chạy đầy đủ)

| Lệnh | Mục đích |
| --- | --- |
| `pnpm lint && pnpm format:check && pnpm typecheck` | Import, kiểu, định dạng |
| `pnpm test` (toàn bộ Vitest) | Mọi test, gồm quy ước mới |
| `pnpm build` | Route, special file, import động |
| `pnpm e2e tests/e2e/auth.spec.ts tests/e2e/admin-pages.spec.ts tests/e2e/attachment-library.spec.ts` | Đăng nhập, trang quản trị, thư viện file (chạm nhiều file chuyển nhất) |
| Mở thử trong trình duyệt | Đăng nhập, sidebar, thư viện file + sửa ảnh, một trang công khai, dashboard tài chính, trình đọc truyện |

## 10. Rủi ro

| Rủi ro | Cách tránh |
| --- | --- |
| Import tương đối sai sau khi chuyển | Script giải theo đường tuyệt đối; typecheck + build bắt mọi import gãy |
| `vi.mock` trỏ đường cũ: test vẫn đạt nhưng không mock | Script đổi cả `vi.mock`, báo chuỗi đường `components/`/`views/` cũ còn sót (phải = 0) |
| `table-conventions` âm thầm không kiểm bảng nào | Sửa đệ quy ở bước 7, giữ assert `length > 10` |
| Tách `social-auth-callback-view` làm đổi hành vi | Giữ nguyên JSX và thứ tự effect, chỉ dời chỗ; test hiện có phải đạt mà không sửa kỳ vọng |
| Diff lớn khó xem | Làm theo từng module; bảng ở mục 4 là danh sách đối chiếu |
