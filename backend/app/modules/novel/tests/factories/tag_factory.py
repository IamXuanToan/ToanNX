"""Factory cho Tag."""

import factory

from app.modules.novel.models.tag import Tag


class TagFactory(factory.django.DjangoModelFactory):
    """Factory tạo thẻ tiểu thuyết."""

    class Meta:
        model = Tag

    name = factory.Sequence(lambda n: f"Thẻ {n}")
    slug = factory.Sequence(lambda n: f"the-{n}")
