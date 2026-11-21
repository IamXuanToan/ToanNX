"""Service truy vấn dung lượng lưu trữ thực tế từ Cloudflare R2 API v4."""

import json
import logging
import urllib.error
import urllib.request
from typing import Any

from django.conf import settings

logger = logging.getLogger(__name__)


class R2UsageService:
    """Truy vấn thông số dung lượng thực tế từ Cloudflare R2 REST API v4.

    Endpoint Cloudflare:
    `GET https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/buckets/{bucket_name}/usage`

    Tài liệu chính thức:
    - https://developers.cloudflare.com/api/resources/r2/subresources/buckets/subresources/usage/
    """

    def __init__(
        self,
        account_id: str | None = None,
        bucket_name: str | None = None,
        api_token: str | None = None,
        timeout_seconds: float = 3.0,
    ) -> None:
        """Khởi tạo service với thông tin kết nối Cloudflare R2.

        Args:
            account_id: ID tài khoản Cloudflare (mặc định đọc từ settings.CLOUDFLARE_R2_ACCOUNT_ID).
            bucket_name: Tên bucket R2 (mặc định đọc từ settings.CLOUDFLARE_R2_BUCKET_NAME).
            api_token: API Token có quyền R2 Storage Read (mặc định đọc từ settings.CLOUDFLARE_API_TOKEN).
            timeout_seconds: Thời gian tối đa chờ phản hồi từ Cloudflare (mặc định 3.0 giây).
        """
        self.account_id = (
            getattr(settings, "CLOUDFLARE_R2_ACCOUNT_ID", "") if account_id is None else account_id
        )
        self.bucket_name = (
            getattr(settings, "CLOUDFLARE_R2_BUCKET_NAME", "") if bucket_name is None else bucket_name
        )
        self.api_token = getattr(settings, "CLOUDFLARE_API_TOKEN", "") if api_token is None else api_token
        self.timeout_seconds = timeout_seconds

    def is_configured(self) -> bool:
        """Kiểm tra hệ thống đã có đủ thông tin để gọi Cloudflare R2 API hay chưa.

        Returns:
            True nếu có đủ account_id, bucket_name và api_token.
        """
        return bool(self.account_id and self.bucket_name and self.api_token)

    def get_bucket_usage_bytes(self) -> int | None:
        """Lấy tổng dung lượng (bytes) đang sử dụng trên bucket R2.

        Bao gồm:
        - `payloadSize`: Dung lượng dữ liệu đối tượng lưu trữ (Standard tier).
        - `metadataSize`: Dung lượng metadata đi kèm.

        Returns:
            Tổng số bytes nguyên nếu thành công, hoặc None nếu chưa cấu hình token hoặc gọi API thất bại.
        """
        if not self.is_configured():
            return None

        url = (
            f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/r2/buckets/"
            f"{self.bucket_name}/usage"
        )
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
            "User-Agent": "ToanNX-Backend/1.0",
        }

        request = urllib.request.Request(url, headers=headers, method="GET")  # noqa: S310
        try:
            with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:  # noqa: S310
                if response.status != 200:
                    logger.warning(
                        "Cloudflare R2 usage API trả về status %s: %s",
                        response.status,
                        response.read().decode("utf-8", errors="replace"),
                    )
                    return None

                data: dict[str, Any] = json.loads(response.read().decode("utf-8"))
                if not data.get("success"):
                    logger.warning("Cloudflare R2 usage API báo lỗi: %s", data.get("errors"))
                    return None

                result: dict[str, Any] = data.get("result", {})
                payload_size = int(result.get("payloadSize", 0))
                metadata_size = int(result.get("metadataSize", 0))
                return payload_size + metadata_size
        except (urllib.error.URLError, TimeoutError, ValueError, KeyError) as exc:
            logger.warning(
                "Không thể lấy dung lượng từ Cloudflare R2 API (%s): %s",
                type(exc).__name__,
                exc,
            )
            return None
