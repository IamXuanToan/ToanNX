/** Endpoint API của module Workspace (tương đối với `env.apiBasePath`, khớp `/api/v1/workspace/...`). */
export const WORKSPACE_API_ENDPOINTS = {
  assets: "/workspace/assets",
  warrantyClaims: "/workspace/warranty-claims",
  subscriptions: "/workspace/subscriptions",
  subscriptionRenew: (id: string) => `/workspace/subscriptions/${id}/renew`,
  subscriptionPayments: "/workspace/subscription-payments",
  vaultItems: "/workspace/vault-items",
  vaultItemReveal: (id: string) => `/workspace/vault-items/${id}/reveal`,
  monitorTargets: "/workspace/monitor-targets",
  monitorTargetPing: (id: string) => `/workspace/monitor-targets/${id}/ping`,
  monitorIncidents: "/workspace/monitor-incidents",
  reminders: "/workspace/reminders",
  settings: "/workspace/settings",
  settingsByOwner: (ownerId: string) => `/workspace/settings/${ownerId}`,
  dashboardSummary: "/workspace/dashboard/summary",
  calendar: "/workspace/calendar",
  assistantChat: "/workspace/assistant/chat",
  assistantConversations: "/workspace/assistant/conversations",
  assistantConversationMessages: (id: string) =>
    `/workspace/assistant/conversations/${id}/messages`,
} as const;
