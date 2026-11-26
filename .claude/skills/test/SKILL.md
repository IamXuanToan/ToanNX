---
name: test
description: "Tạo test FE (Vitest/Playwright) và BE (pytest), tự chạy Playwright trên giao diện thật, chụp ảnh phân tích để tự phát hiện và sửa lỗi UI/logic, đồng thời chạy monkey test thao tác hỗn loạn để bóc bug ẩn trong repo ToanNX."
---

# Kiểm thử toàn diện, soi ảnh UI và Monkey Test

Skill này tự động hóa quy trình viết test BE/FE, chạy Playwright trên giao diện thật, chụp ảnh màn hình để soi lỗi thị giác, chạy **monkey test** thao tác hỗn loạn tìm bug ẩn, rồi tự sửa tận gốc và xác nhận lại trong repo ToanNX.

> **Ràng buộc an toàn & rule repo:** `docs/rules/` luôn thắng. Không chạy full suite (`scripts/check-all.*`, toàn bộ `pytest`/`vitest`/`pnpm e2e`) khi chưa được yêu cầu — chỉ chạy đúng test liên quan hoặc luồng đang kiểm, trừ khi người dùng giao chạy toàn bộ. Không chạy DB test trên Neon/cloud; chỉ chạy **monkey test** trên server local/E2E test (`localhost` / DB test `toannx_e2e` hoặc local dev với tài khoản mẫu), tuyệt đối không chạy lên production.

## 1. Nạp ngữ cảnh trước khi viết hoặc chạy test

1. Đọc `AGENTS.md`, `docs/architecture/testing.md`, `.agents/rules/11-tests.md`, `docs/rules/common.md` (mục 7), `docs/rules/backend.md` (mục kiểm thử), `docs/rules/frontend.md`.
2. Đọc source thật của module/luồng cần test:
   - BE: `urls.py` → `views/` → `services/` → `repositories/` → `serializers/` → `permissions/`.
   - FE: `page.tsx` → `views/` → `components/<model>/` + `hooks/` → `services/` + `messages/{vi,en}.json` + `navigation.ts`.
3. Nạp skill chuyên môn khi thao tác tương ứng:
   - `vitest` khi viết/sửa unit test FE;
   - `playwright-best-practices` khi viết/sửa spec `frontend/tests/e2e/*.spec.ts`;
   - `playwright-cli` khi điều khiển trình duyệt thủ công/chụp nhanh theo ref DOM.

## 2. Tự động tạo test Backend và Frontend đúng chuẩn ToanNX

Đọc chi tiết mẫu tại [mẫu tạo test BE/FE](references/test-patterns.md).

### 2.1 Backend (`uv run pytest --reuse-db ...`)
- **Mỗi endpoint đúng một file**: `backend/app/<module>/tests/test_<resource>_<action>_api.py` (không gộp CRUD theo model, không tách riêng file quyền).
- Kiểm tra đủ `conftest.py` (`DATABASE_URL` trỏ PostgreSQL local, tuyệt đối không trỏ Neon).
- Bắt buộc phủ đủ mọi case: `full_data`, `min_data`, `validation_errors`, `unauthenticated` (401), `forbidden` (403), `owner_isolation` (404 cho người khác, `manage_all` thao tác được), `response_envelope` (`{success, data, meta}`) + `list_features` (filter nhiều giá trị, `search`, `ordering`, `page`/`page_size`).
- Endpoint mới công khai hoặc chỉ cần đăng nhập → cập nhật `backend/app/core/tests/test_endpoint_access.py`.
- Endpoint danh sách mới → thêm 1 dòng đo query trong `backend/app/core/tests/test_list_query_count.py`.
- Kiểm thêm `test_openapi_schema.py` và chạy `pnpm api:types` nếu có thay đổi serializer/view/schema.

### 2.2 Frontend Unit / Component (`Vitest`)
- Đặt tại `frontend/tests/unit/`. Bọc `NextIntlClientProvider` (kèm messages thật từ `vi.json`/`en.json`) khi render component có `useTranslations`.
- Kiểm đủ: render dữ liệu, loading/skeleton, error state (`QueryErrorState`), empty state, bị chặn quyền 3 tầng (`Menu` ẩn mục không có `read`, `View` trả `ForbiddenView`, `useEditMode` khóa form khi thiếu `update`, `DataTable.can` làm mờ + tooltip nút Sửa/Xóa), thao tác bulk bar 1 dòng, đồng bộ URL filter/tab.
- Khi đổi cấu trúc/token/route/i18n/bảng → chạy các test quy ước liên quan: `one-unit-per-file.test.ts`, `module-structure.test.ts`, `table-conventions.test.ts`, `module-registry.test.ts`, `theme-tokens.test.ts`, `messages.test.ts`, `api-contract.test.ts`.

### 2.3 Playwright E2E Spec (`tests/e2e/`)
- Tách spec theo luồng trong `frontend/tests/e2e/<luồng>.spec.ts`, dùng helper từ `helpers.ts` (`loginViaUi`, `E2E_ADMIN`).
- Luôn lắng nghe và assert **0 lỗi `console.error`**, **0 `pageerror` (uncaught exception)**, **0 HTTP `>= 500`** trong suốt kịch bản.
- Dùng `playwright.config.ts`: port E2E riêng (`8002`/`3002`, DB `toannx_e2e` với `prepare_e2e`) khi chạy qua `pnpm --dir frontend e2e tests/e2e/<spec>.spec.ts`.

## 3. Tự chạy Playwright, chụp ảnh và phân tích lỗi thị giác (Visual Fix Loop)

Nếu server local chưa chạy ở `3001`/`8001` hoặc cần môi trường độc lập, dùng `pnpm --dir frontend e2e ...` (tự bật `8002`/`3002`) hoặc bật dev server local rồi thao tác bằng `playwright-cli` / script Node Playwright.

1. **Chụp ảnh có hệ thống ở mọi trạng thái & viewport**:
   - Viewport bắt buộc: **Mobile `375x812`**, **Tablet `768x1024`**, **Desktop `1280x800` / `1440x900`**.
   - Cả 2 locale **`/vi/...`** và **`/en/...`**, cả Light mode và Dark mode nếu thay đổi theme/màu.
   - Chụp đủ: màn hình chính có dữ liệu, trạng thái rỗng (`empty`), đang tải (`skeleton`/chờ), mở `Dialog`/`Drawer`/`Popover`/`FilterSelect`, bảng có chọn nhiều dòng (`TableBulkBar`), trang không đủ quyền (`ForbiddenView`).
2. **BẮT BUỘC mở xem ảnh bằng tool đọc ảnh (`read_file`)**: không đoán kết quả bằng text DOM. Soi kỹ từng ảnh:
   - Tràn ngang (`document.documentElement.scrollWidth > clientWidth`) hoặc thanh cuộn ngang bất thường.
   - Chữ bị cắt (`ellipsis` mất nghĩa), rớt dòng vỡ nút, `TableBulkBar` bị tách 2 tầng hoặc bọc `Card`.
   - `DialogContent p-0` bị lệch `DialogFooter`, dialog có tab bị nhảy chiều cao khi chuyển tab.
   - Chồng lấn phần tử (`z-index`), modal/dropdown kẹt không đóng, tooltip thiếu hoặc sai vị trí.
   - Sót i18n: chuỗi tiếng Việt lọt sang trang `/en/...`, key thô dạng `module.key`, số/ngày/tiền format sai locale.
   - Ảnh/SVG gãy (`naturalWidth === 0`), tương phản chữ kém trong Light/Dark mode.
3. **Phát hiện → Truy vết → Sửa → Chụp lại**:
   - Đọc console, tab Network (tìm API 4xx/5xx, request lặp vô tận, gọi API ngầm từ Next server thay vì Client), và stack trace.
   - Sửa nguyên nhân gốc theo đúng rule `docs/rules/` (BE đúng `view → service → repository`; FE đúng shadcn/Tailwind/React Query).
   - Chụp ảnh mới ở đúng trạng thái từng hỏng, mở xem lại xác nhận đã sạch mới kết thúc vòng lặp.

## 4. Monkey Test — Thao tác hỗn loạn có kiểm soát

Đọc kịch bản đầy đủ tại [playbook monkey test](references/monkey-testing.md) và dùng script [monkey-explore.mjs](scripts/monkey-explore.mjs).

1. **Chỉ chạy ở môi trường local/test** (mặc định script từ chối mọi URL không phải `localhost`/`127.0.0.1`), dùng tài khoản test (`seed_test_accounts`: `ADMIN`, `*_MANAGER`, `*_VIEWER`, `*_MEMBER` hoặc `E2E_ADMIN`).
2. **Chạy đủ 5 pha hỗn loạn có `MONKEY_SEED` cố định** (mỗi lần phát hiện lỗi đều in ra `seed` để tái hiện 100%):
   - **Pha 1 (DOM Chaos)**: Click ngẫu nhiên nút, tab, accordion, checkbox, sắp xếp cột, phân trang, đóng/mở dialog liên tục, **double-click** nút Submit để kiểm chống gửi trùng.
   - **Pha 2 (Input Fuzzing)**: Nhập chuỗi 2000–5000 ký tự, tiếng Việt có dấu kết hợp emoji, khoảng trắng đầu/cuối, HTML/XSS `<img src=x onerror=alert(1)>`, số âm/0/`9999999999999`, ký tự URL (`?#%/\`) vào search/input/filter/slug.
   - **Pha 3 (Navigation & Race Chaos)**: Reload `F5` ngẫu nhiên giữa lúc đang lọc bảng / mở tab để kiểm đồng bộ URL (`useTableState`/`useTabState`), bấm Back/Forward trình duyệt liên tục, chuyển `/vi` ↔ `/en` ngay trên màn đang thao tác, hủy request khi chuyển trang nhanh (xác nhận không nổ `Runtime Error: cancelled`).
   - **Pha 4 (Viewport Resize Chaos)**: Đổi kích thước `375px ↔ 768px ↔ 1280px ↔ 1920px` khi đang mở drawer/dialog/filter để kiểm overflow ngang hoặc bố cục kẹt.
   - **Pha 5 (Multi-role Boundary Chaos)**: Lặp lại duyệt route bằng user `_VIEWER`, `_MEMBER`, không quyền (`is_staff=False`) để phát hiện màn crash khi API trả 403/404 hoặc menu hở.
3. **Xử lý phát hiện từ Monkey Test**:
   - Bất kỳ `pageerror`, `console.error`, HTTP `>= 500`, HTTP `400/422` do thao tác hợp lệ bị đúp, `scrollWidth > clientWidth` nghiêm trọng, hay treo spinner vô hạn đều phải:
     1. Tái hiện lại bằng đúng `MONKEY_SEED` + chuỗi bước vừa log;
     2. Chuyển thành **regression test cố định** (pytest / Vitest / Playwright spec);
     3. Sửa lỗi tận gốc và chạy lại cả regression test lẫn vòng monkey test với `seed` đó để xác nhận đã hết.

## 5. Chốt kết quả

Kiểm lại bằng `.agents/rules/90-done-checklist.md`. Nếu người dùng nêu quy chuẩn test mới chưa có trong `docs/rules/`, tự động cập nhật đồng bộ ngay vào `docs/rules/`, `.agents/rules/`, `AGENTS.md`, `CLAUDE.md`, `prompt.md` và chạy `python scripts/sync-ai-rules.py` (`--check`) trong cùng lượt. Báo cáo rõ: test nào vừa tạo/cập nhật, lệnh đã chạy + số case pass, ảnh đã chụp & vấn đề thị giác đã phát hiện/sửa (hoặc ghi rõ lý do nếu môi trường không mở được trình duyệt), kết quả monkey test (`MONKEY_SEED`, số bước, URL đã quét, bug bóc được & regression test đi kèm). Không tự thao tác Git hay tự gợi ý commit nếu chưa được yêu cầu.
