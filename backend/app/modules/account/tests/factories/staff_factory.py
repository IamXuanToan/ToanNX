"""Factory người dùng được vào khu vực quản trị."""

from app.modules.account.tests.factories.user_factory import UserFactory


class StaffFactory(UserFactory):
    """is_staff=True, chưa có quyền."""

    is_staff = True
