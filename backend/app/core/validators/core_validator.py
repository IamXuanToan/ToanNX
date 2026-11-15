"""Quy tắc kiểm tra hợp lệ dùng lại giữa các module.

Phân vai:
- Validate serializer: contract đầu vào (kiểu, bắt buộc, độ dài).
- CoreValidator: định dạng mã dùng chung của core (quyền, module).
- Quy tắc riêng của module nằm trong module đó (ví dụ `account/validators/password_validator.py`).
- Service: bất biến nghiệp vụ.
- Database: ràng buộc cuối cùng.
"""

import re

PERMISSION_CODE_PATTERN = re.compile(r"^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$")
MODULE_CODE_PATTERN = re.compile(r"^[a-z][a-z0-9_]{1,31}$")


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
