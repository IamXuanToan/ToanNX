"""Model của Account. Django nạp model qua `app.account.models` nên phải import tại đây."""

from app.account.models.user import User

__all__ = ["User"]
