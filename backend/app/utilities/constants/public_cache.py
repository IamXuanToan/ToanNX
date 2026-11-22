"""Cache Redis cho dữ liệu công khai của module Tiện ích (link rút gọn, trang tùy chỉnh).

Mọi ghi vào link, trang, đường dẫn giữa, mã QR đều tăng version của namespace (`CoreCrudService`), nên cache
cũ hết hiệu lực ngay sau commit; TTL chỉ là lưới an toàn cho thay đổi ngoài các service đó
(ví dụ ảnh đính kèm).
"""

PUBLIC_CACHE_NAMESPACE = "utilities:public"
# Dữ liệu công khai sống tối đa chừng này giây trong cache.
PUBLIC_CACHE_TTL_SECONDS = 600
# Slug không tồn tại: nhớ ngắn để bot quét slug không đánh thức DB mỗi lượt.
PUBLIC_MISSING_TTL_SECONDS = 60
