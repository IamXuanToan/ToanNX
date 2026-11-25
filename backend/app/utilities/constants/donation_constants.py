"""Hằng số cho nghiệp vụ Quyên góp / Ủng hộ (Donation)."""

from typing import Final

# Kho danh xưng tri ân hóm hỉnh, đa dạng (xoay vòng ngẫu nhiên/hash)
DONOR_HONORARY_TITLES: Final[tuple[str, ...]] = (
    "Anh chị em đẹp zai xinh gái",
    "Xinh gái đẹp trai",
    "Bạn đẹp zai tốt bụng",
    "Nàng thơ xinh đẹp",
    "Soái ca hào phóng",
    "Mỹ nam giấu mặt",
    "Mỹ nữ siêu cấp dễ thương",
    "Nhà hảo tâm đẹp zai ngời ngời",
    "Người bí ẩn siêu cấp đáng yêu",
    "Đại gia ẩn danh mến thương",
    "Vị khách quý tốt bụng",
    "Tri kỷ phương xa",
    "Người bạn vàng làng donate",
    "Thiên thần hộ mệnh",
    "Cao thủ giấu tên",
)

# Mốc tiền vinh danh mặc định (VNĐ)
TIER_THRESHOLD_BRONZE: Final[int] = 100_000
TIER_THRESHOLD_SILVER: Final[int] = 200_000
TIER_THRESHOLD_GOLD: Final[int] = 500_000
TIER_THRESHOLD_DIAMOND: Final[int] = 1_000_000

# Thời hạn hiển thị vinh danh mặc định trên bảng vinh danh (7 ngày = 168 giờ)
DEFAULT_TIER_EXPIRY_DAYS: Final[int] = 7

# Độ dài tối thiểu và tối đa số ngày vinh danh
MIN_TIER_EXPIRY_DAYS: Final[int] = 1
MAX_TIER_EXPIRY_DAYS: Final[int] = 30
