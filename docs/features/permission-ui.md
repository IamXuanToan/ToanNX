# Ẩn/khóa giao diện theo quyền

## Chức năng

FE kiểm quyền ở ba tầng để người dùng không thấy thứ không được dùng. BE vẫn là chốt chặn cuối (403/404),
FE kiểm chỉ để giao diện đúng.

| Tầng | Quy định | Ở đâu |
| --- | --- | --- |
| Menu | Mục khai `permission: <RESOURCE>_PERMISSIONS.read`; thiếu quyền thì ẩn mục; module/nhóm không còn mục nào thì ẩn cả module/nhóm (màn chọn module lẫn sidebar) | `modules/<m>/navigation.ts`, lọc ở `use-admin-shell.ts` |
| Trang | View kiểm quyền rồi trả `ForbiddenView`: list và detail cần `read`, trang tạo cần `create` | `modules/<m>/views/*-view.tsx` |
| Thao tác | Có `read` mà không `update` thì trang chi tiết chỉ xem; nút Thêm, thao tác hàng loạt, switch trạng thái khóa theo quyền tương ứng; cột Thao tác xem [table-actions.md](table-actions.md) | component + hook |

## Trang chi tiết: chỉ xem và sửa

- Mặc định trang chi tiết (`/…/{id}`) **chỉ xem**: form `disabled`, nút ở header là "Quay lại".
- Có quyền `update` thì header có nút **Sửa** (`EditModeButton`, tự hiện trong `FormPage`); bấm thì URL thêm
  `?mode=edit` và form mở khóa.
- Nút Sửa ở bảng mở thẳng `?mode=edit` (`withEditMode(<M>_ROUTES.xxxDetail(id))`).
- Thiếu quyền mà gõ `?mode=edit` thì vẫn chỉ xem.

View mẫu:

```tsx
export function CurrencyDetailView({ id }: { id: string }) {
  const canRead = usePermission(CURRENCY_PERMISSIONS.read);
  const canUpdate = usePermission(CURRENCY_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);
  if (!canRead) return <ForbiddenView />;
  return (
    <EditModeProvider canEdit={canUpdate}>
      <CurrencyProfile id={id} canUpdate={isEditing} />
    </EditModeProvider>
  );
}
```

Quyền phụ chỉ dùng khi sửa (gán quyền cho vai trò, tạo đường dẫn trang) cũng `&& isEditing`. Trang mà quyền phụ
một mình đã đủ để sửa (vai trò: chỉ có `permission.assign`) thì `canEdit = canUpdate || canAssign`.

Ngoại lệ chỉ xem hoàn toàn (không có nút Sửa): nhật ký thay đổi (`journal-entry`).

## Hằng quyền ở FE

Mỗi class quyền BE có đúng một file FE `modules/<m>/permissions/<resource>-permission.ts`
(`exchange_rate_permission.py` ↔ `exchange-rate-permission.ts`), ghi rõ class BE ở JSDoc. Không gộp nhiều
tài nguyên vào một file.

## File chính

- `frontend/src/shares/hooks/use-edit-mode.ts`, `shares/lib/edit-mode.ts`
- `frontend/src/shares/components/common/edit-mode-provider.tsx`, `edit-mode-button.tsx`, `form-page.tsx`
- `frontend/src/modules/system/hooks/use-permission.ts`, `shares/components/errors/forbidden-view.tsx`

Liên quan: [permission-scope.md](permission-scope.md), rule frontend §3.1.
