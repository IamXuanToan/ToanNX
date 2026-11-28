"""Field người dùng phải tự quyết khi Trợ lý AI tạo mới; câu hỏi/nhãn/enum/giới hạn tự lấy từ model.

Thêm tool mới chỉ cần khai tên field (và mốc gợi ý nếu là số); field có `choices`/boolean tự có lựa chọn.
"""

from app.workspace.types.assistant_ask_field import AssistantAskField
from app.workspace.types.assistant_number_unit import AssistantNumberUnit

UNIT_SECOND = AssistantNumberUnit("giây", ("giay", "s", "sec", "giây"))
UNIT_MINUTE = AssistantNumberUnit("phút", ("phut", "ph", "p", "min", "minute", "minutes"))
UNIT_HOUR_AS_MINUTES = AssistantNumberUnit("giờ", ("tieng", "gio", "h", "hour", "hours"), factor=60)
UNIT_DAY = AssistantNumberUnit("ngày", ("ngay", "day", "days"))
UNIT_MONTH = AssistantNumberUnit("tháng", ("thang", "month", "months"))

BEFORE_WORDS = ("truoc", "som", "before")
# Từ chung chung không đủ làm tiêu đề nhắc việc ("Tạo 1 nhắc lịch" → phải hỏi nhắc việc gì).
GENERIC_REMINDER_TITLE_WORDS: tuple[str, ...] = (
    "nhac",
    "lich",
    "viec",
    "cong",
    "nho",
    "hen",
    "moi",
    "tao",
    "toi",
    "luc",
    "hom",
    "nay",
    "mai",
    "ngay",
    "gio",
    "sang",
    "chieu",
    "trua",
    "reminder",
    "task",
    "todo",
    "note",
    "ghi",
    "chu",
    "mot",
    "cai",
)

ASSISTANT_ASK_FIELDS: dict[str, tuple[AssistantAskField, ...]] = {
    "create_quick_reminder": (
        AssistantAskField(
            "title",
            value_kind="text",
            generic_values=GENERIC_REMINDER_TITLE_WORDS,
            question="Bạn muốn nhắc việc gì?",
            placeholder="VD Họp team dự án, Đóng tiền điện",
        ),
        AssistantAskField(
            "due_date",
            value_kind="date",
            presets=("@today", "@tomorrow", "@day_after", "@next_week"),
            preset_labels={
                "@today": "Hôm nay",
                "@tomorrow": "Ngày mai",
                "@day_after": "Ngày kia",
                "@next_week": "Tuần sau",
            },
            question="Nhắc vào ngày nào?",
            placeholder="VD 05/12 hoặc 2026-12-05",
        ),
        AssistantAskField(
            "due_time",
            value_kind="time",
            presets=("", "08:00", "09:00", "12:00", "14:00", "17:00", "20:00"),
            preset_labels={"": "Cả ngày (không giờ)"},
            question="Nhắc lúc mấy giờ?",
            placeholder="VD 14:30 hoặc 2h chiều",
        ),
        AssistantAskField(
            "notify_minutes_before",
            presets=(0, 5, 15, 30, 60),
            unit=UNIT_MINUTE,
            alt_units=(UNIT_HOUR_AS_MINUTES,),
            preset_label="Trước {n} phút",
            zero_label="Không nhắc trước (đúng giờ)",
            extra_hints={0: ("dung gio", "khong nhac truoc", "khong can nhac truoc", "khong bao truoc")},
            context_words=BEFORE_WORDS,
            when_arg_present="due_time",
        ),
        AssistantAskField(
            "reminder_days_before",
            presets=((), (1,), (3, 1), (7, 3, 1)),
            unit=UNIT_DAY,
            preset_label="Trước {n} ngày",
            zero_label="Không nhắc trước",
            extra_hints={(): ("khong nhac truoc", "khong can nhac truoc", "khong bao truoc")},
            context_words=BEFORE_WORDS,
            when_arg_absent="due_time",
            list_value=True,
        ),
        AssistantAskField(
            "recurrence",
            extra_hints={
                "NONE": ("mot lan", "1 lan", "khong lap", "khong lap lai"),
                "DAILY": ("moi ngay", "hang ngay", "hang ngay"),
                "WEEKLY": ("moi tuan", "hang tuan"),
                "MONTHLY": ("moi thang", "hang thang"),
                "YEARLY": ("moi nam", "hang nam"),
            },
        ),
    ),
    "create_short_link": (
        AssistantAskField(
            "auto_redirect_seconds",
            presets=(None, 1, 3, 5, 10),
            unit=UNIT_SECOND,
            preset_label="Đếm ngược {n} giây",
            preset_labels={1: "Chuyển ngay (1 giây)"},
            null_label="Chờ bấm nút",
            extra_hints={
                None: ("cho bam", "bam nut", "nut bam", "cho nguoi xem bam", "khong tu chuyen"),
                1: (
                    "chuyen ngay",
                    "mo ngay",
                    "redirect ngay",
                    "ngay lap tuc",
                    "chuyen thang",
                    "0s",
                    "0 giay",
                ),
            },
            question="Người xem mở link thì chuyển hướng thế nào?",
        ),
        AssistantAskField(
            "password",
            secret_toggle=("Không đặt mật khẩu", "Đặt mật khẩu"),
            extra_hints={
                False: (
                    "khong mat khau",
                    "khong can mat khau",
                    "khong dat mat khau",
                    "ko mat khau",
                    "k mat khau",
                    "khong pass",
                    "no password",
                    "cong khai",
                ),
                True: ("co mat khau", "dat mat khau", "kem mat khau"),
            },
            question="Có đặt mật khẩu bảo vệ link không?",
            secret_prompt="Nhập mật khẩu bạn muốn đặt cho link",  # noqa: S106 - câu hỏi, không phải mật khẩu
        ),
    ),
    "create_subscription": (
        AssistantAskField("billing_cycle"),
        AssistantAskField(
            "custom_cycle_days",
            presets=(15, 30, 60, 90),
            unit=UNIT_DAY,
            preset_label="Mỗi {n} ngày",
            only_if=("billing_cycle", "CUSTOM_DAYS"),
        ),
        AssistantAskField(
            "reminder_days_before",
            presets=((), (1,), (3, 1), (7, 3, 1)),
            unit=UNIT_DAY,
            preset_label="Trước {n} ngày",
            zero_label="Không nhắc trước",
            context_words=BEFORE_WORDS,
            list_value=True,
        ),
        AssistantAskField(
            "auto_renew",
            extra_hints={
                True: ("tu dong gia han", "tu gia han", "auto renew", "tu dong tru tien"),
                False: ("khong tu dong", "gia han tay", "tu thanh toan", "khong auto"),
            },
        ),
    ),
    "create_asset": (
        AssistantAskField(
            "category",
            extra_hints={
                "LAPTOP": ("macbook", "notebook", "may tinh xach tay"),
                "PHONE": ("iphone", "smartphone", "dt", "samsung galaxy"),
                "TABLET": ("ipad", "tab"),
                "MONITOR": ("man hinh",),
                "PERIPHERAL": ("chuot", "ban phim", "phu kien", "sac", "cap"),
                "AUDIO": ("tai nghe", "loa", "airpods", "headphone"),
                "NETWORK": ("router", "wifi", "modem", "switch mang"),
                "CAMERA": ("may anh", "camera", "gopro"),
            },
        ),
        AssistantAskField(
            "warranty_months",
            presets=(0, 6, 12, 24, 36),
            unit=UNIT_MONTH,
            preset_label="{n} tháng",
            zero_label="Không có bảo hành",
            extra_hints={0: ("khong bao hanh", "het bao hanh", "khong co bao hanh")},
            context_words=("bao hanh", "bh", "warranty"),
        ),
    ),
    "create_warranty_claim": (
        AssistantAskField(
            "claim_type",
            extra_hints={
                "WARRANTY": ("bao hanh", "bh", "doi tra", "warranty"),
                "PAID_REPAIR": ("sua chua", "sua may", "thay linh kien", "tinh phi", "mat phi"),
                "MAINTENANCE": ("bao tri", "ve sinh", "bao duong", "tra keo"),
            },
        ),
    ),
}

# Tool tạo mới KHÔNG hỏi thêm (kèm lý do); test buộc mọi `create_*` nằm ở đây hoặc `ASSISTANT_ASK_FIELDS`.
ASSISTANT_NO_ASK_TOOLS: dict[str, str] = {
    "create_finance_income": (
        "Ghi nhanh kiểu 'tiền afff 30k': số tiền + nền tảng là đủ (ngày mặc định hôm nay); "
        "nền tảng mơ hồ đã có `needs_clarification`."
    ),
    "create_finance_platform": "Chỉ cần tên nền tảng; tiền tệ mặc định VND, sửa thêm trên giao diện.",
    "create_qr_code": "Loại QR suy từ nội dung (URL hoặc văn bản); QR chuyển khoản làm trên giao diện.",
    "create_page": "Luôn tạo bản nháp; nội dung và công khai soạn trên giao diện Trang.",
    "create_vault_item": "Tiêu đề + mã bí mật người dùng tự gõ là đủ; nhóm/ghi chú tùy chọn.",
}
