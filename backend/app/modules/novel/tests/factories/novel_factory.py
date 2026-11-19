"""Factory cho Novel."""

import factory

from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.novel.models.novel import Novel
from app.modules.novel.tests.factories.author_factory import AuthorFactory


class NovelFactory(factory.django.DjangoModelFactory):
    """Factory tạo truyện tiểu thuyết."""

    class Meta:
        model = Novel

    title = factory.Sequence(lambda n: f"Tiểu Thuyết {n}")
    slug = factory.Sequence(lambda n: f"tieu-thuyet-{n}")
    description = "Mô tả truyện tiểu thuyết..."
    status = "ONGOING"
    author = factory.SubFactory(AuthorFactory)
    owner = factory.SubFactory(UserFactory)
