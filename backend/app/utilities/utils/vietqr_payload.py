"""Tạo payload chuyển khoản VietQR bằng thư viện napas-qr-python."""

from qr_pay import QRPay


def build_vietqr_payload(bank_bin: str, account_number: str, amount: int | None, message: str) -> str:
    """Tạo payload NAPAS chuyển tới tài khoản với CRC do thư viện xử lý.

    Args:
        bank_bin: Mã BIN của ngân hàng nhận.
        account_number: Số tài khoản nhận.
        amount: Số tiền VND; None để người chuyển tự nhập.
        message: Nội dung chuyển khoản đã chuẩn hóa.

    Returns:
        Payload VietQR hoàn chỉnh.
    """
    return QRPay(
        bin_id=bank_bin,
        consumer_id=account_number,
        service_code="ACCOUNT",
        point_of_initiation_method="DYNAMIC" if amount is not None else "STATIC",
        transaction_amount=amount,
        purpose_of_transaction=message or None,
    ).code
