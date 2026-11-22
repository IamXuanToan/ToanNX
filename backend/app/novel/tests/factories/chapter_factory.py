"""Factory cho Chapter."""

import factory

from app.novel.models.chapter import Chapter
from app.novel.tests.factories.novel_factory import NovelFactory


class ChapterFactory(factory.django.DjangoModelFactory):
    """Factory tạo chương tiểu thuyết."""

    class Meta:
        model = Chapter

    novel = factory.SubFactory(NovelFactory)
    chapter_number = factory.Sequence(lambda n: n + 1)
    title = factory.Sequence(lambda n: f"Chương {n + 1}: Mở đầu")
    slug = factory.Sequence(lambda n: f"chuong-{n + 1}")
    content = "Nội dung chương mẫu..."
    word_count = 500
