# Trình soạn thảo Tiptap & AI tạo nội dung — /ca-nhan/trang

## Cách gọi AI trong trình soạn thảo Tiptap
Trên màn hình Tạo/Sửa Trang cá nhân (`/ca-nhan/trang`) và các ô soạn thảo đầy đủ (`TiptapEditor`), có 3 cách mở hộp thoại AI tạo nội dung:
- Bấm nút **AI Viết bài** trên thanh công cụ phía trên trình soạn thảo.
- Gõ lệnh slash `/ai` (hoặc `/viet`, `/tao noi dung`) trên một dòng trống.
- Bôi đen đoạn văn bản cần chỉnh sửa rồi bấm nút **AI** trên thanh công cụ nổi (`BubbleMenu`).

## Các chế độ AI biên tập nội dung
Hộp thoại AI hỗ trợ 5 chế độ xử lý:
- **Tạo nội dung mới (`generate`)**: Viết mới bài viết, báo cáo hoặc dàn ý từ mô tả yêu cầu.
- **Viết lại (`rewrite`)**: Diễn đạt lại đoạn đang chọn cho tự nhiên, chuyên nghiệp và mạch lạc hơn.
- **Mở rộng (`expand`)**: Bổ sung chi tiết, lập luận và ví dụ cho đoạn đang chọn.
- **Tóm tắt (`summarize`)**: Cô đọng nội dung dài thành đoạn ngắn hoặc danh sách gạch đầu dòng.
- **Sửa chính tả & ngữ pháp (`fix_grammar`)**: Chuẩn hóa chính tả, dấu câu tiếng Việt/Anh, giữ nguyên ý gốc.

## Tham khảo dữ liệu cá nhân (RAG theo quyền tài khoản)
Khi bật tùy chọn **Tham khảo dữ liệu cá nhân**:
- Hệ thống tự động tra cứu ngữ cảnh liên quan trong tài khoản của chính bạn (Nhắc việc, Tài chính thu nhập, Thiết bị & Bảo hành, Dịch vụ định kỳ, Thống kê cá nhân) nếu tài khoản có quyền xem (`READ`) ở module tương ứng.
- Tuyệt đối không đọc Két sắt bí mật hay dữ liệu quản trị của hệ thống.
- Các nguồn dữ liệu đã dùng được hiển thị rõ bằng thẻ badge ngay trên khung xem trước.

## Xem trước và chèn nội dung chuẩn Tiptap
- Nội dung AI tạo ra được làm sạch HTML (`<h2>`, `<h3>`, `<p>`, `<ul>`, `<ol>`, `<li>`, `<blockquote>`, `<pre><code>`, `<strong>`, `<em>`, `<a>`) và xem trước trực tiếp bằng trình đọc Tiptap.
- Sau khi kiểm tra bản xem trước, bấm **Chèn vào tài liệu** hoặc **Thay thế đoạn chọn** để đưa thẳng vào bài viết đúng chuẩn block Tiptap.
