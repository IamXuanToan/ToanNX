"""Factory người dùng thường."""

from typing import Any

import factory

from app.system.models.user import User

DEFAULT_PASSWORD = "Str0ng-Passw0rd!"


class UserFactory(factory.django.DjangoModelFactory):
    """Người dùng thường, mật khẩu mặc định `DEFAULT_PASSWORD`."""

    class Meta:
        model = User
        skip_postgeneration_save = True

    email = factory.Sequence(lambda n: f"user{n}@toannx.test")
    first_name = "Test"
    last_name = "User"
    is_active = True

    @factory.post_generation
    def password(self, create: bool, extracted: str | None, **kwargs: Any) -> None:
        """Đặt mật khẩu đã băm."""
        self.set_password(extracted or DEFAULT_PASSWORD)
        if create:
            self.save(update_fields=["password"])
