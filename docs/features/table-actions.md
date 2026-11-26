# Cột Thao tác của bảng

## Chức năng

Mọi bảng (`DataTable`) của tài nguyên có trang chi tiết luôn có đủ ba nút ở cột Thao tác, thứ tự cố định:

**Xem → Sửa → (Sao chép) → Xóa**, rồi tới thao tác riêng (`rowActions`).

- **Xem**: mở trang chi tiết chỉ xem. Nháy đúp vào dòng cũng là Xem.
- **Sửa**: mở trang chi tiết ở chế độ sửa (`?mode=edit`).
- **Xóa**: hỏi xác nhận rồi xóa mềm.
- Thiếu quyền hoặc dòng không cho phép thì nút **vẫn hiện**, mờ đi, không bấm được, tooltip nói lý do:
  "Bạn không có quyền thực hiện thao tác này" / "Không thể thao tác với bản ghi này".
  Cột không bao giờ đổi hình dạng giữa các người dùng.

## Chọn nhiều và thao tác hàng loạt

- Bảng có **Xoá** từng dòng thì **luôn** có cột chọn dòng + **Xoá hàng loạt** (`onBulkDelete`). Bảng không có Xoá
  (nhật ký, cài đặt, nhật ký thông báo) thì không có cột chọn; không có thao tác nào thì cột Thao tác ẩn.
- Tài nguyên có cờ boolean bật/tắt thì có **Đổi trạng thái hàng loạt** (`bulkStatus`).
- BE: `bulk_delete_enabled = True`, `bulk_update_serializer_class` cho cờ boolean (rule backend mục 9).
- FE dùng common, không viết hook riêng:

```ts
// hook bảng
const bulk = useBulkActions<Currency>({ service: currencyService, invalidate: [currencyKeys.currencies.all] });
return { bulkDelete: bulk.bulkDelete,
  bulkSetActive: (rows: Currency[], value: boolean) => bulk.bulkUpdate(rows, { isActive: value }) };

// component bảng
onBulkDelete={canDelete ? state.bulkDelete : undefined}
bulkStatus={canUpdate ? createBooleanBulkStatus({ on: tStatus("active"), off: tStatus("inactive") }, state.bulkSetActive) : undefined}
canSelectRow={(row) => !row.isBase}
```

Hiện có hàng loạt: người dùng, vai trò, phiên, nhật ký thay đổi, nhật ký gửi thông báo, cài đặt, tiền tệ (+bật/tắt), tỷ giá (dòng nhập tay), thông báo chung,
link rút gọn, mã QR, trang, đường dẫn (+bật/tắt), quyên góp (+ẩn/hiện), truyện (+xuất bản), chương (+xuất bản), tác giả, thể loại, tag,
khoản thu, hóa đơn, nền tảng (+bật/tắt), quy tắc (+bật/tắt); `workspace`: thiết bị, phiếu bảo hành, dịch vụ định kỳ (+bật/tắt), lịch sử gia hạn, két sắt, giám sát Uptime (+bật/tắt), sự cố Uptime, nhắc việc (+hoàn thành). `tests/unit/table-conventions.test.ts` kiểm.

## Cách dùng

```tsx
// hook bảng
view: (row: Currency) => router.push(SYSTEM_ROUTES.currencyDetail(row.id)),
edit: (row: Currency) => router.push(withEditMode(SYSTEM_ROUTES.currencyDetail(row.id))),

// component bảng
<DataTable
  onView={state.view}
  onEdit={state.edit}
  onDelete={state.remove}
  can={{ update: canUpdate, delete: canDelete }}
  canDeleteRow={(user) => !isSelf(user)}
/>
```

- Không viết `onEdit={canUpdate ? fn : undefined}`: như vậy là ẩn nút, sai rule.
- `can.update` / `can.create` (Sao chép) / `can.delete`: quyền của người dùng. `canEditRow` / `canDeleteRow`:
  khóa theo dòng (chính mình, bản ghi hệ thống, superuser).
- Thao tác hàng loạt (`onBulkDelete`, `bulkStatus`) chỉ truyền khi có quyền (thiếu quyền thì không có cột chọn).

## Ngoại lệ

Chỉ bỏ handler khi **nghiệp vụ không có** thao tác đó (không có API), không phải vì thiếu quyền:

| Bảng | Có | Lý do |
| --- | --- | --- |
| Phiên đăng nhập (`session-table`) | Thu hồi, Xóa | Phiên không có trang chi tiết, không sửa |
| Thông báo chung (`announcement-table`) | Xóa, Xóa hàng loạt | Đã gửi thì không sửa |
| Tỷ giá (`exchange-rate-table`) | Xóa, Xóa hàng loạt (chỉ dòng nhập tay) | FE chưa có trang chi tiết/sửa tỷ giá (API đã có `PATCH`); thêm trang thì bỏ ngoại lệ này |
| Nhật ký thay đổi (`journal-table`) | Xem, Xóa, Xóa hàng loạt | Lịch sử không sửa được; xóa là xóa hẳn (model không có `deleted_at`), quyền `system.journal_entry.delete` |
| Nhật ký gửi thông báo (`notification-delivery-table`) | Xóa, Xóa hàng loạt, Gửi lại | Không có trang chi tiết, không sửa; quyền `system.notification_delivery.delete` |
| Quyên góp (`donation-table`) | Ẩn/hiện (switch + hàng loạt), Xóa, Xóa hàng loạt | Giao dịch đến từ webhook SePay, không có trang chi tiết hay form sửa |
| Cài đặt (`setting-table`) | Xem, Sửa (dialog), Xóa, Xóa hàng loạt | Sửa giá trị bằng dialog thay cho trang chi tiết; xóa = quay về giá trị mặc định trong code |
| Thư mục tệp (`attachment-folder-manager`) | Sửa, Xóa (hỏi giữ hay xóa tệp) | Xóa thư mục cần chọn cách xử lý tệp bên trong nên chưa có xóa hàng loạt |
| Thư viện file | Lưới riêng (`AttachmentLibrary`), không dùng `DataTable` | Thao tác nằm ở panel chi tiết file |
| Lịch sử thanh toán gia hạn (`subscription-payment-table`) | Xóa, Xóa hàng loạt | Bản ghi được sinh tự động khi gia hạn dịch vụ, không có trang tạo/sửa riêng |
| Sự cố Uptime (`monitor-incident-table`) | Xóa, Xóa hàng loạt | Bản ghi được sinh tự động khi probe phát hiện sập/khôi phục, không có trang tạo/sửa riêng |

Thêm ngoại lệ mới phải ghi vào bảng này và rule frontend §3.1.

## File chính

- `frontend/src/shares/components/common/table-row-actions.tsx`, `data-table.tsx`, `data-table.types.ts`
- `frontend/src/shares/hooks/use-bulk-actions.ts`, `frontend/src/shares/lib/bulk-status.ts`
- Test: `frontend/tests/unit/table-conventions.test.ts`
- Test: `frontend/tests/unit/table-row-actions.test.tsx`

Liên quan: [permission-ui.md](permission-ui.md).
