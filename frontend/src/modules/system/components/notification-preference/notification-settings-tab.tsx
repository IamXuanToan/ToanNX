"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "../../hooks/use-permission";
import { useCurrentUser } from "../../hooks/use-current-user";
import { useTelegramBot } from "../../hooks/use-telegram-bot";
import { NOTIFICATION_PREFERENCE_PERMISSIONS } from "../../permissions/notification-preference-permission";
import { PUSH_DEVICE_PERMISSIONS } from "../../permissions/push-device-permission";
import { TELEGRAM_BOT_PERMISSIONS } from "../../permissions/telegram-bot-permission";
import { TELEGRAM_CHAT_PERMISSIONS } from "../../permissions/telegram-chat-permission";
import { NotificationPreferenceMatrix } from "./notification-preference-matrix";
import { PushDeviceCard } from "../push-device/push-device-card";
import { TelegramBotCard } from "../telegram-bot/telegram-bot-card";
import { TelegramChatList } from "../telegram-chat/telegram-chat-list";

/**
 * Tab "Thông báo" trong Hồ sơ cá nhân: thông báo trình duyệt, bot Telegram riêng, nơi nhận Telegram, bảng sự
 * kiện × kênh. Khối nào hiện tùy quyền (không có quyền Telegram thì không có khối/cột Telegram).
 *
 * @returns Nội dung tab.
 */
export function NotificationSettingsTab() {
  const t = useTranslations("system.notifications.settings");
  const { data: currentUser } = useCurrentUser();
  const isSuperuser = Boolean(currentUser?.user?.isSuperuser);

  const canPreference = usePermission(NOTIFICATION_PREFERENCE_PERMISSIONS.read);
  const canPreferenceUpdate = usePermission(NOTIFICATION_PREFERENCE_PERMISSIONS.update);
  const canPush = usePermission(PUSH_DEVICE_PERMISSIONS.create);
  const hasBotPermission = usePermission(TELEGRAM_BOT_PERMISSIONS.read);
  const canBot = isSuperuser && hasBotPermission;
  const canBotUpdate = usePermission(TELEGRAM_BOT_PERMISSIONS.update);
  const canBotCreate = usePermission(TELEGRAM_BOT_PERMISSIONS.create);
  const canBotWrite = canBotUpdate || canBotCreate;
  const canBotDelete = usePermission(TELEGRAM_BOT_PERMISSIONS.delete);
  const canChats = usePermission(TELEGRAM_CHAT_PERMISSIONS.read);
  const canChatCreate = usePermission(TELEGRAM_CHAT_PERMISSIONS.create);
  const canChatDelete = usePermission(TELEGRAM_CHAT_PERMISSIONS.delete);
  const bot = useTelegramBot(canBot);
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{t("hint")}</p>
      {canPush ? <PushDeviceCard canCreate={canPush} /> : null}
      {canBot ? <TelegramBotCard canWrite={canBotWrite} canDelete={canBotDelete} /> : null}
      {canBot && canChats && bot.data ? (
        <TelegramChatList canCreate={canChatCreate} canDelete={canChatDelete} />
      ) : null}
      {canPreference ? (
        <NotificationPreferenceMatrix
          canUpdate={canPreferenceUpdate}
          canTelegram={canChats && Boolean(bot.data)}
        />
      ) : null}
    </div>
  );
}
