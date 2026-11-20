"""ViewSet gốc cho mọi tài nguyên CRUD. Lớp con chỉ **khai báo**:

```python
class ShortLinkViewSet(CoreModelViewSet[ShortLink]):
    service_class = ShortLinkService
    filterset_class = ShortLinkFilter                       # ?status=ACTIVE,EXPIRED (django-filter)
    search_fields = ("name", "slug")                        # ?search=
    ordering_fields = ("name", "created_at")                # ?ordering= (whitelist)
    list_serializer_class = ShortLinkListResponseSerializer
    detail_serializer_class = ShortLinkDetailResponseSerializer
    create_serializer_class = ShortLinkCreateValidateSerializer
    update_serializer_class = ShortLinkUpdateValidateSerializer
    bulk_update_serializer_class = ShortLinkBulkUpdateValidateSerializer   # None = không có bulk-update
    bulk_delete_enabled = True                                             # POST …/bulk-delete
    history_enabled = True                                                 # GET …/{id}/history (cần tracker)
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    action_permissions = {                                  # mặc định DENY: action không khai → 403
        "list": permission_rule(P.READ), "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE), "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE), "bulk_update": permission_rule(P.UPDATE),
        "bulk_delete": permission_rule(P.DELETE), "history": permission_rule(P.READ),
    }
    action_rate_limits = {"create": "utilities.short_link.create"}   # khóa trong settings.RATE_LIMITS
```

Luồng: view → `self.service` (CoreCrudService, luôn gọi bản `*_for(actor)` nên owner tự áp) → repository.
Phân trang chỉ khi request có `page`/`page_size`; không có thì trả hết. Quyền và xác thực lấy mặc định
từ settings; view cần khác (công khai…) ghi đè `permission_classes` — xem bảng trong `core_api_view.py`.
"""

from typing import Any, ClassVar

from django.db.models import Model, QuerySet
from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from app.core.responses.core_response import CoreResponse
from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer
from app.core.serializers.core_bulk_result_response_serializer import CoreBulkResultResponseSerializer
from app.core.serializers.core_journal_entry_response_serializer import CoreJournalEntryResponseSerializer
from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.core.services.core_crud_service import CoreCrudService
from app.core.tracking.journal_tracker import JournalTracker
from app.core.tracking.recorder_registry import get_change_recorder
from app.core.views.core_api_view import CoreApiView

_RESPONSE_BY_ACTION: dict[str, type[serializers.BaseSerializer[Any]]] = {
    "bulk_update": CoreBulkResultResponseSerializer,
    "bulk_delete": CoreBulkResultResponseSerializer,
    "history": CoreJournalEntryResponseSerializer,
}


class CoreModelViewSet[M: Model](GenericViewSet[M]):
    """ViewSet CRUD gọi service, trả response chuẩn.

    Attributes:
        service_class: Service CRUD của tài nguyên.
        list_serializer_class: Serializer phần tử danh sách.
        detail_serializer_class: Serializer chi tiết (retrieve/create/update).
        create_serializer_class: Validate serializer khi tạo.
        update_serializer_class: Validate serializer khi cập nhật (partial).
        bulk_update_serializer_class: Validate serializer của bulk-update (`ids` + field); None = tắt.
        bulk_delete_serializer_class: Validate serializer của bulk-delete.
        bulk_delete_enabled: Bật `POST …/bulk-delete`.
        history_enabled: Bật `GET …/{id}/history`.
        action_permissions: `{action: PermissionRule}` (IAM đọc; mặc định DENY).
        action_rate_limits: `{action: khóa RATE_LIMITS}`.
    """

    service_class: type[CoreCrudService[M, Any]]
    list_serializer_class: type[serializers.BaseSerializer[Any]]
    detail_serializer_class: type[serializers.BaseSerializer[Any]]
    create_serializer_class: type[CoreValidateSerializer] | None = None
    update_serializer_class: type[CoreValidateSerializer] | None = None
    bulk_update_serializer_class: type[CoreBulkIdsValidateSerializer] | None = None
    bulk_delete_serializer_class: type[CoreBulkIdsValidateSerializer] = CoreBulkIdsValidateSerializer
    bulk_delete_enabled: bool = False
    history_enabled: bool = False
    action_permissions: ClassVar[dict[str, Any]] = {}
    action_rate_limits: ClassVar[dict[str, str]] = {}
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    lookup_value_regex = "[0-9a-fA-F-]{36}"
    ordering: tuple[str, ...] = ("-created_at", "-pk")

    get_actor = staticmethod(CoreApiView.get_actor)

    def __init_subclass__(cls, **kwargs: Any) -> None:
        """Kiểm cấu hình ngay lúc import để lỗi khai báo hiện khi khởi động, không đợi request.

        Raises:
            TypeError: Khai quyền cho action mà thiếu serializer, hoặc bật lịch sử mà model không có tracker.
        """
        super().__init_subclass__(**kwargs)
        if not hasattr(cls, "service_class"):
            return
        rules = {
            action: rule
            for action, rule in cls.action_permissions.items()
            if not getattr(rule, "denies_all", False)
        }
        if "create" in rules and cls.create_serializer_class is None:
            raise TypeError(f"{cls.__name__}: khai quyền `create` nhưng thiếu create_serializer_class.")
        if "partial_update" in rules and cls.update_serializer_class is None:
            raise TypeError(
                f"{cls.__name__}: khai quyền `partial_update` nhưng thiếu update_serializer_class."
            )
        if cls.history_enabled:
            model = cls.service_class.repository_class.model
            if not issubclass(model, JournalTracker):
                raise TypeError(
                    f"{cls.__name__}: history_enabled cần {model.__name__} kế thừa JournalTracker."
                )

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service một lần cho mỗi request.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.service: CoreCrudService[M, Any] = self.service_class()

    @classmethod
    def get_extra_actions(cls) -> list[Any]:
        """Ẩn action bulk/history chưa bật để router và OpenAPI không có endpoint thừa."""
        disabled = set()
        if cls.bulk_update_serializer_class is None:
            disabled.add("bulk_update")
        if not cls.bulk_delete_enabled:
            disabled.add("bulk_delete")
        if not cls.history_enabled:
            disabled.add("history")
        return [item for item in super().get_extra_actions() if item.__name__ not in disabled]

    # ==================================================================
    # Hook cho lớp con
    # ==================================================================
    def get_queryset(self) -> QuerySet[M]:
        """Queryset actor được thấy (filter backend áp lên queryset này).

        Returns:
            QuerySet.
        """
        if getattr(self, "swagger_fake_view", False):
            return self.service.get_queryset().none()
        return self.service.get_queryset_for(self.get_actor(self.request))

    def get_serializer_class(self) -> type[serializers.BaseSerializer[Any]]:
        """Serializer response theo action (dùng cho list và tài liệu OpenAPI).

        Returns:
            Lớp serializer.
        """
        if self.action == "list":
            return self.list_serializer_class
        return _RESPONSE_BY_ACTION.get(self.action or "", self.detail_serializer_class)

    def serialize_detail(self, instance: M) -> Any:
        """Serialize một bản ghi bằng detail serializer.

        Args:
            instance: Bản ghi.

        Returns:
            Dữ liệu đã serialize.
        """
        return self.detail_serializer_class(instance, context=self.get_serializer_context()).data

    def get_object_for_actor(self, pk: Any) -> M:
        """Bản ghi actor được thấy (404 nếu không có hoặc của người khác).

        Args:
            pk: Khóa chính.

        Returns:
            Bản ghi.
        """
        return self.service.get_by_id_for(self.get_actor(self.request), pk)

    def paginated(self, items: Any, serializer_class: type[serializers.BaseSerializer[Any]]) -> Response:
        """Trả danh sách có phân trang nếu request có `page`/`page_size`, ngược lại trả hết.

        Args:
            items: Queryset hoặc danh sách.
            serializer_class: Serializer phần tử.

        Returns:
            Response chuẩn.
        """
        context = self.get_serializer_context()
        page = self.paginate_queryset(items)
        if page is None:
            return CoreResponse(serializer_class(items, many=True, context=context).data)
        return self.get_paginated_response(serializer_class(page, many=True, context=context).data)

    # ==================================================================
    # Action chuẩn
    # ==================================================================
    def list(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Danh sách có lọc, tìm kiếm, sắp xếp; phân trang khi có `page`/`page_size`."""
        return self.paginated(self.filter_queryset(self.get_queryset()), self.list_serializer_class)

    def retrieve(self, request: Request, *args: Any, **kwargs: Any) -> CoreResponse:
        """Chi tiết bản ghi."""
        return CoreResponse(self.serialize_detail(self.get_object_for_actor(kwargs["pk"])))

    def create(self, request: Request, *args: Any, **kwargs: Any) -> CoreResponse:
        """Tạo bản ghi (201)."""
        data = self._validate(self.create_serializer_class, request.data)
        instance = self.service.create(self.get_actor(request), data)
        return CoreResponse(self.serialize_detail(self.get_object_for_actor(instance.pk)), status=201)

    def partial_update(self, request: Request, *args: Any, **kwargs: Any) -> CoreResponse:
        """Cập nhật một phần (PATCH)."""
        data = self._validate(self.update_serializer_class, request.data)
        self.service.update(self.get_actor(request), kwargs["pk"], data)
        return CoreResponse(self.serialize_detail(self.get_object_for_actor(kwargs["pk"])))

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Xóa bản ghi (204 không body)."""
        self.service.delete(self.get_actor(request), kwargs["pk"])
        return Response(status=204)

    @extend_schema(responses=CoreBulkResultResponseSerializer)
    @action(detail=False, methods=["post"], url_path="bulk-update")
    def bulk_update(self, request: Request) -> CoreResponse:
        """Cập nhật nhiều bản ghi trong một transaction (tất cả hoặc không gì cả)."""
        data = self._validate(self.bulk_update_serializer_class, request.data)
        ids = data.pop("ids")
        count = self.service.bulk_update(self.get_actor(request), ids, data)
        return CoreResponse(CoreBulkResultResponseSerializer({"count": count}).data)

    @extend_schema(responses=CoreBulkResultResponseSerializer)
    @action(detail=False, methods=["post"], url_path="bulk-delete")
    def bulk_delete(self, request: Request) -> CoreResponse:
        """Xóa nhiều bản ghi trong một transaction (tất cả hoặc không gì cả)."""
        data = self._validate(self.bulk_delete_serializer_class, request.data)
        count = self.service.bulk_delete(self.get_actor(request), data["ids"])
        return CoreResponse(CoreBulkResultResponseSerializer({"count": count}).data)

    @extend_schema(responses=CoreJournalEntryResponseSerializer(many=True))
    @action(detail=True, methods=["get"])
    def history(self, request: Request, pk: Any = None) -> Response:
        """Lịch sử thay đổi của bản ghi (mới nhất trước); quyền owner áp như `retrieve`."""
        instance = self.get_object_for_actor(pk)
        recorder = get_change_recorder()
        model = type(instance)
        entries = recorder.history(model.journal_resource(), instance.pk) if recorder else []  # type: ignore[attr-defined]  # đã kiểm JournalTracker
        return self.paginated(entries, CoreJournalEntryResponseSerializer)

    @staticmethod
    def _validate(serializer_class: type[CoreValidateSerializer] | None, data: Any) -> dict[str, Any]:
        """Validate body bằng validate serializer của action."""
        if serializer_class is None:
            raise NotImplementedError("ViewSet chưa khai báo validate serializer cho action này.")
        return serializer_class.validate_data(data)
