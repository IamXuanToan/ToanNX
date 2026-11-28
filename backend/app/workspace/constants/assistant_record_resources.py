"""Registry tài nguyên Client Portal mà Trợ lý thao tác qua tool chung `list_my_records` / `update_my_record`.

Thêm chức năng Portal mới không cần viết tool riêng: khai một dòng ở đây (model, service, quyền, serializer
validate của
API) + trang chi tiết; xóa thì thêm vào `DELETE_RESOURCE_PERMISSION_MAP`. Tài nguyên đã có tool riêng (nhắc
việc, link
rút gọn...) không khai lại.
"""

from app.finance.models.invoice import Invoice
from app.finance.models.platform import Platform
from app.finance.permissions.invoice_permission import InvoicePermission
from app.finance.permissions.platform_permission import PlatformPermission
from app.finance.serializers.validates.invoice_update_validate_serializer import (
    InvoiceUpdateValidateSerializer,
)
from app.finance.serializers.validates.platform_update_validate_serializer import (
    PlatformUpdateValidateSerializer,
)
from app.system.models.attachment import Attachment
from app.system.permissions.attachment_permission import AttachmentPermission
from app.system.serializers.validates.attachment_update_validate_serializer import (
    AttachmentUpdateValidateSerializer,
)
from app.utilities.models.donation_transaction import DonationTransaction
from app.utilities.models.page_path import PagePath
from app.utilities.permissions.donation_permission import DonationPermission
from app.utilities.permissions.page_path_permission import PagePathPermission
from app.utilities.serializers.validates.donation_toggle_validate_serializer import (
    DonationToggleValidateSerializer,
)
from app.workspace.models.subscription_payment import SubscriptionPayment
from app.workspace.permissions.subscription_payment_permission import SubscriptionPaymentPermission
from app.workspace.types.assistant_record_resource import AssistantRecordResource

ASSISTANT_RECORD_RESOURCES: dict[str, AssistantRecordResource] = {
    resource.key: resource
    for resource in (
        AssistantRecordResource(
            key="invoice",
            label="hóa đơn / chứng từ",
            model=Invoice,
            service_attr="invoice_service",
            read_permission=InvoicePermission.READ.code,
            update_permission=InvoicePermission.UPDATE.code,
            update_serializer=InvoiceUpdateValidateSerializer,
            title_fields=("number", "issuer"),
            list_fields=("doc_type", "number", "issuer", "issued_on", "amount", "tax_amount", "note"),
            search_fields=("number", "issuer", "issuer_tax_code", "note"),
            ordering=("-issued_on", "-created_at"),
            detail_path="/ca-nhan/tai-chinh/hoa-don/{id}",
            note="Tạo hóa đơn cần tải file chứng từ nên làm trên giao diện; qua chat chỉ xem/sửa/xóa.",
        ),
        AssistantRecordResource(
            key="platform",
            label="nền tảng thu nhập",
            model=Platform,
            service_attr="platform_service",
            read_permission=PlatformPermission.READ.code,
            update_permission=PlatformPermission.UPDATE.code,
            update_serializer=PlatformUpdateValidateSerializer,
            title_fields=("name",),
            list_fields=("name", "code", "is_active", "note"),
            search_fields=("name", "code", "note"),
            ordering=("name",),
            detail_path="/ca-nhan/tai-chinh/nen-tang/{id}",
        ),
        AssistantRecordResource(
            key="donation",
            label="giao dịch ủng hộ",
            model=DonationTransaction,
            service_attr="donation_service",
            read_permission=DonationPermission.READ.code,
            update_permission=DonationPermission.UPDATE.code,
            update_serializer=DonationToggleValidateSerializer,
            title_fields=("donor_title",),
            list_fields=("donor_title", "amount", "message", "received_at", "is_hidden"),
            search_fields=("donor_title", "message"),
            ordering=("-received_at",),
            detail_path="/ca-nhan/quyen-gop",
            note="Chỉ ẩn/hiện bình luận (`is_hidden`); giao dịch đến từ SePay nên không tạo/xóa.",
        ),
        AssistantRecordResource(
            key="file",
            label="file trong thư viện",
            model=Attachment,
            service_attr="attachment_service",
            read_permission=AttachmentPermission.FILE_READ.code,
            update_permission=AttachmentPermission.FILE_UPDATE.code,
            update_serializer=AttachmentUpdateValidateSerializer,
            owner_field="created_by",
            title_fields=("original_name",),
            list_fields=("original_name", "content_type", "size", "visibility", "created_at"),
            search_fields=("original_name", "alt_text"),
            detail_path="/ca-nhan/thu-vien",
            base_filter={"purged_at__isnull": True},
            note="Tải file lên làm trên giao diện; qua chat xem, đổi tên/mô tả, xóa.",
        ),
        AssistantRecordResource(
            key="subscription_payment",
            label="lần thanh toán dịch vụ",
            model=SubscriptionPayment,
            service_attr="subscription_payment_service",
            read_permission=SubscriptionPaymentPermission.READ.code,
            title_fields=("subscription__name",),
            list_fields=("subscription__name", "paid_on", "period_from", "period_to", "amount_vnd", "note"),
            search_fields=("subscription__name", "note"),
            ordering=("-paid_on",),
            detail_path="/ca-nhan/gia-han",
            note="Ghi lần thanh toán mới dùng `renew_subscription`.",
        ),
        AssistantRecordResource(
            key="page_path",
            label="đường dẫn giữa của trang",
            model=PagePath,
            service_attr="page_path_service",
            read_permission=PagePathPermission.PATH_READ.code,
            owner_field="",
            title_fields=("segment",),
            list_fields=("segment", "name", "description", "is_active"),
            search_fields=("segment", "name"),
            ordering=("position", "segment"),
            base_filter={"is_active": True},
            note="Dùng chung toàn hệ thống; đổi đường dẫn giữa của trang bằng `update_page(path_segment)`.",
        ),
    )
}
