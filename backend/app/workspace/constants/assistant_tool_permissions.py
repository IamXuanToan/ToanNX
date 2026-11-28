"""Bảng ánh xạ quyền RBAC và danh sách tool xác nhận 2 bước cho Trợ lý AI (chỉ Client Portal)."""

from app.finance.permissions.income_permission import IncomePermission
from app.finance.permissions.invoice_permission import InvoicePermission
from app.finance.permissions.platform_permission import PlatformPermission
from app.system.permissions.attachment_permission import AttachmentPermission
from app.utilities.permissions.page_permission import PagePermission
from app.utilities.permissions.qr_code_permission import QrCodePermission
from app.utilities.permissions.short_link_permission import ShortLinkPermission
from app.workspace.permissions.asset_permission import AssetPermission
from app.workspace.permissions.asset_warranty_claim_permission import AssetWarrantyClaimPermission
from app.workspace.permissions.reminder_permission import ReminderPermission
from app.workspace.permissions.subscription_payment_permission import SubscriptionPaymentPermission
from app.workspace.permissions.subscription_permission import SubscriptionPermission
from app.workspace.permissions.vault_item_permission import VaultItemPermission
from app.workspace.permissions.workspace_dashboard_permission import WorkspaceDashboardPermission

READ_TOOL_NAMES = frozenset(
    {
        "get_my_capabilities",
        "get_my_profile",
        "get_personal_statistics",
        "get_upcoming_events",
        "get_spending_summary",
        "get_finance_income_summary",
        "list_finance_platforms",
        "get_upcoming_subscriptions",
        "get_pending_reminders",
        "get_assets_and_warranty",
        "list_warranty_claims",
        "list_vault_items",
        "reveal_vault_secret",
        "get_stale_projects",
        "list_short_links",
        "list_qr_codes",
        "list_pages",
        "list_my_records",
    }
)

OWNER_SENSITIVE_READ_TOOL_NAMES = frozenset(
    {
        "get_my_profile",
        "list_vault_items",
        "reveal_vault_secret",
        # Hóa đơn, giao dịch ủng hộ, file: chỉ chủ sở hữu xem (thành viên khác trong nhóm Telegram không
        # thấy).
        "list_my_records",
    }
)

OWNER_MUTATION_TOOL_NAMES = frozenset(
    {
        "update_my_profile",
        "create_quick_reminder",
        "update_reminder",
        "create_finance_income",
        "update_finance_income",
        "create_finance_platform",
        "create_asset",
        "update_asset",
        "create_warranty_claim",
        "update_warranty_claim",
        "create_subscription",
        "update_subscription",
        "renew_subscription",
        "create_vault_item",
        "update_vault_item",
        "create_short_link",
        "update_short_link",
        "create_qr_code",
        "update_qr_code",
        "create_page",
        "update_page",
        "update_my_record",
        "delete_personal_record",
    }
)

CONFIRMATION_REQUIRED_TOOLS = frozenset({"delete_personal_record"})

ALL_TOOL_NAMES = READ_TOOL_NAMES | OWNER_MUTATION_TOOL_NAMES

# Ánh xạ quyền RBAC thực tế cho mọi tool đọc & ghi theo module (chặn AI free vượt quyền)
TOOL_PERMISSION_MAP: dict[str, str] = {
    "get_spending_summary": WorkspaceDashboardPermission.READ.code,
    "get_finance_income_summary": IncomePermission.READ.code,
    "list_finance_platforms": PlatformPermission.READ.code,
    "get_upcoming_subscriptions": SubscriptionPermission.READ.code,
    "get_pending_reminders": ReminderPermission.READ.code,
    "create_quick_reminder": ReminderPermission.CREATE.code,
    "update_reminder": ReminderPermission.UPDATE.code,
    "get_assets_and_warranty": AssetPermission.READ.code,
    "list_warranty_claims": AssetWarrantyClaimPermission.READ.code,
    "list_short_links": ShortLinkPermission.READ.code,
    "list_vault_items": VaultItemPermission.READ.code,
    "reveal_vault_secret": VaultItemPermission.REVEAL.code,
    "create_vault_item": VaultItemPermission.CREATE.code,
    "update_vault_item": VaultItemPermission.UPDATE.code,
    "list_qr_codes": QrCodePermission.READ.code,
    "create_qr_code": QrCodePermission.CREATE.code,
    "update_qr_code": QrCodePermission.UPDATE.code,
    "list_pages": PagePermission.READ.code,
    "create_page": PagePermission.CREATE.code,
    "update_page": PagePermission.UPDATE.code,
    "create_finance_income": IncomePermission.CREATE.code,
    "update_finance_income": IncomePermission.UPDATE.code,
    "create_finance_platform": PlatformPermission.CREATE.code,
    "create_asset": AssetPermission.CREATE.code,
    "update_asset": AssetPermission.UPDATE.code,
    "create_warranty_claim": AssetWarrantyClaimPermission.CREATE.code,
    "update_warranty_claim": AssetWarrantyClaimPermission.UPDATE.code,
    "create_subscription": SubscriptionPermission.CREATE.code,
    "update_subscription": SubscriptionPermission.UPDATE.code,
    "renew_subscription": SubscriptionPermission.UPDATE.code,
    "create_short_link": ShortLinkPermission.CREATE.code,
    "update_short_link": ShortLinkPermission.UPDATE.code,
}

DELETE_RESOURCE_PERMISSION_MAP: dict[str, str] = {
    "reminder": ReminderPermission.DELETE.code,
    "income": IncomePermission.DELETE.code,
    "asset": AssetPermission.DELETE.code,
    "warranty_claim": AssetWarrantyClaimPermission.DELETE.code,
    "subscription": SubscriptionPermission.DELETE.code,
    "vault_item": VaultItemPermission.DELETE.code,
    "short_link": ShortLinkPermission.DELETE.code,
    "qr_code": QrCodePermission.DELETE.code,
    "page": PagePermission.DELETE.code,
    "invoice": InvoicePermission.DELETE.code,
    "platform": PlatformPermission.DELETE.code,
    "file": AttachmentPermission.FILE_DELETE.code,
    "subscription_payment": SubscriptionPaymentPermission.DELETE.code,
}
