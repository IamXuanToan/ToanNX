const SESSIONS_BASE = "/admin/sessions";
const SESSIONS_VI_BASE = "/quan-tri/he-thong/phien";
const SESSIONS_EN_BASE = "/admin/system/sessions";

/**
 * Route nội bộ của module System: đăng nhập/đặt lại mật khẩu, người dùng, phiên, vai trò, quyền, thư viện và
 * nhật ký. Route động là hàm trả `{ pathname, params }` cho `Link`/`router` của `@/i18n/navigation`.
 */
export const SYSTEM_ROUTES = {
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
  invitation: "/invitation",
  authCallback: (provider: string) => ({
    pathname: "/auth/callback/[provider]" as const,
    params: { provider },
  }),
  users: "/admin/users",
  userCreate: "/admin/users/new",
  userDetail: (id: string) => ({ pathname: "/admin/users/[id]" as const, params: { id } }),
  sessions: SESSIONS_BASE,
  roles: "/admin/roles",
  roleCreate: "/admin/roles/new",
  roleDetail: (id: string) => ({ pathname: "/admin/roles/[id]" as const, params: { id } }),
  permissions: "/admin/permissions",
  library: "/admin/attachments",
  /** Link chia sẻ của file riêng tư: kiểm quyền rồi mở file hoặc báo không có quyền. */
  fileAccess: (id: string) => ({ pathname: "/files/[id]" as const, params: { id } }),
  settings: "/admin/settings",
  notifications: "/admin/notifications",
  announcements: "/admin/announcements",
  announcementCreate: "/admin/announcements/new",
  currencies: "/admin/currencies",
  currencyCreate: "/admin/currencies/new",
  currencyDetail: (id: string) => ({ pathname: "/admin/currencies/[id]" as const, params: { id } }),
  exchangeRates: "/admin/exchange-rates",
  exchangeRateCreate: "/admin/exchange-rates/new",
  webhooks: "/admin/webhooks",
  callbacks: "/admin/callbacks",
  journalEntries: "/admin/journal",
  journalEntryDetail: (id: string) => ({
    pathname: "/admin/journal/[id]" as const,
    params: { id },
  }),
  emailTemplates: "/admin/email-templates",
  emailTemplateCreate: "/admin/email-templates/new",
  emailTemplateDetail: (id: string) => ({
    pathname: "/admin/email-templates/[id]" as const,
    params: { id },
  }),
  languages: "/admin/languages",
  languageCreate: "/admin/languages/new",
  languageDetail: (id: string) => ({
    pathname: "/admin/languages/[id]" as const,
    params: { id },
  }),
} as const;

/** Pathname theo ngôn ngữ của module System (gộp vào `routing.pathnames`). */
export const SYSTEM_PATHNAMES = {
  "/login": { vi: "/dang-nhap", en: "/login" },
  "/forgot-password": { vi: "/quen-mat-khau", en: "/forgot-password" },
  "/reset-password": { vi: "/dat-lai-mat-khau", en: "/reset-password" },
  "/verify-email": { vi: "/xac-minh-email", en: "/verify-email" },
  "/invitation": { vi: "/loi-moi", en: "/invitation" },
  "/auth/callback/[provider]": {
    vi: "/auth/callback/[provider]",
    en: "/auth/callback/[provider]",
  },
  "/admin/users": { vi: "/quan-tri/he-thong/nguoi-dung", en: "/admin/system/users" },
  "/admin/users/new": {
    vi: "/quan-tri/he-thong/nguoi-dung/tao-moi",
    en: "/admin/system/users/new",
  },
  "/admin/users/[id]": { vi: "/quan-tri/he-thong/nguoi-dung/[id]", en: "/admin/system/users/[id]" },
  [SESSIONS_BASE]: { vi: SESSIONS_VI_BASE, en: SESSIONS_EN_BASE },
  "/admin/roles": { vi: "/quan-tri/he-thong/vai-tro", en: "/admin/system/roles" },
  "/admin/roles/new": { vi: "/quan-tri/he-thong/vai-tro/tao-moi", en: "/admin/system/roles/new" },
  "/admin/roles/[id]": { vi: "/quan-tri/he-thong/vai-tro/[id]", en: "/admin/system/roles/[id]" },
  "/admin/permissions": { vi: "/quan-tri/he-thong/quyen", en: "/admin/system/permissions" },
  "/admin/attachments": { vi: "/quan-tri/he-thong/thu-vien", en: "/admin/system/attachments" },
  "/files/[id]": { vi: "/tep/[id]", en: "/files/[id]" },
  "/admin/settings": { vi: "/quan-tri/he-thong/cai-dat", en: "/admin/system/settings" },
  "/admin/notifications": {
    vi: "/quan-tri/he-thong/nhat-ky-thong-bao",
    en: "/admin/system/notification-log",
  },
  "/admin/announcements": {
    vi: "/quan-tri/he-thong/gui-thong-bao",
    en: "/admin/system/announcements",
  },
  "/admin/announcements/new": {
    vi: "/quan-tri/he-thong/gui-thong-bao/tao-moi",
    en: "/admin/system/announcements/new",
  },
  "/admin/currencies": { vi: "/quan-tri/he-thong/tien-te", en: "/admin/system/currencies" },
  "/admin/currencies/new": {
    vi: "/quan-tri/he-thong/tien-te/tao-moi",
    en: "/admin/system/currencies/new",
  },
  "/admin/currencies/[id]": {
    vi: "/quan-tri/he-thong/tien-te/[id]",
    en: "/admin/system/currencies/[id]",
  },
  "/admin/exchange-rates": { vi: "/quan-tri/he-thong/ty-gia", en: "/admin/system/exchange-rates" },
  "/admin/exchange-rates/new": {
    vi: "/quan-tri/he-thong/ty-gia/tao-moi",
    en: "/admin/system/exchange-rates/new",
  },
  "/admin/webhooks": { vi: "/quan-tri/he-thong/webhook", en: "/admin/system/webhooks" },
  "/admin/callbacks": { vi: "/quan-tri/he-thong/callback", en: "/admin/system/callbacks" },
  "/admin/email-templates": {
    vi: "/quan-tri/he-thong/mau-email",
    en: "/admin/system/email-templates",
  },
  "/admin/email-templates/new": {
    vi: "/quan-tri/he-thong/mau-email/tao-moi",
    en: "/admin/system/email-templates/new",
  },
  "/admin/email-templates/[id]": {
    vi: "/quan-tri/he-thong/mau-email/[id]",
    en: "/admin/system/email-templates/[id]",
  },
  "/admin/languages": {
    vi: "/quan-tri/he-thong/ngon-ngu",
    en: "/admin/system/languages",
  },
  "/admin/languages/new": {
    vi: "/quan-tri/he-thong/ngon-ngu/tao-moi",
    en: "/admin/system/languages/new",
  },
  "/admin/languages/[id]": {
    vi: "/quan-tri/he-thong/ngon-ngu/[id]",
    en: "/admin/system/languages/[id]",
  },
  "/admin/journal": { vi: "/quan-tri/he-thong/nhat-ky", en: "/admin/system/journal" },
  "/admin/journal/[id]": {
    vi: "/quan-tri/he-thong/nhat-ky/[id]",
    en: "/admin/system/journal/[id]",
  },
} as const;
