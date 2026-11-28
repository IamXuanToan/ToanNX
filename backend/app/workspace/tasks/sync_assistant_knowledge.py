"""Task đồng bộ tri thức RAG Trợ lý AI mỗi ngày (khai trong `ModuleDescriptor.cleanup_tasks`)."""

from app.workspace.services.assistant_knowledge_service import AssistantKnowledgeService


def sync_assistant_knowledge() -> int:
    """Lớp vỏ task: chỉ đoạn mới/đổi mới gọi Gemini nhúng vector nên gần như 0 chi phí khi không đổi gì."""
    stats = AssistantKnowledgeService().sync(embed=True)
    return int(stats["created"] + stats["updated"] + stats["removed"] + stats["embedded"])
