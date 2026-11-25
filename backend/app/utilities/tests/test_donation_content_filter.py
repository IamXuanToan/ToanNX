"""Unit test cho bộ lọc kiểm duyệt từ ngữ DonationContentFilter."""

import pytest

from app.utilities.services.donation_content_filter import DonationContentFilter


@pytest.fixture
def content_filter() -> DonationContentFilter:
    return DonationContentFilter()


def test_clean_message_is_not_censored(content_filter: DonationContentFilter) -> None:
    """Nội dung sạch không bị đánh dấu vi phạm."""
    assert not content_filter.is_censored("Chúc bạn luôn mạnh khỏe và thành công!")
    assert not content_filter.is_censored("Ủng hộ bạn 1 ly cà phê nhé")
    assert not content_filter.is_censored("Toan to chill nghe nhạc hay lắm")


def test_terrorist_violence_keywords_are_censored(content_filter: DonationContentFilter) -> None:
    """Từ khóa bạo lực, khủng bố bị chặn chính xác."""
    assert content_filter.is_censored("ủng hộ nhóm khủng bố")
    assert content_filter.is_censored("chế tạo bom tự chế")
    assert content_filter.is_censored("tổ chức việt tân tài trợ")
    assert content_filter.is_censored("lực lượng isis đánh bom")


def test_profanity_keywords_are_censored(content_filter: DonationContentFilter) -> None:
    """Từ chửi bậy, tục tĩu, teencode bị chặn chính xác."""
    assert content_filter.is_censored("dkm thằng ngu")
    assert content_filter.is_censored("vcl đồ lừa đảo")
    assert content_filter.is_censored("địt mẹ mày")
    assert content_filter.is_censored("đéo thèm ủng hộ")
    assert content_filter.is_censored("đồ chó đẻ")


def test_sanitize_message_replaces_violation(content_filter: DonationContentFilter) -> None:
    """Nội dung vi phạm bị khử trùng về rỗng."""
    assert content_filter.sanitize_message("dkm thằng này") == ""
    assert content_filter.sanitize_message("Chúc bạn thành công") == "Chúc bạn thành công"
