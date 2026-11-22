"""Factory cho Genre."""

import factory

from app.novel.models.genre import Genre


class GenreFactory(factory.django.DjangoModelFactory):
    """Factory tạo thể loại tiểu thuyết."""

    class Meta:
        model = Genre

    name = factory.Sequence(lambda n: f"Thể Loại {n}")
    slug = factory.Sequence(lambda n: f"the-loai-{n}")
    description = "Mô tả thể loại mẫu..."
