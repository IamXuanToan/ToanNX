"""Module đã cài kèm cấu hình runtime."""

from dataclasses import dataclass

from app.core.registry.module_descriptor import ModuleDescriptor


@dataclass(frozen=True)
class ModuleState:
    """Descriptor + cấu hình hiện tại.

    Attributes:
        descriptor: Metadata khai báo trong code.
        enabled: Đang bật.
        icon: Tên icon lucide hiệu lực (cấu hình DB, nếu không có thì mặc định của descriptor).
        icon_url: URL tuyệt đối của icon SVG tự upload, hoặc None.
    """

    descriptor: ModuleDescriptor
    enabled: bool
    icon: str
    icon_url: str | None = None
