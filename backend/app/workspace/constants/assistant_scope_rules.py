"""Phạm vi Trợ lý AI: chỉ dữ liệu cá nhân Client Portal; yêu cầu Admin bị từ chối ngay.

Áp dụng cho mọi người dùng kể cả `is_superuser` / `manage_all`: quản trị làm trên giao diện Admin.
"""

# Quản lý tài khoản/người dùng của hệ thống. Bị bỏ qua nếu câu nói rõ là dữ liệu của chính mình hoặc két sắt
# (VD "danh sách tài khoản trong két sắt của tôi").
ADMIN_ACCOUNT_PHRASES: tuple[str, ...] = (
    "danh sach tai khoan",
    "danh sach account",
    "danh sach user",
    "danh sach nguoi dung",
    "danh sach thanh vien",
    "liet ke tai khoan",
    "liet ke account",
    "liet ke user",
    "liet ke nguoi dung",
    "liet ke thanh vien",
    "tat ca tai khoan",
    "tat ca account",
    "tat ca user",
    "tat ca nguoi dung",
    "tat ca thanh vien",
    "bao nhieu tai khoan",
    "bao nhieu account",
    "bao nhieu user",
    "bao nhieu nguoi dung",
    "bao nhieu thanh vien",
    "list user",
    "list users",
    "list account",
    "list accounts",
    "all users",
    "all accounts",
    "tao user",
    "tao nguoi dung",
    "xoa user",
    "xoa nguoi dung",
    "khoa user",
    "khoa nguoi dung",
    "reset mat khau user",
    "reset mat khau nguoi dung",
)

# Dữ liệu người khác / toàn hệ thống: luôn từ chối.
ADMIN_OTHERS_PHRASES: tuple[str, ...] = (
    "cua nguoi khac",
    "cua user khac",
    "cua nguoi dung khac",
    "cua tai khoan khac",
    "cua thanh vien khac",
    "cua moi nguoi",
    "cua tat ca moi nguoi",
    "cua tat ca nguoi dung",
    "nguoi dung khac",
    "user khac",
    "toan he thong",
    "other users",
    "everyone s",
)

# Vai trò, phân quyền, cấu hình & vận hành hệ thống: luôn từ chối.
ADMIN_SYSTEM_PHRASES: tuple[str, ...] = (
    "vai tro",
    "phan quyen",
    "cap quyen",
    "thu hoi quyen",
    "nhom quyen",
    "quyen admin",
    "quyen quan tri",
    "quyen superuser",
    "superuser",
    "role",
    "roles",
    "permission",
    "permissions",
    "cau hinh he thong",
    "cai dat he thong",
    "thiet lap he thong",
    "cau hinh bot",
    "cau hinh tro ly",
    "nhat ky he thong",
    "audit log",
    "webhook",
    "callback",
    "trang quan tri he thong",
    "khu quan tri",
    "quan tri he thong",
    "admin panel",
    "trang admin",
    "chuc nang admin",
    "phien dang nhap cua",
    "token bot",
    "bot token",
    "api key he thong",
    "secret key",
    "bien moi truong",
    "co so du lieu",
    "database",
    "truy van sql",
)

# Có các cụm này thì cụm "tài khoản/người dùng" ở trên được hiểu là dữ liệu cá nhân (két sắt, hồ sơ của mình).
PERSONAL_SCOPE_MARKERS: tuple[str, ...] = (
    "ket sat",
    "vault",
    "cua toi",
    "cua minh",
    "cua tao",
    "my ",
    "ho so",
)

# `update_my_profile` chỉ chạy khi câu nói rõ là hồ sơ/tên của chính mình
# (tránh "đổi tên cái vừa tạo" đổi nhầm tên tài khoản).
PROFILE_INTENT_PHRASES: tuple[str, ...] = (
    "ten toi",
    "ten cua toi",
    "ten minh",
    "ten cua minh",
    "ten hien thi",
    "ho ten",
    "ho so",
    "profile",
    "ten tai khoan cua toi",
)

ASSISTANT_SCOPE_REFUSAL = (
    "⛔ Mình chỉ hỗ trợ dữ liệu **cá nhân của bạn** trong Client Portal (nhắc việc, thu nhập, thiết bị, "
    "dịch vụ, két sắt, link rút gọn, mã QR, trang cá nhân, hồ sơ). Các thao tác quản trị hệ thống như "
    "xem/sửa tài khoản người dùng khác, vai trò, phân quyền, cấu hình, nhật ký hay webhook không thực hiện "
    "qua Trợ lý — "
    "kể cả khi tài khoản của bạn có quyền quản trị. Vui lòng dùng trang Quản trị."
)
