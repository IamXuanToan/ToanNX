"""Kiểm thử cấu hình log phân tách mức INFO/WARNING/ERROR và luồng stdout/stderr."""

import logging
from typing import Any

from django.conf import settings
from django.http import HttpResponse
from django.test import RequestFactory

from app.core.logging.max_level_filter import MaxLevelFilter
from app.core.logging.readable_console_formatter import ReadableConsoleFormatter
from app.core.middleware.request_context_middleware import RequestContextMiddleware


def test_request_context_middleware_logs_by_status_level(caplog: Any) -> None:
    """2xx ghi INFO, 4xx ghi WARNING, 5xx ghi ERROR."""
    factory = RequestFactory()
    with caplog.at_level(logging.INFO, logger="app.request"):
        RequestContextMiddleware(lambda _req: HttpResponse("ok", status=200))(factory.get("/ok"))
        RequestContextMiddleware(lambda _req: HttpResponse("bad", status=400))(factory.get("/bad"))
        RequestContextMiddleware(lambda _req: HttpResponse("err", status=500))(factory.get("/err"))

    records = [r for r in caplog.records if r.name == "app.request"]
    assert [(r.levelno, r.getMessage().split()[1]) for r in records] == [
        (logging.INFO, "/ok"),
        (logging.WARNING, "/bad"),
        (logging.ERROR, "/err"),
    ]


def test_max_level_filter_and_readable_formatter() -> None:
    """MaxLevelFilter chặn WARNING/ERROR khỏi stdout và formatter giữ tag căn lề rõ ràng."""
    flt = MaxLevelFilter(logging.INFO)
    info_rec = logging.LogRecord("app.test", logging.INFO, "", 1, "bình thường", (), None)
    warn_rec = logging.LogRecord("app.test", logging.WARNING, "", 1, "cảnh báo", (), None)
    err_rec = logging.LogRecord("app.test", logging.ERROR, "", 1, "lỗi nặng", (), None)
    for rec in (info_rec, warn_rec, err_rec):
        rec.request_id = "req-1"

    assert flt.filter(info_rec) is True
    assert flt.filter(warn_rec) is False
    assert flt.filter(err_rec) is False

    plain = ReadableConsoleFormatter(use_color=False)
    assert "[WARNING] [req-1] app.test: cảnh báo" in plain.format(warn_rec)
    assert "[ERROR  ] [req-1] app.test: lỗi nặng" in plain.format(err_rec)

    handlers = settings.LOGGING["handlers"]
    assert "console_stdout" in handlers
    assert "console_stderr" in handlers
    assert handlers["console_stderr"]["level"] == "WARNING"
