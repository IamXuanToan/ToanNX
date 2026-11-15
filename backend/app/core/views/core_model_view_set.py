"""ViewSet gốc cho tài nguyên CRUD chuẩn (list, retrieve, create, partial_update, destroy).

Lọc/tìm kiếm/sắp xếp/phân trang dùng chuẩn DRF + django-filter (cấu hình mặc định trong settings):

```
GET /resources?search=abc&is_active=true&ordering=-created_at&page=2&page_size=50
```

Lớp con khai báo:

```python
class RoleViewSet(AdminModelViewSet):
    service_class = RoleService
    filterset_class = RoleFilter                      # lọc theo field (django-filter)
    search_fields = ("code", "name")                  # ?search=
    ordering_fields = ("code", "name", "created_at")  # ?ordering= (whitelist)
    ordering = ("-created_at", "-pk")                 # mới nhất trước
    list_serializer_class = RoleListResponseSerializer
    detail_serializer_class = RoleDetailResponseSerializer
    create_serializer_class = RoleCreateValidateSerializer
    update_serializer_class = RoleUpdateValidateSerializer
    http_method_names = ["get", "post", "patch"]      # bỏ "delete" nếu không hỗ trợ xóa
```

Luồng mỗi action: view → `self.service` (CoreCrudService) → repository. ViewSet không gọi ORM.
"""

from typing import Any

from django.db.models import Model, QuerySet
from rest_framework import serializers
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from app.core.responses.core_response import CoreResponse
from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.core.services.core_crud_service import CoreCrudService
from app.core.views.core_api_view import CoreApiView


class CoreModelViewSet[M: Model](GenericViewSet[M]):
    """ViewSet CRUD gọi service, trả response chuẩn.

    Attributes:
        service_class: Service CRUD của tài nguyên.
        list_serializer_class: Serializer phần tử danh sách.
        detail_serializer_class: Serializer chi tiết (retrieve/create/update).
        create_serializer_class: Validate serializer khi tạo.
        update_serializer_class: Validate serializer khi cập nhật (partial).
    """

    service_class: type[CoreCrudService[M, Any]]
    list_serializer_class: type[serializers.BaseSerializer[Any]]
    detail_serializer_class: type[serializers.BaseSerializer[Any]]
    create_serializer_class: type[CoreValidateSerializer] | None = None
    update_serializer_class: type[CoreValidateSerializer] | None = None
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    lookup_value_regex = "[0-9a-fA-F-]{36}"
    ordering: tuple[str, ...] = ("-created_at", "-pk")

    get_actor = staticmethod(CoreApiView.get_actor)

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service một lần cho mỗi request.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.service: CoreCrudService[M, Any] = self.service_class()

    # ==================================================================
    # Hook cho lớp con
    # ==================================================================
    def get_queryset(self) -> QuerySet[M]:
        """Queryset gốc lấy từ service (filter backend áp lên queryset này).

        Returns:
            QuerySet.
        """
        return self.service.get_queryset()

    def get_serializer_class(self) -> type[serializers.BaseSerializer[Any]]:
        """Serializer theo action (dùng cho list và tài liệu OpenAPI).

        Returns:
            Lớp serializer.
        """
        return self.list_serializer_class if self.action == "list" else self.detail_serializer_class

    def serialize_detail(self, instance: M) -> Any:
        """Serialize một bản ghi bằng detail serializer.

        Args:
            instance: Bản ghi.

        Returns:
            Dữ liệu đã serialize.
        """
        return self.detail_serializer_class(instance, context=self.get_serializer_context()).data

    # ==================================================================
    # Action chuẩn
    # ==================================================================
    def list(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Danh sách có lọc, tìm kiếm, sắp xếp, phân trang.

        Args:
            request: Request.
            *args: Tham số URL.
            **kwargs: Tham số URL.

        Returns:
            Response phân trang (hoặc danh sách nếu tắt phân trang).
        """
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        context = self.get_serializer_context()
        if page is None:
            return CoreResponse(self.list_serializer_class(queryset, many=True, context=context).data)
        return self.get_paginated_response(self.list_serializer_class(page, many=True, context=context).data)

    def retrieve(self, request: Request, *args: Any, **kwargs: Any) -> CoreResponse:
        """Chi tiết bản ghi.

        Args:
            request: Request.
            *args: Tham số URL.
            **kwargs: Tham số URL (`pk`).

        Returns:
            Bản ghi.
        """
        return CoreResponse(self.serialize_detail(self.service.get_by_id(kwargs["pk"])))

    def create(self, request: Request, *args: Any, **kwargs: Any) -> CoreResponse:
        """Tạo bản ghi.

        Args:
            request: Request.
            *args: Tham số URL.
            **kwargs: Tham số URL.

        Returns:
            Bản ghi vừa tạo (201).
        """
        data = self._validate(self.create_serializer_class, request.data)
        instance = self.service.create(self.get_actor(request), data)
        return CoreResponse(self.serialize_detail(self.service.get_by_id(instance.pk)), status=201)

    def partial_update(self, request: Request, *args: Any, **kwargs: Any) -> CoreResponse:
        """Cập nhật một phần (PATCH).

        Args:
            request: Request.
            *args: Tham số URL.
            **kwargs: Tham số URL (`pk`).

        Returns:
            Bản ghi sau cập nhật.
        """
        data = self._validate(self.update_serializer_class, request.data)
        self.service.update(self.get_actor(request), kwargs["pk"], data)
        return CoreResponse(self.serialize_detail(self.service.get_by_id(kwargs["pk"])))

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Xóa bản ghi.

        Args:
            request: Request.
            *args: Tham số URL.
            **kwargs: Tham số URL (`pk`).

        Returns:
            204 không body.
        """
        self.service.delete(self.get_actor(request), kwargs["pk"])
        return Response(status=204)

    @staticmethod
    def _validate(serializer_class: type[CoreValidateSerializer] | None, data: Any) -> dict[str, Any]:
        """Validate body bằng validate serializer của action."""
        if serializer_class is None:
            raise NotImplementedError("ViewSet chưa khai báo validate serializer cho action này.")
        return serializer_class.validate_data(data)
