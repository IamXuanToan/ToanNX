"""POST /finance/sepay/webhook/{public_id}: nhận webhook SePay của một người.

Ngoại lệ có chủ đích với envelope chuẩn: phản hồi đúng `{"success": true}` (hợp đồng với SePay). Công khai,
không cookie nên không CSRF; xác thực bằng HMAC-SHA256 trên body gốc. DB lỗi → 503 để SePay gửi lại."""

from typing import Any

from django.db import DatabaseError
from django.http import JsonResponse
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.exceptions.authentication_error import AuthenticationError
from app.core.exceptions.validation_error import ValidationError
from app.core.views.core_api_view import CoreApiView
from app.finance.constants.finance_rate_limit_key import FinanceRateLimitKey
from app.finance.services.sepay_webhook_service import SepayWebhookService


class SepayWebhookView(CoreApiView):
    """Đọc `request.body` trước khi chạm `request.data` để giữ nguyên bytes ký."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.sepay_webhook_service = SepayWebhookService()

    @extend_schema(
        request=None,
        responses={
            200: OpenApiResponse(description='{"success": true}'),
            400: OpenApiResponse(description="Body hỏng hoặc thiếu id."),
            401: OpenApiResponse(description="Kết nối không có/tắt hoặc sai chữ ký."),
            503: OpenApiResponse(description="DB lỗi, SePay gửi lại."),
        },
    )
    @rate_limit(FinanceRateLimitKey.SEPAY_WEBHOOK)
    def post(self, request: Request, public_id: Any) -> JsonResponse:
        """Kiểm chữ ký rồi ghi tiền vào."""
        raw_body = request._request.body
        try:
            connection = self.sepay_webhook_service.verify(
                public_id,
                raw_body,
                request.headers.get("X-SePay-Signature", ""),
                request.headers.get("X-SePay-Timestamp", ""),
            )
        except AuthenticationError:
            return JsonResponse({"success": False}, status=401)
        try:
            self.sepay_webhook_service.handle(connection, raw_body)
        except ValidationError:
            return JsonResponse({"success": False}, status=400)
        except DatabaseError:
            return JsonResponse({"success": False}, status=503)
        return JsonResponse({"success": True})
