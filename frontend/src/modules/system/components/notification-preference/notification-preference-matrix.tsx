"use client";

import { useTranslations } from "next-intl";

import { Form } from "@/shares/components/common/form";
import { Checkbox } from "@/shares/components/ui/checkbox";
import { Skeleton } from "@/shares/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shares/components/ui/table";

import { NOTIFICATION_PREFERENCES_FORM_ID } from "../../constants/profile-forms";
import { useNotificationPreferenceMatrix } from "./hooks/use-notification-preference-matrix";

/**
 * Bảng sự kiện × kênh (Trong app, Trình duyệt, Email, Telegram theo chat) — chỉ sự kiện người dùng có quyền;
 * ô Trong app của sự kiện lỗi bị khóa.
 *
 * @param props - Có quyền sửa, có quyền Telegram.
 * @returns Bảng tùy chọn.
 */
export function NotificationPreferenceMatrix({
  canUpdate,
  canTelegram,
}: {
  canUpdate: boolean;
  canTelegram: boolean;
}) {
  const t = useTranslations("system.notifications.preferences");
  const state = useNotificationPreferenceMatrix(canTelegram);
  if (state.preferences.isPending) return <Skeleton className="h-40 w-full rounded-xl" />;
  const has = (channel: string) => state.channels.includes(channel as never);
  return (
    // Nút "Lưu tùy chọn" nằm ở footer dialog Hồ sơ (ngoài form), gửi form này qua thuộc tính `form`.
    <Form
      id={NOTIFICATION_PREFERENCES_FORM_ID}
      onSubmit={(event) => {
        event.preventDefault();
        if (canUpdate && !state.isSaving) state.save();
      }}
      className="space-y-3"
    >
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-56">{t("event")}</TableHead>
              <TableHead className="text-center">{t("inApp")}</TableHead>
              {has("PUSH") ? <TableHead className="text-center">{t("push")}</TableHead> : null}
              <TableHead className="text-center">{t("email")}</TableHead>
              {has("TELEGRAM") && canTelegram ? (
                <TableHead className="text-center">{t("telegram")}</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.items.map((item) => {
              const row = state.draft.find((entry) => entry.eventCode === item.event.code);
              if (!row) return null;
              return (
                <TableRow key={item.event.code}>
                  {/* TableCell mặc định không xuống dòng: cột sự kiện phải cho xuống dòng, nếu không bảng
                      rộng hơn khung và tên sự kiện bị che khi cuộn ngang. */}
                  <TableCell className="min-w-56 whitespace-normal">
                    <p className="font-medium">{item.event.name}</p>
                    <p className="text-muted-foreground text-xs">{item.event.description}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={row.inApp}
                      disabled={!canUpdate || item.inAppLocked}
                      onCheckedChange={(checked) =>
                        state.update(row.eventCode, { inApp: checked === true })
                      }
                      aria-label={t("inApp")}
                    />
                  </TableCell>
                  {has("PUSH") ? (
                    <TableCell className="text-center">
                      <Checkbox
                        checked={row.push}
                        disabled={!canUpdate}
                        onCheckedChange={(checked) =>
                          state.update(row.eventCode, { push: checked === true })
                        }
                        aria-label={t("push")}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell className="text-center">
                    <Checkbox
                      checked={row.email}
                      disabled={!canUpdate}
                      onCheckedChange={(checked) =>
                        state.update(row.eventCode, { email: checked === true })
                      }
                      aria-label={t("email")}
                    />
                  </TableCell>
                  {has("TELEGRAM") && canTelegram ? (
                    <TableCell className="text-center">
                      <Checkbox
                        checked={state.telegramState(row)}
                        disabled={!canUpdate || !state.hasTelegramChats}
                        onCheckedChange={(checked) =>
                          state.toggleTelegram(row.eventCode, checked === true)
                        }
                        aria-label={t("telegram")}
                      />
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Form>
  );
}
