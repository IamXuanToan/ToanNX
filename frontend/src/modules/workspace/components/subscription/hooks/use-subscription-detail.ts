"use client";

import { useState } from "react";

import { useSubscription } from "../../../hooks/use-subscription";
import { useSubscriptionPayments } from "../../../hooks/use-subscription-payments";

/** @returns Query chi tiết Dịch vụ định kỳ, số kỳ thanh toán và modal Gia hạn. */
export function useSubscriptionDetail(id: string) {
  const query = useSubscription(id);
  const payments = useSubscriptionPayments({ subscription: id, pageSize: 1 });
  const [renewOpen, setRenewOpen] = useState(false);

  return {
    query,
    paymentCount: payments.data?.pagination.total ?? 0,
    renewOpen,
    setRenewOpen,
  };
}
