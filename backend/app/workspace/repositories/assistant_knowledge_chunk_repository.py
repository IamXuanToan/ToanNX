"""Repository đoạn tri thức Trợ lý AI: đọc gọn cho tìm kiếm từ khóa, tìm gần nhất bằng pgvector."""

from typing import Any

from pgvector.django import CosineDistance

from app.core.repositories.core_repository import CoreRepository
from app.workspace.models.assistant_knowledge_chunk import AssistantKnowledgeChunk


class AssistantKnowledgeChunkRepository(CoreRepository[AssistantKnowledgeChunk]):
    """Chỉ repository chạm ORM; dữ liệu nhỏ (vài trăm đoạn) nên đọc toàn bộ cho xếp hạng từ khóa."""

    model = AssistantKnowledgeChunk

    def list_for_search(self) -> list[dict[str, Any]]:
        """Toàn bộ đoạn còn hiệu lực (không kèm vector) để xếp hạng từ khóa."""
        rows = self.get_queryset().order_by("source", "heading").values("id", "source", "heading", "content")
        return [dict(row) for row in rows]

    def list_index(self) -> dict[tuple[str, str], AssistantKnowledgeChunk]:
        """Map `(source, heading)` → bản ghi để đồng bộ theo mã băm."""
        return {(row.source, row.heading): row for row in self.get_queryset()}

    def list_missing_embedding(self, model_name: str, limit: int) -> list[AssistantKnowledgeChunk]:
        """Đoạn chưa có vector hoặc vector của model khác."""
        return list(
            self.get_queryset()
            .exclude(embedding__isnull=False, embedding_model=model_name)
            .order_by("source", "heading")[:limit]
        )

    def nearest(self, vector: list[float], model_name: str, limit: int) -> list[dict[str, Any]]:
        """Đoạn gần nhất theo cosine (chỉ so vector cùng model embedding)."""
        rows = (
            self.get_queryset()
            .filter(embedding__isnull=False, embedding_model=model_name)
            .annotate(distance=CosineDistance("embedding", vector))
            .order_by("distance")
            .values("id", "source", "heading", "content", "distance")[:limit]
        )
        return [dict(row) for row in rows]

    def set_embedding(self, chunk: AssistantKnowledgeChunk, vector: list[float], model_name: str) -> None:
        """Ghi vector cho một đoạn (không đổi audit người dùng)."""
        self.update_where({"embedding": vector, "embedding_model": model_name}, pk=chunk.pk)

    def remove_where_not_in(self, keys: set[tuple[str, str]]) -> int:
        """Xóa cứng đoạn không còn trong nguồn (dữ liệu hệ thống sinh lại được, không cần xóa mềm)."""
        stale = [row.pk for key, row in self.list_index().items() if key not in keys]
        if not stale:
            return 0
        return self.hard_delete_where(pk__in=stale)
