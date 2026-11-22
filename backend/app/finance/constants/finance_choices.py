"""Enum dùng chung giữa Income và Invoice."""

from django.db import models


class RateSource(models.TextChoices):
    """Cách có tỷ giá quy đổi VNĐ."""

    BASE = "BASE", "Tiền tệ gốc (VNĐ)"
    API = "API", "Tự động (Vietcombank)"
    MANUAL = "MANUAL", "Nhập tay"
    BANK_ACTUAL = "BANK_ACTUAL", "Theo số ngân hàng đã trả"
