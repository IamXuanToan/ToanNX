---
name: rule-performance-review
description: "Dùng khi được yêu cầu kiểm hiệu năng/N+1/tối ưu hoặc khi sửa endpoint danh sách, đường đọc công khai, cache, cron, batch, số request frontend; không dùng cho chỉnh tài liệu hay UI tĩnh."
---

<!-- Sinh tự động từ .agents/rules/55-performance-review.md bằng scripts/sync-ai-rules.py. Không sửa tay. -->

# Kiểm tra hiệu năng theo phần bị ảnh hưởng

Chi tiết: `docs/rules/common.md` mục 7, `docs/rules/backend.md` mục 12, `docs/rules/frontend.md` mục 8,
`docs/architecture/infrastructure.md`.

- Khi yêu cầu rà hiệu năng Django, dùng `django-perf-review`: truy vết queryset tới serializer, kiểm N+1,
  phân trang, index và vòng ghi. Tối ưu truy vấn ở **repository**, không ở view/service/serializer như ví dụ
  Django chung trong skill.
- Khi viết/review React/Next.js, dùng `vercel-react-best-practices`; trang vẫn lấy dữ liệu qua React Query
  phía Client như rule frontend. Với luồng UI bị ảnh hưởng, đo số request, waterfall, dung lượng tài nguyên
  và trạng thái cache trên Network thực tế.
- Khi người dùng yêu cầu audit tốc độ trang/Core Web Vitals, dùng `web-perf` trên URL/môi trường đã xác định;
  nếu thiếu công cụ trace, vẫn kiểm Network và mã nguồn trong phạm vi có thể, ghi rõ phép đo chưa thực hiện.
- Đường nóng backend: dùng test số query liên quan (`test_list_query_count.py` cho danh sách), PostgreSQL local
  `--reuse-db`; khi đổi cache, xét hit/miss, số lệnh Redis và nhánh dự phòng. Chỉ kiểm phần đã sửa.
- Không báo cải thiện khi thiếu số đo trước/sau hoặc test chứng minh. Tính chi phí gói free trước khi thêm cache,
  cron, lệnh Redis, lượt R2 hoặc function.
