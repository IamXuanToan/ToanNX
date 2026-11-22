"use client";

import { NotificationBell } from "@/modules/system/components/notification-bell";
import { ATTACHMENT_PERMISSIONS } from "@/modules/system/permissions/attachment-permission";
import { UserMenu } from "@/modules/system/components/user-menu";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { LanguageSwitcher } from "@/shares/components/layout/language-switcher";
import { ThemeSwitcher } from "@/shares/components/layout/theme-switcher";

import { AdminAttachmentPickerSlot } from "./admin-attachment-picker-slot";

/**
 * Nhóm nút bên phải header: ngôn ngữ, giao diện; tài khoản chỉ có ở đây khi không có sidebar.
 *
 * @param props - Có hiện menu tài khoản không.
 * @returns Nhóm nút.
 */
export function HeaderActions({ withAccount = false }: { withAccount?: boolean }) {
  const canReadLibrary = usePermission(ATTACHMENT_PERMISSIONS.read);
  return (
    <div className="flex items-center gap-2">
      <NotificationBell />
      <LanguageSwitcher />
      <ThemeSwitcher />
      {withAccount ? (
        <UserMenu
          renderAttachmentPicker={
            canReadLibrary
              ? (pickerProps) => <AdminAttachmentPickerSlot {...pickerProps} />
              : undefined
          }
        />
      ) : null}
    </div>
  );
}
