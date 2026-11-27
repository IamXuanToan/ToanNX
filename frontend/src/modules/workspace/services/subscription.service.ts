import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { WORKSPACE_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  Subscription,
  SubscriptionFilters,
  SubscriptionInput,
  SubscriptionRenewInput,
} from "../types/subscription.types";
import type { SubscriptionPayment } from "../types/subscription-payment.types";

/** Service quản lý Dịch vụ định kỳ & gia hạn (BE `subscription_service.py`). */
export const subscriptionService = {
  ...createCrudService<
    Subscription,
    SubscriptionFilters,
    SubscriptionInput,
    Partial<SubscriptionInput>,
    Subscription
  >(WORKSPACE_API_ENDPOINTS.subscriptions),

  /** Gia hạn dịch vụ, ghi nhận kỳ thanh toán và lùi `renew_date` nguyên tử. */
  async renew(id: string, input: SubscriptionRenewInput): Promise<SubscriptionPayment> {
    return (
      await apiClient.post<SubscriptionPayment>(
        WORKSPACE_API_ENDPOINTS.subscriptionRenew(id),
        input,
      )
    ).data;
  },
};
