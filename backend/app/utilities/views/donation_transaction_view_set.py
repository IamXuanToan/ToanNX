"""ViewSet quản lý giao dịch quyên góp (DonationTransaction)."""

from typing import Any

from django.http import HttpResponse
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.types.permission_rule import DENY, permission_rule
from app.utilities.filters.donation_transaction_filter import DonationTransactionFilter
from app.utilities.models.donation_transaction import DonationTransaction
from app.utilities.permissions.donation_permission import DonationPermission
from app.utilities.serializers.responses.donation_stats_response_serializer import (
    DonationStatsResponseSerializer,
)
from app.utilities.serializers.responses.donation_transaction_response_serializer import (
    DonationTransactionResponseSerializer,
)
from app.utilities.serializers.validates.donation_bulk_update_validate_serializer import (
    DonationBulkUpdateValidateSerializer,
)
from app.utilities.serializers.validates.donation_toggle_validate_serializer import (
    DonationToggleValidateSerializer,
)
from app.utilities.services.donation_transaction_service import DonationTransactionService


class DonationTransactionViewSet(CoreModelViewSet[DonationTransaction]):
    """Xem danh sách, xem chi tiết, ẩn/hiện bình luận, thống kê và xuất báo cáo quyên góp."""

    service_class = DonationTransactionService
    service: DonationTransactionService

    filterset_class = DonationTransactionFilter
    search_fields = ("donor_title", "message", "sepay_id")
    ordering_fields = ("received_at", "amount", "created_at")
    ordering = ("-received_at", "-pk")
    list_serializer_class = DonationTransactionResponseSerializer
    detail_serializer_class = DonationTransactionResponseSerializer
    bulk_delete_enabled = True
    bulk_update_serializer_class = DonationBulkUpdateValidateSerializer

    action_permissions = {
        "list": permission_rule(DonationPermission.READ),
        "retrieve": permission_rule(DonationPermission.READ),
        "destroy": permission_rule(DonationPermission.UPDATE),
        "bulk_delete": permission_rule(DonationPermission.UPDATE),
        "bulk_update": permission_rule(DonationPermission.UPDATE),
        "toggle_hidden": permission_rule(DonationPermission.UPDATE),
        "stats": permission_rule(DonationPermission.READ),
        "export": permission_rule(DonationPermission.EXPORT),
        "create": DENY,
        "partial_update": DENY,
    }

    @extend_schema(
        summary="Đổi trạng thái ẩn/hiện bình luận",
        request=DonationToggleValidateSerializer,
        responses=DonationTransactionResponseSerializer,
    )
    @action(detail=True, methods=["post"], url_path="toggle-hidden")
    @validate_request(DonationToggleValidateSerializer)
    def toggle_hidden(
        self, request: Request, pk: Any = None, validated_data: dict[str, Any] | None = None
    ) -> CoreResponse:
        """Chủ trang hoặc Admin có quyền MANAGE_ALL ẩn hoặc hiện bình luận."""
        data = validated_data or {}
        tx = self.service.toggle_hidden(self.get_actor(request), pk, data.get("is_hidden", False))
        return CoreResponse(DonationTransactionResponseSerializer(tx).data)

    @extend_schema(
        summary="Thống kê tổng hợp quyên góp",
        responses=DonationStatsResponseSerializer,
    )
    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request: Request) -> CoreResponse:
        """Lấy số liệu thống kê quyên góp (1 người vs tất cả)."""
        actor = self.get_actor(request)
        page_id = request.query_params.get("page_id") or request.query_params.get("page")
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        owner_id = request.query_params.get("owner_id") or request.query_params.get("owner")

        data = self.service.summary_stats(
            actor,
            date_from=date_from,
            date_to=date_to,
            page_id=page_id,
            owner_id=owner_id,
        )
        return CoreResponse(DonationStatsResponseSerializer(data).data)

    @extend_schema(
        summary="Xuất báo cáo quyên góp CSV",
        responses={200: str},
    )
    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request: Request) -> HttpResponse:
        """Xuất danh sách quyên góp đã lọc ra file CSV UTF-8 có dấu."""
        actor = self.get_actor(request)
        queryset = self.filter_queryset(self.get_queryset())
        csv_content = self.service.export_csv(actor, queryset=queryset)

        response = HttpResponse(csv_content, content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="bao-cao-quyen-gop.csv"'
        return response
