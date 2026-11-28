"""Định nghĩa JSON Schema OpenAI function calling cho toàn bộ tool cá nhân (Client Portal)."""

from typing import Any

from app.utilities.models.page import Page
from app.utilities.models.qr_code import QrCode
from app.utilities.models.short_link import ShortLink
from app.workspace.constants.assistant_record_resources import ASSISTANT_RECORD_RESOURCES
from app.workspace.constants.assistant_tool_permissions import (
    DELETE_RESOURCE_PERMISSION_MAP,
    TOOL_PERMISSION_MAP,
)
from app.workspace.constants.workspace_defaults import ALLOWED_CALENDAR_TYPES
from app.workspace.models.asset import Asset
from app.workspace.models.asset_warranty_claim import AssetWarrantyClaim
from app.workspace.models.reminder import Reminder
from app.workspace.models.subscription import Subscription

# Trợ lý chỉ tạo QR dạng URL/Văn bản; QR chuyển khoản cần chọn ngân hàng nên làm trên giao diện.
ASSISTANT_QR_TYPES: tuple[str, ...] = tuple(
    value for value in QrCode.Type.values if value != QrCode.Type.BANK_TRANSFER
)


def _schema(
    name: str,
    description: str,
    properties: dict[str, Any],
    *,
    required: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "type": "function",
        "function": {
            "name": name,
            "description": description,
            "parameters": {
                "type": "object",
                "properties": properties,
                **({"required": required} if required else {}),
            },
        },
    }


def build_assistant_tool_schemas(*, is_owner: bool = True, actor: Any | None = None) -> list[dict[str, Any]]:
    """Trả danh sách schema tool Client Portal đã lọc đúng theo quyền RBAC của `actor`."""
    schemas: list[dict[str, Any]] = [
        _schema(
            "get_my_capabilities",
            "Liệt kê các module & thao tác cá nhân trong hệ thống mà tài khoản đang có quyền sử dụng.",
            {},
        ),
        _schema(
            "get_personal_statistics",
            (
                "Xem thống kê tổng hợp cá nhân "
                "(thu nhập, chi tiêu, nhắc việc, thiết bị, dịch vụ, link, QR, két sắt)."
            ),
            {
                "month": {"type": "integer", "minimum": 1, "maximum": 12},
                "year": {"type": "integer", "minimum": 2020, "maximum": 2100},
                "days": {"type": "integer", "minimum": 1, "maximum": 365},
            },
        ),
        _schema(
            "get_upcoming_events",
            (
                "Xem lịch tổng hợp các sự kiện SẮP TỚI trong N ngày tới "
                "(nhắc việc, gia hạn dịch vụ, hết bảo hành, hẹn trả sửa chữa)."
            ),
            {
                "days_ahead": {"type": "integer", "minimum": 1, "maximum": 90},
                "types": {
                    "type": "array",
                    "items": {"type": "string", "enum": sorted(ALLOWED_CALENDAR_TYPES)},
                },
            },
        ),
        _schema(
            "get_spending_summary",
            "Xem tổng hợp chi tiêu cá nhân trong tháng (gia hạn dịch vụ, mua thiết bị, sửa chữa).",
            {
                "month": {"type": "integer", "minimum": 1, "maximum": 12},
                "year": {"type": "integer", "minimum": 2020, "maximum": 2100},
            },
        ),
        _schema(
            "get_finance_income_summary",
            (
                "Xem dòng tiền thu nhập cá nhân: hỗ trợ `days` gần nhất (vd `days=5`), "
                "`from_date`..`to_date`, hoặc `month`/`year`."
            ),
            {
                "days": {"type": "integer", "minimum": 1, "maximum": 365},
                "from_date": {"type": "string", "description": "YYYY-MM-DD"},
                "to_date": {"type": "string", "description": "YYYY-MM-DD"},
                "month": {"type": "integer", "minimum": 1, "maximum": 12},
                "year": {"type": "integer", "minimum": 2020, "maximum": 2100},
                "platform_name": {"type": "string", "maxLength": 100},
            },
        ),
        _schema(
            "list_finance_platforms",
            "Liệt kê các nền tảng thu nhập đang bật (TikTok, YouTube, Affiliate...).",
            {},
        ),
        _schema(
            "get_upcoming_subscriptions",
            "Xem các dịch vụ định kỳ (domain, VPS, SaaS) sắp gia hạn trong N ngày tới.",
            {"days_ahead": {"type": "integer", "minimum": 1, "maximum": 90}},
        ),
        _schema(
            "get_pending_reminders",
            "Xem nhắc việc chưa hoàn thành (`today`, `overdue`, `week`, `all`), lọc thêm theo `query`.",
            {
                "scope": {"type": "string", "enum": ["today", "overdue", "week", "all"]},
                "query": {"type": "string", "maxLength": 100},
            },
        ),
        _schema(
            "get_assets_and_warranty",
            "Tra cứu danh sách thiết bị, nơi mua và thời hạn bảo hành cá nhân.",
            {
                "query": {"type": "string", "maxLength": 100},
                "status": {"type": "string", "enum": [c[0] for c in Asset.Status.choices]},
            },
        ),
        _schema(
            "list_warranty_claims",
            "Tra cứu danh sách phiếu bảo hành / sửa chữa thiết bị.",
            {"query": {"type": "string", "maxLength": 100}},
        ),
        _schema(
            "get_stale_projects",
            "Tìm các trang tùy chỉnh hoặc truyện của chính chủ lâu chưa cập nhật.",
            {"days": {"type": "integer", "minimum": 1, "maximum": 365}},
        ),
        _schema(
            "list_short_links",
            "Tra cứu danh sách liên kết rút gọn của chính chủ.",
            {"query": {"type": "string", "maxLength": 100}},
        ),
        _schema(
            "list_qr_codes",
            "Tra cứu danh sách mã QR của chính chủ.",
            {"query": {"type": "string", "maxLength": 100}},
        ),
        _schema(
            "list_pages",
            "Tra cứu danh sách trang tùy chỉnh cá nhân của chính chủ.",
            {"query": {"type": "string", "maxLength": 100}},
        ),
    ]
    if is_owner:
        schemas.extend(_owner_only_schemas())
    if actor is None or getattr(actor, "is_superuser", False):
        return schemas
    return _filter_schemas_for_actor(schemas, actor)


def _filter_schemas_for_actor(schemas: list[dict[str, Any]], actor: Any) -> list[dict[str, Any]]:
    filtered: list[dict[str, Any]] = []
    for schema in schemas:
        fn = schema["function"]
        name = str(fn["name"])
        required_perm = TOOL_PERMISSION_MAP.get(name)
        if required_perm and not actor.has_perm(required_perm):
            continue
        if name == "delete_personal_record":
            allowed_types = [
                res_type
                for res_type, perm in sorted(DELETE_RESOURCE_PERMISSION_MAP.items())
                if actor.has_perm(perm)
            ]
            if not allowed_types:
                continue
            fn = {
                **fn,
                "parameters": {
                    **fn["parameters"],
                    "properties": {
                        **fn["parameters"]["properties"],
                        "resource_type": {"type": "string", "enum": allowed_types},
                    },
                },
            }
            schema = {**schema, "function": fn}
        filtered.append(schema)
    return filtered


def _owner_only_schemas() -> list[dict[str, Any]]:
    return [
        _schema(
            "get_my_profile",
            "Xem thông tin hồ sơ cá nhân của chính mình (họ tên, username, email, vai trò).",
            {},
        ),
        _schema(
            "update_my_profile",
            "Cập nhật thông tin hồ sơ cá nhân của chính mình (vd đổi tên hiển thị `full_name`).",
            {"full_name": {"type": "string", "minLength": 1, "maxLength": 150}},
            required=["full_name"],
        ),
        _schema(
            "list_vault_items",
            "Tìm kiếm danh sách mục trong Két sắt bí mật cá nhân (che mật khẩu).",
            {"query": {"type": "string", "maxLength": 100}},
        ),
        _schema(
            "reveal_vault_secret",
            "Giải mã và đọc mã số / mật khẩu thật của một mục trong Két sắt cá nhân (có ghi nhật ký).",
            {"vault_item_id": {"type": "string"}},
            required=["vault_item_id"],
        ),
        _schema(
            "create_vault_item",
            "Lưu mục bí mật mới vào Két sắt cá nhân.",
            {
                "title": {"type": "string", "minLength": 1, "maxLength": 200},
                "secret": {"type": "string", "minLength": 1},
                "username": {"type": "string", "maxLength": 150},
                "category": {"type": "string", "maxLength": 80},
                "url": {"type": "string", "maxLength": 500},
                "notes": {"type": "string", "maxLength": 1000},
            },
            required=["title", "secret"],
        ),
        _schema(
            "update_vault_item",
            "Cập nhật mục Két sắt cá nhân (đổi tiêu đề, tài khoản, mã bí mật, ghi chú).",
            {
                "vault_item_id": {"type": "string"},
                "title": {"type": "string", "maxLength": 200},
                "secret": {"type": "string"},
                "username": {"type": "string", "maxLength": 150},
                "category": {"type": "string", "maxLength": 80},
                "url": {"type": "string", "maxLength": 500},
                "notes": {"type": "string", "maxLength": 1000},
            },
            required=["vault_item_id"],
        ),
        _schema(
            "create_quick_reminder",
            (
                "Tạo nhắc việc cá nhân mới. Hỗ trợ báo trước theo phút (`notify_minutes_before`, "
                "vd 1 phút = 1), báo trước theo ngày (`reminder_days_before`) và lặp lại (`recurrence`)."
            ),
            {
                "title": {"type": "string", "minLength": 1, "maxLength": 200},
                "due_date": {"type": "string", "description": "YYYY-MM-DD (mặc định hôm nay)"},
                "due_time": {"type": "string", "description": "HH:MM tùy chọn"},
                "notify_minutes_before": {
                    "type": "integer",
                    "minimum": 0,
                    "maximum": 1440,
                    "description": "Số phút báo trước giờ đến hạn (vd 1, 5, 15, 30).",
                },
                "reminder_days_before": {
                    "type": "array",
                    "items": {"type": "integer", "minimum": 0, "maximum": 365},
                    "description": "Danh sách số ngày nhắc trước (vd [7, 3, 1]).",
                },
                "recurrence": {
                    "type": "string",
                    "enum": [c[0] for c in Reminder.Recurrence.choices],
                },
                "priority": {"type": "string", "enum": [c[0] for c in Reminder.Priority.choices]},
                "description": {"type": "string", "maxLength": 1000},
                "topic_name": {
                    "type": "string",
                    "description": (
                        "Tên chủ đề nhắc việc (Công việc, Ngày kỷ niệm, Ngày giỗ, Gia đình, Sinh nhật, "
                        "Sức khỏe, Tài chính hoặc chủ đề riêng của người dùng)."
                    ),
                },
            },
            required=["title"],
        ),
        _schema(
            "update_reminder",
            (
                "Cập nhật nhắc việc (tiêu đề, ngày/giờ, báo trước phút/ngày, "
                "lặp lại, chủ đề, ưu tiên, hoàn thành)."
            ),
            {
                "reminder_id": {"type": "string"},
                "title": {"type": "string", "maxLength": 200},
                "due_date": {"type": "string"},
                "due_time": {"type": "string"},
                "notify_minutes_before": {"type": "integer", "minimum": 0, "maximum": 1440},
                "reminder_days_before": {
                    "type": "array",
                    "items": {"type": "integer", "minimum": 0, "maximum": 365},
                },
                "recurrence": {
                    "type": "string",
                    "enum": [c[0] for c in Reminder.Recurrence.choices],
                },
                "priority": {"type": "string", "enum": [c[0] for c in Reminder.Priority.choices]},
                "description": {"type": "string", "maxLength": 1000},
                "topic_name": {"type": "string", "description": "Tên chủ đề nhắc việc."},
                "is_completed": {"type": "boolean"},
            },
            required=["reminder_id"],
        ),
        _schema(
            "create_finance_income",
            (
                "Ghi nhận khoản thu nhập (vd 'tiền afff 30k' -> amount='30k', platform_name='afff'). "
                "Nếu nền tảng không khớp rõ ràng, tool trả needs_clarification để hỏi lại người dùng."
            ),
            {
                "amount": {"type": "string", "description": "Số tiền, hỗ trợ '30k', '1tr5' hoặc số thuần"},
                "platform_name": {"type": "string", "maxLength": 100},
                "platform_id": {"type": "string"},
                "currency_code": {"type": "string", "description": "Mặc định VND"},
                "received_date": {"type": "string", "description": "YYYY-MM-DD, mặc định hôm nay"},
                "content": {"type": "string", "maxLength": 255},
                "note": {"type": "string", "maxLength": 500},
                "allow_unclassified": {"type": "boolean"},
            },
            required=["amount"],
        ),
        _schema(
            "create_finance_platform",
            "Tạo nền tảng thu nhập mới.",
            {
                "name": {"type": "string", "minLength": 1, "maxLength": 120},
                "code": {"type": "string", "maxLength": 40},
                "currency_code": {"type": "string"},
                "description": {"type": "string", "maxLength": 500},
            },
            required=["name"],
        ),
        _schema(
            "update_finance_income",
            "Cập nhật thông tin khoản thu nhập đã tạo.",
            {
                "income_id": {"type": "string"},
                "amount": {"type": "string"},
                "platform_name": {"type": "string"},
                "received_date": {"type": "string"},
                "content": {"type": "string", "maxLength": 255},
            },
            required=["income_id"],
        ),
        _schema(
            "create_asset",
            "Thêm thiết bị cá nhân mới (tên, hãng, model, serial, giá, nơi mua, bảo hành, ghi chú).",
            {
                "name": {"type": "string", "minLength": 1, "maxLength": 200},
                "category": {"type": "string", "enum": [c[0] for c in Asset.Category.choices]},
                "brand": {"type": "string", "maxLength": 100},
                "model_code": {"type": "string", "maxLength": 100},
                "serial_number": {"type": "string", "maxLength": 120},
                "imei": {"type": "string", "maxLength": 60},
                "purchase_date": {"type": "string"},
                "purchase_price": {"type": "string"},
                "currency_code": {"type": "string"},
                "warranty_months": {"type": "integer", "minimum": 0, "maximum": 240},
                "warranty_provider": {"type": "string", "maxLength": 150},
                "warranty_note": {"type": "string", "maxLength": 500},
                "purchase_store": {"type": "string", "maxLength": 150},
                "notes": {"type": "string", "maxLength": 1000},
            },
            required=["name"],
        ),
        _schema(
            "update_asset",
            "Cập nhật thiết bị cá nhân (đổi tên, hãng, model, serial, nơi mua, trạng thái, giá, bảo hành).",
            {
                "asset_id": {"type": "string"},
                "name": {"type": "string", "maxLength": 200},
                "brand": {"type": "string", "maxLength": 100},
                "model_code": {"type": "string", "maxLength": 100},
                "serial_number": {"type": "string", "maxLength": 120},
                "status": {"type": "string", "enum": [c[0] for c in Asset.Status.choices]},
                "purchase_store": {"type": "string", "maxLength": 150},
                "purchase_price": {"type": "string"},
                "warranty_months": {"type": "integer", "minimum": 0, "maximum": 240},
                "warranty_provider": {"type": "string", "maxLength": 150},
                "warranty_note": {"type": "string", "maxLength": 500},
                "notes": {"type": "string", "maxLength": 1000},
            },
            required=["asset_id"],
        ),
        _schema(
            "create_warranty_claim",
            "Tạo phiếu bảo hành / sửa chữa cho một thiết bị.",
            {
                "asset_id": {"type": "string"},
                "asset_name": {"type": "string"},
                "claim_type": {
                    "type": "string",
                    "enum": [c[0] for c in AssetWarrantyClaim.ClaimType.choices],
                },
                "issue_description": {"type": "string", "maxLength": 500},
                "submitted_date": {"type": "string"},
                "service_center": {"type": "string", "maxLength": 150},
                "cost": {"type": "string"},
                "currency_code": {"type": "string"},
            },
            required=["issue_description"],
        ),
        _schema(
            "update_warranty_claim",
            "Cập nhật phiếu bảo hành / sửa chữa (trạng thái, mô tả, trung tâm, chi phí).",
            {
                "claim_id": {"type": "string"},
                "status": {
                    "type": "string",
                    "enum": [c[0] for c in AssetWarrantyClaim.Status.choices],
                },
                "issue_description": {"type": "string", "maxLength": 500},
                "service_center": {"type": "string", "maxLength": 150},
                "cost": {"type": "string"},
            },
            required=["claim_id"],
        ),
        _schema(
            "create_subscription",
            "Tạo dịch vụ định kỳ mới (VPS, domain, SaaS...) kèm ngày nhắc trước & tự động gia hạn.",
            {
                "name": {"type": "string", "minLength": 1, "maxLength": 200},
                "provider": {"type": "string", "maxLength": 150},
                "category": {"type": "string", "maxLength": 80},
                "billing_cycle": {
                    "type": "string",
                    "enum": [c[0] for c in Subscription.BillingCycle.choices],
                },
                "custom_cycle_days": {"type": "integer", "minimum": 1, "maximum": 3650},
                "amount": {"type": "string"},
                "currency_code": {"type": "string"},
                "renew_date": {"type": "string", "description": "YYYY-MM-DD"},
                "auto_renew": {"type": "boolean"},
                "reminder_days_before": {
                    "type": "array",
                    "items": {"type": "integer", "minimum": 0, "maximum": 365},
                },
                "notes": {"type": "string", "maxLength": 1000},
            },
            required=["name", "amount"],
        ),
        _schema(
            "update_subscription",
            "Cập nhật dịch vụ định kỳ (đổi tên, nhà cung cấp, chu kỳ, giá, ngày gia hạn, nhắc trước).",
            {
                "subscription_id": {"type": "string"},
                "name": {"type": "string", "maxLength": 200},
                "provider": {"type": "string", "maxLength": 150},
                "category": {"type": "string", "maxLength": 80},
                "billing_cycle": {
                    "type": "string",
                    "enum": [c[0] for c in Subscription.BillingCycle.choices],
                },
                "amount": {"type": "string"},
                "renew_date": {"type": "string"},
                "auto_renew": {"type": "boolean"},
                "reminder_days_before": {
                    "type": "array",
                    "items": {"type": "integer", "minimum": 0, "maximum": 365},
                },
                "is_active": {"type": "boolean"},
                "notes": {"type": "string", "maxLength": 1000},
            },
            required=["subscription_id"],
        ),
        _schema(
            "renew_subscription",
            "Ghi nhận gia hạn cho dịch vụ định kỳ.",
            {
                "subscription_id": {"type": "string"},
                "subscription_name": {"type": "string"},
                "paid_on": {"type": "string"},
                "amount": {"type": "string"},
            },
        ),
        _schema(
            "create_short_link",
            (
                "Tạo liên kết rút gọn mới. CHỈ gọi khi đã rõ chế độ mở (`auto_redirect_seconds`: "
                "null=chờ bấm nút, 1=chuyển ngay, N=đếm ngược N giây) và mật khẩu (`password`); "
                "nếu người dùng chưa nêu rõ, hãy hỏi lại trước khi tạo."
            ),
            {
                "destination_url": {"type": "string"},
                "slug": {"type": "string"},
                "name": {"type": "string", "maxLength": 150},
                "description": {"type": "string", "maxLength": 1000},
                "auto_redirect_seconds": {
                    "type": ["integer", "null"],
                    "minimum": 1,
                    "maximum": 60,
                    "description": (
                        "null = chờ bấm nút; 1 = chuyển ngay; N = đếm ngược N giây (1..60). "
                        "Chỉ truyền khi người dùng đã nói rõ; hệ thống tự hỏi nếu thiếu."
                    ),
                },
                "password": {"type": "string", "description": "Mật khẩu bảo vệ (để trống = không đặt)."},
                "expires_at": {"type": "string", "description": "Ngày hết hạn YYYY-MM-DD (tùy chọn)."},
            },
            required=["destination_url"],
        ),
        _schema(
            "update_short_link",
            "Cập nhật liên kết rút gọn (tên, slug, URL đích, chế độ chuyển hướng, mật khẩu, trạng thái).",
            {
                "short_link_id": {"type": "string"},
                "name": {"type": "string", "maxLength": 150},
                "slug": {"type": "string"},
                "destination_url": {"type": "string"},
                "description": {"type": "string", "maxLength": 1000},
                "auto_redirect_seconds": {"type": ["integer", "null"], "minimum": 1, "maximum": 60},
                "password": {"type": "string"},
                "status": {"type": "string", "enum": list(ShortLink.Status.values)},
                "expires_at": {"type": ["string", "null"]},
            },
            required=["short_link_id"],
        ),
        _schema(
            "create_qr_code",
            "Tạo mã QR mới cho đường dẫn hoặc văn bản.",
            {
                "name": {"type": "string", "maxLength": 150},
                "content_text": {"type": "string"},
                "qr_type": {"type": "string", "enum": list(ASSISTANT_QR_TYPES)},
            },
            required=["name", "content_text"],
        ),
        _schema(
            "update_qr_code",
            "Cập nhật mã QR (đổi tên, nội dung).",
            {
                "qr_code_id": {"type": "string"},
                "name": {"type": "string", "maxLength": 150},
                "content_text": {"type": "string"},
                "qr_type": {"type": "string", "enum": list(ASSISTANT_QR_TYPES)},
            },
            required=["qr_code_id"],
        ),
        _schema(
            "create_page",
            (
                "Tạo trang tùy chỉnh cá nhân mới (bản nháp). Mặc định đường dẫn giữa `p` (/p/<slug>); "
                "người dùng nói đường dẫn khác (VD 'kp') thì truyền `path_segment`, chưa có mà người dùng "
                "muốn tạo thì thêm `create_path_if_missing=true`."
            ),
            {
                "title": {"type": "string", "minLength": 1, "maxLength": 200},
                "slug": {"type": "string"},
                "path_segment": {
                    "type": "string",
                    "description": "Đoạn đường dẫn giữa 1–32 ký tự a-z, 0-9, '-'.",
                },
                "create_path_if_missing": {
                    "type": "boolean",
                    "description": "true = tự tạo đường dẫn giữa nếu chưa có (người dùng đã yêu cầu).",
                },
            },
            required=["title"],
        ),
        _schema(
            "update_page",
            (
                "Cập nhật trang cá nhân: tiêu đề, slug, mô tả, trạng thái (nháp/công khai/ngừng công "
                "khai) và "
                "ĐƯỜNG DẪN GIỮA (`path_segment`, VD 'kp' để URL thành /kp/<slug>). Đường dẫn giữa chưa "
                "có thì "
                "truyền `create_path_if_missing=true` khi người dùng muốn tự tạo (cần quyền tạo đường "
                "dẫn giữa)."
            ),
            {
                "page_id": {"type": "string"},
                "title": {"type": "string", "maxLength": 200},
                "slug": {"type": "string"},
                "description": {"type": "string", "maxLength": 1000},
                "status": {"type": "string", "enum": list(Page.Status.values)},
                "path_segment": {
                    "type": "string",
                    "description": "Đoạn đường dẫn giữa 1–32 ký tự a-z, 0-9, '-'.",
                },
                "create_path_if_missing": {
                    "type": "boolean",
                    "description": "true = tự tạo đường dẫn giữa nếu chưa có (người dùng đã yêu cầu).",
                },
            },
            required=["page_id"],
        ),
        _schema(
            "list_my_records",
            (
                "Liệt kê dữ liệu cá nhân khác trong Client Portal: hóa đơn/chứng từ (`invoice`), nền "
                "tảng thu nhập "
                "(`platform`), giao dịch ủng hộ (`donation`), file thư viện (`file`), lịch sử thanh toán "
                "dịch vụ "
                "(`subscription_payment`), đường dẫn giữa của trang (`page_path`). Lọc bằng `query` "
                "(không dấu)."
            ),
            {
                "resource": {"type": "string", "enum": list(ASSISTANT_RECORD_RESOURCES)},
                "query": {"type": "string", "maxLength": 100},
            },
            required=["resource"],
        ),
        _schema(
            "update_my_record",
            (
                "Sửa một bản ghi cá nhân thuộc các loại của `list_my_records`: hóa đơn (number, issuer, "
                "issued_on, "
                "doc_type, note...), nền tảng (name, code, is_active, note), giao dịch ủng hộ "
                "(is_hidden), file "
                "(original_name, alt_text). `fields` chỉ gồm trường người dùng muốn đổi; dùng ID trong "
                "BẢN GHI VỪA "
                "THAO TÁC hoặc từ `list_my_records`."
            ),
            {
                "resource": {"type": "string", "enum": list(ASSISTANT_RECORD_RESOURCES)},
                "record_id": {"type": "string"},
                "fields": {"type": "object", "description": "Các trường cần đổi (tên trường như API)."},
            },
            required=["resource", "record_id", "fields"],
        ),
        _schema(
            "delete_personal_record",
            (
                "Xóa bản ghi cá nhân. Lần đầu gọi với confirmed=false để hỏi xác nhận từ người dùng; "
                "chỉ truyền confirmed=true ở lượt chat sau khi người dùng đã đồng ý."
            ),
            {
                "resource_type": {
                    "type": "string",
                    "enum": sorted(DELETE_RESOURCE_PERMISSION_MAP.keys()),
                },
                "record_id": {"type": "string"},
                "confirmed": {"type": "boolean"},
            },
            required=["resource_type", "record_id"],
        ),
    ]
