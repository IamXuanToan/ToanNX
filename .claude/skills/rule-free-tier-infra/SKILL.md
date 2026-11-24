---
name: rule-free-tier-infra
description: "Dùng khi thêm việc tốn tài nguyên (query DB, lệnh Redis, file R2, lượt gọi function, cron, cache) hoặc sửa Redis/QStash/Neon/Vercel/R2/Firebase."
---

<!-- Sinh tự động từ .agents/rules/52-free-tier-infra.md bằng scripts/sync-ai-rules.py. Không sửa tay. -->

# Hạ tầng gói free và ngân sách

Chi tiết và số liệu: `docs/architecture/infrastructure.md`.

## Giới hạn chính

| Dịch vụ | Giới hạn |
| --- | --- |
| Vercel Hobby | 1 triệu lượt gọi/tháng, **4 giờ Active CPU/tháng**, tối đa 300 giây/lần, cron 1 lần/ngày |
| Neon | 1 GB/project, **100 CU-giờ/tháng**, tự ngủ sau 5 phút không truy vấn |
| Upstash Redis | 500.000 lệnh/tháng, 256 MB, **chỉ TLS** (`rediss://`) |
| Upstash QStash | 1.000 tin/ngày |
| Cloudflare R2 | 10 GB, 1 triệu thao tác ghi, 10 triệu thao tác đọc/tháng |

## Quy tắc

- **Lượt khách và cron không chạm Neon khi cache/mốc còn hiệu lực** (mỗi truy vấn giữ Neon thức thêm 5 phút).
- Redis (`CacheService`) chỉ để tăng tốc: PostgreSQL vẫn là nguồn gốc; Redis trống/lỗi/hết hạn mức → dự phòng, không
  500. Chỉ cache dữ liệu **công khai**; không cache request của quản trị viên, phiên đăng nhập.
- Khóa Redis `<module>:<resource>:...`, luôn có TTL; service có dữ liệu công khai khai `public_cache_namespace` để ghi
  là làm mới cache.
- Không gọi function theo kiểu thăm dò dày; polling FE phải > 5 phút khi có thể (để Neon ngủ).
- Không làm việc nặng trong request (gửi thông báo, xử lý ảnh lớn); mọi lời gọi ngoài có timeout.
- File public trên R2 khóa UUID mới mỗi lần thay → `Cache-Control: immutable`; file riêng tư `private, no-store`.
- Ước lượng chi phí (lệnh Redis, query, lượt gọi) trước khi thêm việc định kỳ; cập nhật bảng ngân sách nếu đổi.
- Khi sửa đường nóng hoặc được yêu cầu tối ưu, theo rule `performance-review`: đo query/request/cache liên quan
  trước/sau; dùng `django-perf-review` cho rà Django, `vercel-react-best-practices` cho React/Next.js.
