"""Đường dẫn Frontend và tiêu đề email theo ngôn ngữ dùng cho nghiệp vụ xác thực."""

from app.core.constants.defaults import DEFAULT_LOCALE, ENGLISH_LOCALE

AUTH_RESET_PASSWORD_PATHS = {
    DEFAULT_LOCALE: f"/{DEFAULT_LOCALE}/dat-lai-mat-khau",
    ENGLISH_LOCALE: f"/{ENGLISH_LOCALE}/reset-password",
}
AUTH_VERIFY_EMAIL_PATH_SEGMENT = "verify-email"
AUTH_INVITATION_PATH_SEGMENT = "invitation"

EMAIL_TEMPLATE_PASSWORD_RESET = "password_reset"  # noqa: S105 - tên template email, không phải bí mật
EMAIL_TEMPLATE_VERIFICATION = "email_verification"
EMAIL_TEMPLATE_INVITATION = "invitation"

EMAIL_SUBJECTS = {
    EMAIL_TEMPLATE_PASSWORD_RESET: {
        DEFAULT_LOCALE: "Đặt lại mật khẩu tài khoản ToanNX",
        ENGLISH_LOCALE: "Reset your ToanNX password",
    },
    EMAIL_TEMPLATE_VERIFICATION: {
        DEFAULT_LOCALE: "Xác minh địa chỉ email · ToanNX",
        ENGLISH_LOCALE: "Verify your email address · ToanNX",
    },
    EMAIL_TEMPLATE_INVITATION: {
        DEFAULT_LOCALE: "Lời mời tham gia hệ thống ToanNX",
        ENGLISH_LOCALE: "Invitation to join ToanNX platform",
    },
}


def resolve_auth_locale(locale: str | None) -> str:
    """Chuẩn hóa mã ngôn ngữ email/URL về `vi` hoặc `en`."""
    return ENGLISH_LOCALE if locale == ENGLISH_LOCALE else DEFAULT_LOCALE
