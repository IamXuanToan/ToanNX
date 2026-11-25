import { BarChart3, FileText, LayoutDashboard, Receipt, Wallet } from "lucide-react";

import type { AdminModuleNavigation } from "@/shares/types/navigation.types";

import { FINANCE_ROUTES } from "./constants/routes";
import { INCOME_PERMISSIONS } from "./permissions/income-permission";
import { INVOICE_PERMISSIONS } from "./permissions/invoice-permission";
import { REPORT_PERMISSIONS } from "./permissions/report-permission";

/** Điều hướng module Tài chính (mã BE `finance`) trong nhóm `finance`; mục chỉ hiện khi có quyền. */
export const financeNavigation: AdminModuleNavigation = {
  module: "finance",
  nameKey: "finance.module.name",
  descriptionKey: "finance.module.description",
  group: "finance",
  icon: Wallet,
  items: [
    {
      labelKey: "finance.nav.dashboard",
      href: FINANCE_ROUTES.dashboard,
      icon: LayoutDashboard,
      permission: REPORT_PERMISSIONS.read,
      section: "finance.navSections.overview",
    },
    {
      labelKey: "finance.nav.reports",
      href: FINANCE_ROUTES.reports,
      icon: BarChart3,
      permission: REPORT_PERMISSIONS.read,
      section: "finance.navSections.overview",
    },
    {
      labelKey: "finance.nav.incomes",
      href: FINANCE_ROUTES.incomes,
      icon: Receipt,
      permission: INCOME_PERMISSIONS.read,
      section: "finance.navSections.transactions",
    },
    {
      labelKey: "finance.nav.invoices",
      href: FINANCE_ROUTES.invoices,
      icon: FileText,
      permission: INVOICE_PERMISSIONS.read,
      section: "finance.navSections.transactions",
    },
  ],
};
