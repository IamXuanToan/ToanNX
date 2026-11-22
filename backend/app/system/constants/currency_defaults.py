"""Mặc định tiền tệ và tỷ giá."""

BASE_CURRENCY_CODE = "VND"
# Ngày nghỉ/không có số: lùi tối đa số ngày này để tìm tỷ giá gần nhất.
EXCHANGE_RATE_LOOKBACK_DAYS = 7
EXCHANGE_RATE_TIMEOUT_SECONDS = 10
# Endpoint JSON theo ngày của Vietcombank (không có tài liệu chính thức; đã gọi thử 21/11/2026).
VIETCOMBANK_RATE_URL = "https://www.vietcombank.com.vn/api/exchangerates"
