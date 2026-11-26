import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { WORKSPACE_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  SubscriptionPayment,
  SubscriptionPaymentFilters,
} from "../types/subscription-payment.types";

/** Service lịch sử thanh toán gia hạn dịch vụ (BE `subscription_payment_service.py`). */
export const subscriptionPaymentService = createCrudService<
  SubscriptionPayment,
  SubscriptionPaymentFilters,
  never,
  never,
  SubscriptionPayment
>(WORKSPACE_API_ENDPOINTS.subscriptionPayments);
