"""`uv run python manage.py sync_assistant_knowledge`: nạp tri thức Client Portal vào RAG, nhúng vector."""

from typing import Any

from django.core.management.base import BaseCommand

from app.workspace.services.assistant_knowledge_service import AssistantKnowledgeService


class Command(BaseCommand):
    """Đồng bộ file `knowledge/client_portal/*.md` + đoạn trường dữ liệu sinh từ model vào bảng tri thức."""

    help = "Đồng bộ tri thức Trợ lý AI (RAG), nhúng vector đoạn mới/đổi (bỏ qua nếu chưa có GEMINI_API_KEY)."

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Khởi tạo service tri thức."""
        super().__init__(*args, **kwargs)
        self.knowledge_service = AssistantKnowledgeService()

    def add_arguments(self, parser: Any) -> None:
        """`--no-embed`: chỉ nạp văn bản, không gọi Gemini."""
        parser.add_argument("--no-embed", action="store_true", help="Không gọi Gemini để nhúng vector.")

    def handle(self, *args: Any, **options: Any) -> None:
        """In số đoạn tạo/sửa/xóa/nhúng."""
        stats = self.knowledge_service.sync(embed=not options.get("no_embed"))
        self.stdout.write(
            self.style.SUCCESS(
                "Tri thức Trợ lý AI: "
                f"tạo {stats['created']}, cập nhật {stats['updated']}, xóa {stats['removed']}, "
                f"nhúng vector {stats['embedded']}."
            )
        )
