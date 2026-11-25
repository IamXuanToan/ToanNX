/** Route nội bộ của module Tài chính trong Admin (Quản trị toàn sàn). */
export const FINANCE_ROUTES = {
  dashboard: "/admin/finance",
  reports: "/admin/finance/reports",
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
} as const;

/** Pathname theo ngôn ngữ của module Tài chính Admin (gộp vào `routing.pathnames`); URL vi có tiền tố `tai-chinh`. */
export const FINANCE_PATHNAMES = {
  "/admin/finance": { vi: "/quan-tri/tai-chinh", en: "/admin/finance" },
  "/admin/finance/reports": { vi: "/quan-tri/tai-chinh/bao-cao", en: "/admin/finance/reports" },
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
} as const;
