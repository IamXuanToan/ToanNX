"""Mã sự kiện thông báo của module Tiện ích."""

from enum import StrEnum


class UtilitiesNotificationEvent(StrEnum):
    """Sự kiện thông báo nghiệp vụ từ module Utilities."""

    FEEDBACK_RECEIVED = "utilities.feedback.received"
