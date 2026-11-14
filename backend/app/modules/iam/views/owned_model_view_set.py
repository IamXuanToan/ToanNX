"""ViewSet CRUD cho người dùng có quyền IAM và tài nguyên có owner."""

from typing import Any

from django.db.models import Model, QuerySet
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.response import Response

from app.core.responses.core_response import CoreResponse
from app.core.views.core_model_view_set import CoreModelViewSet
from app.modules.iam.permissions.has_action_permission import HasActionPermission
from app.modules.iam.permissions.is_active_authenticated import IsActiveAuthenticated
from app.modules.iam.services.owned_crud_service import OwnedCrudService


class OwnedModelViewSet[M: Model](CoreModelViewSet[M]):
    """CRUD tài nguyên có owner cho người dùng thường (không cần `is_staff`).

    Thứ tự: đăng nhập + active → quyền theo action (`action_permissions`, mặc định DENY)
    → service kiểm tra owner từng đối tượng (người khác nhận 404). Kiểm tra module do core gắn tự động.
    """

    permission_classes: list[type[BasePermission]] = [IsActiveAuthenticated, HasActionPermission]
    service: OwnedCrudService[M, Any]

    def get_queryset(self) -> QuerySet[M]:
        """Chỉ trả các bản ghi actor có thể xem."""
        if getattr(self, "swagger_fake_view", False):
            return self.service.get_queryset().none()
        return self.service.get_queryset_for(self.get_actor(self.request))

    def retrieve(self, request: Request, *args: Any, **kwargs: Any) -> CoreResponse:
        """Chi tiết có kiểm tra ownership."""
        instance = self.service.get_by_id_for(self.get_actor(request), kwargs["pk"])
        return CoreResponse(self.serialize_detail(instance))

    def create(self, request: Request, *args: Any, **kwargs: Any) -> CoreResponse:
        """Tạo với owner từ authenticated actor."""
        data = self._validate(self.create_serializer_class, request.data)
        instance = self.service.create(self.get_actor(request), data)
        return CoreResponse(self.serialize_detail(instance), status=201)

    def partial_update(self, request: Request, *args: Any, **kwargs: Any) -> CoreResponse:
        """Cập nhật với kiểm tra ownership trong transaction."""
        data = self._validate(self.update_serializer_class, request.data)
        instance = self.service.update(self.get_actor(request), kwargs["pk"], data)
        return CoreResponse(self.serialize_detail(instance))

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Xóa mềm với kiểm tra ownership trong transaction."""
        self.service.delete(self.get_actor(request), kwargs["pk"])
        return Response(status=204)
