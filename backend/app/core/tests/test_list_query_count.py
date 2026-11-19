"""Chặn N+1: số query của danh sách không tăng theo số bản ghi.

Module mới thêm endpoint danh sách thì thêm một dòng vào `CASES`; quên thì
`test_every_list_endpoint_is_covered` đỏ.
"""

import io
import uuid
from collections.abc import Callable
from datetime import timedelta
from typing import Any

import pytest
import segno
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import URLPattern, URLResolver, get_resolver
from django.utils import timezone

from app.core.views.core_model_view_set import CoreModelViewSet
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.attachment.services.attachment_folder_service import AttachmentFolderService
from app.modules.attachment.services.attachment_service import AttachmentService
from app.modules.authentication.models.auth_session import AuthSession
from app.modules.custom_pages.models.page_path import PagePath
from app.modules.custom_pages.services.page_service import PageService
from app.modules.iam.models.permission import Permission
from app.modules.iam.tests.factories.role_factory import RoleFactory
from app.modules.qr_codes.services.qr_code_service import QrCodeService
from app.modules.short_links.services.short_link_service import ShortLinkService

pytestmark = pytest.mark.django_db


def _short_links(owner: Any, count: int) -> None:
    service = ShortLinkService()
    for _ in range(count):
        slug = f"qc-{UserFactory.build().email.split('@')[0]}"
        service.create(owner, {"name": slug, "slug": slug, "destination_url": "https://example.com"})


def _pages(owner: Any, count: int) -> None:
    service, path = PageService(), PagePath.objects.get(segment="p")
    for _ in range(count):
        service.create(owner, {"path_id": path.pk, "title": "Trang"})


def _qr_codes(owner: Any, count: int) -> None:
    service = QrCodeService()
    design = {
        "size": 128,
        "foreground": "#000000",
        "background": "#FFFFFF",
        "margin": 1,
        "error_correction": "L",
    }
    for index in range(count):
        service.create(
            owner, {"name": f"QR {index}", "qr_type": "TEXT", "content": {"text": "x"}, "design": design}
        )


def _sessions(owner: Any, count: int) -> None:
    expires = timezone.now() + timedelta(days=1)
    AuthSession.objects.bulk_create(
        [AuthSession(user=UserFactory(), expires_at=expires) for _ in range(count)]
    )


def _permissions(owner: Any, count: int) -> None:
    start = Permission.objects.count()
    Permission.objects.bulk_create(
        [
            Permission(
                code=f"qc.item.a{start + index}",
                module="qc",
                resource="item",
                action=f"a{start + index}",
                name="QC",
                description="QC",
            )
            for index in range(count)
        ]
    )


def _folders(owner: Any, count: int) -> None:
    service, start = AttachmentFolderService(), Permission.objects.count() + timezone.now().microsecond
    for index in range(count):
        service.create(owner, {"name": f"QC {start}-{index}"})


def _attachments(owner: Any, count: int) -> None:
    buffer = io.BytesIO()
    segno.make("qc").save(buffer, kind="png")
    service = AttachmentService()
    for index in range(count):
        service.create_generated(owner, buffer.getvalue(), f"qc-{index}.png")


def _novels(owner: Any, count: int) -> None:
    from app.modules.novel.services.novel_service import NovelService

    service = NovelService()
    for _ in range(count):
        uid = uuid.uuid4().hex[:8]
        service.create(owner, {"title": f"Truyen {uid}", "slug": f"truyen-{uid}"})


def _chapters(owner: Any, count: int) -> None:
    from app.modules.novel.models.novel import Novel
    from app.modules.novel.services.chapter_service import ChapterService

    novel, _ = Novel.objects.get_or_create(
        slug="truyen-test-ch", defaults={"title": "Truyen Test", "owner": owner}
    )
    service = ChapterService()
    start = novel.chapters.count() + 1
    for index in range(count):
        service.create(
            owner,
            {
                "novel_id": novel.pk,
                "chapter_number": start + index,
                "title": f"Chuong {start + index}",
                "content": "Noi dung",
            },
        )


def _authors(owner: Any, count: int) -> None:
    from app.modules.novel.services.author_service import AuthorService

    service = AuthorService()
    for _ in range(count):
        uid = uuid.uuid4().hex[:8]
        service.create(owner, {"name": f"Tac gia {uid}", "slug": f"tg-{uid}"})


def _genres(owner: Any, count: int) -> None:
    from app.modules.novel.services.genre_service import GenreService

    service = GenreService()
    for _ in range(count):
        uid = uuid.uuid4().hex[:8]
        service.create(owner, {"name": f"The loai {uid}", "slug": f"tl-{uid}"})


def _tags(owner: Any, count: int) -> None:
    from app.modules.novel.services.tag_service import TagService

    service = TagService()
    for _ in range(count):
        uid = uuid.uuid4().hex[:8]
        service.create(owner, {"name": f"The {uid}", "slug": f"tag-{uid}"})


CASES: list[tuple[str, Callable[[Any, int], None]]] = [
    ("/api/v1/account/users", lambda owner, n: UserFactory.create_batch(n)),
    ("/api/v1/iam/roles", lambda owner, n: RoleFactory.create_batch(n)),
    ("/api/v1/short_links/links", _short_links),
    ("/api/v1/journal/entries", lambda owner, n: RoleFactory.create_batch(n)),
    ("/api/v1/custom_pages/pages", _pages),
    ("/api/v1/custom_pages/paths", lambda owner, n: None),
    ("/api/v1/qr_codes/codes", _qr_codes),
    ("/api/v1/auth/admin-sessions", _sessions),
    ("/api/v1/iam/permissions", _permissions),
    ("/api/v1/attachments/folders", _folders),
    ("/api/v1/attachments", _attachments),
    ("/api/v1/novel/novels", _novels),
    ("/api/v1/novel/chapters", _chapters),
    ("/api/v1/novel/authors", _authors),
    ("/api/v1/novel/genres", _genres),
    ("/api/v1/novel/tags", _tags),
]


def _list_routes(patterns: list[URLPattern | URLResolver], prefix: str = "/") -> set[str]:
    """URL của mọi action `list` thuộc `CoreModelViewSet`."""
    routes: set[str] = set()
    for pattern in patterns:
        part = str(pattern.pattern).lstrip("^").rstrip("$")
        if isinstance(pattern, URLResolver):
            routes |= _list_routes(pattern.url_patterns, prefix + part)
            continue
        view_class = getattr(pattern.callback, "cls", None)
        actions = getattr(pattern.callback, "actions", None) or {}
        if view_class and issubclass(view_class, CoreModelViewSet) and actions.get("get") == "list":
            routes.add(prefix + part)
    return routes


def test_every_list_endpoint_is_covered() -> None:
    """Mọi endpoint danh sách đều có dòng trong `CASES`."""
    missing = _list_routes(get_resolver().url_patterns) - {url for url, _ in CASES}
    assert not missing, f"Thêm vào CASES: {sorted(missing)}"


def _count(api: Any, url: str) -> int:
    with CaptureQueriesContext(connection) as context:
        response = api.get(url, {"page_size": 100})
    assert response.status_code == 200, response.content
    return len(context.captured_queries)


@pytest.mark.parametrize(("url", "make"), CASES)
def test_list_query_count_is_stable(
    url: str, make: Callable[[Any, int], None], superuser: Any, login: Any
) -> None:
    api = login(superuser)
    make(superuser, 1)
    first = _count(api, url)
    make(superuser, 20)
    assert _count(api, url) == first, f"{url}: số query tăng theo số bản ghi (N+1)"
