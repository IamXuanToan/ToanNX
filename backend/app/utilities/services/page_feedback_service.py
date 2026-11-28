"""Nghiệp vụ tiếp nhận góp ý ẩn danh, thông báo hồ sơ chủ trang và gửi email cảm ơn."""

import re
from typing import Any

from django.utils import timezone
from django.utils.crypto import salted_hmac

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.services.core_crud_service import CoreCrudService
from app.system.services.email_service import EmailService
from app.system.services.email_template_service import EmailTemplateService
from app.system.services.notification_service import NotificationService
from app.system.types.notification_payload import NotificationPayload
from app.utilities.constants.utilities_error_code import UtilitiesErrorCode
from app.utilities.constants.utilities_notification_event import UtilitiesNotificationEvent
from app.utilities.models.page import Page
from app.utilities.models.page_feedback import PageFeedback
from app.utilities.models.short_link import ShortLink
from app.utilities.permissions.page_feedback_permission import PageFeedbackPermission as P
from app.utilities.repositories.page_feedback_repository import PageFeedbackRepository
from app.utilities.repositories.page_repository import PageRepository
from app.utilities.repositories.short_link_repository import ShortLinkRepository

_TAG_STRIP_RE = re.compile(r"<[^>]+>")


class PageFeedbackService(CoreCrudService[PageFeedback, PageFeedbackRepository]):
    """Quản lý góp ý/báo lỗi ẩn danh trên Custom Page và ShortLink."""

    repository_class = PageFeedbackRepository
    owner_field = "target_owner"
    manage_all_permission = P.MANAGE_ALL.code

    def __init__(
        self,
        repository: PageFeedbackRepository | None = None,
        page_repository: PageRepository | None = None,
        short_link_repository: ShortLinkRepository | None = None,
        notification_service: NotificationService | None = None,
        email_template_service: EmailTemplateService | None = None,
        email_service: EmailService | None = None,
    ) -> None:
        """Khởi tạo các repository và service thông báo/email."""
        super().__init__(repository=repository)
        self.page_repository = page_repository or PageRepository()
        self.short_link_repository = short_link_repository or ShortLinkRepository()
        self.notification_service = notification_service or NotificationService()
        self.email_template_service = email_template_service or EmailTemplateService()
        self.email_service = email_service or EmailService()

    def submit_public(self, data: dict[str, Any], *, client_ip: str = "") -> PageFeedback:
        """Tiếp nhận góp ý ẩn danh từ khách và bắn thông báo tới hồ sơ chủ trang."""
        if str(data.get("website") or "").strip():
            raise BusinessRuleError(
                "Yêu cầu không hợp lệ.", code=UtilitiesErrorCode.FEEDBACK_TARGET_NOT_FOUND
            )

        target_type = str(data.get("target_type") or "")
        target_id = data.get("target_id")
        slug = str(data.get("slug") or "").strip()

        page: Page | None = None
        short_link: ShortLink | None = None
        target_owner: Any = None
        fallback_title = ""

        if target_type == PageFeedback.TargetType.PAGE:
            if not target_id:
                raise NotFoundError(
                    "Không tìm thấy trang tùy chỉnh.",
                    code=UtilitiesErrorCode.FEEDBACK_TARGET_NOT_FOUND,
                )
            page = self.page_repository.find_published_by_id(target_id)
            if page is None:
                raise NotFoundError(
                    "Trang không tồn tại hoặc chưa công khai.",
                    code=UtilitiesErrorCode.FEEDBACK_TARGET_NOT_FOUND,
                )
            target_owner = page.owner
            fallback_title = page.title
        elif target_type == PageFeedback.TargetType.SHORT_LINK:
            short_link = self.short_link_repository.find_by_slug(slug) if slug else None
            if short_link is None and target_id:
                short_link = self.short_link_repository.get_queryset().filter(pk=target_id).first()
            if short_link is None or short_link.status != ShortLink.Status.ACTIVE:
                raise NotFoundError(
                    "Liên kết rút gọn không tồn tại hoặc đã tắt.",
                    code=UtilitiesErrorCode.FEEDBACK_TARGET_NOT_FOUND,
                )
            target_owner = short_link.owner
            fallback_title = short_link.name or short_link.slug
        else:
            raise NotFoundError(code=UtilitiesErrorCode.FEEDBACK_TARGET_NOT_FOUND)

        ip_hash = salted_hmac("utilities.page_feedback.ip", client_ip).hexdigest() if client_ip else ""
        title = str(data.get("target_title") or fallback_title or "")[:200]
        feedback = self.repository.create(
            target_type=target_type,
            page=page,
            short_link=short_link,
            target_owner=target_owner,
            target_url=str(data.get("target_url") or "")[:2048],
            target_title=title,
            target_item_id=str(data.get("target_item_id") or "")[:64],
            feedback_type=str(data.get("feedback_type") or PageFeedback.FeedbackType.BROKEN_LINK),
            message=str(data.get("message") or "").strip()[:2000],
            sender_name=str(data.get("sender_name") or "").strip()[:100],
            sender_email=str(data.get("sender_email") or "").strip(),
            ip_hash=ip_hash,
        )

        sender_label = feedback.sender_name or "Khách ẩn danh"
        self.notification_service.notify(
            UtilitiesNotificationEvent.FEEDBACK_RECEIVED,
            dedup_key=f"page-feedback:{feedback.pk}",
            recipient=target_owner,
            payload=NotificationPayload(
                title=f"Có góp ý mới cho {title or feedback.target_url}",
                body=f"{sender_label}: {feedback.message[:140]}",
                link=f"/portal/feedbacks/{feedback.pk}",
                details=(
                    ("📌 Đối tượng", title or feedback.target_url),
                    ("🏷️ Loại góp ý", feedback.get_feedback_type_display()),
                    ("👤 Người gửi", sender_label),
                    ("💬 Nội dung", feedback.message[:300]),
                ),
            ),
        )
        return feedback

    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> PageFeedback:
        """Cập nhật trạng thái / ghi chú xử lý; tự ghi dấu thời điểm xử lý xong."""
        payload = dict(data)
        if payload.get("status") == PageFeedback.Status.RESOLVED:
            payload["resolved_at"] = timezone.now()
            payload["resolved_by"] = actor
        return super().update(actor, pk, payload)

    def thank_sender(self, actor: Any, pk: Any, data: dict[str, Any]) -> dict[str, Any]:
        """Trộn mẫu email cảm ơn và gửi tới người đã góp ý; đánh dấu đã xử lý & cảm ơn."""
        feedback = self.get_by_id_for(actor, pk)
        if not feedback.sender_email:
            raise BusinessRuleError(
                "Góp ý này không có địa chỉ email của người gửi để cảm ơn.",
                code=UtilitiesErrorCode.FEEDBACK_NO_EMAIL,
            )

        template = None
        template_id = data.get("template_id")
        if template_id:
            template = self.email_template_service.get_by_id_for(actor, template_id)
        elif not (data.get("subject") and data.get("html_body")):
            template = self.email_template_service.find_active_thank_you_template(actor, locale="vi")

        resolution_note = str(
            data.get("resolution_note") or feedback.resolution_note or "Đã kiểm tra và xử lý xong."
        )
        owner_name = getattr(actor, "full_name", "") or getattr(actor, "username", "") or "Quản trị viên"
        context = {
            "sender_name": feedback.sender_name or "bạn",
            "target_title": feedback.target_title or feedback.target_url,
            "target_url": feedback.target_url,
            "feedback_type": feedback.get_feedback_type_display(),
            "resolution_note": resolution_note,
            "owner_name": owner_name,
        }

        if template is not None:
            rendered = self.email_template_service.render_template(template, context)
            subject = str(data.get("subject") or "").strip() or rendered["subject"]
            html_body = str(data.get("html_body") or "").strip() or rendered["html_body"]
            if data.get("html_body"):
                html_body = self.email_template_service.sanitize_html(html_body)
            text_body = re.sub(r"\n{3,}", "\n\n", _TAG_STRIP_RE.sub("", html_body)).strip()
        else:
            subject = (
                str(data.get("subject") or "").strip() or f"Cảm ơn bạn đã góp ý cho {context['target_title']}"
            )
            raw_html = (
                str(data.get("html_body") or "").strip()
                or f"<p>Xin chào {context['sender_name']}, cảm ơn bạn đã góp ý. {resolution_note}</p>"
            )
            html_body = self.email_template_service.sanitize_html(raw_html)
            text_body = re.sub(r"\n{3,}", "\n\n", _TAG_STRIP_RE.sub("", html_body)).strip()

        sent = self.email_service.send_now(
            subject=subject,
            recipient=feedback.sender_email,
            text_body=text_body or subject,
            html_body=html_body,
        )
        now = timezone.now()
        update_fields: dict[str, Any] = {
            "thanked_at": now,
            "thanked_by": actor,
            "resolution_note": resolution_note,
        }
        if template is not None:
            update_fields["thank_template"] = template
        if feedback.status != PageFeedback.Status.RESOLVED:
            update_fields["status"] = PageFeedback.Status.RESOLVED
            update_fields["resolved_at"] = now
            update_fields["resolved_by"] = actor

        self.repository.update(feedback, **update_fields)
        return {
            "sent": sent,
            "thanked_at": now,
            "recipient": feedback.sender_email,
        }
