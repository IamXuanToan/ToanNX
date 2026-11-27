"""Middleware thiết lập ngữ cảnh request."""

import logging
import re
import time
import uuid
from collections.abc import Callable

from django.http import HttpRequest, HttpResponse

from app.core.context.user_context import request_context

logger = logging.getLogger("app.request")

REQUEST_ID_HEADER = "X-Request-ID"
_REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9\-]{8,64}$")


class RequestContextMiddleware:
    """Đặt request_id vào context và header response, ghi log mỗi request.

    Chỉ nhận request_id từ client nếu đúng định dạng (chống log injection).
    Context được reset trong `finally` nên không rò sang request khác.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        """Khởi tạo middleware.

        Args:
            get_response: Bước xử lý tiếp theo.
        """
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        """Xử lý request trong phạm vi ngữ cảnh riêng.

        Args:
            request: HTTP request.

        Returns:
            HTTP response có header X-Request-ID.
        """
        raw = request.headers.get(REQUEST_ID_HEADER)
        request_id = raw if raw and _REQUEST_ID_PATTERN.match(raw) else uuid.uuid4().hex
        started = time.perf_counter()
        with request_context(request_id, request):
            response = self.get_response(request)
            response[REQUEST_ID_HEADER] = request_id
            elapsed_ms = (time.perf_counter() - started) * 1000
            if response.status_code >= 500:
                logger.error(
                    "%s %s %s %.1fms", request.method, request.path, response.status_code, elapsed_ms
                )
            elif response.status_code >= 400:
                logger.warning(
                    "%s %s %s %.1fms", request.method, request.path, response.status_code, elapsed_ms
                )
            else:
                logger.info("%s %s %s %.1fms", request.method, request.path, response.status_code, elapsed_ms)
        return response
