---
name: i18n-audit
description: "Rà soát và sửa triệt để thiếu i18n trong repo ToanNX: tìm chuỗi tiếng Việt/Anh viết cứng, đối chiếu cặp khóa vi.json/en.json và tham số ICU, đồng bộ mã lỗi BE sang FE, kiểm tra URL đa ngôn ngữ /vi và /en trên trình duyệt thật."
---

# Rà soát và sửa i18n toàn diện (`vi` / `en`)

Skill này dùng khi cần rà toàn bộ hoặc một module về đa ngôn ngữ: đảm bảo không còn chuỗi hiển thị cứng, từ điển `vi`/`en` khớp nhau tuyệt đối, mã lỗi BE đều có thông báo dịch ở FE và giao diện chạy mượt ở cả `/vi/...` lẫn `/en/...`.

## 1. Tài liệu & phạm vi cần nạp

1. Đọc `docs/architecture/i18n.md`, `docs/rules/frontend.md`, `.agents/rules/20-frontend.md`.
2. Kiểm tra danh sách namespace trong `frontend/src/i18n/messages.ts`, `frontend/src/global.d.ts`, `frontend/src/i18n/routing.ts`.

## 2. Quy trình quét 5 lớp

1. **Quét chuỗi tiếng Việt / fallback cứng trong `frontend/src/`**:
   Chạy script nội bộ:
   ```powershell
   python .agents/skills/i18n-audit/scripts/scan_hardcoded_vi.py
   ```
   Đồng thời tìm thủ công các chuỗi tiếng Anh hardcode trong JSX (`placeholder="..."`, `title="..."`, `aria-label="..."`, `<Button>...</Button>`, toast `toast.success/error("...")`, cột `DataTable`, nhãn biểu đồ Recharts).
   - **Loại trừ hợp lệ (không phải lỗi)**: boundary gốc ngoài `NextIntlClientProvider` (`app/not-found.tsx`, `global-error-content.tsx` đã có object song ngữ cục bộ), hàm chuẩn hóa `đ` → `d` (VietQR/search-text), regex ký tự tiền tệ `[₫đ]`, chuỗi lỗi invariant chỉ dành cho developer.
   - **Cẩn trọng**: các `t("key") || "Chuỗi tiếng Việt"` thừa thường che giấu thiếu key hoặc key lỗi thời; xóa fallback và đảm bảo key tồn tại trong cả `vi.json` và `en.json`.
2. **Đối chiếu từ điển JSON & chuẩn ICU**:
   - Đảm bảo khóa trùng khớp 100% giữa `src/messages/{vi,en}.json` và từng `src/modules/<m>/messages/{vi,en}.json`.
   - Khớp biến nội suy `{count}`, `{name}`, tránh ký tự `<...>` trần bị parser ICU hiểu nhầm là tag HTML chưa đóng.
   - Chạy `pnpm --dir frontend test tests/unit/messages.test.ts`.
3. **Đồng bộ mã lỗi Backend → Frontend**:
   - Đối chiếu `ErrorCode` (`app/core/constants/error_codes.py`) và `<module>_error_code.py` ở từng app BE với khóa dịch trong `errors.*` của FE để không bao giờ hiện mã lỗi thô (`FINANCE_...`, `UTILITIES_...`).
4. **Định dạng số, tiền, ngày & URL theo locale**:
   - Dùng `useFormatter()` (`next-intl`) cho số, phần trăm, ngày giờ theo múi giờ người xem; không tự ghép chuỗi đơn vị cứng khi có thể format theo locale.
   - Kiểm tra `<M>_PATHNAMES` trong `modules/*/constants/routes.ts` và `src/i18n/routing.ts`: quản trị luôn có tiền tố `/quan-tri/<module-vi>/...` ↔ `/admin/<module-en>/...`; link nội bộ dùng `Link` từ `@/i18n/navigation`.
5. **Xác minh thực tế trên 2 ngôn ngữ**:
   - Khi có server local, dùng `playwright-cli` chuyển giữa `/vi/...` và `/en/...` tại cùng màn đang mở filter/tab: kiểm tra toàn bộ text, tooltip, nút, empty/error state và đảm bảo đổi ngôn ngữ giữ nguyên pathname đã dịch + query params.

## 3. Sửa và kiểm lại

- Format JSON và TS/TSX đã sửa bằng `prettier --write`, kiểm `eslint` trên các file sửa, `pnpm --dir frontend typecheck` và `pnpm --dir frontend test tests/unit/messages.test.ts` + các unit test component bị sửa (bọc `NextIntlClientProvider` nếu cần).
- Kiểm lại bằng `.agents/rules/90-done-checklist.md` và trả commit `fix(<scope>, i18n): ...` theo `docs/rules/git.md`.
