"""Nghiệp vụ block của trang tùy chỉnh."""

from typing import Any

from django.conf import settings
from django.db import transaction
from django.db.models import QuerySet
from django.utils import timezone

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.exceptions.validation_error import ValidationError
from app.core.services.core_crud_service import CoreCrudService
from app.modules.attachment.services.attachment_service import AttachmentService
from app.modules.authentication.services.rate_limit_service import RateLimitService
from app.modules.custom_pages.models.page import Page
from app.modules.custom_pages.models.page_block import PageBlock
from app.modules.custom_pages.repositories.page_block_repository import PageBlockRepository
from app.modules.custom_pages.repositories.page_repository import PageRepository
from app.modules.custom_pages.services.page_service import PageService
from app.modules.custom_pages.validators.page_content import validate_block_content


class PageBlockService(CoreCrudService[PageBlock, PageBlockRepository]):
    """Quản lý block, khóa page để chống trùng thứ tự khi ghi đồng thời."""

    repository_class = PageBlockRepository
    max_blocks = 50

    def get_queryset(self) -> QuerySet[PageBlock]:
        """Từ chối đọc block khi chưa xác định trang và chủ sở hữu."""
        raise BusinessRuleError("Cần truy cập block qua trang sở hữu.")

    def get_by_id(self, pk: Any) -> PageBlock:
        """Từ chối đọc block theo id mà không kiểm tra trang."""
        raise BusinessRuleError("Cần truy cập block qua trang sở hữu.")

    def create(self, actor: Any, data: dict[str, Any]) -> PageBlock:
        """Buộc dùng add_block để kiểm tra trang và giới hạn block."""
        raise BusinessRuleError("Cần thêm block qua trang sở hữu.")

    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> PageBlock:
        """Buộc dùng update_block để kiểm tra trang trước khi sửa."""
        raise BusinessRuleError("Cần sửa block qua trang sở hữu.")

    def delete(self, actor: Any, pk: Any) -> None:
        """Buộc dùng delete_block để kiểm tra trang và dồn thứ tự."""
        raise BusinessRuleError("Cần xóa block qua trang sở hữu.")

    def __init__(
        self,
        repository: PageBlockRepository | None = None,
        page_repository: PageRepository | None = None,
        page_service: PageService | None = None,
        attachment_service: AttachmentService | None = None,
        rate_limit_service: RateLimitService | None = None,
    ) -> None:
        """Khởi tạo các phụ thuộc trong module và service ảnh."""
        super().__init__(repository)
        self.page_repository = page_repository or PageRepository()
        self.page_service = page_service or PageService()
        self.attachment_service = attachment_service or AttachmentService()
        self.rate_limit_service = rate_limit_service or RateLimitService()

    def _locked_page(self, actor: Any, page_id: Any) -> Page:
        """Kiểm tra quyền trên page rồi khóa dòng page cho thao tác block."""
        self.page_service.get_by_id_for(actor, page_id)
        page = self.page_repository.get_for_update(page_id)
        if page.deleted_at is not None:
            raise NotFoundError()
        return page

    def _validate_content(self, page: Page, block_type: str, content: Any) -> dict[str, Any]:
        """Kiểm tra payload và ảnh thuộc chủ trang."""
        result = validate_block_content(block_type, content)
        if block_type == PageBlock.Type.IMAGE:
            attachment = self.attachment_service.get_image(result["attachment_id"])
            if attachment.created_by_id != page.owner_id:
                raise NotFoundError()
        return result

    @transaction.atomic
    def add_block(self, actor: Any, page_id: Any, data: dict[str, Any]) -> PageBlock:
        """Thêm block vào cuối trang, tối đa 50 block."""
        page = self._locked_page(actor, page_id)
        position = self.repository.count(page_id=page.pk)
        if position >= self.max_blocks:
            raise ValidationError(details={"blocks": ["Một trang có tối đa 50 block."]})
        fields = dict(data)
        fields["content"] = self._validate_content(page, fields["block_type"], fields["content"])
        self.rate_limit_service.hit(
            f"custom-page-block-create:{actor.pk}", settings.CUSTOM_PAGE_BLOCK_CREATE_RATE_LIMIT, 3600
        )
        return self.repository.create(actor=actor, page=page, position=position, **fields)

    @transaction.atomic
    def update_block(self, actor: Any, page_id: Any, block_id: Any, data: dict[str, Any]) -> PageBlock:
        """Sửa block sau khi khóa page và xác minh block thuộc page."""
        page = self._locked_page(actor, page_id)
        block = self.repository.get_for_update(block_id)
        if block.deleted_at is not None or block.page_id != page.pk:
            raise NotFoundError()
        fields = dict(data)
        if "content" in fields or "block_type" in fields:
            fields["content"] = self._validate_content(
                page, fields.get("block_type", block.block_type), fields.get("content", block.content)
            )
        return self.repository.update(block, actor=actor, **fields)

    @transaction.atomic
    def delete_block(self, actor: Any, page_id: Any, block_id: Any) -> None:
        """Xóa mềm block rồi dồn thứ tự các block còn lại."""
        page = self._locked_page(actor, page_id)
        block = self.repository.get_for_update(block_id)
        if block.deleted_at is not None or block.page_id != page.pk:
            raise NotFoundError()
        self.repository.soft_delete(block, actor=actor)
        ids = [item.pk for item in self.repository.filter(page_id=page.pk).order_by("position")]
        self._resequence(actor, ids)

    @transaction.atomic
    def reorder(self, actor: Any, page_id: Any, block_ids: list[Any]) -> list[PageBlock]:
        """Thay toàn bộ thứ tự trong một transaction, không cho block trang khác lọt vào."""
        page = self._locked_page(actor, page_id)
        current = list(self.repository.filter(page_id=page.pk).order_by("position"))
        current_ids = {item.pk for item in current}
        if (
            len(block_ids) != len(current)
            or len(set(block_ids)) != len(current)
            or set(block_ids) != current_ids
        ):
            raise ValidationError(details={"block_ids": ["Cần đúng toàn bộ block hiện có của trang."]})
        self._resequence(actor, block_ids)
        return list(self.repository.filter(page_id=page.pk).order_by("position"))

    def _resequence(self, actor: Any, block_ids: list[Any]) -> None:
        """Đưa vị trí sang vùng tạm rồi gán lại để unique index không va chạm."""
        now = timezone.now()
        for index, block_id in enumerate(block_ids):
            self.repository.update_where(
                {"position": 1000 + index, "updated_at": now}, actor=actor, pk=block_id
            )
        for index, block_id in enumerate(block_ids):
            self.repository.update_where({"position": index, "updated_at": now}, actor=actor, pk=block_id)
