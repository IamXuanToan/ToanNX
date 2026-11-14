"""Model của Account. Django nạp model qua `app.modules.account.models` nên phải import tại đây."""

from app.modules.account.models.user import User

__all__ = ["User"]
