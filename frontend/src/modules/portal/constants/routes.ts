/**
 * Route nội bộ của Client Portal (Không gian thành viên / Studio cá nhân).
 * Route động là hàm trả `{ pathname, params }` cho `Link`/`router` của `@/i18n/navigation`.
 */
export const PORTAL_ROUTES = {
  dashboard: "/portal",
  pages: "/portal/pages",
  pageCreate: "/portal/pages/new",
  pageDetail: (id: string) => ({
    pathname: "/portal/pages/[id]" as const,
    params: { id },
  }),
  shortLinks: "/portal/short-links",
  shortLinkCreate: "/portal/short-links/new",
  shortLinkDetail: (id: string) => ({
    pathname: "/portal/short-links/[id]" as const,
    params: { id },
  }),
  qrCodes: "/portal/qr-codes",
  qrCodeCreate: "/portal/qr-codes/new",
  qrCodeDetail: (id: string) => ({
    pathname: "/portal/qr-codes/[id]" as const,
    params: { id },
  }),
  library: "/portal/library",
  files: "/portal/library",
  profile: "/portal/profile",
  donations: "/portal/donations",
  feedbacks: "/portal/feedbacks",
  feedbackDetail: (id: string) => ({
    pathname: "/portal/feedbacks/[id]" as const,
    params: { id },
  }),
  emailTemplates: "/portal/email-templates",
  emailTemplateCreate: "/portal/email-templates/new",
  emailTemplateDetail: (id: string) => ({
    pathname: "/portal/email-templates/[id]" as const,
    params: { id },
  }),

  // ---- Module Tài chính cá nhân ----
  finance: "/portal/finance",
  financeDashboard: "/portal/finance",
  financeIncomes: "/portal/finance/incomes",
  financeIncomeCreate: "/portal/finance/incomes/new",
  financeIncomeDetail: (id: string) => ({
    pathname: "/portal/finance/incomes/[id]" as const,
    params: { id },
  }),
  financeInvoices: "/portal/finance/invoices",
  financeInvoiceCreate: "/portal/finance/invoices/new",
  financeInvoiceDetail: (id: string) => ({
    pathname: "/portal/finance/invoices/[id]" as const,
    params: { id },
  }),
  financePlatforms: "/portal/finance/platforms",
  financePlatformCreate: "/portal/finance/platforms/new",
  financePlatformDetail: (id: string) => ({
    pathname: "/portal/finance/platforms/[id]" as const,
    params: { id },
  }),
  financeReports: "/portal/finance/reports",
  financeSepay: "/portal/finance/sepay",
} as const;

/** Pathname theo ngôn ngữ của Client Portal (gộp vào `routing.pathnames`). */
export const PORTAL_PATHNAMES = {
  "/portal": {
    vi: "/ca-nhan",
    en: "/portal",
  },
  "/portal/pages": {
    vi: "/ca-nhan/trang",
    en: "/portal/pages",
  },
  "/portal/pages/new": {
    vi: "/ca-nhan/trang/tao-moi",
    en: "/portal/pages/new",
  },
  "/portal/pages/[id]": {
    vi: "/ca-nhan/trang/[id]",
    en: "/portal/pages/[id]",
  },
  "/portal/short-links": {
    vi: "/ca-nhan/link-rut-gon",
    en: "/portal/short-links",
  },
  "/portal/short-links/new": {
    vi: "/ca-nhan/link-rut-gon/tao-moi",
    en: "/portal/short-links/new",
  },
  "/portal/short-links/[id]": {
    vi: "/ca-nhan/link-rut-gon/[id]",
    en: "/portal/short-links/[id]",
  },
  "/portal/qr-codes": {
    vi: "/ca-nhan/ma-qr",
    en: "/portal/qr-codes",
  },
  "/portal/qr-codes/new": {
    vi: "/ca-nhan/ma-qr/tao-moi",
    en: "/portal/qr-codes/new",
  },
  "/portal/qr-codes/[id]": {
    vi: "/ca-nhan/ma-qr/[id]",
    en: "/portal/qr-codes/[id]",
  },
  "/portal/library": {
    vi: "/ca-nhan/thu-vien",
    en: "/portal/library",
  },
  "/portal/files": {
    vi: "/ca-nhan/thu-vien",
    en: "/portal/library",
  },
  "/portal/profile": {
    vi: "/ca-nhan/ho-so",
    en: "/portal/profile",
  },
  "/portal/donations": {
    vi: "/ca-nhan/quyen-gop",
    en: "/portal/donations",
  },
  "/portal/feedbacks": {
    vi: "/ca-nhan/gop-y",
    en: "/portal/feedbacks",
  },
  "/portal/feedbacks/[id]": {
    vi: "/ca-nhan/gop-y/[id]",
    en: "/portal/feedbacks/[id]",
  },
  "/portal/email-templates": {
    vi: "/ca-nhan/mau-email",
    en: "/portal/email-templates",
  },
  "/portal/email-templates/new": {
    vi: "/ca-nhan/mau-email/tao-moi",
    en: "/portal/email-templates/new",
  },
  "/portal/email-templates/[id]": {
    vi: "/ca-nhan/mau-email/[id]",
    en: "/portal/email-templates/[id]",
  },

  // ---- Pathname tiếng Việt/Anh cho Tài chính cá nhân ----
  "/portal/finance": {
    vi: "/ca-nhan/tai-chinh",
    en: "/portal/finance",
  },
  "/portal/finance/incomes": {
    vi: "/ca-nhan/tai-chinh/thu-nhap",
    en: "/portal/finance/incomes",
  },
  "/portal/finance/incomes/new": {
    vi: "/ca-nhan/tai-chinh/thu-nhap/tao-moi",
    en: "/portal/finance/incomes/new",
  },
  "/portal/finance/incomes/[id]": {
    vi: "/ca-nhan/tai-chinh/thu-nhap/[id]",
    en: "/portal/finance/incomes/[id]",
  },
  "/portal/finance/invoices": {
    vi: "/ca-nhan/tai-chinh/hoa-don",
    en: "/portal/finance/invoices",
  },
  "/portal/finance/invoices/new": {
    vi: "/ca-nhan/tai-chinh/hoa-don/tao-moi",
    en: "/portal/finance/invoices/new",
  },
  "/portal/finance/invoices/[id]": {
    vi: "/ca-nhan/tai-chinh/hoa-don/[id]",
    en: "/portal/finance/invoices/[id]",
  },
  "/portal/finance/platforms": {
    vi: "/ca-nhan/tai-chinh/nen-tang",
    en: "/portal/finance/platforms",
  },
  "/portal/finance/platforms/new": {
    vi: "/ca-nhan/tai-chinh/nen-tang/tao-moi",
    en: "/portal/finance/platforms/new",
  },
  "/portal/finance/platforms/[id]": {
    vi: "/ca-nhan/tai-chinh/nen-tang/[id]",
    en: "/portal/finance/platforms/[id]",
  },
  "/portal/finance/reports": {
    vi: "/ca-nhan/tai-chinh/bao-cao",
    en: "/portal/finance/reports",
  },
  "/portal/finance/sepay": {
    vi: "/ca-nhan/tai-chinh/ket-noi-sepay",
    en: "/portal/finance/sepay",
  },
} as const;
