"""Chặn N+1: số query của danh sách không tăng theo số bản ghi.

Module mới thêm endpoint danh sách thì thêm một dòng vào `CASES`; quên thì
`test_every_list_endpoint_is_covered` đỏ.
"""

import io
import itertools
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
from app.system.models.auth_session import AuthSession
from app.system.models.permission import Permission
from app.system.models.setting import Setting
from app.system.services.attachment_folder_service import AttachmentFolderService
from app.system.services.attachment_service import AttachmentService
from app.system.tests.factories.role_factory import RoleFactory
from app.system.tests.factories.user_factory import UserFactory
from app.utilities.models.page_path import PagePath
from app.utilities.services.page_service import PageService
from app.utilities.services.qr_code_service import QrCodeService
from app.utilities.services.short_link_service import ShortLinkService

# Mã tiền tệ (3 ký tự, unique) tuần tự toàn phiên test: chỉ gồm chữ số nên không bao giờ trùng
# mã ISO đã seed (VND, USD...) và không trùng nhau như mã ngẫu nhiên.
_CURRENCY_CODE_SEQ = itertools.count(1)

pytestmark = pytest.mark.django_db


def _short_links(owner: Any, count: int) -> None:
    service = ShortLinkService()
    for _ in range(count):
        slug = f"qc-{UserFactory.build().email.split('@')[0]}"
        service.create(owner, {"name": slug, "slug": slug, "destination_url": "https://example.com"})


def _pages(owner: Any, count: int) -> None:
    path, _ = PagePath.objects.get_or_create(segment="p", defaults={"name": "Trang"})
    service = PageService()
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
    from app.novel.services.novel_service import NovelService

    service = NovelService()
    for _ in range(count):
        uid = uuid.uuid4().hex[:8]
        service.create(owner, {"title": f"Truyen {uid}", "slug": f"truyen-{uid}"})


def _chapters(owner: Any, count: int) -> None:
    from app.novel.models.novel import Novel
    from app.novel.services.chapter_service import ChapterService

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
    from app.novel.services.author_service import AuthorService

    service = AuthorService()
    for _ in range(count):
        uid = uuid.uuid4().hex[:8]
        service.create(owner, {"name": f"Tac gia {uid}", "slug": f"tg-{uid}"})


def _genres(owner: Any, count: int) -> None:
    from app.novel.services.genre_service import GenreService

    service = GenreService()
    for _ in range(count):
        uid = uuid.uuid4().hex[:8]
        service.create(owner, {"name": f"The loai {uid}", "slug": f"tl-{uid}"})


def _tags(owner: Any, count: int) -> None:
    from app.novel.services.tag_service import TagService

    service = TagService()
    for _ in range(count):
        uid = uuid.uuid4().hex[:8]
        service.create(owner, {"name": f"The {uid}", "slug": f"tag-{uid}"})


def _finance(model: str) -> Callable[[Any, int], None]:
    """Bản ghi Tài chính đủ quan hệ để lộ N+1 (nền tảng, tiền tệ, mốc thuế, file, giao dịch)."""

    def make(owner: Any, count: int) -> None:
        from decimal import Decimal

        from app.finance.models.classification_rule import ClassificationRule
        from app.finance.models.income import Income
        from app.finance.models.invoice import Invoice
        from app.finance.models.platform import Platform
        from app.finance.models.platform_tax_rate import PlatformTaxRate
        from app.system.models.currency import Currency

        vnd = Currency.objects.get(code="VND")
        now = timezone.now()
        for _ in range(count):
            uid = uuid.uuid4().hex[:8]
            platform = Platform.objects.create(owner=owner, name=uid, code=uid, default_currency=vnd)
            PlatformTaxRate.objects.create(
                platform=platform, effective_from=now.date(), tax_withheld=True, rate=5
            )
            if model == "rules":
                ClassificationRule.objects.create(owner=owner, name=uid, platform=platform, pattern=uid)
            income = Income.objects.create(
                owner=owner,
                source="MANUAL",
                received_at=now,
                received_date=now.date(),
                currency=vnd,
                original_amount=Decimal(1),
                amount=Decimal(1),
                platform=platform,
            )
            if model == "invoices":
                attachment = AttachmentService().create_generated(owner, segno_png(), f"{uid}.png")
                invoice = Invoice.objects.create(
                    owner=owner,
                    doc_type="INVOICE",
                    issuer=uid,
                    issued_on=now.date(),
                    currency=vnd,
                    original_amount=Decimal(1),
                    amount=Decimal(1),
                    platform=platform,
                )
                invoice.attachments.add(attachment)
                invoice.incomes.add(income)

    return make


def _system(model: str) -> Callable[[Any, int], None]:
    """Thông báo, tiền tệ, tỷ giá, thông báo hệ thống."""

    def make(owner: Any, count: int) -> None:
        from datetime import date
        from decimal import Decimal

        from app.system.models.currency import Currency
        from app.system.models.exchange_rate import ExchangeRate
        from app.system.models.notification import Notification
        from app.system.models.notification_delivery import NotificationDelivery
        from app.system.models.system_announcement import SystemAnnouncement
        from app.system.models.telegram_bot import TelegramBot
        from app.system.models.telegram_chat import TelegramChat

        usd = Currency.objects.get(code="USD")
        bot, _ = TelegramBot.objects.get_or_create(
            owner=owner, defaults={"token_encrypted": "x", "token_last4": "1234"}
        )
        for index in range(count):
            uid = uuid.uuid4().hex
            if model == "chats":
                TelegramChat.objects.create(
                    owner=owner, bot=bot, chat_id=uid[:12], title="g", status="active"
                )
            elif model == "deliveries":
                notification = Notification.objects.create(
                    recipient=owner, event_code="system.auth.login", module="system", title="t", dedup_key=uid
                )
                NotificationDelivery.objects.create(
                    notification=notification, channel="EMAIL", target=owner.email
                )
            elif model == "currencies":
                Currency.objects.create(
                    code=f"{next(_CURRENCY_CODE_SEQ):03d}", name=uid, symbol="x", position=index + 10
                )
            elif model == "rates":
                ExchangeRate.objects.create(
                    currency=usd,
                    rate_date=date(2020, 1, 1) + timedelta(days=ExchangeRate.objects.count()),
                    rate=Decimal(25000),
                    source="MANUAL",
                    note=uid,
                )
            elif model == "announcements":
                SystemAnnouncement.objects.create(title=uid)

    return make


def segno_png() -> bytes:
    """PNG nhỏ hợp lệ."""
    buffer = io.BytesIO()
    segno.make("qc").save(buffer, kind="png")
    return buffer.getvalue()


CASES: list[tuple[str, Callable[[Any, int], None]]] = [
    ("/api/v1/finance/platforms", _finance("platforms")),
    ("/api/v1/finance/rules", _finance("rules")),
    ("/api/v1/finance/incomes", _finance("incomes")),
    ("/api/v1/finance/invoices", _finance("invoices")),
    ("/api/v1/system/telegram-chats", _system("chats")),
    ("/api/v1/system/notification-deliveries", _system("deliveries")),
    ("/api/v1/system/currencies", _system("currencies")),
    ("/api/v1/system/exchange-rates", _system("rates")),
    ("/api/v1/system/announcements", _system("announcements")),
    ("/api/v1/system/users", lambda owner, n: UserFactory.create_batch(n)),
    ("/api/v1/system/roles", lambda owner, n: RoleFactory.create_batch(n)),
    ("/api/v1/utilities/short-links", _short_links),
    ("/api/v1/system/journal-entries", lambda owner, n: RoleFactory.create_batch(n)),
    ("/api/v1/utilities/pages", _pages),
    ("/api/v1/utilities/page-paths", lambda owner, n: None),
    ("/api/v1/utilities/qr-codes", _qr_codes),
    ("/api/v1/system/auth/admin-sessions", _sessions),
    ("/api/v1/system/permissions", _permissions),
    ("/api/v1/system/attachments/folders", _folders),
    ("/api/v1/system/attachments", _attachments),
    ("/api/v1/novel/novels", _novels),
    ("/api/v1/novel/chapters", _chapters),
    ("/api/v1/novel/authors", _authors),
    ("/api/v1/novel/genres", _genres),
    ("/api/v1/novel/tags", _tags),
    (
        "/api/v1/system/settings",
        lambda owner, n: [
            Setting.objects.create(key=f"setting_{uuid.uuid4().hex[:6]}", value=True) for _ in range(n)
        ],
    ),
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
