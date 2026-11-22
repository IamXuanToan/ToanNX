"""Mã lỗi: không trùng giữa core và module; FE có bản dịch cho mọi mã (vi, en)."""

import json
from enum import StrEnum
from importlib import import_module
from pathlib import Path

from django.conf import settings

from app.core.constants.error_codes import ErrorCode

FRONTEND_MESSAGES = Path(settings.BASE_DIR).parent / "frontend" / "src" / "messages"


def _all_codes() -> list[str]:
    codes = [item.value for item in ErrorCode]
    apps_dir = Path(settings.BASE_DIR) / "app"
    for path in sorted(apps_dir.glob("*/constants/*_error_code.py")):
        if path.parent.parent.name == "core":
            continue
        module = import_module(f"app.{path.parent.parent.name}.constants.{path.stem}")
        for value in vars(module).values():
            if isinstance(value, type) and issubclass(value, StrEnum) and value is not StrEnum:
                codes += [item.value for item in value]
    return codes


def test_error_codes_are_unique() -> None:
    codes = _all_codes()
    assert len(codes) == len(set(codes)), sorted({code for code in codes if codes.count(code) > 1})


def test_frontend_translates_every_error_code() -> None:
    codes = set(_all_codes())
    for locale in ("vi", "en"):
        translated = set(
            json.loads((FRONTEND_MESSAGES / f"{locale}.json").read_text("utf-8"))["errors"]["codes"]
        )
        missing = sorted(codes - translated)
        assert not missing, f"Thiếu bản dịch {locale}: {missing}"
