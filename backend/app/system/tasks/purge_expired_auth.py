"""Task dọn dữ liệu phần xác thực (module System) (chạy bởi `manage.py run_cleanup`)."""

from app.system.services.auth_session_service import AuthSessionService


def purge_expired_auth() -> int:
    """Dọn bucket rate limit và phiên hết hạn (lớp vỏ của `AuthSessionService.purge_expired_auth`).

    Returns:
        Tổng số bản ghi đã xóa.
    """
    return AuthSessionService().purge_expired_auth()
