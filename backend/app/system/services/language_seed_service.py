"""Seed danh mục ngôn ngữ mặc định của hệ thống (`vi`, `en`)."""

from app.system.repositories.language_repository import LanguageRepository

DEFAULT_LANGUAGES = (
    {
        "code": "vi",
        "name": "Tiếng Việt",
        "native_name": "Tiếng Việt",
        "flag_emoji": "🇻🇳",
        "is_default": True,
        "is_active": True,
        "sort_order": 1,
    },
    {
        "code": "en",
        "name": "English",
        "native_name": "Tiếng Anh",
        "flag_emoji": "🇺🇸",
        "is_default": True,
        "is_active": True,
        "sort_order": 2,
    },
)


class LanguageSeedService:
    """Seed các ngôn ngữ lõi (`vi`, `en`) một cách idempotent sau mỗi `migrate`."""

    def __init__(self, repository: LanguageRepository | None = None) -> None:
        """Khởi tạo repository ngôn ngữ."""
        self.repository = repository or LanguageRepository()

    def seed_defaults(self) -> int:
        """Tạo `vi` và `en` nếu chưa tồn tại; trả số bản ghi mới tạo."""
        created = 0
        for item in DEFAULT_LANGUAGES:
            if self.repository.exists_code(str(item["code"])):
                continue
            self.repository.create(**item)
            created += 1
        return created
