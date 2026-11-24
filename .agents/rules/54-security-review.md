---
trigger: model_decision
description: Dùng khi được yêu cầu rà bảo mật/OWASP hoặc khi sửa xác thực, phân quyền, webhook, URL ngoài, file riêng tư, dữ liệu tài chính; không dùng cho review code thông thường.
---

# Ranh giới bảo mật và rà soát

Chi tiết: `docs/rules/common.md` mục 5, `docs/rules/backend.md` mục 11 và tài liệu kiến trúc liên quan.

- Khi người dùng **yêu cầu** audit bảo mật, tìm lỗ hổng hoặc hướng dẫn code an toàn, dùng skill
  `security-best-practices` cho Python/Django và TypeScript/Next.js trong phạm vi được giao. Không tự mở rộng
  thành audit toàn repo khi chỉ đang sửa tính năng.
- Khi sửa luồng nhạy cảm, xác định đầu vào do khách/người dùng kiểm soát, điểm kiểm quyền BE, phạm vi owner,
  dữ liệu riêng tư, chữ ký/token, redirect/URL ngoài và dịch vụ ngoài liên quan. Thêm test hồi quy đúng endpoint
  cho nhánh bị từ chối, dữ liệu không hợp lệ và trường hợp của người khác.
- Báo finding dựa trên đường đi dữ liệu và điều kiện khai thác cụ thể; phân biệt giả thuyết với lỗi đã xác minh.
  Không in secret, không gọi dịch vụ ngoài thật trong test, không chạy toàn bộ suite nếu chưa được yêu cầu.
- Rule dự án thắng hướng dẫn skill ngoài; việc sửa theo lớp `view → service → repository`.
