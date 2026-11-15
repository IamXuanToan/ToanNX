"""Dựng chuỗi VietQR (chuẩn EMVCo của NAPAS) cho chuyển khoản tới số tài khoản.

```
00 02 "01"                          Payload format
01 02 "11" (tĩnh) | "12" (có số tiền)
38 .. 00 "A000000727"               GUID NAPAS
      01 .. 00 <BIN> 01 <số tài khoản>
      02 "QRIBFTTA"                 dịch vụ chuyển tới tài khoản
53 03 "704"                          VND
54 .. <số tiền>                      (tùy chọn)
58 02 "VN"
62 .. 08 <nội dung>                  (tùy chọn)
63 04 <CRC16-CCITT-FALSE>
```
"""

NAPAS_GUID = "A000000727"
SERVICE_TO_ACCOUNT = "QRIBFTTA"


def _tlv(tag: str, value: str) -> str:
    """Một trường `tag + độ dài 2 số + giá trị`."""
    return f"{tag}{len(value):02d}{value}"


def crc16_ccitt(data: str) -> str:
    """CRC16-CCITT-FALSE (poly 0x1021, init 0xFFFF), 4 ký tự hex in hoa.

    Args:
        data: Chuỗi cần tính (đã gồm `6304`).

    Returns:
        Mã CRC.
    """
    crc = 0xFFFF
    for byte in data.encode("utf-8"):
        crc ^= byte << 8
        for _ in range(8):
            crc = ((crc << 1) ^ 0x1021) if crc & 0x8000 else (crc << 1)
            crc &= 0xFFFF
    return f"{crc:04X}"


def build_vietqr_payload(bank_bin: str, account_number: str, amount: int | None, message: str) -> str:
    """Chuỗi VietQR hoàn chỉnh kèm CRC.

    Args:
        bank_bin: BIN ngân hàng (6 số).
        account_number: Số tài khoản.
        amount: Số tiền VND (None = người chuyển tự nhập).
        message: Nội dung chuyển khoản (đã bỏ dấu, ≤ 25 ký tự).

    Returns:
        Payload để mã hóa vào QR.
    """
    beneficiary = _tlv("00", bank_bin) + _tlv("01", account_number)
    merchant = _tlv("00", NAPAS_GUID) + _tlv("01", beneficiary) + _tlv("02", SERVICE_TO_ACCOUNT)
    parts = [
        _tlv("00", "01"),
        _tlv("01", "12" if amount else "11"),
        _tlv("38", merchant),
        _tlv("53", "704"),
    ]
    if amount:
        parts.append(_tlv("54", str(amount)))
    parts.append(_tlv("58", "VN"))
    if message:
        parts.append(_tlv("62", _tlv("08", message)))
    body = "".join(parts) + "6304"
    return body + crc16_ccitt(body)
