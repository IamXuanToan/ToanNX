"""Phân loại quà tặng, xếp hạng Bảng Vinh danh và xoay vòng danh xưng tri ân."""

import hashlib
import re
from typing import Final

from app.utilities.constants.donation_constants import (
    DONOR_HONORARY_TITLES,
    TIER_THRESHOLD_BRONZE,
    TIER_THRESHOLD_DIAMOND,
    TIER_THRESHOLD_GOLD,
    TIER_THRESHOLD_SILVER,
)
from app.utilities.models.donation_transaction import DonationTransaction

# Từ khóa nhận diện món quà theo nội dung chuyển khoản
GIFT_KEYWORD_PATTERNS: Final[tuple[tuple[re.Pattern[str], str, str], ...]] = (
    (
        re.compile(r"(cf|cafe|c[aà]\s*ph[eê])", re.IGNORECASE),
        DonationTransaction.GiftType.COFFEE,
        "Ly cà phê",
    ),
    (
        re.compile(r"(m[iì]\s*t[oô]m|m[iì]\s*g[oó]i|\bm[iì]\b)", re.IGNORECASE),
        DonationTransaction.GiftType.NOODLE,
        "Gói mì tôm",
    ),
    (
        re.compile(r"([aă]n\s*s[aá]ng|b[uữ]a\s*s[aá]ng|b[aá]nh\s*m[iì])", re.IGNORECASE),
        DonationTransaction.GiftType.BREAKFAST,
        "Bữa sáng",
    ),
    (
        re.compile(r"(s[aá]ch|cu[oố]n\s*s[aá]ch|quy[eể]n\s*s[aá]ch)", re.IGNORECASE),
        DonationTransaction.GiftType.BOOK,
        "Cuốn sách",
    ),
    (
        re.compile(r"(l[aẩ]u|b[uữ]a\s*l[aẩ]u|n[uồ]i\s*l[aẩ]u)", re.IGNORECASE),
        DonationTransaction.GiftType.HOTPOT,
        "Bữa lẩu",
    ),
)


class DonationGiftClassifier:
    """Xác định quà tặng quy đổi, cấp bậc vinh danh và danh xưng tri ân."""

    @staticmethod
    def classify_gift(amount: int, content: str) -> tuple[str, str]:
        """Quy đổi món quà dựa trên nội dung hoặc mốc số tiền.

        Returns:
            (gift_type, gift_label)
        """
        # 1. Ưu tiên tìm từ khóa quà tặng trong nội dung chuyển khoản
        for pattern, gift_type, label in GIFT_KEYWORD_PATTERNS:
            if pattern.search(content):
                return gift_type, label

        # 2. Quy đổi theo mốc số tiền nếu không có từ khóa
        if amount < 30_000:
            return DonationTransaction.GiftType.NOODLE, "Gói mì tôm"
        if amount < 50_000:
            return DonationTransaction.GiftType.COFFEE, "Ly cà phê"
        if amount < 100_000:
            return DonationTransaction.GiftType.BREAKFAST, "Bữa sáng"
        if amount < 200_000:
            return DonationTransaction.GiftType.BOOK, "Cuốn sách"
        if amount < 50_0000:
            return DonationTransaction.GiftType.HOTPOT, "Bữa lẩu"
        return DonationTransaction.GiftType.SPECIAL, "Món quà đặc biệt"

    @staticmethod
    def classify_tier(amount: int) -> str:
        """Xác định cấp bậc vinh danh trên Bảng Vinh danh.

        Returns:
            NORMAL, BRONZE, SILVER, GOLD, DIAMOND
        """
        if amount >= TIER_THRESHOLD_DIAMOND:
            return DonationTransaction.Tier.DIAMOND
        if amount >= TIER_THRESHOLD_GOLD:
            return DonationTransaction.Tier.GOLD
        if amount >= TIER_THRESHOLD_SILVER:
            return DonationTransaction.Tier.SILVER
        if amount >= TIER_THRESHOLD_BRONZE:
            return DonationTransaction.Tier.BRONZE
        return DonationTransaction.Tier.NORMAL

    @staticmethod
    def get_donor_title(sepay_id: str) -> str:
        """Lấy danh xưng tri ân xoay vòng ngẫu nhiên theo mã giao dịch SePay."""
        if not sepay_id:
            return DONOR_HONORARY_TITLES[0]

        # Băm sepay_id để chọn chỉ mục ổn định
        digest = hashlib.md5(sepay_id.encode(), usedforsecurity=False).hexdigest()
        index = int(digest, 16) % len(DONOR_HONORARY_TITLES)
        return DONOR_HONORARY_TITLES[index]
