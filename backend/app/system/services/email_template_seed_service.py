"""Seed các mẫu Email mặc định của hệ thống (1 bản ghi/mẫu, đa ngôn ngữ `vi` + `en`)."""

from typing import Any

from app.system.models.email_template import EmailTemplate
from app.system.repositories.email_template_repository import EmailTemplateRepository


def _tiptap_doc(*paragraphs: str) -> dict[str, Any]:
    return {
        "type": "doc",
        "content": [{"type": "paragraph", "content": [{"type": "text", "text": p}]} for p in paragraphs],
    }


DEFAULT_EMAIL_TEMPLATES: tuple[dict[str, Any], ...] = (
    {
        "code": "feedback_thank_you",
        "locale": "vi",
        "name": "Cảm ơn người góp ý / báo lỗi",
        "description": "Gửi lời cảm ơn tới người đã báo lỗi hoặc góp ý sau khi chủ trang xử lý xong.",
        "category": EmailTemplate.Category.FEEDBACK_THANKS,
        "subject": "Cảm ơn bạn đã góp ý cho {{target_title}}",
        "content": _tiptap_doc(
            "Xin chào {{sender_name}},",
            "Cảm ơn bạn rất nhiều vì đã gửi góp ý ({{feedback_type}}) cho {{target_title}} ({{target_url}}).",
            "Chúng tôi đã kiểm tra và xử lý xong: {{resolution_note}}",
            "Trân trọng, {{owner_name}}",
        ),
        "html_body": (
            "<p>Xin chào <strong>{{sender_name}}</strong>,</p>"
            "<p>Cảm ơn bạn rất nhiều vì đã gửi góp ý (<em>{{feedback_type}}</em>) cho "
            "<strong>{{target_title}}</strong> ({{target_url}}).</p>"
            "<p>Chúng tôi đã kiểm tra và xử lý xong: {{resolution_note}}</p>"
            "<p>Trân trọng,<br/>{{owner_name}}</p>"
        ),
        "translations": {
            "vi": {
                "name": "Cảm ơn người góp ý / báo lỗi",
                "subject": "Cảm ơn bạn đã góp ý cho {{target_title}}",
                "content": _tiptap_doc(
                    "Xin chào {{sender_name}},",
                    (
                        "Cảm ơn bạn rất nhiều vì đã gửi góp ý ({{feedback_type}}) "
                        "cho {{target_title}} ({{target_url}})."
                    ),
                    "Chúng tôi đã kiểm tra và xử lý xong: {{resolution_note}}",
                    "Trân trọng, {{owner_name}}",
                ),
                "html_body": (
                    "<p>Xin chào <strong>{{sender_name}}</strong>,</p>"
                    "<p>Cảm ơn bạn rất nhiều vì đã gửi góp ý (<em>{{feedback_type}}</em>) cho "
                    "<strong>{{target_title}}</strong> ({{target_url}}).</p>"
                    "<p>Chúng tôi đã kiểm tra và xử lý xong: {{resolution_note}}</p>"
                    "<p>Trân trọng,<br/>{{owner_name}}</p>"
                ),
            },
            "en": {
                "name": "Thank You for Feedback",
                "subject": "Thank you for your feedback on {{target_title}}",
                "content": _tiptap_doc(
                    "Hi {{sender_name}},",
                    "Thank you for reporting ({{feedback_type}}) on {{target_title}} ({{target_url}}).",
                    "We have reviewed and resolved it: {{resolution_note}}",
                    "Best regards, {{owner_name}}",
                ),
                "html_body": (
                    "<p>Hi <strong>{{sender_name}}</strong>,</p>"
                    "<p>Thank you for reporting (<em>{{feedback_type}}</em>) on "
                    "<strong>{{target_title}}</strong> ({{target_url}}).</p>"
                    "<p>We have reviewed and resolved it: {{resolution_note}}</p>"
                    "<p>Best regards,<br/>{{owner_name}}</p>"
                ),
            },
        },
        "variables": [
            {"key": "sender_name", "label": "Tên người gửi", "example": "Nguyễn Văn A"},
            {"key": "target_title", "label": "Tên trang / link", "example": "Góc Affiliate"},
            {"key": "target_url", "label": "Đường dẫn trang", "example": "https://toannx.com/p/demo"},
            {"key": "feedback_type", "label": "Loại góp ý", "example": "Sai link / Link hỏng"},
            {
                "key": "resolution_note",
                "label": "Ghi chú xử lý",
                "example": "Đã cập nhật lại link chính xác.",
            },
            {"key": "owner_name", "label": "Tên chủ trang", "example": "Xuân Toàn"},
        ],
    },
    {
        "code": "email_verification",
        "locale": "vi",
        "name": "Xác minh địa chỉ email",
        "description": "Mẫu email gửi liên kết xác minh tài khoản mới.",
        "category": EmailTemplate.Category.AUTH,
        "subject": "Xác minh địa chỉ email tài khoản ToanNX",
        "content": _tiptap_doc(
            "Xin chào {{full_name}},",
            "Vui lòng nhấn vào liên kết sau để xác minh email của bạn: {{action_url}}",
        ),
        "html_body": (
            "<p>Xin chào <strong>{{full_name}}</strong>,</p>"
            "<p>Vui lòng nhấn vào liên kết sau để xác minh email của bạn: "
            '<a href="{{action_url}}">Xác minh email</a></p>'
        ),
        "translations": {
            "vi": {
                "name": "Xác minh địa chỉ email",
                "subject": "Xác minh địa chỉ email tài khoản ToanNX",
                "content": _tiptap_doc(
                    "Xin chào {{full_name}},",
                    "Vui lòng nhấn vào liên kết sau để xác minh email của bạn: {{action_url}}",
                ),
                "html_body": (
                    "<p>Xin chào <strong>{{full_name}}</strong>,</p>"
                    "<p>Vui lòng nhấn vào liên kết sau để xác minh email của bạn: "
                    '<a href="{{action_url}}">Xác minh email</a></p>'
                ),
            },
            "en": {
                "name": "Verify Email Address",
                "subject": "Verify your ToanNX account email address",
                "content": _tiptap_doc(
                    "Hi {{full_name}},",
                    "Please open the following link to verify your email address: {{action_url}}",
                ),
                "html_body": (
                    "<p>Hi <strong>{{full_name}}</strong>,</p>"
                    "<p>Please click the link below to verify your email address: "
                    '<a href="{{action_url}}">Verify email</a></p>'
                ),
            },
        },
        "variables": [
            {"key": "full_name", "label": "Họ tên", "example": "Nguyễn Văn A"},
            {"key": "action_url", "label": "Liên kết xác minh", "example": "https://toannx.com/verify"},
        ],
    },
    {
        "code": "password_reset",
        "locale": "vi",
        "name": "Đặt lại mật khẩu",
        "description": "Mẫu email gửi liên kết khôi phục mật khẩu.",
        "category": EmailTemplate.Category.AUTH,
        "subject": "Yêu cầu đặt lại mật khẩu tài khoản ToanNX",
        "content": _tiptap_doc(
            "Xin chào {{full_name}},",
            "Nhấn vào liên kết sau để đặt lại mật khẩu: {{action_url}}",
        ),
        "html_body": (
            "<p>Xin chào <strong>{{full_name}}</strong>,</p>"
            "<p>Nhấn vào liên kết sau để đặt lại mật khẩu: "
            '<a href="{{action_url}}">Đặt lại mật khẩu</a></p>'
        ),
        "translations": {
            "vi": {
                "name": "Đặt lại mật khẩu",
                "subject": "Yêu cầu đặt lại mật khẩu tài khoản ToanNX",
                "content": _tiptap_doc(
                    "Xin chào {{full_name}},",
                    "Nhấn vào liên kết sau để đặt lại mật khẩu: {{action_url}}",
                ),
                "html_body": (
                    "<p>Xin chào <strong>{{full_name}}</strong>,</p>"
                    "<p>Nhấn vào liên kết sau để đặt lại mật khẩu: "
                    '<a href="{{action_url}}">Đặt lại mật khẩu</a></p>'
                ),
            },
            "en": {
                "name": "Reset Password",
                "subject": "Reset your ToanNX account password",
                "content": _tiptap_doc(
                    "Hi {{full_name}},",
                    "Click the following link to reset your password: {{action_url}}",
                ),
                "html_body": (
                    "<p>Hi <strong>{{full_name}}</strong>,</p>"
                    "<p>Click the link below to reset your password: "
                    '<a href="{{action_url}}">Reset password</a></p>'
                ),
            },
        },
        "variables": [
            {"key": "full_name", "label": "Họ tên", "example": "Nguyễn Văn A"},
            {"key": "action_url", "label": "Liên kết đặt lại", "example": "https://toannx.com/reset"},
        ],
    },
    {
        "code": "invitation",
        "locale": "vi",
        "name": "Lời mời tham gia hệ thống",
        "description": "Mẫu email mời thành viên mới kích hoạt tài khoản.",
        "category": EmailTemplate.Category.AUTH,
        "subject": "Bạn được mời tham gia hệ thống ToanNX",
        "content": _tiptap_doc(
            "Xin chào {{full_name}},",
            "Bạn đã được mời tham gia hệ thống. Nhấn liên kết sau để kích hoạt: {{action_url}}",
        ),
        "html_body": (
            "<p>Xin chào <strong>{{full_name}}</strong>,</p>"
            "<p>Bạn đã được mời tham gia hệ thống. Nhấn liên kết sau để kích hoạt: "
            '<a href="{{action_url}}">Kích hoạt tài khoản</a></p>'
        ),
        "translations": {
            "vi": {
                "name": "Lời mời tham gia hệ thống",
                "subject": "Bạn được mời tham gia hệ thống ToanNX",
                "content": _tiptap_doc(
                    "Xin chào {{full_name}},",
                    "Bạn đã được mời tham gia hệ thống. Nhấn liên kết sau để kích hoạt: {{action_url}}",
                ),
                "html_body": (
                    "<p>Xin chào <strong>{{full_name}}</strong>,</p>"
                    "<p>Bạn đã được mời tham gia hệ thống. Nhấn liên kết sau để kích hoạt: "
                    '<a href="{{action_url}}">Kích hoạt tài khoản</a></p>'
                ),
            },
            "en": {
                "name": "System Invitation",
                "subject": "You are invited to join ToanNX",
                "content": _tiptap_doc(
                    "Hi {{full_name}},",
                    "You have been invited to join ToanNX. Click the link below to activate: {{action_url}}",
                ),
                "html_body": (
                    "<p>Hi <strong>{{full_name}}</strong>,</p>"
                    "<p>You have been invited to join ToanNX. Click the link below to activate your account: "
                    '<a href="{{action_url}}">Activate account</a></p>'
                ),
            },
        },
        "variables": [
            {"key": "full_name", "label": "Họ tên", "example": "Nguyễn Văn A"},
            {"key": "action_url", "label": "Liên kết kích hoạt", "example": "https://toannx.com/invite"},
        ],
    },
)


class EmailTemplateSeedService:
    """Seed các mẫu email mặc định cho toàn hệ thống (không ghi đè bản đã chỉnh)."""

    def __init__(self, repository: EmailTemplateRepository | None = None) -> None:
        """Khởi tạo repository mẫu email."""
        self.repository = repository or EmailTemplateRepository()

    def seed_defaults(self) -> int:
        """Tạo các mẫu mặc định nếu chưa tồn tại hoặc bổ sung `translations` còn thiếu."""
        created_count = 0
        for item in DEFAULT_EMAIL_TEMPLATES:
            existing = (
                self.repository.get_queryset()
                .filter(code=item["code"], scope=EmailTemplate.Scope.SYSTEM)
                .first()
            )
            if existing is not None:
                if not existing.translations:
                    existing.translations = item["translations"]
                    existing.save(update_fields=["translations", "updated_at"])
                continue
            self.repository.create(
                code=item["code"],
                locale=item["locale"],
                name=item["name"],
                description=item["description"],
                category=item["category"],
                status=EmailTemplate.Status.ACTIVE,
                scope=EmailTemplate.Scope.SYSTEM,
                owner=None,
                subject=item["subject"],
                content=item["content"],
                html_body=item["html_body"],
                translations=item["translations"],
                variables=item["variables"],
                is_system_default=True,
            )
            created_count += 1
        return created_count
