"""Quy tắc kiểm tra hợp lệ dùng lại giữa các module.

Phân vai:
- Validate serializer: contract đầu vào (kiểu, bắt buộc, độ dài).
- CoreValidator: định dạng mã dùng chung của core (quyền, module, icon).
- Quy tắc riêng của module nằm trong module đó (ví dụ `account/validators/password_validator.py`).
- Service: bất biến nghiệp vụ.
- Database: ràng buộc cuối cùng.
"""

import re

PERMISSION_CODE_PATTERN = re.compile(r"^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$")
MODULE_CODE_PATTERN = re.compile(r"^[a-z][a-z0-9_]{1,31}$")
# Tên icon lucide-react dạng kebab-case, ví dụ `shield-check` (frontend render bằng DynamicIcon).
ICON_NAME_PATTERN = re.compile(r"^[a-z][a-z0-9]*(-[a-z0-9]+)*$")


class CoreValidator:
    """Quy tắc kiểm tra hợp lệ dùng chung."""

    @staticmethod
    def is_permission_code(value: str) -> bool:
        """Mã quyền dạng `module.resource.action`.

        Args:
            value: Mã cần kiểm tra.

        Returns:
            True nếu hợp lệ.
        """
        return bool(PERMISSION_CODE_PATTERN.match(value))

    @staticmethod
    def is_module_code(value: str) -> bool:
        """Mã module snake_case chữ thường, 2-32 ký tự.

        Args:
            value: Mã cần kiểm tra.

        Returns:
            True nếu hợp lệ.
        """
        return bool(MODULE_CODE_PATTERN.match(value))

    @staticmethod
    def is_icon_name(value: str) -> bool:
        """Tên icon lucide-react kebab-case, tối đa 64 ký tự (ví dụ `shield-check`).

        Args:
            value: Tên icon.

        Returns:
            True nếu hợp lệ.
        """
        return len(value) <= 64 and bool(ICON_NAME_PATTERN.match(value))
