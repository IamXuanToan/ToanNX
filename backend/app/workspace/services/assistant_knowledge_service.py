"""RAG tri thức Client Portal cho Trợ lý AI: nguồn Markdown + metadata model, tìm lai BM25 + pgvector.

- Nguồn: `app/workspace/knowledge/client_portal/*.md` (mỗi heading `##` là một đoạn) và đoạn "trường dữ
  liệu" sinh từ metadata model của từng tool (không lệch khi model đổi).
- Đồng bộ (`sync`): upsert theo mã băm, xóa đoạn không còn nguồn, nhúng vector Gemini cho đoạn mới/đổi.
- Tìm (`search`): xếp hạng từ khóa không dấu luôn chạy; có Gemini thì thêm tìm theo nghĩa và trộn bằng RRF.
  Bảng trống (vừa deploy) thì tự đồng bộ không nhúng để vẫn trả lời được ngay.
"""

import hashlib
import logging
import math
import time
from pathlib import Path
from typing import Any

from django.db import DatabaseError, connections, models

from app.core.utils.text import to_ascii
from app.workspace.constants.assistant_record_resources import ASSISTANT_RECORD_RESOURCES
from app.workspace.constants.assistant_tool_models import ASSISTANT_TOOL_MODELS
from app.workspace.constants.assistant_tool_permissions import DELETE_RESOURCE_PERMISSION_MAP
from app.workspace.constants.workspace_defaults import (
    ASSISTANT_EMBEDDING_BATCH_SIZE,
    ASSISTANT_KNOWLEDGE_CACHE_TTL_SECONDS,
    ASSISTANT_KNOWLEDGE_PROMPT_MAX_CHARS,
    ASSISTANT_KNOWLEDGE_RRF_K,
    ASSISTANT_KNOWLEDGE_TOP_K,
)
from app.workspace.repositories.assistant_knowledge_chunk_repository import AssistantKnowledgeChunkRepository
from app.workspace.services.assistant_embedding_client import AssistantEmbeddingClient
from app.workspace.services.assistant_tool_spec_builder import AssistantToolSpecBuilder

KNOWLEDGE_DIR = Path(__file__).resolve().parent.parent / "knowledge" / "client_portal"
# pytest-django tạo DB tên `test_<tên>`: không gọi Gemini khi tạo DB test.
TEST_DATABASE_PREFIX = "test_"
logger = logging.getLogger(__name__)
MODEL_SOURCE_PREFIX = "model:"
RESOURCE_SOURCE_PREFIX = "resource:"
_STOPWORDS = frozenset(
    {
        "toi",
        "cho",
        "la",
        "va",
        "co",
        "cua",
        "mot",
        "nhe",
        "giup",
        "ban",
        "hay",
        "duoc",
        "khong",
        "the",
        "nao",
        "gi",
        "voi",
        "nay",
        "do",
        "di",
        "a",
        "oi",
        "minh",
        "em",
        "anh",
        "chi",
        "de",
        "thi",
        "o",
        "khi",
        "nhu",
    }
)
# Field kỹ thuật/bí mật không đưa vào tri thức (không giúp người dùng, có thể lộ cấu trúc nhạy cảm).
_HIDDEN_FIELDS = frozenset(
    {
        "id",
        "owner",
        "created_at",
        "updated_at",
        "deleted_at",
        "created_by",
        "updated_by",
        "deleted_by",
        "password",
        "password_hash",
        "secret_ciphertext",
        "secret_encrypted",
        "encrypted_secret",
        "secret_last4",
        "last_login",
        "is_superuser",
        "is_staff",
        "groups",
        "user_permissions",
        "last_revealed_at",
        "last_revealed_by",
    }
)
# Tool không sinh đoạn trường dữ liệu (model hệ thống như User: chỉ mô tả bằng tài liệu Markdown hồ sơ).
_MODEL_CHUNK_EXCLUDED_TOOLS = frozenset({"update_my_profile"})
# Cache đoạn đã chuẩn hóa theo process (dữ liệu hệ thống ít đổi; đồng bộ xong thì xóa cache).
_CHUNK_CACHE: dict[str, Any] = {"at": 0.0, "rows": None}


class AssistantKnowledgeService:
    """Đồng bộ và truy hồi tri thức chức năng Client Portal (dữ liệu chung, không chứa dữ liệu người dùng)."""

    def __init__(
        self,
        repository: AssistantKnowledgeChunkRepository | None = None,
        embedding_client: AssistantEmbeddingClient | None = None,
        spec_builder: AssistantToolSpecBuilder | None = None,
    ) -> None:
        """Khởi tạo repository, client embedding và bộ đọc metadata model."""
        self.repository = repository or AssistantKnowledgeChunkRepository()
        self.embedding_client = embedding_client or AssistantEmbeddingClient()
        self.spec_builder = spec_builder or AssistantToolSpecBuilder()

    # ------------------------------------------------------------------ Nguồn
    def load_sources(self) -> list[dict[str, str]]:
        """Toàn bộ đoạn từ file Markdown + đoạn trường dữ liệu sinh từ model."""
        return [*self._markdown_chunks(), *self._model_chunks(), *self._resource_chunks()]

    def sync(self, *, embed: bool = True) -> dict[str, int]:
        """Upsert đoạn theo mã băm, xóa đoạn thừa, nhúng vector đoạn thiếu (nếu bật và có Gemini)."""
        sources = self.load_sources()
        index = self.repository.list_index()
        created = updated = 0
        for item in sources:
            content_hash = self._hash(item)
            existing = index.get((item["source"], item["heading"]))
            if existing is None:
                self.repository.create(content_hash=content_hash, **item)
                created += 1
            elif existing.content_hash != content_hash:
                self.repository.update(
                    existing,
                    content=item["content"],
                    content_hash=content_hash,
                    embedding=None,
                    embedding_model="",
                )
                updated += 1
        removed = self.repository.remove_where_not_in({(item["source"], item["heading"]) for item in sources})
        embedded = self.embed_missing() if embed else 0
        _CHUNK_CACHE.update({"at": 0.0, "rows": None})
        return {"created": created, "updated": updated, "removed": removed, "embedded": embedded}

    def sync_after_migrate(self, *, using: str) -> dict[str, int] | None:
        """Đồng bộ sau `migrate`: luôn nạp văn bản; chỉ nhúng vector Gemini khi không phải DB test.

        Lỗi (VD bảng chưa có khi migrate dở một app) chỉ ghi cảnh báo, không làm hỏng lệnh `migrate`.
        """
        database_name = str(connections[using].settings_dict.get("NAME") or "")
        embed = self.embedding_client.is_configured() and not database_name.startswith(TEST_DATABASE_PREFIX)
        try:
            return self.sync(embed=embed)
        except DatabaseError as exc:
            logger.warning("Bỏ qua đồng bộ tri thức Trợ lý sau migrate: %s", type(exc).__name__)
            return None

    def embed_missing(self, *, limit: int = ASSISTANT_EMBEDDING_BATCH_SIZE * 3) -> int:
        """Nhúng vector cho đoạn chưa có/lệch model, gom theo lô ≤ 100; dừng khi Gemini lỗi."""
        if not self.embedding_client.is_configured():
            return 0
        pending = self.repository.list_missing_embedding(self.embedding_client.model_name, limit)
        done = 0
        for start in range(0, len(pending), ASSISTANT_EMBEDDING_BATCH_SIZE):
            batch = pending[start : start + ASSISTANT_EMBEDDING_BATCH_SIZE]
            vectors = self.embedding_client.embed_documents([chunk.content for chunk in batch])
            if vectors is None:
                break
            for chunk, vector in zip(batch, vectors, strict=False):
                if vector is not None:
                    self.repository.set_embedding(chunk, vector, self.embedding_client.model_name)
                    done += 1
        return done

    # ------------------------------------------------------------------ Truy hồi
    def search(
        self, query: str, *, limit: int = ASSISTANT_KNOWLEDGE_TOP_K, use_vector: bool = True
    ) -> list[dict]:
        """Đoạn liên quan nhất: xếp hạng từ khóa + (nếu có) theo nghĩa, trộn Reciprocal Rank Fusion."""
        rows = self._cached_rows()
        if not rows or not query.strip():
            return []
        lexical = self._lexical_rank(query, rows)
        rankings = [lexical]
        if use_vector:
            vector = self.embedding_client.embed_query(query)
            if vector is not None:
                nearest = self.repository.nearest(vector, self.embedding_client.model_name, limit * 3)
                rankings.append([row["id"] for row in nearest])
        scores: dict[Any, float] = {}
        for ranking in rankings:
            for position, chunk_id in enumerate(ranking):
                scores[chunk_id] = scores.get(chunk_id, 0.0) + 1.0 / (
                    ASSISTANT_KNOWLEDGE_RRF_K + position + 1
                )
        by_id = {row["id"]: row for row in rows}
        ordered = sorted(scores, key=lambda key: scores[key], reverse=True)
        return [by_id[key] for key in ordered if key in by_id][:limit]

    def prompt_block(self, query: str, *, use_vector: bool = True) -> str:
        """Khối "Tài liệu hướng dẫn" chèn vào system prompt (giới hạn ký tự để không vỡ ngân sách token)."""
        chunks = self.search(query, use_vector=use_vector)
        if not chunks:
            return ""
        parts: list[str] = []
        used = 0
        for chunk in chunks:
            text = f"[{chunk['heading']}]\n{chunk['content']}".strip()
            if used + len(text) > ASSISTANT_KNOWLEDGE_PROMPT_MAX_CHARS:
                text = text[: max(0, ASSISTANT_KNOWLEDGE_PROMPT_MAX_CHARS - used)]
            if text:
                parts.append(text)
                used += len(text)
            if used >= ASSISTANT_KNOWLEDGE_PROMPT_MAX_CHARS:
                break
        return (
            "TÀI LIỆU HƯỚNG DẪN CHỨC NĂNG CLIENT PORTAL (tri thức hệ thống, để trả lời đúng cách thao tác; "
            "không phải dữ liệu của người dùng):\n" + "\n\n".join(parts)
        )

    # ------------------------------------------------------------------ Nội bộ
    def _cached_rows(self) -> list[dict[str, Any]]:
        now = time.monotonic()
        rows = _CHUNK_CACHE.get("rows")
        if rows is not None and now - float(_CHUNK_CACHE["at"]) < ASSISTANT_KNOWLEDGE_CACHE_TTL_SECONDS:
            return list(rows)
        rows = self.repository.list_for_search()
        if not rows:
            # Vừa deploy chưa chạy đồng bộ: nạp nguồn ngay (không gọi Gemini trong request chat).
            self.sync(embed=False)
            rows = self.repository.list_for_search()
        for row in rows:
            row["tokens"] = self._tokens(row["content"])
            row["heading_tokens"] = self._tokens(row["heading"])
        _CHUNK_CACHE.update({"at": now, "rows": rows})
        return list(rows)

    def _lexical_rank(self, query: str, rows: list[dict[str, Any]]) -> list[Any]:
        query_tokens = [token for token in self._tokens(query) if token not in _STOPWORDS]
        if not query_tokens:
            return []
        total = len(rows)
        document_frequency = {
            token: sum(1 for row in rows if token in row["tokens"] or token in row["heading_tokens"])
            for token in set(query_tokens)
        }
        query_bigrams = set(zip(query_tokens, query_tokens[1:], strict=False))
        scored: list[tuple[float, Any]] = []
        for row in rows:
            score = 0.0
            for token in set(query_tokens):
                df = document_frequency[token]
                if not df:
                    continue
                idf = math.log(1 + total / df)
                if token in row["tokens"]:
                    score += idf
                if token in row["heading_tokens"]:
                    score += idf
            content_tokens = row.get("content_list")
            if content_tokens is None:
                content_tokens = self._token_list(row["content"])
                row["content_list"] = content_tokens
            bigrams = set(zip(content_tokens, content_tokens[1:], strict=False))
            score += 0.5 * len(query_bigrams & bigrams)
            if score > 0:
                scored.append((score, row["id"]))
        scored.sort(key=lambda item: item[0], reverse=True)
        return [chunk_id for _, chunk_id in scored]

    def _tokens(self, text: str) -> set[str]:
        return set(self._token_list(text))

    def _token_list(self, text: str) -> list[str]:
        lowered = to_ascii(text or "").lower()
        cleaned = "".join(char if char.isalnum() else " " for char in lowered)
        return [token for token in cleaned.split() if len(token) > 1 or token.isdigit()]

    def _hash(self, item: dict[str, str]) -> str:
        return hashlib.sha256(f"{item['heading']}\n{item['content']}".encode()).hexdigest()

    def _markdown_chunks(self) -> list[dict[str, str]]:
        chunks: list[dict[str, str]] = []
        for path in sorted(KNOWLEDGE_DIR.glob("*.md")):
            chunks.extend(self._split_markdown(path.name, path.read_text(encoding="utf-8")))
        return chunks

    def _split_markdown(self, source: str, text: str) -> list[dict[str, str]]:
        """Tách tài liệu theo heading `##`; mỗi đoạn kèm tiêu đề `#` của tài liệu làm ngữ cảnh."""
        title = ""
        sections: list[tuple[str, list[str]]] = []
        for raw in text.splitlines():
            if raw.startswith("# "):
                title = raw[2:].strip()
            elif raw.startswith("## "):
                sections.append((raw[3:].strip(), []))
            elif sections:
                sections[-1][1].append(raw)
        result: list[dict[str, str]] = []
        for heading, lines in sections:
            body = "\n".join(lines).strip()
            if heading and body:
                result.append(
                    {"source": source, "heading": heading[:200], "content": f"{title}\n{body}".strip()}
                )
        return result

    def _resource_chunks(self) -> list[dict[str, str]]:
        """Một đoạn cho mỗi tài nguyên của tool chung (`ASSISTANT_RECORD_RESOURCES`): xem/sửa/xóa được gì."""
        chunks: list[dict[str, str]] = []
        for key, resource in ASSISTANT_RECORD_RESOURCES.items():
            model = resource.model
            fields = {
                field.name: field for field in model._meta.get_fields() if isinstance(field, models.Field)
            }
            verbose = str(model._meta.verbose_name)
            title = resource.label.capitalize()
            if verbose.lower() != resource.label.lower():
                title += f" ({verbose})"
            lines = [f'{title} — `resource="{key}"`.']
            lines.append(f'- Xem/tìm: `list_my_records(resource="{key}", query=...)`.')
            if resource.update_serializer is not None:
                editable = []
                for name in resource.update_serializer().fields:
                    field = fields.get(name.removesuffix("_id"))
                    editable.append(f"{name} ({field.verbose_name})" if field is not None else name)
                lines.append(
                    f'- Sửa: `update_my_record(resource="{key}", record_id=..., fields={{...}})`; '
                    f"trường sửa được: {', '.join(editable)}."
                )
            else:
                lines.append("- Không sửa qua chat.")
            if key in DELETE_RESOURCE_PERMISSION_MAP:
                lines.append(f'- Xóa: `delete_personal_record(resource_type="{key}")`, xác nhận 2 bước.')
            if resource.detail_path:
                lines.append(f"- Trang Portal: `{resource.detail_path}`.")
            if resource.note:
                lines.append(f"- Lưu ý: {resource.note}")
            chunks.append(
                {
                    "source": f"{RESOURCE_SOURCE_PREFIX}{key}"[:120],
                    "heading": f"Thao tác {resource.label}"[:200],
                    "content": "\n".join(lines),
                }
            )
        return chunks

    def _model_chunks(self) -> list[dict[str, str]]:
        """Một đoạn "trường dữ liệu" cho mỗi model gắn tool, sinh từ `verbose_name`/`help_text`/`choices`."""
        tools_by_model: dict[type[models.Model], list[str]] = {}
        for tool, model in ASSISTANT_TOOL_MODELS.items():
            if tool in _MODEL_CHUNK_EXCLUDED_TOOLS:
                continue
            tools_by_model.setdefault(model, []).append(tool)
        chunks: list[dict[str, str]] = []
        for model, tools in tools_by_model.items():
            title = str(model._meta.verbose_name)
            lines = [f"Trường dữ liệu của {title} (tool: {', '.join(sorted(tools))})."]
            for field in model._meta.get_fields():
                if not isinstance(field, models.Field) or field.auto_created or field.name in _HIDDEN_FIELDS:
                    continue
                text = f"- {field.verbose_name}"
                if field.help_text:
                    text += f": {field.help_text}"
                if field.choices:
                    text += " Lựa chọn: " + ", ".join(str(label) for _, label in field.flatchoices) + "."
                lines.append(text)
            for tool in sorted(tools):
                spec = self.spec_builder.spec_for(tool)
                if spec is not None:
                    asked = "; ".join(
                        slot.question.split("?")[0] for slot in spec.ask_slots if not slot.internal
                    )
                    lines.append(f"Khi `{tool}` mà người dùng chưa nói rõ, hệ thống tự hỏi: {asked}.")
            chunks.append(
                {
                    "source": f"{MODEL_SOURCE_PREFIX}{model._meta.label_lower}"[:120],
                    "heading": f"Trường dữ liệu {title}"[:200],
                    "content": "\n".join(lines),
                }
            )
        return chunks
