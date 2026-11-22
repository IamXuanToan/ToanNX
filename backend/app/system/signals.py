"""Signal của phần Tài khoản (module System).

`user_credentials_changed` phát ra khi mật khẩu đổi hoặc tài khoản bị khóa, để phần xác thực thu hồi phiên
mà service tài khoản không phải phụ thuộc trực tiếp vào service phiên.
"""

from django.dispatch import Signal

# Tham số: user (User), reason (str)
user_credentials_changed = Signal()
