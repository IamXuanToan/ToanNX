"""Khai báo module System (đăng ký trong `SystemConfig.ready()`)."""

from app.core.registry.module_descriptor import ModuleDescriptor
from app.system.permissions.attachment_folder_permission import AttachmentFolderPermission
from app.system.permissions.attachment_permission import AttachmentPermission
from app.system.permissions.iam_permission import IamPermission
from app.system.permissions.journal_entry_permission import JournalEntryPermission
from app.system.permissions.session_permission import SessionPermission
from app.system.permissions.setting_permission import SettingPermission
from app.system.permissions.user_permission import UserPermission

MODULE = ModuleDescriptor(
    code="system",
    name="System",
    description=(
        "Nền tảng hệ thống: tài khoản, vai trò và phân quyền, đăng nhập và phiên, thư viện file, "
        "lịch sử thay đổi và kiểm tra tình trạng hệ thống."
    ),
    version="1.0.0",
    permissions=(
        *UserPermission.all(),
        *IamPermission.all(),
        *SessionPermission.all(),
        *AttachmentPermission.all(),
        *AttachmentFolderPermission.all(),
        *JournalEntryPermission.all(),
        *SettingPermission.all(),
    ),
    cleanup_tasks=(
        "app.system.tasks.purge_expired_auth.purge_expired_auth",
        "app.system.tasks.purge_journal.purge_journal",
        "app.system.tasks.purge_deleted_files.purge_deleted_files",
    ),
)
