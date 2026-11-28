"""Nhóm tool theo chủ đề + cụm từ khóa không dấu để router chỉ gửi tool liên quan cho model free."""

# Luôn gửi kèm: tra năng lực, tổng hợp và xóa 2 bước (câu nối tiếp kiểu "xóa cái đó").
CORE_TOOL_NAMES: tuple[str, ...] = (
    "get_my_capabilities",
    "get_personal_statistics",
    "get_upcoming_events",
    "delete_personal_record",
    "list_my_records",
    "update_my_record",
)

# (cụm từ khóa không dấu, tên tool) — khớp bất kỳ cụm nào thì thêm cả nhóm.
TOOL_GROUPS: dict[str, tuple[tuple[str, ...], tuple[str, ...]]] = {
    "short_link": (
        ("link", "rut gon", "short", "slug", "url", "duong dan"),
        ("create_short_link", "update_short_link", "list_short_links"),
    ),
    "qr": (("qr", "ma qr"), ("create_qr_code", "update_qr_code", "list_qr_codes")),
    "page": (
        ("trang ca nhan", "page", "trang", "duong dan giua"),
        ("create_page", "update_page", "list_pages", "get_stale_projects"),
    ),
    "finance": (
        ("thu nhap", "tien", "nen tang", "dong tien", "income", "doanh thu", "chi tieu", "kiem duoc"),
        (
            "create_finance_income",
            "update_finance_income",
            "create_finance_platform",
            "list_finance_platforms",
            "get_finance_income_summary",
            "get_spending_summary",
        ),
    ),
    "reminder": (
        ("nhac", "viec", "hom nay", "sap toi", "reminder", "deadline", "lich"),
        ("create_quick_reminder", "update_reminder", "get_pending_reminders"),
    ),
    "asset": (
        ("thiet bi", "bao hanh", "sua chua", "laptop", "dien thoai", "may tinh", "asset"),
        (
            "create_asset",
            "update_asset",
            "get_assets_and_warranty",
            "create_warranty_claim",
            "update_warranty_claim",
            "list_warranty_claims",
        ),
    ),
    "subscription": (
        ("dich vu", "gia han", "subscription", "ten mien", "domain", "hosting", "vps", "goi cuoc"),
        ("create_subscription", "update_subscription", "renew_subscription", "get_upcoming_subscriptions"),
    ),
    "vault": (
        ("ket sat", "mat khau", "bi mat", "vault", "tai khoan"),
        ("list_vault_items", "reveal_vault_secret", "create_vault_item", "update_vault_item"),
    ),
    "profile": (
        ("ho so", "profile", "ten toi", "ten cua toi", "ten hien thi", "ho ten", "ten minh"),
        ("get_my_profile", "update_my_profile"),
    ),
}
