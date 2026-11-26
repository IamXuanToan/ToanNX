"use client";

import { Globe, Mail, Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { Checkbox } from "@/shares/components/ui/checkbox";
import { Label } from "@/shares/components/ui/label";
import { cn } from "cn";

import {
  WORKSPACE_NOTIFICATION_CHANNELS,
  type WorkspaceNotificationChannel,
} from "../../constants/defaults";

const CHANNEL_ICONS: Record<WorkspaceNotificationChannel, typeof Globe> = {
  WEBSITE: Globe,
  TELEGRAM: Send,
  EMAIL: Mail,
};

/**
 * Bộ chọn kênh nhận thông báo cho từng Nhắc việc / Dịch vụ định kỳ / Thiết bị:
 * mặc định Website (Chuông & Web Push), tùy chọn thêm hoặc chuyển sang Telegram, Email.
 *
 * @param props - Danh sách kênh đang chọn, callback đổi giá trị, trạng thái khóa & tiền tố ID DOM.
 * @returns Danh sách checkbox chọn kênh thông báo.
 */
export function NotificationChannelsField({
  value,
  onChange,
  disabled = false,
  idPrefix = "ws-channel",
}: {
  value: WorkspaceNotificationChannel[];
  onChange: (next: WorkspaceNotificationChannel[]) => void;
  disabled?: boolean;
  idPrefix?: string;
}) {
  const t = useTranslations("workspace.notificationChannels");
  const current = value.length > 0 ? value : (["WEBSITE"] as WorkspaceNotificationChannel[]);

  function toggleChannel(channel: WorkspaceNotificationChannel, checked: boolean) {
    if (disabled) return;
    const nextSet = new Set<WorkspaceNotificationChannel>(current);
    if (checked) nextSet.add(channel);
    else nextSet.delete(channel);
    const ordered = WORKSPACE_NOTIFICATION_CHANNELS.filter((item) => nextSet.has(item));
    onChange(ordered);
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-3">
        {WORKSPACE_NOTIFICATION_CHANNELS.map((channel) => {
          const Icon = CHANNEL_ICONS[channel];
          const selected = current.includes(channel);
          const inputId = `${idPrefix}-${channel.toLowerCase()}`;
          return (
            <div
              key={channel}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors",
                selected ? "border-primary/40 bg-primary/5" : "border-border bg-card",
                disabled && "opacity-70",
              )}
            >
              <Checkbox
                id={inputId}
                checked={selected}
                onCheckedChange={(checked) => toggleChannel(channel, Boolean(checked))}
                disabled={disabled}
              />
              <Label
                htmlFor={inputId}
                className="flex flex-1 cursor-pointer items-center gap-1.5 text-sm font-medium"
              >
                <Icon className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
                <span>{t(`options.${channel}`)}</span>
              </Label>
            </div>
          );
        })}
      </div>
      <p className="text-muted-foreground text-xs">{t("hint")}</p>
    </div>
  );
}
