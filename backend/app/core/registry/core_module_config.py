"""AppConfig gốc của mọi module trong `app`.

Mỗi module chỉ khai báo tên module **một lần** trong `module.py` (`MODULE = ModuleDescriptor(code=...)`).
Lớp này tự nạp `<app>.module.MODULE` và đăng ký vào registry ở `ready()`, đồng thời bắt buộc
`MODULE.code == label` của app. Nhờ quy ước đó, mọi nơi khác (ví dụ kiểm tra module đang bật)
suy ra module từ app chứa code, không phải khai lại chuỗi mã module.

```python
class CustomPagesConfig(CoreModuleConfig):
    default = True                  # bắt buộc: Django chọn đúng config này trong apps.py
    name = "app.utilities"
    label = "utilities"          # = MODULE.code
    verbose_name = "Custom Pages"
```

Module cần thêm việc khi khởi động thì override `ready()` và gọi `super().ready()` trước.
"""

from importlib import import_module

from django.apps import AppConfig

from app.core.registry.module_descriptor import ModuleDescriptor
from app.core.registry.module_registry import module_registry

MODULE_DESCRIPTOR_PATH = "module"
MODULE_DESCRIPTOR_NAME = "MODULE"


class CoreModuleConfig(AppConfig):
    """AppConfig tự đăng ký ModuleDescriptor của module.

    `default = False` để Django không tự chọn lớp gốc này khi nó được import vào `apps.py`;
    lớp con của module phải đặt `default = True`.
    """

    default = False

    def get_module_descriptor(self) -> ModuleDescriptor:
        """Đọc `MODULE` trong `<app>/module.py`.

        Returns:
            Descriptor của module.

        Raises:
            ValueError: Không có `MODULE` hợp lệ.
        """
        module = import_module(f"{self.name}.{MODULE_DESCRIPTOR_PATH}")
        descriptor = getattr(module, MODULE_DESCRIPTOR_NAME, None)
        if not isinstance(descriptor, ModuleDescriptor):
            raise ValueError(f"{self.name}.module phải khai báo `MODULE = ModuleDescriptor(...)`.")
        return descriptor

    def ready(self) -> None:
        """Đăng ký module (kiểm tra mã module trùng label của app)."""
        module_registry.register(self.get_module_descriptor(), app_label=self.label)
