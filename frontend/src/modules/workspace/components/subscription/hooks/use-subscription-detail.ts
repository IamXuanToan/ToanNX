"use client";

import { useState } from "react";

import { useTabState } from "@/shares/hooks/use-tab-state";

import { useSubscription } from "../../../hooks/use-subscription";
import { useSubscriptionPayments } from "../../../hooks/use-subscription-payments";

const VALID_TABS = ["general", "payments", "history"] as const;

/** @returns Query chi tiết Dịch vụ định kỳ, số kỳ thanh toán, tab đồng bộ `?tab=`, modal Gia hạn. */
export function useSubscriptionDetail(id: string) {
  const query = useSubscription(id);
  const payments = useSubscriptionPayments({ subscription: id, pageSize: 1 });
  const [activeTab, setActiveTab] = useTabState({ validTabs: VALID_TABS, defaultTab: "general" });
  const [renewOpen, setRenewOpen] = useState(false);

  return {
    query,
    paymentCount: payments.data?.pagination.total ?? 0,
    activeTab,
    setActiveTab,
    renewOpen,
    setRenewOpen,
  };
}
