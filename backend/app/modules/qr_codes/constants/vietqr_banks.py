"""Danh mục ngân hàng nhận VietQR (mã BIN của NAPAS). Khai tĩnh; thêm ngân hàng thì thêm dòng."""

from typing import TypedDict


class VietQrBank(TypedDict):
    """Một ngân hàng: BIN (6 số), mã ngắn, tên."""

    bin: str
    code: str
    short_name: str
    name: str


VIETQR_BANKS: tuple[VietQrBank, ...] = (
    {"bin": "970436", "code": "VCB", "short_name": "Vietcombank", "name": "Ngoại thương Việt Nam"},
    {"bin": "970415", "code": "ICB", "short_name": "VietinBank", "name": "Công thương Việt Nam"},
    {"bin": "970418", "code": "BIDV", "short_name": "BIDV", "name": "Đầu tư và Phát triển Việt Nam"},
    {"bin": "970405", "code": "VBA", "short_name": "Agribank", "name": "Nông nghiệp và Phát triển Nông thôn"},
    {"bin": "970407", "code": "TCB", "short_name": "Techcombank", "name": "Kỹ Thương Việt Nam"},
    {"bin": "970422", "code": "MB", "short_name": "MB Bank", "name": "Quân đội"},
    {"bin": "970416", "code": "ACB", "short_name": "ACB", "name": "Á Châu"},
    {"bin": "970432", "code": "VPB", "short_name": "VPBank", "name": "Việt Nam Thịnh Vượng"},
    {"bin": "970423", "code": "TPB", "short_name": "TPBank", "name": "Tiên Phong"},
    {"bin": "970403", "code": "STB", "short_name": "Sacombank", "name": "Sài Gòn Thương Tín"},
    {"bin": "970437", "code": "HDB", "short_name": "HDBank", "name": "Phát triển TP.HCM"},
    {"bin": "970441", "code": "VIB", "short_name": "VIB", "name": "Quốc tế Việt Nam"},
    {"bin": "970443", "code": "SHB", "short_name": "SHB", "name": "Sài Gòn - Hà Nội"},
    {"bin": "970431", "code": "EIB", "short_name": "Eximbank", "name": "Xuất Nhập khẩu Việt Nam"},
    {"bin": "970426", "code": "MSB", "short_name": "MSB", "name": "Hàng Hải Việt Nam"},
    {"bin": "970448", "code": "OCB", "short_name": "OCB", "name": "Phương Đông"},
    {"bin": "970440", "code": "SEAB", "short_name": "SeABank", "name": "Đông Nam Á"},
    {"bin": "970449", "code": "LPB", "short_name": "LPBank", "name": "Lộc Phát Việt Nam"},
    {"bin": "970428", "code": "NAB", "short_name": "Nam A Bank", "name": "Nam Á"},
    {"bin": "970409", "code": "BAB", "short_name": "Bac A Bank", "name": "Bắc Á"},
    {"bin": "970425", "code": "ABB", "short_name": "ABBANK", "name": "An Bình"},
    {"bin": "970454", "code": "VCCB", "short_name": "BVBank", "name": "Bản Việt"},
    {"bin": "970452", "code": "KLB", "short_name": "KienlongBank", "name": "Kiên Long"},
    {"bin": "970412", "code": "PVCB", "short_name": "PVcomBank", "name": "Đại Chúng Việt Nam"},
)

VIETQR_BANK_BINS = frozenset(bank["bin"] for bank in VIETQR_BANKS)
