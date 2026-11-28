"""Trang chi tiết Portal của bản ghi Trợ lý vừa tạo/sửa (`{id}` = ID; khớp `*_PATHNAMES` FE tiếng Việt)."""

from app.workspace.types.assistant_record_link import AssistantRecordLink

_REMINDER = AssistantRecordLink(
    "reminder", "nhắc việc", "/ca-nhan/nhac-viec/{id}", "update_reminder", "reminder_id"
)
_ASSET = AssistantRecordLink("asset", "thiết bị", "/ca-nhan/thiet-bi/{id}", "update_asset", "asset_id")
_CLAIM = AssistantRecordLink(
    "warranty_claim", "phiếu bảo hành", "/ca-nhan/bao-hanh/{id}", "update_warranty_claim", "claim_id"
)
_SUBSCRIPTION = AssistantRecordLink(
    "subscription", "dịch vụ định kỳ", "/ca-nhan/dich-vu/{id}", "update_subscription", "subscription_id"
)
_VAULT = AssistantRecordLink(
    "vault_item", "mục két sắt", "/ca-nhan/ket-sat/{id}", "update_vault_item", "vault_item_id"
)
_SHORT_LINK = AssistantRecordLink(
    "short_link", "link rút gọn", "/ca-nhan/link-rut-gon/{id}", "update_short_link", "short_link_id"
)
_QR = AssistantRecordLink("qr_code", "mã QR", "/ca-nhan/ma-qr/{id}", "update_qr_code", "qr_code_id")
_PAGE = AssistantRecordLink("page", "trang cá nhân", "/ca-nhan/trang/{id}", "update_page", "page_id")
_INCOME = AssistantRecordLink(
    "income", "khoản thu", "/ca-nhan/tai-chinh/thu-nhap/{id}", "update_finance_income", "income_id"
)
_PLATFORM = AssistantRecordLink(
    "platform", "nền tảng", "/ca-nhan/tai-chinh/nen-tang/{id}", "update_my_record", "record_id"
)
_INVOICE = AssistantRecordLink(
    "invoice", "hóa đơn", "/ca-nhan/tai-chinh/hoa-don/{id}", "update_my_record", "record_id"
)
_DONATION = AssistantRecordLink(
    "donation", "giao dịch ủng hộ", "/ca-nhan/quyen-gop", "update_my_record", "record_id"
)
_FILE = AssistantRecordLink("file", "file", "/ca-nhan/thu-vien", "update_my_record", "record_id")
_PROFILE = AssistantRecordLink("profile", "hồ sơ", "/ca-nhan/ho-so")

ASSISTANT_RECORD_LINKS: dict[str, AssistantRecordLink] = {
    "create_quick_reminder": _REMINDER,
    "update_reminder": _REMINDER,
    "create_asset": _ASSET,
    "update_asset": _ASSET,
    "create_warranty_claim": _CLAIM,
    "update_warranty_claim": _CLAIM,
    "create_subscription": _SUBSCRIPTION,
    "update_subscription": _SUBSCRIPTION,
    "create_vault_item": _VAULT,
    "update_vault_item": _VAULT,
    "create_short_link": _SHORT_LINK,
    "update_short_link": _SHORT_LINK,
    "create_qr_code": _QR,
    "update_qr_code": _QR,
    "create_page": _PAGE,
    "update_page": _PAGE,
    "create_finance_income": _INCOME,
    "update_finance_income": _INCOME,
    "create_finance_platform": _PLATFORM,
    "update_my_profile": _PROFILE,
}

# Tool chung `update_my_record`: thẻ lấy theo `resource` trong kết quả.
GENERIC_RECORD_LINKS: dict[str, AssistantRecordLink] = {
    link.card_type: link for link in (_INVOICE, _PLATFORM, _DONATION, _FILE)
}

# Tra theo loại thẻ (dùng khi nhắc lại bản ghi vừa thao tác cho model).
ASSISTANT_RECORD_LINKS_BY_TYPE: dict[str, AssistantRecordLink] = {
    link.card_type: link for link in (*ASSISTANT_RECORD_LINKS.values(), *GENERIC_RECORD_LINKS.values())
}
