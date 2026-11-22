"""Đo thời gian từng bước của một luồng và ghi một dòng log (request_id do `RequestContextFilter` tự gắn).

```python
timer = StepTimer("auth.login", logger)
...
timer.mark("authenticate")
...
timer.mark("session")
timer.log()  # auth.login steps authenticate=112ms session=35ms total=147ms
```

Chỉ ghi tên bước và số mili giây, không bao giờ ghi dữ liệu người dùng, mật khẩu hay token.
"""

import logging
import time


class StepTimer:
    """Bộ đếm giờ theo mốc: mỗi `mark` ghi thời gian từ mốc trước tới giờ."""

    def __init__(self, name: str, logger: logging.Logger) -> None:
        """Bắt đầu đo.

        Args:
            name: Tên luồng (ví dụ `auth.login`), không chứa dữ liệu người dùng.
            logger: Logger để ghi.
        """
        self.name = name
        self.logger = logger
        self.started = time.perf_counter()
        self.last = self.started
        self.steps: list[tuple[str, float]] = []

    def mark(self, step: str) -> None:
        """Kết thúc một bước.

        Args:
            step: Tên bước (chữ thường, gạch dưới).
        """
        now = time.perf_counter()
        self.steps.append((step, (now - self.last) * 1000))
        self.last = now

    def total_ms(self) -> float:
        """Tổng thời gian từ lúc bắt đầu (ms)."""
        return (time.perf_counter() - self.started) * 1000

    def log(self, level: int = logging.INFO) -> None:
        """Ghi một dòng `<name> steps a=..ms b=..ms total=..ms`.

        Args:
            level: Mức log.
        """
        parts = " ".join(f"{step}={elapsed:.0f}ms" for step, elapsed in self.steps)
        self.logger.log(level, "%s steps %s total=%.0fms", self.name, parts, self.total_ms())
