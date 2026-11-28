"""Nghiệp vụ Chủ đề nhắc việc (mặc định hệ thống + cá nhân)."""

import unicodedata
from typing import Any
from uuid import uuid4

from django.db import transaction
from django.db.models import QuerySet
from django.utils.text import slugify

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.exceptions.conflict_error import ConflictError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.services.core_crud_service import CoreCrudService
from app.workspace.constants.workspace_error_code import WorkspaceErrorCode
from app.workspace.models.reminder_topic import ReminderTopic
from app.workspace.permissions.reminder_topic_permission import ReminderTopicPermission
from app.workspace.repositories.reminder_topic_repository import ReminderTopicRepository


class ReminderTopicService(CoreCrudService[ReminderTopic, ReminderTopicRepository]):
    """CRUD chủ đề nhắc việc cá nhân, cho phép đọc kèm chủ đề mặc định hệ thống."""

    repository_class = ReminderTopicRepository
    owner_field = "owner"
    manage_all_permission = ReminderTopicPermission.MANAGE_ALL.code

    def __init__(self, repository: ReminderTopicRepository | None = None) -> None:
        """Khởi tạo repository chủ đề nhắc việc."""
        super().__init__(repository or ReminderTopicRepository())

    def get_queryset_for(self, actor: Any) -> QuerySet[ReminderTopic]:
        """Trả toàn bộ chủ đề nếu có `manage_all`, ngược lại trả mặc định hệ thống + của mình."""
        if self.can_manage_all(actor):
            return self.repository.get_queryset()
        return self.repository.list_for_actor(actor.pk)

    def _get_writable_topic(self, actor: Any, pk: Any) -> ReminderTopic:
        """Lấy chủ đề để sửa/xóa, chặn user thường đụng vào chủ đề mặc định hệ thống."""
        topic = self.repository.get_for_update(pk)
        if topic.is_system:
            if not self.can_manage_all(actor):
                raise BusinessRuleError(
                    "Không thể thay đổi chủ đề mặc định của hệ thống.",
                    code=WorkspaceErrorCode.REMINDER_TOPIC_SYSTEM_PROTECTED,
                )
            return topic
        if not self.can_access(actor, topic):
            raise NotFoundError()
        return topic

    def get_by_id_for(self, actor: Any, pk: Any) -> ReminderTopic:
        """Cho phép đọc cả chủ đề mặc định hệ thống (`owner=None`) và của mình."""
        if self.can_manage_all(actor):
            return super().get_by_id_for(actor, pk)
        topic = self.repository.find_usable_for_actor(actor.pk, pk)
        if topic is None:
            return super().get_by_id_for(actor, pk)
        return topic

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> ReminderTopic:
        """Tạo chủ đề cá nhân cho `actor`."""
        payload = dict(data)
        payload["name"] = str(payload["name"]).strip()
        if not payload.get("code"):
            ascii_name = (
                unicodedata.normalize("NFKD", payload["name"]).encode("ascii", "ignore").decode("ascii")
            )
            base_slug = slugify(ascii_name)[:48] or "topic"
            payload["code"] = f"{base_slug}-{uuid4().hex[:6]}"
        payload["is_system"] = False
        try:
            return super().create(actor, payload)
        except ConflictError as exc:
            if exc.code != ErrorCode.CONFLICT:
                raise
            raise ConflictError(
                "Tên chủ đề đã tồn tại.", details={"name": ["Chủ đề này đã tồn tại."]}
            ) from exc

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> ReminderTopic:
        """Chủ đề mặc định hệ thống không cho user thường sửa."""
        topic = self._get_writable_topic(actor, pk)
        payload = dict(data)
        if "name" in payload:
            payload["name"] = str(payload["name"]).strip()
        try:
            return self.repository.update(topic, actor=actor, **payload)
        except ConflictError as exc:
            if exc.code != ErrorCode.CONFLICT:
                raise
            raise ConflictError(
                "Tên chủ đề đã tồn tại.", details={"name": ["Chủ đề này đã tồn tại."]}
            ) from exc

    @transaction.atomic
    def delete(self, actor: Any, pk: Any) -> None:
        """Chủ đề mặc định hệ thống không cho user thường xóa."""
        topic = self._get_writable_topic(actor, pk)
        self.repository.delete(topic, actor=actor)

    def resolve_for_actor(self, actor: Any, topic_name: str) -> ReminderTopic | None:
        """Tìm chủ đề theo tên cho AI tool; trả None nếu không khớp."""
        return self.repository.find_by_name_for_actor(actor.pk, topic_name)
