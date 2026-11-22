"""Kiểm thử R2UsageService gọi Cloudflare R2 REST API v4."""

import json
import urllib.error
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase, override_settings

from app.core.storage.r2_usage_service import R2UsageService


class TestR2UsageService(SimpleTestCase):
    """Kiểm tra logic truy vấn dung lượng R2 từ API Cloudflare."""

    def test_is_configured_returns_false_when_missing_credentials(self) -> None:
        """Chưa đủ thông tin thì is_configured trả False."""
        service = R2UsageService(account_id="", bucket_name="bucket", api_token="token")
        assert service.is_configured() is False

        service = R2UsageService(account_id="acc", bucket_name="", api_token="token")
        assert service.is_configured() is False

        service = R2UsageService(account_id="acc", bucket_name="bucket", api_token="")
        assert service.is_configured() is False

    def test_is_configured_returns_true_when_all_credentials_present(self) -> None:
        """Đầy đủ thông tin thì is_configured trả True."""
        service = R2UsageService(account_id="acc_123", bucket_name="bucket_abc", api_token="token_xyz")
        assert service.is_configured() is True

    def test_get_bucket_usage_bytes_returns_none_when_not_configured(self) -> None:
        """Không gọi HTTP nếu chưa cấu hình đủ token."""
        service = R2UsageService(account_id="", bucket_name="", api_token="")
        assert service.get_bucket_usage_bytes() is None

    @patch("urllib.request.urlopen")
    def test_get_bucket_usage_bytes_success(self, mock_urlopen: MagicMock) -> None:
        """API trả 200 và success: true thì cộng payloadSize và metadataSize."""
        response_payload = {
            "success": True,
            "errors": [],
            "messages": [],
            "result": {
                "payloadSize": "104857600",  # 100 MB
                "metadataSize": "1024",  # 1 KB
                "objectCount": "50",
            },
        }
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.read.return_value = json.dumps(response_payload).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_response

        service = R2UsageService(account_id="acc_123", bucket_name="bucket_abc", api_token="token_xyz")
        total = service.get_bucket_usage_bytes()

        assert total == 104857600 + 1024

    @patch("urllib.request.urlopen")
    def test_get_bucket_usage_bytes_api_error_returns_none(self, mock_urlopen: MagicMock) -> None:
        """API trả success: false thì trả None."""
        response_payload = {
            "success": False,
            "errors": [{"code": 10000, "message": "Authentication error"}],
            "messages": [],
            "result": None,
        }
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.read.return_value = json.dumps(response_payload).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_response

        service = R2UsageService(account_id="acc_123", bucket_name="bucket_abc", api_token="bad_token")
        assert service.get_bucket_usage_bytes() is None

    @patch("urllib.request.urlopen")
    def test_get_bucket_usage_bytes_network_error_returns_none(self, mock_urlopen: MagicMock) -> None:
        """Gặp lỗi mạng hoặc timeout thì trả về None an toàn (không crash)."""
        mock_urlopen.side_effect = urllib.error.URLError("Connection timed out")

        service = R2UsageService(account_id="acc_123", bucket_name="bucket_abc", api_token="token_xyz")
        assert service.get_bucket_usage_bytes() is None

    @override_settings(
        CLOUDFLARE_R2_ACCOUNT_ID="settings_acc",
        CLOUDFLARE_R2_BUCKET_NAME="settings_bucket",
        CLOUDFLARE_API_TOKEN="settings_token",
    )
    def test_r2_usage_reads_from_django_settings(self) -> None:
        """Service tự động lấy giá trị từ Django settings khi không truyền tham số."""
        service = R2UsageService()
        assert service.account_id == "settings_acc"
        assert service.bucket_name == "settings_bucket"
        assert service.api_token == "settings_token"
        assert service.is_configured() is True
