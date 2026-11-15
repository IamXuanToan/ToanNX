"""Dữ liệu mã QR chuyển khoản (VietQR)."""

import re
from typing import Any

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.modules.qr_codes.constants.vietqr_banks import VIETQR_BANK_BINS
from app.modules.qr_codes.utils.vietqr_payload import strip_accents

MESSAGE_MAX_LENGTH = 25
_MESSAGE_PATTERN = re.compile(r"^[A-Za-z0-9 ]*$")


class QrBankTransferDataValidateSerializer(CoreValidateSerializer):
    """Ngân hàng, số tài khoản, chủ tài khoản (in hoa, bỏ dấu), số tiền, nội dung (≤ 25 ký tự không dấu)."""

    bank_bin = serializers.ChoiceField(
        choices=sorted(VIETQR_BANK_BINS), help_text="BIN ngân hàng (GET /qr_codes/banks)."
    )
    account_number = serializers.RegexField(
        r"^[0-9A-Za-z]{4,19}$", help_text="Số tài khoản 4–19 ký tự chữ/số."
    )
    account_name = serializers.CharField(max_length=50, help_text="Tên chủ tài khoản; tự in hoa, bỏ dấu.")
    amount = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=1,
        max_value=9_999_999_999,
        help_text="Số tiền VND (trống = tự nhập).",
    )
    message = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=100,
        help_text="Nội dung chuyển khoản, ≤ 25 ký tự không dấu.",
    )

    def validate_account_name(self, value: str) -> str:
        """In hoa, bỏ dấu, gộp khoảng trắng."""
        return " ".join(strip_accents(value).upper().split())

    def validate_message(self, value: str) -> str:
        """Bỏ dấu; chỉ chữ, số, khoảng trắng; tối đa 25 ký tự (an toàn với mọi app ngân hàng)."""
        text = " ".join(strip_accents(value).split())
        if len(text) > MESSAGE_MAX_LENGTH or not _MESSAGE_PATTERN.fullmatch(text):
            raise serializers.ValidationError(
                f"Tối đa {MESSAGE_MAX_LENGTH} ký tự, chỉ gồm chữ không dấu, số và khoảng trắng."
            )
        return text

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """Điền giá trị mặc định cho trường tùy chọn."""
        return {"amount": None, "message": "", **attrs}
