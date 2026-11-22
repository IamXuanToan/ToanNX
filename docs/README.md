# Tài liệu toannx.com

Mục lục mọi tài liệu của dự án. Rule (`rules/`) là chuẩn bắt buộc; các thư mục còn lại mô tả hệ thống đang chạy
ra sao và cách vận hành nó.

| Thư mục | Chứa gì | Đọc khi |
| --- | --- | --- |
| [rules/](rules/) | Rule bắt buộc: `common`, `backend`, `frontend`, `git` | Trước khi viết bất kỳ dòng code nào |
| [common-catalog.md](common-catalog.md) | Danh mục common BE + FE đang có | Trước khi viết code (tránh viết lại thứ đã có) |
| [architecture/](architecture/) | Kiến trúc tổng, xác thực, phân quyền, i18n, kiểm thử, đối chiếu tham chiếu, [hạ tầng và hạn mức gói free](architecture/infrastructure.md) | Sửa phần nền, cần hiểu luồng chung; thêm việc tốn DB/Redis/R2/function |
| [guides/](guides/) | Hướng dẫn cài đặt, vận hành: triển khai, Cloudflare R2, OAuth, thông báo, tài chính | Cài môi trường, cấu hình dịch vụ ngoài |
| [modules/](modules/) | Mỗi module một thư mục: mục đích, model, quyền, route, sự kiện, webhook | Làm việc trong một module |
| [features/](features/) | **Mô tả chức năng**: mỗi file một chức năng, đọc là hiểu luồng xử lý | Sửa hoặc dùng lại một chức năng |
| [plans/](plans/) | Kế hoạch đã/đang làm | Tiếp tục một việc dở dang |
| [reports/](reports/) | Báo cáo | Khi cần tham khảo kết quả cũ |

## Module

- [system](modules/system/README.md): tài khoản, vai trò/quyền, phiên, thư viện file, thông báo, tiền tệ, nhật ký.
- [utilities](modules/utilities/README.md): link rút gọn, mã QR, trang tùy chỉnh.
- [novel](modules/novel/README.md): truyện, chương, tác giả, thể loại, tag; trang đọc công khai.
- [finance](modules/finance/README.md): khoản thu, hóa đơn/chứng từ, nền tảng, quy tắc phân loại, SePay.
- [manage-app](modules/manage-app/README.md) (chỉ FE): khung quản trị, màn chọn module, sidebar.
- [home](modules/home/README.md) (chỉ FE): trang công khai, header, trang lỗi.

## Mô tả chức năng

- [Phạm vi quyền: của mình và của mọi người](features/permission-scope.md)
- [Ẩn/khóa giao diện theo quyền](features/permission-ui.md)
- [Cột Thao tác của bảng](features/table-actions.md)
- [Điều hướng quản trị: nhóm, module, cụm, thu gọn](features/admin-navigation.md)
- [File công khai và riêng tư](features/attachment-visibility.md)
- [Thông báo đẩy trên trình duyệt (Web Push)](features/web-push.md)

## Quy định cập nhật

- Đổi hành vi một module (model, quyền, route, sự kiện, webhook/callback) thì sửa `modules/<module>/README.md`
  **trong cùng lần sửa**.
- Đổi cách một chức năng chạy thì sửa file tương ứng trong `features/`; chức năng mới dùng chung nhiều module
  thì thêm file mới (tên kebab-case tiếng Anh, nội dung tiếng Việt) và thêm dòng vào mục lục ở trên.
- Thêm module mới: tạo `modules/<module>/README.md` theo khung của các module có sẵn.
- Một file `features/` trả lời ba câu: chức năng làm gì, chạy thế nào (BE → FE, file chính), quy định khi dùng
  hoặc sửa. Không chép lại rule; dẫn link tới mục rule liên quan.
