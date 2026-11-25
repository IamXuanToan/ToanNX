"""Parse danh sách UUID phân tách bằng dấu phẩy cho query param."""

from uuid import UUID

from rest_framework import serializers


def parse_uuid_list(value: str) -> list[UUID]:
    """Chuyển chuỗi `uuid1,uuid2` thành danh sách UUID hợp lệ.

    Args:
        value: Chuỗi query param thô.

    Returns:
        Danh sách UUID (rỗng nếu chuỗi trống).

    Raises:
        serializers.ValidationError: Nếu có phần tử không phải UUID hợp lệ.
    """
    raw_items = [item.strip() for item in value.split(",") if item.strip()]
    result: list[UUID] = []
    for item in raw_items:
        try:
            result.append(UUID(item))
        except ValueError as exc:
            raise serializers.ValidationError("Giá trị UUID không hợp lệ.") from exc
    return result
