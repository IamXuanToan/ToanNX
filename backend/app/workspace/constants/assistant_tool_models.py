"""Tool ↔ model nguồn: sinh mô tả/enum/giới hạn field cho Trợ lý AI từ metadata model (không gõ tay)."""

from django.db import models

from app.finance.models.income import Income
from app.finance.models.platform import Platform
from app.system.models.user import User
from app.utilities.models.page import Page
from app.utilities.models.qr_code import QrCode
from app.utilities.models.short_link import ShortLink
from app.workspace.models.asset import Asset
from app.workspace.models.asset_warranty_claim import AssetWarrantyClaim
from app.workspace.models.reminder import Reminder
from app.workspace.models.subscription import Subscription
from app.workspace.models.vault_item import VaultItem

ASSISTANT_TOOL_MODELS: dict[str, type[models.Model]] = {
    "update_my_profile": User,
    "create_vault_item": VaultItem,
    "update_vault_item": VaultItem,
    "create_quick_reminder": Reminder,
    "update_reminder": Reminder,
    "create_finance_income": Income,
    "update_finance_income": Income,
    "create_finance_platform": Platform,
    "create_asset": Asset,
    "update_asset": Asset,
    "create_warranty_claim": AssetWarrantyClaim,
    "update_warranty_claim": AssetWarrantyClaim,
    "create_subscription": Subscription,
    "update_subscription": Subscription,
    "create_short_link": ShortLink,
    "update_short_link": ShortLink,
    "create_qr_code": QrCode,
    "update_qr_code": QrCode,
    "create_page": Page,
    "update_page": Page,
}
