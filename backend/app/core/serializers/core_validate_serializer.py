"""Serializer gốc kiểm tra dữ liệu đầu vào (request contract)."""

from typing import Any

from rest_framework import serializers


class CoreValidateSerializer(serializers.Serializer[Any]):
    """Serializer đầu vào chỉ kiểm tra contract, không ghi DB.

    Từ chối field lạ để client gửi nhầm (ví dụ `is_superuser`) không bị bỏ qua âm thầm.
    """

    def to_internal_value(self, data: Any) -> Any:
        """Từ chối field không khai báo rồi validate như bình thường.

        Args:
            data: Dữ liệu thô.

        Returns:
            Dữ liệu đã chuẩn hóa.

        Raises:
            serializers.ValidationError: Khi có field lạ hoặc dữ liệu sai.
        """
        if isinstance(data, dict):
            unknown = sorted(set(data) - set(self.fields))
            if unknown:
                raise serializers.ValidationError(
                    {name: ["Trường này không được hỗ trợ."] for name in unknown}
                )
        return super().to_internal_value(data)

    @classmethod
    def validate_data(cls, data: Any, **kwargs: Any) -> dict[str, Any]:
        """Kiểm tra dữ liệu và trả về validated_data.

        Args:
            data: request.data hoặc query params.
            **kwargs: Tham số serializer (ví dụ `partial=True`).

        Returns:
            Dữ liệu hợp lệ.
        """
        serializer = cls(data=data, **kwargs)
        serializer.is_valid(raise_exception=True)
        return dict(serializer.validated_data)
