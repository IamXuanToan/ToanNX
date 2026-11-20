# BẮT BUỘC: ĐỌC TÀI LIỆU VÀ TUÂN THỦ RULE HỆ THỐNG

Trước khi thực hiện bất kỳ yêu cầu nào, BẮT BUỘC kiểm tra, đọc đầy đủ và hiểu tài liệu trong:

- docs/
- docs/plans/
- docs/reports/
- docs/rules/ (toàn bộ file và thư mục con)
- docs/architecture.md
- docs/authentication.md
- docs/authorization.md
- docs/deployment.md
- docs/i18n.md
- docs/reference-audit.md
- docs/sentry.md
- docs/testing.md

## NGUYÊN TẮC BẮT BUỘC

1. Đọc đầy đủ tài liệu và phân tích codebase trước khi triển khai. Phải hiểu kiến trúc, nghiệp vụ, coding conventions, các pattern và quy chuẩn hiện có.

2. Tuân thủ nghiêm ngặt toàn bộ rule Backend, Frontend, Common, Git và các quy định liên quan. Không tự ý thay đổi kiến trúc hoặc tạo pattern mới khi đã có quy chuẩn.

3. Code phải clean, dễ đọc, dễ bảo trì, tuân thủ SOLID, DRY, KISS. Ưu tiên tái sử dụng code, component, hook, service và utility hiện có. Không duplicate logic hoặc over-engineering.

4. Function, method, class, hook phải có docstring/JSDoc theo chuẩn ngôn ngữ và rule dự án. Comment bằng tiếng Việt, giải thích rõ logic phức tạp, nghiệp vụ và lý do xử lý. Không comment thừa hoặc mô tả những điều hiển nhiên.

5. Frontend phải tuân thủ shadcn/ui, Tailwind CSS, design tokens, responsive, accessibility và i18n. Ưu tiên component hiện có, không hard-code style hoặc tự tạo component trùng lặp.

6. Khi công việc liên quan đến thiết kế, xây dựng hoặc chỉnh sửa UI/UX, BẮT BUỘC sử dụng skill UI/UX có sẵn để phân tích và thiết kế trước khi triển khai.

7. Trong quá trình thực hiện, nếu phát hiện code vi phạm rule trong phạm vi đang xử lý, BẮT BUỘC refactor và chuẩn hóa ngay. Không tiếp tục sử dụng code sai chuẩn.

8. Không tự ý thêm dependency, thay đổi nghiệp vụ, chỉnh sửa module hoặc chức năng ngoài phạm vi yêu cầu.

9. Sau khi hoàn thành MỖI chức năng, BẮT BUỘC chạy lại Graphify để cập nhật và tóm tắt kiến trúc, dependency, luồng xử lý và các thay đổi liên quan. Đảm bảo tài liệu phản ánh đúng code hiện tại.

10. Sau khi triển khai, BẮT BUỘC review code, chạy lint, format, typecheck và các test phù hợp. Phải xử lý lỗi phát sinh từ thay đổi trước khi kết thúc.

11. Khi cần kiểm tra, test hoặc xác minh giao diện, BẮT BUỘC sử dụng skill playwright-cli:
    - Kiểm tra UI, UX, responsive, accessibility và các luồng tương tác.
    - Kiểm tra console errors, network requests và API khi liên quan.
    - Kiểm tra các trạng thái loading, empty, error và success.
    - Nếu phát hiện lỗi, phải sửa và kiểm tra lại.
    - Không được kết luận chức năng hoạt động đúng khi chưa kiểm tra thực tế.

12. Không được tự ý bỏ qua rule, tắt lint/typecheck, bỏ qua test hoặc sử dụng giải pháp tạm thời để che giấu lỗi.

13. Nếu tài liệu, skill hoặc công cụ không tồn tại hay không khả dụng, phải thông báo rõ. Không được giả định hoặc báo cáo rằng đã thực hiện.

## QUY TRÌNH THỰC HIỆN

Bước 1: Đọc toàn bộ docs/rules và tài liệu liên quan.
Bước 2: Phân tích kiến trúc, codebase và xác định các thành phần có thể tái sử dụng.
Bước 3: Sử dụng skill UI/UX nếu có công việc liên quan đến giao diện.
Bước 4: Triển khai chức năng theo đúng kiến trúc và coding conventions.
Bước 5: Review, refactor và chuẩn hóa code trong phạm vi xử lý.
Bước 6: Chạy lint, typecheck và các test phù hợp.
Bước 7: Sử dụng skill playwright-cli nếu cần kiểm tra UI hoặc luồng tương tác.
Bước 8: Khắc phục lỗi và kiểm tra lại đến khi đạt yêu cầu.
Bước 9: Chạy Graphify sau mỗi chức năng để cập nhật tài liệu hệ thống.
Bước 10: Báo cáo ngắn gọn kết quả, các thay đổi và tình trạng kiểm tra.

## YÊU CẦU CUỐI CÙNG

- KHÔNG bắt đầu viết code khi chưa đọc tài liệu.
- KHÔNG bỏ qua các rule liên quan.
- KHÔNG tự ý thay đổi những phần ngoài phạm vi.
- KHÔNG tuyên bố hoàn thành khi chưa kiểm tra.
- LUÔN ưu tiên tính nhất quán với hệ thống hiện tại.
- LUÔN đảm bảo code sạch, chuẩn hóa, dễ bảo trì và mở rộng.
- LUÔN cập nhật Graphify sau khi hoàn thành từng chức năng.

Nếu phát hiện xung đột giữa yêu cầu và rule hệ thống, phải thông báo và đề xuất hướng xử lý trước khi triển khai.

# YÊU CẦU CẦN THỰC HIỆN

[Nội dung yêu cầu]