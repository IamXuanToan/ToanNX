"""Factory superuser."""

from app.system.tests.factories.user_factory import UserFactory


class SuperuserFactory(UserFactory):
    """is_staff=True, is_superuser=True."""

    is_staff = True
    is_superuser = True
