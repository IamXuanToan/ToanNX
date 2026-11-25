"""Unit test cho phân loại quà tặng và danh xưng tri ân."""

from app.utilities.constants.donation_constants import DONOR_HONORARY_TITLES
from app.utilities.models.donation_transaction import DonationTransaction
from app.utilities.services.donation_gift_classifier import DonationGiftClassifier


def test_classify_gift_by_keyword() -> None:
    """Nhận diện quà tặng theo từ khóa trong lời nhắn."""
    classifier = DonationGiftClassifier()

    gift, label = classifier.classify_gift(50000, "Mời anh ly cà phê sáng nhé")
    assert gift == DonationTransaction.GiftType.COFFEE
    assert label == "Ly cà phê"

    gift, label = classifier.classify_gift(50000, "Tặng bạn gói mì tôm ăn đêm")
    assert gift == DonationTransaction.GiftType.NOODLE
    assert label == "Gói mì tôm"

    gift, label = classifier.classify_gift(50000, "Chúc bạn bữa sáng ngon miệng")
    assert gift == DonationTransaction.GiftType.BREAKFAST
    assert label == "Bữa sáng"


def test_classify_gift_by_amount() -> None:
    """Nhận diện quà tặng theo mốc số tiền khi không có từ khóa."""
    classifier = DonationGiftClassifier()

    gift, label = classifier.classify_gift(20000, "Ủng hộ bạn")
    assert gift == DonationTransaction.GiftType.NOODLE

    gift, label = classifier.classify_gift(35000, "Ủng hộ bạn")
    assert gift == DonationTransaction.GiftType.COFFEE

    gift, label = classifier.classify_gift(70000, "Ủng hộ bạn")
    assert gift == DonationTransaction.GiftType.BREAKFAST


def test_classify_tier() -> None:
    """Xếp hạng Bảng Vinh danh theo số tiền."""
    classifier = DonationGiftClassifier()

    assert classifier.classify_tier(50000) == DonationTransaction.Tier.NORMAL
    assert classifier.classify_tier(100000) == DonationTransaction.Tier.BRONZE
    assert classifier.classify_tier(250000) == DonationTransaction.Tier.SILVER
    assert classifier.classify_tier(500000) == DonationTransaction.Tier.GOLD
    assert classifier.classify_tier(1500000) == DonationTransaction.Tier.DIAMOND


def test_get_donor_title_is_in_titles() -> None:
    """Danh xưng tri ân luôn nằm trong kho danh xưng."""
    classifier = DonationGiftClassifier()

    title1 = classifier.get_donor_title("SP_12345")
    title2 = classifier.get_donor_title("SP_67890")

    assert title1 in DONOR_HONORARY_TITLES
    assert title2 in DONOR_HONORARY_TITLES
