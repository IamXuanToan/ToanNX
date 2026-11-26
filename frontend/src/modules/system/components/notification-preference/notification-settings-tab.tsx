"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "../../hooks/use-permission";
import { useTelegramBot } from "../../hooks/use-telegram-bot";
import { NOTIFICATION_PREFERENCE_PERMISSIONS } from "../../permissions/notification-preference-permission";
import { PUSH_DEVICE_PERMISSIONS } from "../../permissions/push-device-permission";
import { SETTING_PERMISSIONS } from "../../permissions/setting-permission";
import { TELEGRAM_CHAT_PERMISSIONS } from "../../permissions/telegram-chat-permission";
import { PushDeviceCard } from "../push-device/push-device-card";
import { TelegramBotCard } from "../telegram-bot/telegram-bot-card";
import { TelegramChatList } from "../telegram-chat/telegram-chat-list";
import { NotificationPreferenceMatrix } from "./notification-preference-matrix";

/**
 * Tab "Thông báo" trong Hồ sơ cá nhân: thông báo trình duyệt, Bot Telegram hệ thống dùng chung,
 * nơi nhận Telegram cá nhân và bảng ma trận sự kiện × kênh.
 *
 * @returns Nội dung tab cài đặt thông báo.
 */
export function NotificationSettingsTab() {
  const t = useTranslations("system.notifications.settings");

  const canPreference = usePermission(NOTIFICATION_PREFERENCE_PERMISSIONS.read);
  const canPreferenceUpdate = usePermission(NOTIFICATION_PREFERENCE_PERMISSIONS.update);
  const canPushRead = usePermission(PUSH_DEVICE_PERMISSIONS.read);
  const canPushCreate = usePermission(PUSH_DEVICE_PERMISSIONS.create);
  const canCheckWebhook = usePermission(SETTING_PERMISSIONS.settingUpdate);
  const canChats = usePermission(TELEGRAM_CHAT_PERMISSIONS.read);
  const canChatCreate = usePermission(TELEGRAM_CHAT_PERMISSIONS.create);
  const canChatUpdate = usePermission(TELEGRAM_CHAT_PERMISSIONS.update);
  const canChatDelete = usePermission(TELEGRAM_CHAT_PERMISSIONS.delete);

  const bot = useTelegramBot(canChats || canCheckWebhook);
  const botConfigured = Boolean(bot.data?.configured);

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{t("hint")}</p>
      {canPushRead ? <PushDeviceCard canCreate={canPushCreate} /> : null}
      {canChats || canCheckWebhook ? <TelegramBotCard canCheck={canCheckWebhook} /> : null}
      {canChats && botConfigured ? (
        <TelegramChatList
          canCreate={canChatCreate}
          canUpdate={canChatUpdate}
          canDelete={canChatDelete}
        />
      ) : null}
      {canPreference ? (
        <NotificationPreferenceMatrix
          canUpdate={canPreferenceUpdate}
          canTelegram={canChats && botConfigured}
        />
      ) : null}
    </div>
  );
}
