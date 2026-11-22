"""Đăng ký module Tài chính."""

from app.core.registry.module_descriptor import ModuleDescriptor
from app.core.registry.notification_event_definition import NotificationEventDefinition
from app.core.registry.webhook_definition import WebhookDefinition
from app.finance.constants.finance_notification_event import FinanceNotificationEvent as E
from app.finance.permissions.income_permission import IncomePermission
from app.finance.permissions.invoice_permission import InvoicePermission
from app.finance.permissions.platform_permission import PlatformPermission
from app.finance.permissions.report_permission import ReportPermission
from app.finance.permissions.rule_permission import RulePermission
from app.finance.permissions.sepay_permission import SepayPermission

MODULE = ModuleDescriptor(
    code="finance",
    name="Finance",
    description=(
        "Ghi nhận thu nhập (nhập tay, webhook SePay riêng mỗi người), nền tảng và lịch sử khấu trừ thuế, "
        "quy tắc nhận diện, hóa đơn/chứng từ, ngoại tệ quy đổi VNĐ, báo cáo năm/tháng."
    ),
    version="2.0.0",
    dependencies=("system",),
    permissions=(
        *IncomePermission.all(),
        *InvoicePermission.all(),
        *PlatformPermission.all(),
        *RulePermission.all(),
        *ReportPermission.all(),
        *SepayPermission.all(),
    ),
    member_permissions=(
        *IncomePermission.member(),
        *InvoicePermission.member(),
        *PlatformPermission.member(),
        *RulePermission.member(),
        *ReportPermission.member(),
        *SepayPermission.member(),
    ),
    webhooks=(
        WebhookDefinition(
            code="finance.sepay",
            name="Biến động số dư SePay (mỗi người một URL)",
            provider="SePay",
            path="/finance/sepay/webhook/{public_id}",
            description=(
                "SePay gọi khi tài khoản ngân hàng có tiền vào. Hệ thống tìm kết nối theo {public_id}, "
                "chống trùng "
                'theo id/mã giao dịch, nhận diện nền tảng, tính khấu trừ và trả đúng {"success": true}. '
                "Mỗi người có URL riêng ở Tài chính → Kết nối SePay."
            ),
            auth=(
                "HMAC-SHA256: header X-SePay-Signature = sha256=HMAC({X-SePay-Timestamp}.{body}), "
                "lệch giờ ≤ 300 "
                "giây; secret riêng mỗi người (dẫn xuất từ DJANGO_SECRET_KEY, xem ở Kết nối SePay)."
            ),
            setup=(
                "Tài chính → Kết nối SePay: dán token API, chép URL webhook và secret.",
                "my.sepay.vn → Webhooks → Thêm webhook, dán URL; sự kiện: Chỉ tiền vào.",
                "Xác thực HMAC-SHA256, Secret Key = secret ở trên; tắt “Dùng để xác thực thanh toán”.",
                "Bật “Tự động gửi lại khi server trả lỗi” và cảnh báo lỗi liên tiếp.",
            ),
        ),
    ),
    notification_events=(
        NotificationEventDefinition(
            E.INCOME_RECEIVED,
            "Có tiền vào",
            "Webhook SePay hoặc lấy thủ công ghi nhận một khoản thu nhập.",
            permission="finance.income.read",
            default_channels=("IN_APP", "PUSH"),
            icon="💰",
        ),
        NotificationEventDefinition(
            E.INCOME_NEEDS_REVIEW,
            "Thu nhập cần xử lý",
            "Không rõ số tiền, chưa nhận diện nền tảng hoặc nền tảng chưa có mốc thuế.",
            permission="finance.income.read",
            default_level="WARNING",
            default_channels=("IN_APP", "PUSH"),
            icon="🧾",
        ),
        NotificationEventDefinition(
            E.WEBHOOK_AUTH_FAILED,
            "Webhook SePay sai chữ ký",
            "Request tới webhook SePay của bạn bị từ chối vì sai/thiếu chữ ký (gom theo giờ).",
            permission="finance.sepay.manage",
            default_level="ERROR",
            default_channels=("IN_APP", "PUSH", "EMAIL"),
            kind="technical",
            icon="🚫",
        ),
    ),
)
