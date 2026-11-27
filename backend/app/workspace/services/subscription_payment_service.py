"""Nghiệp vụ Lịch sử thanh toán gia hạn dịch vụ định kỳ (chỉ đọc & xóa)."""

from app.core.services.core_crud_service import CoreCrudService
from app.workspace.models.subscription_payment import SubscriptionPayment
from app.workspace.permissions.subscription_payment_permission import SubscriptionPaymentPermission
from app.workspace.repositories.subscription_payment_repository import SubscriptionPaymentRepository


class SubscriptionPaymentService(CoreCrudService[SubscriptionPayment, SubscriptionPaymentRepository]):
    """Truy xuất và xóa lịch sử thanh toán gia hạn theo phạm vi owner."""

    repository_class = SubscriptionPaymentRepository
    owner_field = "owner"
    manage_all_permission = SubscriptionPaymentPermission.MANAGE_ALL.code
