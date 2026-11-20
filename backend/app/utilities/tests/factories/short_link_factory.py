"""Factory tạo dữ liệu mẫu cho ShortLink."""

import factory
from factory.django import DjangoModelFactory

from app.system.tests.factories.user_factory import UserFactory
from app.utilities.models.short_link import ShortLink


class ShortLinkFactory(DjangoModelFactory):
    """Factory sinh dữ liệu cho model ShortLink."""

    class Meta:
        model = ShortLink

    owner = factory.SubFactory(UserFactory)
    name = factory.Sequence(lambda n: f"Short Link {n}")
    slug = factory.Sequence(lambda n: f"link-{n}")
    destination_url = "https://example.com/test"
    description = "Mô tả test liên kết"
    status = ShortLink.Status.ACTIVE
