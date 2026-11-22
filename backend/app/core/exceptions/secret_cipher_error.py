"""Lỗi giải mã bí mật đã lưu (khóa đổi hoặc bản mã hỏng)."""


class SecretCipherError(Exception):
    """Không giải mã được; nơi gọi chuyển thành trạng thái "cần nhập lại"."""
