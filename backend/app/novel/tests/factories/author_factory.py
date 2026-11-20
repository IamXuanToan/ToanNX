"""Factory cho Author."""

import factory

from app.novel.models.author import Author


class AuthorFactory(factory.django.DjangoModelFactory):
    """Factory tạo tác giả tiểu thuyết."""

    class Meta:
        model = Author

    name = factory.Sequence(lambda n: f"Tác Giả {n}")
    slug = factory.Sequence(lambda n: f"tac-gia-{n}")
    bio = "Tiểu sử tác giả mẫu..."
