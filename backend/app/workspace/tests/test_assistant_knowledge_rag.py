"""RAG tri thức Client Portal: đồng bộ nguồn, tìm lai từ khóa/vector, chèn prompt, không lộ field bí mật."""

import math
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from app.workspace.constants.workspace_defaults import (
    ASSISTANT_EMBEDDING_DIMENSIONS,
    ASSISTANT_KNOWLEDGE_TOP_K,
)
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.models.assistant_knowledge_chunk import AssistantKnowledgeChunk
from app.workspace.services.assistant_knowledge_service import KNOWLEDGE_DIR, AssistantKnowledgeService
from app.workspace.services.assistant_service import AssistantService

pytestmark = pytest.mark.django_db


def _unit_vector(index: int) -> list[float]:
    vector = [0.0] * ASSISTANT_EMBEDDING_DIMENSIONS
    vector[index] = 1.0
    return vector


class FakeEmbeddingClient:
    """Embedding giả: mỗi nguồn tài liệu một trục, câu hỏi chứa từ khóa trục nào thì vector trỏ trục đó."""

    model_name = "fake-embedding"

    def __init__(self, axes: dict[str, int]) -> None:
        self.axes = axes
        self.query_calls = 0

    def is_configured(self) -> bool:
        return True

    def embed_documents(self, texts: list[str]) -> list[list[float] | None]:
        result: list[list[float] | None] = []
        for text in texts:
            axis = next((idx for word, idx in self.axes.items() if word in text.lower()), 0)
            result.append(_unit_vector(axis))
        return result

    def embed_query(self, text: str) -> list[float] | None:
        self.query_calls += 1
        axis = next((idx for word, idx in self.axes.items() if word in text.lower()), None)
        return _unit_vector(axis) if axis is not None else None


class TestKnowledgeSync:
    def test_sync_loads_every_markdown_file_and_model_chunks_idempotently(self) -> None:
        # DB test đã được nạp tri thức qua post_migrate; xóa để đo lần nạp đầu.
        AssistantKnowledgeChunk.objects.all().delete()
        service = AssistantKnowledgeService()
        first = service.sync(embed=False)
        sources = set(AssistantKnowledgeChunk.objects.values_list("source", flat=True))
        assert {path.name for path in KNOWLEDGE_DIR.glob("*.md")} <= sources
        assert any(source.startswith("model:") for source in sources)
        assert any(source.startswith("resource:") for source in sources)
        assert first["created"] == AssistantKnowledgeChunk.objects.count()
        assert service.sync(embed=False) == {"created": 0, "updated": 0, "removed": 0, "embedded": 0}

    def test_changed_and_removed_sources_are_resynced(self) -> None:
        service = AssistantKnowledgeService()
        service.sync(embed=False)
        chunk = AssistantKnowledgeChunk.objects.filter(source="nhac-viec.md").first()
        assert chunk is not None
        AssistantKnowledgeChunk.objects.filter(pk=chunk.pk).update(content_hash="old")
        AssistantKnowledgeChunk.objects.create(
            source="da-xoa.md", heading="Cũ", content="x", content_hash="x"
        )
        stats = service.sync(embed=False)
        assert stats["updated"] == 1
        assert stats["removed"] == 1
        assert not AssistantKnowledgeChunk.objects.filter(source="da-xoa.md").exists()

    def test_model_chunks_describe_choices_and_never_secret_fields(self) -> None:
        chunks = {item["heading"]: item["content"] for item in AssistantKnowledgeService().load_sources()}
        reminder = next(
            content for heading, content in chunks.items() if "Nhắc việc" in heading and "Trường" in heading
        )
        assert "Hàng tuần" in reminder
        assert "tự hỏi" in reminder
        everything = "\n".join(chunks.values())
        for secret_field in ("secret_encrypted", "password_hash", "Mã băm mật khẩu", "Mã bí mật mã hóa"):
            assert secret_field not in everything
        assert not any(heading.removeprefix("Trường dữ liệu ") == "Người dùng" for heading in chunks)


class TestKnowledgeSearch:
    @pytest.mark.parametrize(
        ("query", "expected_source"),
        [
            ("tạo link rút gọn có mật khẩu", "link-rut-gon.md"),
            ("nhắc tôi họp lúc 11h nhắc trước", "nhac-viec.md"),
            ("thêm dịch vụ netflix gia hạn hàng tháng", "dich-vu-dinh-ky.md"),
            ("lưu mật khẩu gmail vào két sắt", "ket-sat.md"),
            ("tôi kiếm được bao nhiêu tuần này", "tai-chinh-thu-nhap.md"),
            ("tạo phiếu bảo hành laptop", "thiet-bi-bao-hanh.md"),
            ("tạo mã QR chuyển khoản", "ma-qr-trang-ca-nhan.md"),
            ("liệt kê tài khoản người dùng hệ thống", "00-pham-vi-tro-ly.md"),
            ("lệnh nhanh telegram", "lenh-nhanh-telegram.md"),
            ("đổi tên cái vừa tạo", "thao-tac-chung.md"),
            ("dời nhắc việc sang 3h chiều mai", "nhac-viec.md"),
            ("link xem lại bản ghi vừa tạo ở đâu", "thao-tac-chung.md"),
            ("đổi slug link vừa tạo", "link-rut-gon.md"),
        ],
    )
    def test_lexical_search_finds_the_right_feature(self, query: str, expected_source: str) -> None:
        AssistantKnowledgeService().sync(embed=False)
        results = AssistantKnowledgeService().search(query, use_vector=False)
        assert results, query
        # Tài liệu chức năng phải nằm trong các đoạn được chèn vào prompt (top-K).
        sources = [row["source"] for row in results[:ASSISTANT_KNOWLEDGE_TOP_K]]
        assert expected_source in sources, sources

    def test_empty_table_self_seeds_on_first_search(self) -> None:
        AssistantKnowledgeChunk.objects.all().delete()
        results = AssistantKnowledgeService().search("tạo link rút gọn", use_vector=False)
        assert results and results[0]["source"] == "link-rut-gon.md"

    def test_vector_path_uses_pgvector_and_merges_with_lexical(self) -> None:
        fake = FakeEmbeddingClient({"két sắt": 5, "ket sat": 5, "bí mật": 5})
        service = AssistantKnowledgeService(embedding_client=fake)  # type: ignore[arg-type]
        stats = service.sync(embed=True)
        assert stats["embedded"] == AssistantKnowledgeChunk.objects.count()
        assert not AssistantKnowledgeChunk.objects.filter(embedding__isnull=True).exists()
        # Câu không trùng từ khóa với tài liệu nhưng vector trỏ đúng trục "két sắt".
        results = service.search("chỗ cất bí mật riêng tư")
        assert fake.query_calls == 1
        assert results[0]["source"] in {"ket-sat.md", "model:workspace.vaultitem"}

    def test_vector_of_other_embedding_model_is_ignored(self) -> None:
        fake = FakeEmbeddingClient({"két sắt": 5})
        service = AssistantKnowledgeService(embedding_client=fake)  # type: ignore[arg-type]
        service.sync(embed=True)
        AssistantKnowledgeChunk.objects.update(embedding_model="old-model")
        with patch.object(service.repository, "nearest", wraps=service.repository.nearest) as nearest:
            service.search("két sắt")
        assert nearest.call_args.args[1] == "fake-embedding"
        assert service.repository.nearest(_unit_vector(5), "fake-embedding", 3) == []

    def test_embedding_failure_falls_back_to_lexical(self) -> None:
        fake = FakeEmbeddingClient({})
        service = AssistantKnowledgeService(embedding_client=fake)  # type: ignore[arg-type]
        service.sync(embed=False)
        results = service.search("tạo link rút gọn")
        assert results[0]["source"] == "link-rut-gon.md"


class TestKnowledgeInPrompt:
    def test_chat_prompt_contains_relevant_guide_block(self, superuser: Any) -> None:
        AssistantKnowledgeService().sync(embed=False)
        svc = AssistantService()
        captured: list[Any] = []

        def fake_completion(messages: Any, **kwargs: Any) -> dict[str, Any]:
            captured.append(messages)
            return {
                "ok": True,
                "model": "m",
                "tokens": 3,
                "fallback_attempts": 0,
                "message": {"content": "Ok"},
            }

        with (
            patch.object(svc.xkiro_client, "is_configured", return_value=True),
            patch.object(svc.xkiro_client, "chat_completion", side_effect=fake_completion),
        ):
            svc.chat(
                superuser, "link rút gọn đặt mật khẩu được không?", channel=AssistantConversation.Channel.WEB
            )
        system_prompt = captured[0][0]["content"]
        assert "TÀI LIỆU HƯỚNG DẪN CHỨC NĂNG CLIENT PORTAL" in system_prompt
        assert "Link rút gọn" in system_prompt

    def test_group_chat_does_not_send_question_to_embedding_provider(self) -> None:
        fake = FakeEmbeddingClient({"link": 1})
        service = AssistantKnowledgeService(embedding_client=fake)  # type: ignore[arg-type]
        service.sync(embed=False)
        service.prompt_block("link rút gọn", use_vector=False)
        assert fake.query_calls == 0


class TestGeminiEmbeddingClient:
    def _client(self, settings: Any, response: MagicMock) -> Any:
        from app.workspace.services.assistant_embedding_client import AssistantEmbeddingClient

        settings.GEMINI_API_KEY = "test-key"  # noqa: S105 - giá trị test
        settings.GEMINI_EMBEDDING_MODEL = "gemini-embedding-001"
        session = MagicMock()
        session.post.return_value = response
        return AssistantEmbeddingClient(session=session), session

    def test_query_request_shape_header_key_and_l2_normalization(self, settings: Any) -> None:
        response = MagicMock(status_code=200)
        response.json.return_value = {
            "embedding": {"values": [3.0, 4.0] + [0.0] * (ASSISTANT_EMBEDDING_DIMENSIONS - 2)}
        }
        client, session = self._client(settings, response)
        vector = client.embed_query("tạo link")
        assert vector is not None and math.isclose(vector[0], 0.6) and math.isclose(vector[1], 0.8)
        url = session.post.call_args.args[0]
        kwargs = session.post.call_args.kwargs
        assert url.endswith("models/gemini-embedding-001:embedContent")
        assert "test-key" not in url
        assert kwargs["headers"]["x-goog-api-key"] == "test-key"
        assert kwargs["json"]["taskType"] == "RETRIEVAL_QUERY"
        assert kwargs["json"]["outputDimensionality"] == ASSISTANT_EMBEDDING_DIMENSIONS
        assert kwargs["timeout"] <= 2.0

    def test_wrong_dimensions_and_errors_return_none(self, settings: Any) -> None:
        response = MagicMock(status_code=200)
        response.json.return_value = {"embedding": {"values": [1.0, 2.0]}}
        client, _ = self._client(settings, response)
        assert client.embed_query("x") is None
        response.status_code = 500
        assert client.embed_query("x") is None

    def test_rate_limit_sets_cooldown_and_skips_next_calls(self, settings: Any, fake_redis: Any) -> None:
        response = MagicMock(status_code=429)
        client, session = self._client(settings, response)
        assert client.embed_query("x") is None
        assert client.embed_query("y") is None
        assert session.post.call_count == 1

    def test_batch_uses_document_task_type(self, settings: Any) -> None:
        response = MagicMock(status_code=200)
        values = [1.0] + [0.0] * (ASSISTANT_EMBEDDING_DIMENSIONS - 1)
        response.json.return_value = {"embeddings": [{"values": values}, {"values": [1.0]}]}
        client, session = self._client(settings, response)
        vectors = client.embed_documents(["a", "b"])
        assert vectors is not None and vectors[0] is not None and vectors[1] is None
        body = session.post.call_args.kwargs["json"]
        assert session.post.call_args.args[0].endswith(":batchEmbedContents")
        assert {item["taskType"] for item in body["requests"]} == {"RETRIEVAL_DOCUMENT"}

    def test_not_configured_never_calls_network(self, settings: Any) -> None:
        from app.workspace.services.assistant_embedding_client import AssistantEmbeddingClient

        settings.GEMINI_API_KEY = ""
        session = MagicMock()
        client = AssistantEmbeddingClient(session=session)
        assert client.embed_query("x") is None
        assert client.embed_documents(["x"]) is None
        session.post.assert_not_called()
