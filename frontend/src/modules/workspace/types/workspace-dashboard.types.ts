import type { ReminderPriority } from "./reminder.types";

/** Nhắc việc gọn trong ngày trên Dashboard (khớp `WorkspaceDashboardReminderResponse`). */
export type WorkspaceDashboardReminder = {
  id: string;
  title: string;
  dueDate: string;
  dueTime: string;
  priority: ReminderPriority;
  isCompleted: boolean;
};

/** Tổng hợp Dashboard Không gian cá nhân (khớp `WorkspaceDashboardSummaryResponse`). */
export type WorkspaceDashboardSummary = {
  ownerId: string;
  timezone: string;
  today: string;
  monthlySpendingVnd: string;
  subscriptionPaidVnd: string;
  assetPurchaseVnd: string;
  warrantyRepairVnd: string;
  projectedSubscriptionsVnd: string;
  pendingRemindersToday: number;
  overdueReminders: number;
  expiringWarranties30d: number;
  upcomingSubscriptions14d: number;
  upcomingSubscriptions14dVnd: string;
  monitorsTotal: number;
  monitorsHealthy: number;
  monitorsDown: number;
  todayReminders: WorkspaceDashboardReminder[];
};
