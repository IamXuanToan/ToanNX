import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { WORKSPACE_API_ENDPOINTS } from "../constants/api-endpoints";
import type { Reminder, ReminderFilters, ReminderInput } from "../types/reminder.types";

/** Service Nhắc việc cá nhân (BE `reminder_service.py`). */
export const reminderService = createCrudService<
  Reminder,
  ReminderFilters,
  ReminderInput,
  Partial<ReminderInput> & { isCompleted?: boolean },
  Reminder
>(WORKSPACE_API_ENDPOINTS.reminders);
