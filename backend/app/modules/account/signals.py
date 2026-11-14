"""Signal công khai của Account.

`user_credentials_changed` phát ra khi mật khẩu đổi hoặc tài khoản bị khóa, để
module authentication thu hồi phiên mà Account không phải import module đó.
"""

from django.dispatch import Signal

# Tham số: user (User), reason (str)
user_credentials_changed = Signal()
