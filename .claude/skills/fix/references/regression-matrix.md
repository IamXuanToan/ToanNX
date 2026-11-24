# Bảng truy vết và kiểm hồi quy

| Dấu hiệu | Đi theo source | Kiểm sau khi sửa |
| --- | --- | --- |
| API trả sai/500 | Route → view → service → repository → serializer/permission; input, transaction, exception mapping. | Status/envelope, min/full/invalid, 401/403, owner 404, lỗi cũ tái hiện trước và hết sau. |
| OpenAPI hoặc kiểu FE lệch | Route, serializer, `@extend_schema`, docstring view/method, error code, generated API types. | `pnpm api:types` khi đổi bất kỳ thứ gì vào OpenAPI, type FE và test contract tương ứng khớp. |
| Sai quyền hoặc lộ dữ liệu | Permission class, `MEMBER`, service owner, `manage_all`, serializer, FE menu/View/action. | Nhánh từ chối và cho phép, bulk, file riêng tư, UI ba tầng quyền; không chỉ ẩn nút ở FE. |
| Dữ liệu cũ/migration | Model, constraint/index, migration, serializer, code đọc/ghi và tài liệu module. | Trạng thái trước/sau, soft delete, unique, rollback khả thi; không thử trên DB production. |
| Bulk/table/form lỗi | `CoreModelViewSet` bulk flags, `useBulkActions`, `DataTable`, action `can`, edit mode, form dùng chung. | Xóa/trạng thái hàng loạt đúng quyền và transaction; Xem/Sửa/Xóa, form create/edit/view giữ hành vi. |
| UI sai | Page/view/component/hook/service, i18n, route, state, cache/query key. | Tương tác thật, loading/empty/error/forbidden, desktop/mobile, keyboard, Network và console nếu môi trường có. |
| Chuỗi/URL/asset sai | `messages/vi.json`/`en.json`, namespace, pathname module, `Image`/`Link`, SVG path, token màu. | Cả hai locale, link không lạc, ảnh/SVG tải được, aria/tooltip có bản dịch, dark mode và mobile không vỡ. |
| Test fail/flaky | Test, fixture, thời gian, network, quyền, dữ liệu test và hành vi thật. | Giữ assertion đúng contract, chạy đúng file liên quan, xác nhận hết race chứ không thêm sleep tùy ý. |
| Chậm/tốn tài nguyên | Queryset/N+1, cache, index, request trùng, ảnh/bundle; đọc ngân sách free tier. | Query count hoặc đo web trong cùng điều kiện nếu có; không hứa cải thiện số liệu khi chỉ suy luận source. |
| Tích hợp ngoài | Webhook/callback, timeout, xác thực, idempotency, outbox/task, env. | Test mock/sandbox hợp lệ, không gửi thao tác thật ngoài phạm vi; cập nhật docs/config nếu contract đổi. |
| Secret hoặc file riêng tư | `SecretCipher`, secret nội bộ, storage visibility, API response, log, `.env.example`. | Không lộ token/URL storage; ảnh khách xem được, chứng từ chỉ qua endpoint nội dung có quyền. |
| Thông báo sai | `NotificationService.notify`, event descriptor, recipient, outbox/QStash, transaction commit. | Không gửi trực tiếp từ request; thử nhánh thành công/lỗi/idempotency phù hợp, không gửi thật nếu chỉ test. |
| Hành vi/cache không khớp docs | README module, feature docs, common catalog, deployment guide, source đang chạy. | Docs/config cập nhật cùng lần khi contract hoặc hành vi đổi; không sửa docs để hợp thức hóa bug sai rule. |

Chỉ thêm regression test khi nó bắt hành vi có thể tái phát. Nếu không tái hiện được trước khi sửa, ghi rõ bằng chứng tĩnh và giới hạn xác minh.
