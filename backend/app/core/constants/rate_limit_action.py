"""Hậu tố hành động dùng chung để ghép khóa `StrEnum` của `settings.RATE_LIMITS`."""

from enum import StrEnum


class RateLimitAction(StrEnum):
    """Các hành động tiêu chuẩn trong khóa `<phạm_vi>[.<nhóm>].<hành_động>`."""

    READ = "read"
    WRITE = "write"
    CREATE = "create"
    IMPORT = "import"
    AUTH = "auth"
    LINK = "link"
    UNLINK = "unlink"
    REQUEST = "request"
    VALIDATE = "validate"
    CONFIRM = "confirm"
    SEND = "send"
    VERIFY = "verify"
    ACCEPT = "accept"
    CONTENT = "content"
    CALL = "call"
    WEBHOOK = "webhook"
    UNLOCK = "unlock"
    PREVIEW = "preview"
    RENEW = "renew"
    REVEAL = "reveal"
    PING = "ping"
    CHAT = "chat"
    TICK = "tick"
    DISPATCH_DUE = "dispatch_due"
    PROCESS = "process"
