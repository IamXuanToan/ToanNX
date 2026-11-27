import type { CALENDAR_EVENT_TYPES } from "../constants/defaults";

export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number];

/** Sự kiện hợp nhất trên Lịch cá nhân (khớp `WorkspaceCalendarEventResponse`). */
export type WorkspaceCalendarEvent = {
  id: string;
  sourceId: string;
  type: CalendarEventType;
  date: string;
  time: string;
  title: string;
  subtitle: string;
  status: string;
  amountVnd: string | null;
  isCompleted: boolean;
  link: string;
};

/** Dữ liệu Lịch hợp nhất theo khoảng ngày (khớp `WorkspaceCalendarResponse`). */
export type WorkspaceCalendar = {
  timezone: string;
  fromDate: string;
  toDate: string;
  events: WorkspaceCalendarEvent[];
};

/** Tham số truy vấn API Lịch hợp nhất. */
export type WorkspaceCalendarParams = {
  fromDate: string;
  toDate: string;
  types?: readonly string[];
  ownerId?: string | null;
};
