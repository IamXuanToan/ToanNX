"use client";

import { useProfileDialog } from "@/modules/system/components/current-user/hooks/use-profile-dialog";
import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { ATTACHMENT_PERMISSIONS } from "@/modules/system/permissions/attachment-permission";
import { NOTIFICATION_PREFERENCE_PERMISSIONS } from "@/modules/system/permissions/notification-preference-permission";
import { PUSH_DEVICE_PERMISSIONS } from "@/modules/system/permissions/push-device-permission";
import { TELEGRAM_CHAT_PERMISSIONS } from "@/modules/system/permissions/telegram-chat-permission";

/**
 * Hook điều khiển trang Hồ sơ cá nhân trong Client Portal.
 * Tái sử dụng logic form, đổi mật khẩu, ảnh đại diện, xác minh email và liên kết OAuth từ `useProfileDialog`
 * ở chế độ trang (`urlMode: "page"`), kết hợp kiểm tra quyền hiển thị thư viện và cài đặt thông báo.
 *
 * @returns Trạng thái tải, dữ liệu người dùng, phân quyền và toàn bộ handler cho `PortalProfile`.
 */
export function usePortalProfile() {
  const { data: currentUser, isLoading } = useCurrentUser();
  const user = currentUser?.user;
  const roles = currentUser?.roles ?? [];

  const profile = useProfileDialog({
    user,
    roles,
    open: Boolean(user),
    urlMode: "page",
  });

  const canPreferences = usePermission(NOTIFICATION_PREFERENCE_PERMISSIONS.read);
  const canPreferenceUpdate = usePermission(NOTIFICATION_PREFERENCE_PERMISSIONS.update);
  const canReadAttachments = usePermission(ATTACHMENT_PERMISSIONS.read);
  const canUploadAttachments = usePermission(ATTACHMENT_PERMISSIONS.create);
  const canPushDevices = usePermission(PUSH_DEVICE_PERMISSIONS.read);
  const canTelegramChats = usePermission(TELEGRAM_CHAT_PERMISSIONS.read);
  const canNotifications = canPreferences || canPushDevices || canTelegramChats;

  const allRoles: {
    key: string;
    label: string;
    variant: "default" | "secondary" | "outline" | "ghost";
  }[] = [];

  if (user?.isSuperuser) {
    allRoles.push({ key: "superuser", label: profile.t("roleSuperuser"), variant: "default" });
  }
  if (user?.isStaff && !user.isSuperuser) {
    allRoles.push({ key: "staff", label: profile.t("roleStaff"), variant: "secondary" });
  }
  if (user?.isNovel) {
    allRoles.push({ key: "novel", label: profile.t("roleNovel"), variant: "outline" });
  }
  for (const role of roles) {
    allRoles.push({ key: role.id, label: role.name, variant: "outline" });
  }
  if (!user?.isSuperuser && !user?.isStaff && roles.length === 0) {
    allRoles.push({ key: "user", label: profile.t("roleUser"), variant: "ghost" });
  }

  return {
    ...profile,
    isLoading,
    allRoles,
    canPreferences,
    canPreferenceUpdate,
    canNotifications,
    canReadAttachments,
    canUploadAttachments,
  };
}
