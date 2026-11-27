"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { CALENDAR_EVENT_TYPES } from "../../../constants/defaults";
import { workspaceKeys } from "../../../constants/query-keys";
import { useWorkspaceCalendar } from "../../../hooks/use-workspace-calendar";
import { reminderService } from "../../../services/reminder.service";
import type {
  CalendarEventType,
  WorkspaceCalendarEvent,
} from "../../../types/workspace-calendar.types";

function parseMonthOrToday(raw: string | null): Date {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const parsed = parseISO(`${raw}-01`);
    if (!Number.isNaN(parsed.getTime())) return startOfMonth(parsed);
  }
  return startOfMonth(new Date());
}

function parseDateOrToday(raw: string | null): string {
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return format(new Date(), "yyyy-MM-dd");
}

function parseTypes(raw: string | null): CalendarEventType[] {
  if (!raw) return [...CALENDAR_EVENT_TYPES];
  const valid = raw
    .split(",")
    .filter((item): item is CalendarEventType =>
      (CALENDAR_EVENT_TYPES as readonly string[]).includes(item),
    );
  return valid.length > 0 ? valid : [...CALENDAR_EVENT_TYPES];
}

/**
 * State Lịch tổng hợp 5 nguồn trên Dashboard Portal:
 * đồng bộ `?month=yyyy-MM&date=yyyy-MM-dd&types=...` qua `window.history.replaceState`
 * để F5 giữ nguyên tháng, ngày chọn và bộ lọc.
 *
 * @param enabled - Quyền `workspace.calendar.read`.
 * @returns Tháng đang xem, danh sách ô ngày, sự kiện theo ngày, bộ lọc loại & modal tạo nhanh nhắc việc.
 */
export function usePortalCalendar(enabled = true) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const [monthDate, setMonthDate] = useState<Date>(() =>
    parseMonthOrToday(searchParams?.get("month") ?? null),
  );
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    parseDateOrToday(searchParams?.get("date") ?? null),
  );
  const [selectedTypes, setSelectedTypes] = useState<CalendarEventType[]>(() =>
    parseTypes(searchParams?.get("types") ?? null),
  );
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const syncUrl = useCallback(
    (nextMonth: Date, nextSelectedDate: string, nextTypes: CalendarEventType[]) => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      url.searchParams.set("month", format(nextMonth, "yyyy-MM"));
      url.searchParams.set("date", nextSelectedDate);
      if (nextTypes.length === CALENDAR_EVENT_TYPES.length) {
        url.searchParams.delete("types");
      } else {
        url.searchParams.set("types", nextTypes.join(","));
      }
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    },
    [],
  );

  const gridStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const fromDate = format(gridStart, "yyyy-MM-dd");
  const toDate = format(gridEnd, "yyyy-MM-dd");

  const query = useWorkspaceCalendar(
    {
      fromDate,
      toDate,
      types: selectedTypes.length === CALENDAR_EVENT_TYPES.length ? undefined : selectedTypes,
    },
    { enabled },
  );

  const events = query.data?.events ?? [];
  const eventsByDate = new Map<string, WorkspaceCalendarEvent[]>();
  for (const ev of events) {
    const list = eventsByDate.get(ev.date) ?? [];
    list.push(ev);
    eventsByDate.set(ev.date, list);
  }

  return {
    monthDate,
    selectedDate,
    selectedTypes,
    days,
    eventsByDate,
    selectedDayEvents: eventsByDate.get(selectedDate) ?? [],
    query,
    quickAddOpen,
    setQuickAddOpen,
    isCurrentMonth: (d: Date) => isSameMonth(d, monthDate),
    prevMonth: () => {
      const next = subMonths(monthDate, 1);
      setMonthDate(next);
      syncUrl(next, selectedDate, selectedTypes);
    },
    nextMonth: () => {
      const next = addMonths(monthDate, 1);
      setMonthDate(next);
      syncUrl(next, selectedDate, selectedTypes);
    },
    goToday: () => {
      const today = new Date();
      const todayMonth = startOfMonth(today);
      const todayStr = format(today, "yyyy-MM-dd");
      setMonthDate(todayMonth);
      setSelectedDate(todayStr);
      syncUrl(todayMonth, todayStr, selectedTypes);
    },
    selectDate: (dateStr: string) => {
      setSelectedDate(dateStr);
      syncUrl(monthDate, dateStr, selectedTypes);
    },
    toggleType: (type: CalendarEventType) => {
      const exists = selectedTypes.includes(type);
      const next = exists
        ? selectedTypes.length > 1
          ? selectedTypes.filter((t) => t !== type)
          : selectedTypes
        : [...selectedTypes, type];
      setSelectedTypes(next);
      syncUrl(monthDate, selectedDate, next);
    },
    toggleReminderDone: async (sourceId: string, currentCompleted: boolean) => {
      await reminderService.update(sourceId, { isCompleted: !currentCompleted });
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  };
}
