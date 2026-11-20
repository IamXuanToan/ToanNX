"""Sinh logo và favicon từ ảnh gốc `frontend/public/brand/logo.png`.

Chạy lại mỗi khi thay ảnh gốc (dùng Pillow có sẵn trong dependency của backend, không cài thêm gói):

    uv run --project backend python scripts/build_brand_assets.py

Đầu ra (ghi đè):
- `frontend/public/brand/logo-mark.png`: logo 256×256 nền trong suốt cho giao diện (`LogoMark`).
- `frontend/src/app/icon.png`: favicon PNG 192×192 (Next.js tự gắn `<link rel="icon">`).
- `frontend/src/app/favicon.ico`: favicon ICO 16/32/48 cho trình duyệt cũ và `/favicon.ico`.
- `frontend/src/app/apple-icon.png`: 180×180 nền trắng (iOS tô đen vùng trong suốt).
"""

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "frontend/public/brand/logo.png"
APP_DIR = ROOT / "frontend/src/app"
BRAND_DIR = ROOT / "frontend/public/brand"

# Lề trong suốt quanh hình sau khi cắt sát (tỉ lệ cạnh) để logo không chạm mép ô vuông.
PADDING_RATIO = 0.04
# Điểm ảnh có độ đục thấp hơn ngưỡng coi như nền (ảnh gốc có viền mờ do khử răng cưa).
ALPHA_THRESHOLD = 16
APPLE_ICON_BACKGROUND = (255, 255, 255, 255)

LOGO_MARK_SIZE = 256
ICON_SIZE = 192
APPLE_ICON_SIZE = 180
FAVICON_SIZES = [(16, 16), (32, 32), (48, 48)]


def load_square_logo(path: Path) -> Image.Image:
    """Đọc ảnh gốc, cắt sát phần có hình rồi đặt vào giữa một ô vuông trong suốt có lề.

    Args:
        path: Đường dẫn ảnh gốc (PNG có kênh alpha).

    Returns:
        Ảnh RGBA vuông.
    """
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A").point(lambda value: 255 if value >= ALPHA_THRESHOLD else 0)
    bbox = alpha.getbbox()
    if bbox is None:
        raise SystemExit(f"Ảnh gốc trong suốt hoàn toàn: {path}")
    cropped = image.crop(bbox)
    side = round(max(cropped.size) * (1 + 2 * PADDING_RATIO))
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.paste(cropped, ((side - cropped.width) // 2, (side - cropped.height) // 2), cropped)
    return square


def resized(image: Image.Image, size: int) -> Image.Image:
    """Thu nhỏ ảnh vuông về cạnh `size` bằng bộ lọc LANCZOS.

    Args:
        image: Ảnh vuông.
        size: Cạnh đích (px).

    Returns:
        Ảnh đã thu nhỏ.
    """
    return image.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    """Sinh toàn bộ asset thương hiệu từ ảnh gốc."""
    # Console Windows mặc định cp1252: ép UTF-8 để in được thông báo tiếng Việt.
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[union-attr]  # stdout thật là TextIOWrapper
    logo = load_square_logo(SOURCE)
    outputs = {
        BRAND_DIR / "logo-mark.png": resized(logo, LOGO_MARK_SIZE),
        APP_DIR / "icon.png": resized(logo, ICON_SIZE),
    }
    for path, image in outputs.items():
        image.save(path, optimize=True)

    favicon = APP_DIR / "favicon.ico"
    logo.save(favicon, sizes=FAVICON_SIZES)

    apple_path = APP_DIR / "apple-icon.png"
    apple = Image.new("RGBA", (APPLE_ICON_SIZE, APPLE_ICON_SIZE), APPLE_ICON_BACKGROUND)
    apple.alpha_composite(resized(logo, APPLE_ICON_SIZE))
    apple.convert("RGB").save(apple_path, optimize=True)

    for path in (*outputs, favicon, apple_path):
        sys.stdout.write(f"Đã tạo {path.relative_to(ROOT).as_posix()}\n")


if __name__ == "__main__":
    main()
