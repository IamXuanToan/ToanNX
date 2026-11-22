"""Hằng số gọi SePay API v2 (https://developer.sepay.vn/vi/sepay-api/v2/gioi-thieu)."""

SEPAY_API_BASE_URLS = {
    "production": "https://userapi.sepay.vn/v2",
    "sandbox": "https://userapi-sandbox.sepay.vn/v2",
}
# Tối đa bản ghi mỗi trang của các endpoint danh sách v2.
SEPAY_MAX_PER_PAGE = 100
# Giới hạn 3 request/giây mỗi IP → giãn ít nhất 350 ms giữa hai trang.
SEPAY_PAGE_INTERVAL_SECONDS = 0.35
# Chặn vòng lặp phân trang vô hạn khi API trả `has_more` sai.
SEPAY_MAX_PAGES = 50
SEPAY_TIMEOUT_SECONDS = 10
HTTP_OK = 200
HTTP_UNAUTHORIZED = 401
HTTP_TOO_MANY = 429
