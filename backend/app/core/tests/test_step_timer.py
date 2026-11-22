"""StepTimer: một dòng log gồm tên bước + mili giây."""

import logging
import re

import pytest

from app.core.logging.step_timer import StepTimer


def test_logs_steps_and_total(caplog: pytest.LogCaptureFixture) -> None:
    logger = logging.getLogger("test.step_timer")
    timer = StepTimer("auth.login", logger)
    timer.mark("rate_limit")
    timer.mark("authenticate")
    with caplog.at_level(logging.INFO, logger="test.step_timer"):
        timer.log()
    message = caplog.records[-1].getMessage()
    assert re.fullmatch(r"auth\.login steps rate_limit=\d+ms authenticate=\d+ms total=\d+ms", message)
