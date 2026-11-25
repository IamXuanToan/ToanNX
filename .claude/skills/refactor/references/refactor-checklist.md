# Bảng kiểm trước và sau khi Refactor trong ToanNX

| Tiêu chí | Cần kiểm khi rà | Hành động chuẩn |
| --- | --- | --- |
| Tầng BE | View/task/command có chạm `.objects` hoặc `*Repository()`? | Tạo/gọi method trên Service; khai service phụ thuộc trong `__init__`. |
| Method tĩnh BE | Service có `@staticmethod` / `@classmethod` ở method công khai? | Chuyển sang instance method dùng `self.<service>` hoặc tách module `utils/`. |
| Một đơn vị / file | Nhiều class, nhiều component hoặc hook nằm trong `.tsx`? | Tách file riêng, cập nhật import; kiểm bằng `test_one_class_per_file.py` & `one-unit-per-file.test.ts`. |
| Lặp logic (DRY) | Hai đoạn xử lý giống nhau ở 2 module hoặc 2 component? | Tra `docs/common-catalog.md`; mở rộng common hiện có hoặc trích helper dùng chung, cập nhật catalog. |
| Độ sâu & rõ nghĩa | Hàm dài > 60 dòng, `if` lồng > 3 cấp, chuỗi `if/elif` theo loại? | Early return, tách helper nhỏ đặt tên theo ý định, dùng bảng ánh xạ (`Record`/`dict`). |
| Frontend View | `*-view.tsx` có `useQuery`, `useEffect`, `useState`? | Chuyển xuống `components/<model>/` và `components/<model>/hooks/use-*.ts`. |
| Primitive & Token | Thẻ `<button>/<a>/<img>` trần, class màu không có `--color-*`? | Thay bằng `@/shares/components/ui/*`, `Link`, `Image`, token màu và `cn()`. |
| URL & Query State | Bảng/tab có lưu state lọc/phân trang/tab vào URL không? | Dùng `useTableState` / `useTabState` (`replaceState`) giữ state khi F5. |
| Contract & Docs | Signature công khai, OpenAPI docstring, đường dẫn docs còn khớp? | Chạy `pnpm api:types` nếu chạm OpenAPI; cập nhật `docs/common-catalog.md` nếu đổi common. |
