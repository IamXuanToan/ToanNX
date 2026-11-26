import { createResourceKeys } from "@/shares/lib/api/resource-keys";

/** Phạm vi chung của query key module Workspace (invalidate toàn bộ bằng `workspaceKeys.all`). */
export const WORKSPACE_SCOPE = "workspace";

/** Query key của module Workspace. */
export const workspaceKeys = {
  all: [WORKSPACE_SCOPE] as const,
  assets: createResourceKeys(WORKSPACE_SCOPE, "assets"),
  warrantyClaims: createResourceKeys(WORKSPACE_SCOPE, "warranty-claims"),
  subscriptions: createResourceKeys(WORKSPACE_SCOPE, "subscriptions"),
  subscriptionPayments: createResourceKeys(WORKSPACE_SCOPE, "subscription-payments"),
  vaultItems: createResourceKeys(WORKSPACE_SCOPE, "vault-items"),
  monitorTargets: createResourceKeys(WORKSPACE_SCOPE, "monitor-targets"),
  monitorIncidents: createResourceKeys(WORKSPACE_SCOPE, "monitor-incidents"),
  reminders: createResourceKeys(WORKSPACE_SCOPE, "reminders"),
  conversations: createResourceKeys(WORKSPACE_SCOPE, "conversations"),
  conversationMessages: (id: string, before?: string | null) =>
    [WORKSPACE_SCOPE, "conversation-messages", id, before ?? null] as const,
  setting: (ownerId?: string | null) => [WORKSPACE_SCOPE, "setting", ownerId ?? "me"] as const,
  dashboardSummary: (ownerId?: string | null) =>
    [WORKSPACE_SCOPE, "dashboard-summary", ownerId ?? "me"] as const,
  calendar: (params: object) => [WORKSPACE_SCOPE, "calendar", params] as const,
};
