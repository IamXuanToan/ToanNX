"""Lỗi khi gọi SePay API."""

from app.core.exceptions.app_exception import AppException
from app.finance.constants.finance_error_code import FinanceErrorCode


class SepayApiError(AppException):
    """SePay từ chối hoặc không phản hồi.

    Trả 502 (không phải 401) kể cả khi token SePay sai: 401 của API này dành cho phiên đăng nhập, trả 401 sẽ
    làm FE tưởng hết phiên. Mã lỗi cụ thể nằm ở `code`.
    """

    status_code = 502
    default_code = FinanceErrorCode.SEPAY_UNAVAILABLE
    default_message = "Không kết nối được SePay, thử lại sau."
