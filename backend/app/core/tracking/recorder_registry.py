"""Nạp `ChangeRecorder` từ setting `CORE_CHANGE_RECORDER` (rỗng = không ghi lịch sử)."""

from functools import cache

from django.conf import settings
from django.utils.module_loading import import_string

from app.core.tracking.change_recorder import ChangeRecorder


@cache
def get_change_recorder() -> ChangeRecorder | None:
    """Recorder đang cấu hình (nạp một lần mỗi tiến trình).

    Returns:
        Recorder hoặc None nếu chưa cấu hình.
    """
    path = getattr(settings, "CORE_CHANGE_RECORDER", "")
    if not path:
        return None
    recorder: ChangeRecorder = import_string(path)()
    return recorder
