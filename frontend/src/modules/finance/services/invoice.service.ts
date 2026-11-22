import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { FINANCE_API_ENDPOINTS } from "../constants/api-endpoints";
import type { Invoice, InvoiceFilters, InvoiceInput } from "../types/invoice.types";

/** Service hóa đơn / chứng từ (BE `finance/services/invoice_service.py`). */
export const invoiceService = createCrudService<
  Invoice,
  InvoiceFilters,
  InvoiceInput,
  InvoiceInput,
  Invoice
>(FINANCE_API_ENDPOINTS.invoices);
