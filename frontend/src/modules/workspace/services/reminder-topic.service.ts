import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { WORKSPACE_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  ReminderTopic,
  ReminderTopicFilters,
  ReminderTopicInput,
} from "../types/reminder-topic.types";

/** Service Chủ đề nhắc việc cá nhân (BE `reminder_topic_service.py`). */
export const reminderTopicService = createCrudService<
  ReminderTopic,
  ReminderTopicFilters,
  ReminderTopicInput,
  Partial<ReminderTopicInput>,
  ReminderTopic
>(WORKSPACE_API_ENDPOINTS.reminderTopics);
