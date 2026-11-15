"""Nghiệp vụ thư mục logic, tách khỏi cách lưu file vật lý."""

from typing import Any

from django.db import transaction

from app.core.exceptions.authorization_error import AuthorizationError
from app.core.exceptions.conflict_error import ConflictError
from app.core.exceptions.validation_error import ValidationError
from app.core.services.core_crud_service import CoreCrudService
from app.modules.attachment.constants.attachment_error_code import AttachmentErrorCode
from app.modules.attachment.models.attachment_folder import AttachmentFolder
from app.modules.attachment.permissions.attachment_permission import AttachmentPermission
from app.modules.attachment.repositories.attachment_folder_repository import AttachmentFolderRepository
from app.modules.attachment.repositories.attachment_repository import AttachmentRepository


class AttachmentFolderService(CoreCrudService[AttachmentFolder, AttachmentFolderRepository]):
    """Thư mục riêng theo created_by; quyền mở rộng dùng chung với kho file."""

    repository_class = AttachmentFolderRepository
    owner_field = "created_by"
    manage_all_permission = AttachmentPermission.FILE_MANAGE_ALL.code

    def __init__(self) -> None:
        """Khởi tạo các repository trong cùng module, không phụ thuộc IAM/Account."""
        super().__init__()
        self.attachment_repository = AttachmentRepository()

    def _locked(self, actor: Any, pk: Any) -> AttachmentFolder:
        """Khóa cây của owner trước rồi khóa thư mục (thứ tự cố định, không deadlock)."""
        folder = self.get_by_id_for(actor, pk)
        self.repository.lock_tree(folder.created_by_id)
        return self.get_for_write(actor, pk)

    def get_for_file(self, actor: Any, pk: Any, owner_id: Any) -> AttachmentFolder:
        """Khóa nhóm trước file; chỉ gom file vào thư mục cùng người sở hữu."""
        if not actor.has_perm(AttachmentPermission.FOLDER_READ.code):
            raise AuthorizationError(details={"permissions": [AttachmentPermission.FOLDER_READ.code]})
        folder = self.get_by_id_for(actor, pk)
        if folder.created_by_id != owner_id:
            raise ValidationError(code=AttachmentErrorCode.ATTACHMENT_FOLDER_OWNER_MISMATCH)
        return self._locked(actor, pk)

    def _parent(self, actor: Any, pk: Any, owner_id: Any) -> AttachmentFolder | None:
        return self.get_for_file(actor, pk, owner_id) if pk else None

    def _validate_name(self, owner_id: Any, name: str, parent_id: Any, exclude_id: Any = None) -> None:
        if self.repository.name_exists(owner_id, name, parent_id, exclude_id):
            raise ConflictError(code=AttachmentErrorCode.ATTACHMENT_FOLDER_NAME_EXISTS)

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> AttachmentFolder:
        """Tạo thư mục gốc hoặc con trong cây của actor."""
        self.repository.lock_tree(actor.pk)
        parent = self._parent(actor, data.get("parent_id"), actor.pk)
        self._validate_name(actor.pk, data["name"], parent.pk if parent else None)
        return self.repository.create(
            actor=actor,
            name=data["name"],
            parent=parent,
            ancestor_ids=[*parent.ancestor_ids, parent.pk] if parent else [],
        )

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> AttachmentFolder:
        """Đổi tên/chuyển nhánh, cập nhật tổ tiên của hậu duệ và chặn chu trình."""
        folder = self._locked(actor, pk)
        parent = self._parent(actor, data.get("parent_id", folder.parent_id), folder.created_by_id)
        if parent and (parent.pk == folder.pk or folder.pk in parent.ancestor_ids):
            raise ValidationError(code=AttachmentErrorCode.ATTACHMENT_FOLDER_CYCLE)
        name = data.get("name", folder.name)
        self._validate_name(folder.created_by_id, name, parent.pk if parent else None, folder.pk)
        ancestors = [*parent.ancestor_ids, parent.pk] if parent else []
        if ancestors != folder.ancestor_ids:
            old_prefix_length = len(folder.ancestor_ids) + 1
            for child in self.repository.descendants(folder.pk):
                self.repository.update(
                    child,
                    actor=actor,
                    ancestor_ids=[*ancestors, folder.pk, *child.ancestor_ids[old_prefix_length:]],
                )
        self.repository.update(folder, actor=actor, name=name, parent=parent, ancestor_ids=ancestors)
        # Nạp lại annotation để PATCH không trả số file mặc định 0 khi thư mục đã có file.
        return self.repository.get_by_id(folder.pk)

    @transaction.atomic
    def delete_tree(self, actor: Any, pk: Any, delete_files: bool = False) -> int:
        """Xóa mềm cả nhánh; giữ file hoặc xóa mềm file với quyền riêng."""
        if delete_files and not actor.has_perm(AttachmentPermission.FILE_DELETE.code):
            raise AuthorizationError(details={"permissions": [AttachmentPermission.FILE_DELETE.code]})
        folder = self._locked(actor, pk)
        folders = [folder, *self.repository.descendants(folder.pk)]
        ids = [item.pk for item in folders]
        # Khóa cây ngăn upload/chuyển file hoặc thêm con trong lúc xóa nhánh.
        if delete_files:
            self.attachment_repository.delete_where(actor=actor, folder_id__in=ids)
        else:
            self.attachment_repository.update_where(
                {"folder": None}, actor=actor, folder_id__in=ids, deleted_at__isnull=True
            )
        for item in folders:
            self.repository.delete(item, actor=actor)
        return len(folders)

    def delete(self, actor: Any, pk: Any) -> None:
        """DELETE mặc định giữ file; lựa chọn xóa file qua endpoint có body."""
        self.delete_tree(actor, pk)
