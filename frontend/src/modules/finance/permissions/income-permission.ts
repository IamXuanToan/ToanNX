/** Quyền của `IncomePermission` (khớp `app/finance/permissions/income_permission.py`). */
export const INCOME_PERMISSIONS = {
  read: "finance.income.read",
  create: "finance.income.create",
  update: "finance.income.update",
  delete: "finance.income.delete",
  manageAll: "finance.income.manage_all",
} as const;
