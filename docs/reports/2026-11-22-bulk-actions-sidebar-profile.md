# Báo cáo 2026-11-22: thao tác hàng loạt, sidebar, hồ sơ cá nhân

Phạm vi: (1) rule + code "có Xoá thì có chọn nhiều + Xoá hàng loạt, có cờ boolean thì có cập nhật hàng loạt",
common dùng chung; (2) bỏ nhãn module thừa trên sidebar; (3) sửa vỡ layout dialog Hồ sơ cá nhân; (4) ẩn cột
Thao tác khi bảng không có thao tác; (5) cập nhật rule, `prompt.md`, `AGENTS.md`/`CLAUDE.md`, tài liệu.

## 1. Kết quả kiểm tra hiện trạng

| Bảng | Xoá từng dòng | Xoá hàng loạt (trước) | Cờ boolean | Cập nhật hàng loạt (trước) | Sau khi sửa |
| --- | --- | --- | --- | --- | --- |
| Quy tắc phân loại | có | FE có, **BE chưa bật → gọi là 404** | `is_active` | không | Xoá + bật/tắt hàng loạt |
| Hóa đơn | có | FE có, **BE chưa bật → 404** | — | — | Xoá hàng loạt chạy được |
| Nền tảng | có | FE có, **BE chưa bật → 404** | `is_active` | không | Xoá + bật/tắt hàng loạt |
| Tiền tệ | có | không | `is_active` | không | Xoá + bật/tắt hàng loạt (không chọn được tiền tệ gốc) |
| Tỷ giá | có | không | — | — | Xoá hàng loạt (chỉ chọn được dòng nhập tay) |
| Thông báo chung | có | không | — | — | Xoá (thu hồi) hàng loạt |
| Đường dẫn trang | có | không | `is_active` (có công tắc) | không | Xoá + bật/tắt hàng loạt |
| Chương | có | có | `is_published` | không | + xuất bản/ẩn hàng loạt |
| Truyện | có | có | `is_published` (BE đã có API) | FE chưa dùng | + xuất bản/ẩn hàng loạt |
| Người dùng, vai trò, phiên, link rút gọn, mã QR, trang, tác giả, thể loại, tag, khoản thu | có | có | — / đã có | đã có | Giữ nguyên |
| Nhật ký thay đổi, cài đặt, nhật ký thông báo | không | — | — | — | Không cột chọn; cột Thao tác tự ẩn |

**Lỗi thật phát hiện thêm**: xoá **bất kỳ** tiền tệ nào (cả xoá từng dòng) đều 500. Xoá mềm gắn hậu tố
`_deleted_<ms>` (~20 ký tự) vào field unique, mà `Currency.code` chỉ dài 3 → tràn độ dài. Đã sửa ở
`CoreModel.mark_deleted`: field quá ngắn để chứa hậu tố thì giữ nguyên giá trị. Đánh đổi: mã tiền tệ đã xoá chỉ
tạo lại được sau khi bản ghi bị dọn hẳn. Hướng triệt để (cần migration, chưa làm): đổi `code` sang
`UniqueConstraint(..., condition=Q(deleted_at__isnull=True))`.

## 2. Đã làm

### Backend

- Bật `bulk_delete_enabled` cho 7 ViewSet: quy tắc, hóa đơn, nền tảng, tiền tệ, tỷ giá, thông báo chung, đường dẫn
  trang (chương đã có).
- Thêm bulk-update cho cờ boolean: `ClassificationRule`, `Platform`, `Currency`, `PagePath` (`is_active`), `Chapter`
  (`is_published`): 5 serializer `*BulkUpdateValidateSerializer`, quyền `bulk_update`/`bulk_delete` trong
  `action_permissions`. Luật nghiệp vụ giữ nguyên vì `CoreCrudService.bulk_*` gọi lại `update`/`delete` từng bản
  trong một transaction (tiền tệ gốc, nền tảng đang dùng, tỷ giá từ API vẫn bị chặn).
- 13 file test mới `test_<resource>_bulk_{delete,update}_api.py` (thành công, thiếu `ids`, cô lập owner nếu có,
  401, 403).
- Sửa `CoreModel.mark_deleted` (lỗi tiền tệ ở trên).

### Frontend

- **Common mới**:
  - `useBulkActions({ service, invalidate })` (`shares/hooks/use-bulk-actions.ts`): trả `bulkDelete(rows)` và
    `bulkUpdate(rows, patch)`, toast + làm mới cache chuẩn. Bảng mới chỉ cần gọi hook này.
  - `createBooleanBulkStatus(labels, apply)` (`shares/lib/bulk-status.ts`): `bulkStatus` cho cờ bật/tắt.
- 8 bảng gắn xoá/cập nhật hàng loạt (bảng ở mục 1); `canSelectRow` chặn tiền tệ gốc và tỷ giá lấy từ API.
- Bỏ 4 hook riêng không còn dùng: `useBulkDeleteClassificationRules`, `useBulkDeletePlatforms`,
  `useBulkDeleteChapters`, `useBulkDeleteNovels`.
- Test chặn tái phạm `tests/unit/table-conventions.test.ts`: mọi bảng có Xoá phải có Xoá hàng loạt; có công tắc
  trạng thái phải có `bulkStatus`; cấm ẩn nút thao tác vì thiếu quyền.
- Cột Thao tác: `DataTable` vốn đã ẩn cột khi bảng không có thao tác nào (đã kiểm: nhật ký, cài đặt, nhật ký thông
  báo không có cột).
- **Sidebar**: nhóm chỉ có một module (mọi nhóm hiện tại: Hệ thống, Tiện ích, Truyện, Tài chính) không còn nhãn
  module IN HOA ("HỆ THỐNG") lặp lại tên ở bộ chuyển nhóm; nhóm có từ hai module mới hiện nhãn.
- **Hồ sơ cá nhân**: nguyên nhân vỡ layout là cột phải dùng `1fr`, bảng sự kiện × kênh trong tab Thông báo đẩy cột
  rộng quá dialog (bị cắt vì `overflow-hidden`), và thân dialog không cuộn nên nội dung dài bị cắt ở đáy. Đã sửa:
  cột phải `minmax(0,1fr)` + `min-w-0` (bảng cuộn ngang trong khung của nó), thân dialog cuộn riêng (header/footer
  đứng yên), dialog to hơn (`lg:max-w-5xl`, `xl:max-w-6xl`), cột trái 300px, nhãn tab rút gọn thay vì bị ép.
- `pnpm api:types` đã chạy lại (thêm các endpoint bulk vào `api-schema.gen.ts`).

### Rule, prompt, tài liệu

- Rule backend mục 9: ViewSet có `destroy` bắt buộc `bulk_delete_enabled`; cờ boolean bật/tắt bắt buộc bulk-update;
  mỗi endpoint một file test.
- Rule frontend §3.1: thao tác hàng loạt bắt buộc, dùng `useBulkActions` + `createBooleanBulkStatus`, `canSelectRow`;
  §4.1: không nhãn module thừa.
- Rule chung §5.2 + `docs/features/attachment-visibility.md`: thêm **ảnh bìa truyện** vào nhóm bắt buộc công khai
  (lần trước bỏ nhầm, `Novel.thumbnail` có tồn tại).
- `prompt.md`: mục 2.4.1 "Chọn nhiều và thao tác hàng loạt", sidebar, 2 dòng bảng kiểm BE + FE.
- `AGENTS.md` ↔ `CLAUDE.md` đồng bộ; `docs/common-catalog.md`, `docs/features/table-actions.md`,
  `docs/features/admin-navigation.md` cập nhật.

## 3. Kiểm tra đã chạy (chỉ phần liên quan)

| Lệnh | Kết quả |
| --- | --- |
| `ruff check` / `ruff format` / `mypy` (file BE đã sửa) | Sạch; `mypy .` còn 3 lỗi cũ ở file không đụng (`createsuperuser.py`, `user_view_set.py`, `send_verification_email_view.py`) |
| pytest 13 file bulk mới + `test_endpoint_access` + `test_module_conventions` + `test_openapi_schema` | 74 passed, 1 failed → lỗi tiền tệ ở mục 1, đã sửa |
| pytest tiền tệ + core repository/crud + attachment (sau khi sửa `mark_deleted`) | 41 passed |
| `eslint` / `prettier` file FE đã sửa, `pnpm typecheck` | Sạch |
| Vitest: table-conventions, table-row-actions, admin-navigation, module-registry, api-contract, profile-dialog, messages | 108 passed |

## 4. Chưa kiểm / còn tồn

- **Chưa xem giao diện thật** (sidebar mới, dialog Hồ sơ, thanh thao tác hàng loạt): server E2E (cổng 3001/8001)
  đang chạy nhưng DB `toannx_e2e` lỗi lịch sử migration (`finance.0001_initial` áp trước `system.0009...`) nên
  không có tài khoản E2E để đăng nhập; DB dev có tài khoản nhưng không có mật khẩu. Cần reset DB E2E (chạy lại
  `prepare_e2e` trên DB sạch) rồi chạy `pnpm e2e tests/e2e/data-table.spec.ts tests/e2e/admin-pages.spec.ts
  tests/e2e/content-modules.spec.ts` và kiểm tay dialog Hồ sơ.
- pgbouncer giữ một kết nối nhàn rỗi tới `test_toannx` nên pytest không tạo lại DB test được; đã chạy với
  `--reuse-db` (không đổi model/migration nên an toàn).
- Có vài tiến trình `runserver 8001` / `next dev -p 3001` từ 1:01 sáng vẫn chạy; không rõ của ai nên chưa tắt.
- Trang sửa tỷ giá ở FE vẫn chưa có (ngoại lệ cột Thao tác).
- Các bảng cũ còn dùng hook `useBulkDeleteXxx` riêng (người dùng, vai trò, link, trang…) chạy đúng nhưng chưa
  chuyển sang `useBulkActions`; nên chuyển dần khi sửa từng module.
- Đề xuất: đổi ràng buộc unique `Currency.code` sang có điều kiện (cần migration, chờ bạn đồng ý).
