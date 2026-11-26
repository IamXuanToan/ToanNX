"""Nghiệp vụ Sự cố giám sát Uptime/HTTP (chỉ đọc & xóa)."""

from app.core.services.core_crud_service import CoreCrudService
from app.workspace.models.monitor_incident import MonitorIncident
from app.workspace.permissions.monitor_incident_permission import MonitorIncidentPermission
from app.workspace.repositories.monitor_incident_repository import MonitorIncidentRepository


class MonitorIncidentService(CoreCrudService[MonitorIncident, MonitorIncidentRepository]):
    """Truy xuất lịch sử sự cố downtime theo phạm vi owner."""

    repository_class = MonitorIncidentRepository
    owner_field = "owner"
    manage_all_permission = MonitorIncidentPermission.MANAGE_ALL.code
