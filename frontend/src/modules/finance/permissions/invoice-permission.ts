/** Quyền của `InvoicePermission` (khớp `app/finance/permissions/invoice_permission.py`). */
export const INVOICE_PERMISSIONS = {
  read: "finance.invoice.read",
  create: "finance.invoice.create",
  update: "finance.invoice.update",
  delete: "finance.invoice.delete",
  manageAll: "finance.invoice.manage_all",
} as const;
