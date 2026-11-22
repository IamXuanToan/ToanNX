/** Route nội bộ của module Tài chính. Route động là hàm trả `{ pathname, params }` cho `Link`/`router`. */
export const FINANCE_ROUTES = {
  dashboard: "/admin/finance",
  reports: "/admin/finance/reports",
  sepay: "/admin/finance/sepay",
  incomes: "/admin/finance/incomes",
  incomeCreate: "/admin/finance/incomes/new",
  incomeDetail: (id: string) => ({
    pathname: "/admin/finance/incomes/[id]" as const,
    params: { id },
  }),
  invoices: "/admin/finance/invoices",
  invoiceCreate: "/admin/finance/invoices/new",
  invoiceDetail: (id: string) => ({
    pathname: "/admin/finance/invoices/[id]" as const,
    params: { id },
  }),
  platforms: "/admin/finance/platforms",
  platformCreate: "/admin/finance/platforms/new",
  platformDetail: (id: string) => ({
    pathname: "/admin/finance/platforms/[id]" as const,
    params: { id },
  }),
  rules: "/admin/finance/rules",
  ruleCreate: "/admin/finance/rules/new",
  ruleDetail: (id: string) => ({ pathname: "/admin/finance/rules/[id]" as const, params: { id } }),
} as const;

/** Pathname theo ngôn ngữ của module Tài chính (gộp vào `routing.pathnames`); URL vi có tiền tố `tai-chinh`. */
export const FINANCE_PATHNAMES = {
  "/admin/finance": { vi: "/quan-tri/tai-chinh", en: "/admin/finance" },
  "/admin/finance/reports": { vi: "/quan-tri/tai-chinh/bao-cao", en: "/admin/finance/reports" },
  "/admin/finance/sepay": { vi: "/quan-tri/tai-chinh/ket-noi-sepay", en: "/admin/finance/sepay" },
  "/admin/finance/incomes": { vi: "/quan-tri/tai-chinh/thu-nhap", en: "/admin/finance/incomes" },
  "/admin/finance/incomes/new": {
    vi: "/quan-tri/tai-chinh/thu-nhap/tao-moi",
    en: "/admin/finance/incomes/new",
  },
  "/admin/finance/incomes/[id]": {
    vi: "/quan-tri/tai-chinh/thu-nhap/[id]",
    en: "/admin/finance/incomes/[id]",
  },
  "/admin/finance/invoices": { vi: "/quan-tri/tai-chinh/hoa-don", en: "/admin/finance/invoices" },
  "/admin/finance/invoices/new": {
    vi: "/quan-tri/tai-chinh/hoa-don/tao-moi",
    en: "/admin/finance/invoices/new",
  },
  "/admin/finance/invoices/[id]": {
    vi: "/quan-tri/tai-chinh/hoa-don/[id]",
    en: "/admin/finance/invoices/[id]",
  },
  "/admin/finance/platforms": {
    vi: "/quan-tri/tai-chinh/nen-tang",
    en: "/admin/finance/platforms",
  },
  "/admin/finance/platforms/new": {
    vi: "/quan-tri/tai-chinh/nen-tang/tao-moi",
    en: "/admin/finance/platforms/new",
  },
  "/admin/finance/platforms/[id]": {
    vi: "/quan-tri/tai-chinh/nen-tang/[id]",
    en: "/admin/finance/platforms/[id]",
  },
  "/admin/finance/rules": { vi: "/quan-tri/tai-chinh/quy-tac", en: "/admin/finance/rules" },
  "/admin/finance/rules/new": {
    vi: "/quan-tri/tai-chinh/quy-tac/tao-moi",
    en: "/admin/finance/rules/new",
  },
  "/admin/finance/rules/[id]": {
    vi: "/quan-tri/tai-chinh/quy-tac/[id]",
    en: "/admin/finance/rules/[id]",
  },
} as const;
