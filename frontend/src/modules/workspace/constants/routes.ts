/** Route nội bộ của module Workspace trong Client Portal (`/portal/...` ↔ `/ca-nhan/...`). */
export const WORKSPACE_ROUTES = {
  assets: "/portal/assets",
  assetCreate: "/portal/assets/new",
  assetDetail: (id: string) => ({
    pathname: "/portal/assets/[id]" as const,
    params: { id },
  }),
  warrantyClaims: "/portal/warranty-claims",
  warrantyClaimCreate: "/portal/warranty-claims/new",
  warrantyClaimDetail: (id: string) => ({
    pathname: "/portal/warranty-claims/[id]" as const,
    params: { id },
  }),
  subscriptions: "/portal/subscriptions",
  subscriptionCreate: "/portal/subscriptions/new",
  subscriptionDetail: (id: string) => ({
    pathname: "/portal/subscriptions/[id]" as const,
    params: { id },
  }),
  subscriptionPayments: "/portal/subscription-payments",
  vault: "/portal/vault",
  vaultCreate: "/portal/vault/new",
  vaultDetail: (id: string) => ({
    pathname: "/portal/vault/[id]" as const,
    params: { id },
  }),
  monitors: "/portal/monitors",
  monitorCreate: "/portal/monitors/new",
  monitorDetail: (id: string) => ({
    pathname: "/portal/monitors/[id]" as const,
    params: { id },
  }),
  monitorIncidents: "/portal/monitor-incidents",
  reminders: "/portal/reminders",
  reminderCreate: "/portal/reminders/new",
  reminderDetail: (id: string) => ({
    pathname: "/portal/reminders/[id]" as const,
    params: { id },
  }),
  assistant: "/portal/assistant",
  settings: "/portal/settings",
} as const;

/** Pathname theo ngôn ngữ của module Workspace (gộp vào `routing.pathnames`). */
export const WORKSPACE_PATHNAMES = {
  "/portal/assets": { vi: "/ca-nhan/thiet-bi", en: "/portal/assets" },
  "/portal/assets/new": { vi: "/ca-nhan/thiet-bi/tao-moi", en: "/portal/assets/new" },
  "/portal/assets/[id]": { vi: "/ca-nhan/thiet-bi/[id]", en: "/portal/assets/[id]" },
  "/portal/warranty-claims": { vi: "/ca-nhan/bao-hanh", en: "/portal/warranty-claims" },
  "/portal/warranty-claims/new": {
    vi: "/ca-nhan/bao-hanh/tao-moi",
    en: "/portal/warranty-claims/new",
  },
  "/portal/warranty-claims/[id]": {
    vi: "/ca-nhan/bao-hanh/[id]",
    en: "/portal/warranty-claims/[id]",
  },
  "/portal/subscriptions": { vi: "/ca-nhan/dich-vu", en: "/portal/subscriptions" },
  "/portal/subscriptions/new": { vi: "/ca-nhan/dich-vu/tao-moi", en: "/portal/subscriptions/new" },
  "/portal/subscriptions/[id]": { vi: "/ca-nhan/dich-vu/[id]", en: "/portal/subscriptions/[id]" },
  "/portal/subscription-payments": {
    vi: "/ca-nhan/gia-han",
    en: "/portal/subscription-payments",
  },
  "/portal/vault": { vi: "/ca-nhan/ket-sat", en: "/portal/vault" },
  "/portal/vault/new": { vi: "/ca-nhan/ket-sat/tao-moi", en: "/portal/vault/new" },
  "/portal/vault/[id]": { vi: "/ca-nhan/ket-sat/[id]", en: "/portal/vault/[id]" },
  "/portal/monitors": { vi: "/ca-nhan/uptime", en: "/portal/monitors" },
  "/portal/monitors/new": { vi: "/ca-nhan/uptime/tao-moi", en: "/portal/monitors/new" },
  "/portal/monitors/[id]": { vi: "/ca-nhan/uptime/[id]", en: "/portal/monitors/[id]" },
  "/portal/monitor-incidents": { vi: "/ca-nhan/su-co", en: "/portal/monitor-incidents" },
  "/portal/reminders": { vi: "/ca-nhan/nhac-viec", en: "/portal/reminders" },
  "/portal/reminders/new": { vi: "/ca-nhan/nhac-viec/tao-moi", en: "/portal/reminders/new" },
  "/portal/reminders/[id]": { vi: "/ca-nhan/nhac-viec/[id]", en: "/portal/reminders/[id]" },
  "/portal/assistant": { vi: "/ca-nhan/tro-ly", en: "/portal/assistant" },
  "/portal/settings": { vi: "/ca-nhan/cai-dat", en: "/portal/settings" },
} as const;
