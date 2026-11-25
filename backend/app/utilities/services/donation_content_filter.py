"""Bộ lọc kiểm duyệt từ ngữ xấu, kích động bạo lực, khủng bố, chửi bậy cho lời nhắn quyên góp."""

import re
import unicodedata
from typing import Final

# Tập Regex phát hiện từ cấm
CENSORED_PATTERNS: Final[tuple[re.Pattern[str], ...]] = (
    # 1. Khủng bố, bạo lực, chống phá
    re.compile(
        r"(kh[uủ]ng\s*b[oố]|vi[eệ]t\s*t[aâ]n|al[-_\s]*qaeda|isis|is[\s_]*is|[aá]m\s*s[aá]t|ch[eế]\s*t[aạ]o\s*bom|đ[aá]nh\s*bom|kh[aá]ng\s*chi[eế]n)",
        re.IGNORECASE,
    ),
    # 2. Chửi bậy, tục tĩu, lăng mạ tiếng Việt & viết tắt
    re.compile(
        r"(\bdkm\b|\bđkm\b|\bđ[iị]t\b|\bd[iị]t\b|\bvcl\b|\bvcll\b|\bclmm\b|\bđ[eé]o\b|\bd[eé]o\b|\bl[oồ]n\b|\bbu[oồ]i\b|\bc[aặ]c\b|\bk[aặ]c\b|\bđ[m|c]m\b|\bch[oó]\s*đ[eẻ]\b|\bm[eẹ]\s*m[aà]y\b|\bm[aẹ]\s*ki[eế]p\b|\bđ[uụ]\s*m[eẹ]\b)",
        re.IGNORECASE,
    ),
    # 3. Khiêu dâm, cờ bạc, lừa đảo
    re.compile(
        r"(g[aá]i\s*g[oọ]i|\bcave\b|\bkave\b|b[eé]t\s*88|kubet|thabet|l[oô]\s*đ[eề]|đ[aá]nh\s*b[aạ]c)",
        re.IGNORECASE,
    ),
)


class DonationContentFilter:
    """Kiểm tra và khử trùng nội dung lời nhắn từ webhook."""

    @staticmethod
    def _normalize(text: str) -> str:
        """Loại bỏ dấu thanh Unicode và ký tự rác ngắt quãng chữ."""
        # Chuyển về dạng chuẩn NFD
        normalized = unicodedata.normalize("NFD", text.lower())
        # Loại bỏ ký tự phân cách giữa chữ (d_k_m -> dkm)
        compressed = re.sub(r"[\s._\-*+=]+", " ", normalized)
        return compressed

    def is_censored(self, text: str) -> bool:
        """Kiểm tra xem nội dung có chứa từ ngữ vi phạm không."""
        if not text or not text.strip():
            return False

        clean_text = text.strip()
        normalized_text = self._normalize(clean_text)

        for pattern in CENSORED_PATTERNS:
            if pattern.search(clean_text) or pattern.search(normalized_text):
                return True
        return False

    def sanitize_message(self, text: str) -> str:
        """Trả về nội dung an toàn; nếu vi phạm thì ẩn đi."""
        if self.is_censored(text):
            return ""
        return text.strip()
