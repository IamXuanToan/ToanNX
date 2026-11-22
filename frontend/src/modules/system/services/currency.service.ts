import { createCrudService } from "@/shares/lib/api/create-crud-service";
import type { ListParams } from "@/shares/types/api.types";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type { Currency, CurrencyInput } from "../types/currency.types";

/** Service tiền tệ (BE `system/services/currency_service.py`). */
export const currencyService = createCrudService<
  Currency,
  ListParams & { isActive?: string },
  CurrencyInput,
  CurrencyInput,
  Currency
>(SYSTEM_API_ENDPOINTS.currencies);
