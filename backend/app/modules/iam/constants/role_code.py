"""Quy ước mã vai trò của IAM."""

import re

# CHỮ_HOA_SNAKE, bắt đầu bằng chữ cái, 2-64 ký tự (ví dụ `ADMIN`, `NOVEL_EDITOR`).
ROLE_CODE_PATTERN = re.compile(r"^[A-Z][A-Z0-9_]{1,63}$")
