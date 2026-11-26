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
  reminders: createResourceKeys(WORKSPACE_SCOPE, "reminders"),
  assistantConfig: () => [WORKSPACE_SCOPE, "assistant-config"] as const,
  assistantBotProfile: () => [WORKSPACE_SCOPE, "assistant-bot-profile"] as const,
  assistantThread: (page: number) => [WORKSPACE_SCOPE, "assistant-thread", page] as const,
  setting: (ownerId?: string | null) => [WORKSPACE_SCOPE, "setting", ownerId ?? "me"] as const,
  dashboardSummary: (ownerId?: string | null) =>
    [WORKSPACE_SCOPE, "dashboard-summary", ownerId ?? "me"] as const,
  calendar: (params: object) => [WORKSPACE_SCOPE, "calendar", params] as const,
};
