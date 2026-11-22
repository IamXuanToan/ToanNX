"""Factory cho UserSocialAccount."""

from typing import Any

import factory
from factory.django import DjangoModelFactory

from app.system.models.user_social_account import UserSocialAccount
from app.system.tests.factories.user_factory import UserFactory


class UserSocialAccountFactory(DjangoModelFactory):
    """Factory tạo tài khoản mạng xã hội liên kết."""

    class Meta:
        model = UserSocialAccount

    user = factory.SubFactory(UserFactory)
    provider = UserSocialAccount.Provider.GOOGLE.value
    uid = factory.Sequence(lambda n: f"google-uid-{n}")
    email = factory.Sequence(lambda n: f"social{n}@gmail.com")
    display_name = factory.Faker("name")
    avatar_url = factory.Faker("image_url")
    extra_data: dict[str, Any] = factory.LazyFunction(dict)
