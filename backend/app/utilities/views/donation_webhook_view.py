"""Webhook tiếp nhận giao dịch quyên góp từ SePay theo mã định danh của phương thức QR."""

from typing import Any

from django.db import DatabaseError
from django.http import JsonResponse
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.exceptions.not_found_error import NotFoundError
from app.core.exceptions.validation_error import ValidationError
from app.core.views.core_api_view import CoreApiView
from app.utilities.constants.utilities_rate_limit_key import UtilitiesRateLimitKey
from app.utilities.services.donation_transaction_service import DonationTransactionService


class DonationWebhookView(CoreApiView):
    """Webhook SePay công khai theo webhook_token của mã QR."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service theo đúng quy chuẩn kiến trúc."""
        super().__init__(**kwargs)
        self.donation_service = DonationTransactionService()

    @extend_schema(
        summary="Webhook nhận biến động số dư SePay",
        description="SePay gọi đến khi có giao dịch tiền vào khớp mã QR.",
        request=None,
        responses={
            200: OpenApiResponse(description='{"success": true}'),
            400: OpenApiResponse(description="Body hỏng hoặc thiếu id."),
            404: OpenApiResponse(description="Không tìm thấy cấu hình mã QR."),
            503: OpenApiResponse(description="Lỗi DB, SePay gửi lại."),
        },
    )
    @rate_limit(UtilitiesRateLimitKey.DONATION_WEBHOOK)
    def post(self, request: Request, webhook_token: str) -> JsonResponse:
        """Tiếp nhận và xử lý payload biến động số dư từ SePay."""
        payload = request.data if isinstance(request.data, dict) else {}
        try:
            self.donation_service.ingest_webhook(webhook_token, payload)
        except NotFoundError:
            return JsonResponse({"success": False, "error": "Not found"}, status=404)
        except ValidationError:
            return JsonResponse({"success": False, "error": "Bad request"}, status=400)
        except DatabaseError:
            return JsonResponse({"success": False, "error": "Database error"}, status=503)

        return JsonResponse({"success": True})
