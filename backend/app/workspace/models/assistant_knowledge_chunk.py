"""Model đoạn tri thức (RAG) chức năng Client Portal cho Trợ lý AI, đồng bộ từ Markdown + metadata model."""

from django.db import models
from django.db.models import Q
from pgvector.django import HalfVectorField

from app.core.models.core_model import CoreModel
from app.workspace.constants.workspace_defaults import ASSISTANT_EMBEDDING_DIMENSIONS


class AssistantKnowledgeChunk(CoreModel):
    """Một đoạn tri thức (theo heading `##`) kèm vector Gemini để tìm theo nghĩa; dữ liệu hệ thống chung."""

    source = models.CharField(
        max_length=120,
        verbose_name="Nguồn",
        help_text="Tên file tri thức hoặc `model:<tool>` cho đoạn sinh từ metadata model.",
        db_comment="Nguồn đoạn tri thức",
    )
    heading = models.CharField(
        max_length=200,
        verbose_name="Tiêu đề đoạn",
        help_text="Heading của đoạn trong tài liệu.",
        db_comment="Tiêu đề đoạn tri thức",
    )
    content = models.TextField(
        verbose_name="Nội dung",
        help_text="Nội dung đoạn tri thức (đã kèm tiêu đề tài liệu làm ngữ cảnh).",
        db_comment="Nội dung đoạn tri thức",
    )
    content_hash = models.CharField(
        max_length=64,
        verbose_name="Mã băm nội dung",
        help_text="SHA-256 của tiêu đề + nội dung; đổi thì nhúng vector lại.",
        db_comment="SHA-256 nội dung đoạn",
    )
    embedding = HalfVectorField(
        dimensions=ASSISTANT_EMBEDDING_DIMENSIONS,
        null=True,
        blank=True,
        verbose_name="Vector nhúng",
        help_text="Vector 768 chiều (Gemini, đã chuẩn hóa L2); trống nếu chưa nhúng.",
        db_comment="Vector embedding halfvec(768)",
    )
    embedding_model = models.CharField(
        max_length=120,
        blank=True,
        default="",
        verbose_name="Model nhúng",
        help_text="Model đã tạo vector; khác model hiện hành thì coi như chưa nhúng.",
        db_comment="Tên model embedding",
    )

    class Meta:
        db_table = "workspace_assistant_knowledge_chunk"
        constraints = (
            models.UniqueConstraint(
                fields=("source", "heading"),
                condition=Q(deleted_at__isnull=True),
                name="uq_ws_knowledge_source_heading",
            ),
        )
        verbose_name = "Tri thức Trợ lý AI"
        verbose_name_plural = "Tri thức Trợ lý AI"

    def __str__(self) -> str:
        """Nguồn và tiêu đề đoạn."""
        return f"{self.source} — {self.heading}"
