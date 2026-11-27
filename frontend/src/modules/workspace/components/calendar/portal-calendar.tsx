"use client";

import { format, isToday, parseISO } from "date-fns";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Circle, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { FormDialog } from "@/shares/components/common/form-dialog";
import { StatusBadge, type StatusTone } from "@/shares/components/common/status-badge";
import { Button } from "@/shares/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shares/components/ui/card";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { DEFAULT_CURRENCY } from "@/shares/constants/currency";
import { getDateFnsLocale } from "@/shares/lib/date-fns-locale";
import { formatDisplayMoney } from "@/shares/lib/number-format";
import { cn } from "cn";

import { CALENDAR_EVENT_TYPES } from "../../constants/defaults";
import { WORKSPACE_ROUTES } from "../../constants/routes";
import type {
  CalendarEventType,
  WorkspaceCalendarEvent,
} from "../../types/workspace-calendar.types";
import { ReminderForm } from "../reminder/reminder-form";
import { usePortalCalendar } from "./hooks/use-portal-calendar";

function resolveEventHref(ev: WorkspaceCalendarEvent) {
  switch (ev.type) {
    case "subscription":
      return WORKSPACE_ROUTES.subscriptionDetail(ev.sourceId);
    case "reminder":
      return WORKSPACE_ROUTES.reminderDetail(ev.sourceId);
    case "asset_warranty":
      return WORKSPACE_ROUTES.assetDetail(ev.sourceId);
    case "warranty_claim":
      return WORKSPACE_ROUTES.warrantyClaimDetail(ev.sourceId);
  }
}

const EVENT_TONE: Record<CalendarEventType, StatusTone> = {
  subscription: "warning",
  reminder: "info",
  asset_warranty: "neutral",
  warranty_claim: "success",
};

const DOT_CLASS: Record<CalendarEventType, string> = {
  subscription: "bg-warning",
  reminder: "bg-info",
  asset_warranty: "bg-primary",
  warranty_claim: "bg-success",
};

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

/**
 * Lịch tổng hợp 4 nguồn (Dịch vụ định kỳ, Nhắc việc, Hết bảo hành, Hẹn trả sửa chữa):
 * hỗ trợ lọc chip đa nguồn, xem sự kiện ngày chọn, đánh dấu xong Reminder trực tiếp và mở `FormDialog`
 * tạo nhanh Nhắc việc với form đầy đủ.
 *
 * @param props - Quyền đọc lịch, quyền tạo/cập nhật nhắc việc.
 * @returns Khối Lịch tổng hợp.
 */
export function PortalCalendar({
  canReadCalendar = true,
  canCreateReminder = false,
  canUpdateReminder = false,
}: {
  canReadCalendar?: boolean;
  canCreateReminder?: boolean;
  canUpdateReminder?: boolean;
}) {
  const t = useTranslations("workspace.calendar");
  const locale = useLocale();
  const dateFnsLocale = getDateFnsLocale(locale);
  const state = usePortalCalendar(canReadCalendar);

  const selectedDateLabel = format(parseISO(state.selectedDate), "dd/MM/yyyy");
  const monthTitle = format(state.monthDate, "MMMM yyyy", { locale: dateFnsLocale });

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="text-primary size-5" aria-hidden />
              {t("title")}
            </CardTitle>
            <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("prevMonth")}
              onClick={state.prevMonth}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-36 text-center text-sm font-semibold capitalize">
              {monthTitle}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("nextMonth")}
              onClick={state.nextMonth}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={state.goToday}>
              {t("today")}
            </Button>
            {canCreateReminder ? (
              <Button type="button" size="sm" onClick={() => state.setQuickAddOpen(true)}>
                <Plus />
                {t("quickAddReminder")}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {CALENDAR_EVENT_TYPES.map((type) => {
            const active = state.selectedTypes.includes(type);
            return (
              <Button
                key={type}
                type="button"
                size="sm"
                variant={active ? "secondary" : "outline"}
                onClick={() => state.toggleType(type)}
                className="h-8 gap-1.5 text-xs"
              >
                <span className={cn("size-2 rounded-full", DOT_CLASS[type])} aria-hidden />
                {t(`types.${type}`)}
              </Button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="grid grid-cols-7 gap-1 pb-2 text-center text-xs font-medium">
            {WEEKDAY_KEYS.map((day) => (
              <div key={day} className="text-muted-foreground py-1">
                {t(`weekdays.${day}`)}
              </div>
            ))}
          </div>

          {state.query.isPending ? (
            <Skeleton className="h-72 w-full rounded-xl" />
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {state.days.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const dayEvents = state.eventsByDate.get(dateStr) ?? [];
                const selected = state.selectedDate === dateStr;
                const inMonth = state.isCurrentMonth(day);
                const today = isToday(day);
                return (
                  <Button
                    key={dateStr}
                    type="button"
                    variant="ghost"
                    onClick={() => state.selectDate(dateStr)}
                    className={cn(
                      "flex h-16 flex-col items-start justify-between rounded-lg border p-1.5 text-left font-normal",
                      !inMonth && "text-muted-foreground/50 bg-muted/20",
                      today && "border-primary/60",
                      selected && "bg-primary-light border-primary text-foreground",
                    )}
                  >
                    <span className={cn("text-xs tabular-nums", today && "text-primary font-bold")}>
                      {format(day, "d")}
                    </span>
                    {dayEvents.length > 0 ? (
                      <div className="flex w-full flex-wrap items-center gap-0.5">
                        {dayEvents.slice(0, 4).map((ev) => (
                          <span
                            key={ev.id}
                            className={cn("size-1.5 rounded-full", DOT_CLASS[ev.type])}
                          />
                        ))}
                        {dayEvents.length > 4 ? (
                          <span className="text-muted-foreground text-[10px]">
                            +{dayEvents.length - 4}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-xl border p-4">
          <h3 className="text-sm font-semibold">{t("selectedDay", { date: selectedDateLabel })}</h3>
          {state.selectedDayEvents.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">{t("noEvents")}</p>
          ) : (
            <ul className="space-y-2.5">
              {state.selectedDayEvents.map((ev) => (
                <li
                  key={ev.id}
                  className="bg-muted/30 flex items-start justify-between gap-2 rounded-lg border p-3 text-sm"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge tone={EVENT_TONE[ev.type]}>{t(`types.${ev.type}`)}</StatusBadge>
                      {ev.time ? (
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {ev.time}
                        </span>
                      ) : null}
                    </div>
                    <p
                      className={cn(
                        "font-medium break-words",
                        ev.isCompleted && "text-muted-foreground line-through",
                      )}
                    >
                      {ev.title}
                    </p>
                    {ev.subtitle ? (
                      <p className="text-muted-foreground text-xs">{ev.subtitle}</p>
                    ) : null}
                    {ev.amountVnd ? (
                      <p className="text-xs font-semibold tabular-nums">
                        {formatDisplayMoney(ev.amountVnd, { currency: DEFAULT_CURRENCY })}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {ev.type === "reminder" && canUpdateReminder ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={ev.isCompleted ? t("reopen") : t("markDone")}
                        onClick={() => void state.toggleReminderDone(ev.sourceId, ev.isCompleted)}
                      >
                        {ev.isCompleted ? (
                          <CheckCircle2 className="text-success size-4" />
                        ) : (
                          <Circle className="text-muted-foreground size-4" />
                        )}
                      </Button>
                    ) : null}
                    <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                      <Link href={resolveEventHref(ev) as never}>{t("viewDetail")}</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>

      {canCreateReminder ? (
        <FormDialog
          open={state.quickAddOpen}
          onOpenChange={state.setQuickAddOpen}
          title={t("quickAddTitle", { date: selectedDateLabel })}
        >
          <ReminderForm
            defaultDueDate={state.selectedDate}
            onSaved={() => state.setQuickAddOpen(false)}
            onCancel={() => state.setQuickAddOpen(false)}
          />
        </FormDialog>
      ) : null}
    </Card>
  );
}
