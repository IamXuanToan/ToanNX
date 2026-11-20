"""Factory vai trò."""

import factory

from app.iam.models.role import Role


class RoleFactory(factory.django.DjangoModelFactory):
    """Vai trò tùy chỉnh (không phải vai trò hệ thống)."""

    class Meta:
        model = Role

    code = factory.Sequence(lambda n: f"ROLE_{n}")
    name = factory.Sequence(lambda n: f"Vai trò {n}")
