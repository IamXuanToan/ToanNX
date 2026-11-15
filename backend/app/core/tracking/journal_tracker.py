"""Mixin ghi lịch sử thay đổi: model kế thừa là CRUD tự phát event cho journal.

```python
class ShortLink(JournalTracker, CoreModel):           # đặt TRƯỚC CoreModel
    journal_fields = ("name", "slug", "status")        # mặc định "__all__" (mọi field trừ audit)
    journal_masked_fields = ("password",)              # ghi "đã đổi" nhưng không lưu giá trị
```

Cách hoạt động (không tốn query thêm):
- `from_db` chụp giá trị các field theo dõi lúc nạp bản ghi.
- `save()` so với ảnh chụp → `CREATE` / `UPDATE` / `DELETE` (xóa mềm: `deleted_at` từ rỗng sang có giá trị).
- `delete()` (xóa cứng) → `DELETE`.
- Event gửi cho `ChangeRecorder` cấu hình ở `CORE_CHANGE_RECORDER`, ghi **trong cùng transaction**: thao tác
  rollback thì lịch sử cũng mất.

`QuerySet.update()` / `bulk_create()` không gọi `save()`; `CoreRepository.update_where` / `bulk_create`
tự xử lý model có tracker. Không dùng `Model.objects.update()` trực tiếp cho field được theo dõi.
"""

import json
from collections.abc import Collection
from typing import Any, ClassVar, Literal, Self

from django.core.serializers.json import DjangoJSONEncoder
from django.db import models
from django.db.models.fields.files import FieldFile

from app.core.context.user_context import get_user_id
from app.core.tracking.change_set import ChangeSet
from app.core.tracking.recorder_registry import get_change_recorder

MASK = "***"
SNAPSHOT_ATTR = "_journal_snapshot"
LABEL_ATTR = "_journal_label"
DELETED_FIELD = "deleted_at"
SYSTEM_FIELDS = frozenset(
    {"id", "created_at", "updated_at", "created_by", "updated_by", "deleted_at", "deleted_by"}
)

_tracked_cache: dict[type, tuple["models.Field[Any, Any]", ...]] = {}


def _normalize(value: Any) -> Any:
    """Đổi giá trị field sang dạng JSON (UUID, datetime, Decimal, file...)."""
    if isinstance(value, FieldFile):
        return value.name or None
    return json.loads(json.dumps(value, cls=DjangoJSONEncoder))


class JournalTracker(models.Model):
    """Model trừu tượng (mixin) đặt trước `CoreModel` trong danh sách lớp cha.

    Attributes:
        journal_fields: Field theo dõi; `"__all__"` = mọi field cụ thể trừ field hệ thống.
        journal_masked_fields: Field chỉ ghi "đã đổi", không lưu giá trị.
        journal_excluded_fields: Field bỏ qua khi dùng `"__all__"`.
    """

    journal_fields: ClassVar[tuple[str, ...] | Literal["__all__"]] = "__all__"
    journal_masked_fields: ClassVar[tuple[str, ...]] = ()
    journal_excluded_fields: ClassVar[tuple[str, ...]] = ()

    class Meta:
        abstract = True

    # ==================================================================
    # Vòng đời model
    # ==================================================================
    def save(self, *args: Any, **kwargs: Any) -> None:
        """Lưu rồi phát event so với ảnh chụp."""
        adding = bool(self._state.adding)
        before: dict[str, Any] = getattr(self, SNAPSHOT_ATTR, None) or {}
        super().save(*args, **kwargs)
        self._journal_after_save(adding, before, kwargs.get("update_fields"))
        self.journal_snapshot()

    def delete(self, *args: Any, **kwargs: Any) -> Any:
        """Xóa cứng rồi phát event `DELETE`."""
        pk, label = self.pk, str(self)
        result = super().delete(*args, **kwargs)
        self._journal_emit("DELETE", str(pk), label, {}, get_user_id())
        return result

    @classmethod
    def from_db(
        cls, db: str | None, field_names: Collection[str], values: Collection[Any], **kwargs: Any
    ) -> Self:
        """Nạp bản ghi rồi chụp giá trị field theo dõi."""
        instance = super().from_db(db, field_names, values, **kwargs)
        instance.journal_snapshot()
        return instance

    # ==================================================================
    # Cấu hình
    # ==================================================================
    @classmethod
    def journal_resource(cls) -> str:
        """Mã tài nguyên `<app_label>.<model_name>` (dùng để lọc journal theo module.model)."""
        return f"{cls._meta.app_label}.{cls._meta.model_name}"

    @classmethod
    def journal_tracked_fields(cls) -> tuple["models.Field[Any, Any]", ...]:
        """Field cụ thể được theo dõi (cache theo lớp).

        Raises:
            ValueError: `journal_fields` khai field không tồn tại.
        """
        cached = _tracked_cache.get(cls)
        if cached is not None:
            return cached
        concrete = {field.name: field for field in cls._meta.concrete_fields}
        if cls.journal_fields == "__all__":
            excluded = SYSTEM_FIELDS | set(cls.journal_excluded_fields)
            fields = tuple(field for name, field in concrete.items() if name not in excluded)
        else:
            unknown = [name for name in cls.journal_fields if name not in concrete]
            if unknown:
                raise ValueError(f"{cls.__name__}.journal_fields có field không tồn tại: {unknown}")
            fields = tuple(concrete[name] for name in cls.journal_fields)
        _tracked_cache[cls] = fields
        return fields

    def journal_snapshot(self) -> None:
        """Chụp lại giá trị hiện tại (field chưa nạp do `only()`/`defer()` thì bỏ qua)."""
        deferred = self.get_deferred_fields()
        snapshot = {
            field.name: _normalize(field.value_from_object(self))
            for field in self.journal_tracked_fields()
            if field.attname not in deferred
        }
        if DELETED_FIELD not in deferred and hasattr(self, DELETED_FIELD):
            snapshot[DELETED_FIELD] = getattr(self, DELETED_FIELD) is not None
        setattr(self, SNAPSHOT_ATTR, snapshot)

    def journal_record_created(self) -> None:
        """Phát event `CREATE` cho bản ghi tạo bằng `bulk_create` (không đi qua `save()`)."""
        self._journal_after_save(True, {}, None)
        self.journal_snapshot()

    def journal_event(
        self,
        event: str,
        data: dict[str, Any] | None = None,
        actor_id: Any = None,
        *,
        changes: dict[str, tuple[Any, Any]] | None = None,
    ) -> None:
        """Ghi sự kiện không phải đổi field (gán vai trò, thu hồi phiên...).

        Args:
            event: Mã sự kiện, ví dụ `iam.role_assigned`.
            data: Dữ liệu kèm theo (lưu thành `{khóa: [None, giá trị]}`).
            actor_id: Người thực hiện; mặc định người dùng của request.
            changes: Thay đổi dạng `{khóa: (cũ, mới)}` (ví dụ danh sách quyền trước/sau khi lưu).
        """
        payload = {key: [None, _normalize(value)] for key, value in (data or {}).items()}
        payload |= {key: [_normalize(old), _normalize(new)] for key, (old, new) in (changes or {}).items()}
        self._journal_emit("EVENT", str(self.pk), str(self), payload, actor_id or get_user_id(), event)

    def mark_deleted(self, actor: Any) -> list[str]:
        """Giữ nhãn hiện tại trước khi `CoreModel.mark_deleted` thêm hậu tố cho field unique.

        Args:
            actor: Người thực hiện.

        Returns:
            Field unique đã đổi.
        """
        setattr(self, LABEL_ATTR, str(self))
        released: list[str] = super().mark_deleted(actor)  # type: ignore[misc]  # CoreModel đứng sau trong MRO
        return released

    # ==================================================================
    # Nội bộ
    # ==================================================================
    def _journal_after_save(self, adding: bool, before: dict[str, Any], update_fields: Any) -> None:
        """Tính thay đổi và phát event phù hợp."""
        allowed = set(update_fields) if update_fields else None
        masked = set(self.journal_masked_fields)
        changes: dict[str, list[Any]] = {}
        for field in self.journal_tracked_fields():
            if allowed is not None and field.name not in allowed and field.attname not in allowed:
                continue
            new = _normalize(field.value_from_object(self))
            old = None if adding else before.get(field.name)
            if not adding and field.name not in before:
                continue
            if old == new or (adding and new in (None, "")):
                continue
            changes[field.name] = [MASK, MASK] if field.name in masked else [old, new]

        was_deleted = bool(before.get(DELETED_FIELD))
        is_deleted = getattr(self, DELETED_FIELD, None) is not None
        if adding:
            action, actor_id = "CREATE", getattr(self, "created_by_id", None)
        elif is_deleted and not was_deleted:
            action, actor_id = "DELETE", getattr(self, "deleted_by_id", None)
        elif changes:
            action, actor_id = "UPDATE", getattr(self, "updated_by_id", None)
        else:
            return
        # Xóa mềm: nhãn lấy trước khi gắn hậu tố `_deleted_` (giữ tên người dùng nhìn thấy).
        label = getattr(self, LABEL_ATTR, None) or str(self)
        self.__dict__.pop(LABEL_ATTR, None)
        self._journal_emit(action, str(self.pk), label, changes, actor_id or get_user_id())

    def _journal_emit(
        self,
        action: str,
        object_id: str,
        label: str,
        changes: dict[str, list[Any]],
        actor_id: Any,
        event: str = "",
    ) -> None:
        """Gửi event cho recorder (không cấu hình recorder = bỏ qua)."""
        recorder = get_change_recorder()
        if recorder is None:
            return
        recorder.record(
            ChangeSet(
                action=action,
                resource=self.journal_resource(),
                object_id=object_id,
                object_label=label[:200],
                changes=changes,
                actor_id=actor_id,
                event=event,
            )
        )
