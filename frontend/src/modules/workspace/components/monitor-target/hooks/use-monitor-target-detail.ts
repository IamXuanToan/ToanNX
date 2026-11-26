"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useTabState } from "@/shares/hooks/use-tab-state";

import { useMonitorIncidents } from "../../../hooks/use-monitor-incidents";
import { useMonitorTarget } from "../../../hooks/use-monitor-target";
import { usePingMonitorTarget } from "../../../hooks/use-ping-monitor-target";

const VALID_TABS = ["general", "incidents", "history"] as const;

/** @returns Query chi tiết Endpoint Uptime, số sự cố, tab `?tab=` và action Ping ngay. */
export function useMonitorTargetDetail(id: string) {
  const t = useTranslations("workspace.monitors");
  const query = useMonitorTarget(id);
  const incidents = useMonitorIncidents({ target: id, pageSize: 1 });
  const ping = usePingMonitorTarget();
  const [activeTab, setActiveTab] = useTabState({ validTabs: VALID_TABS, defaultTab: "general" });

  return {
    query,
    incidentCount: incidents.data?.pagination.total ?? 0,
    activeTab,
    setActiveTab,
    isPinging: ping.isPending,
    pingNow: async () => {
      const res = await ping.mutateAsync(id);
      if (res.status === "HEALTHY") {
        toast.success(
          t("pingSuccess", { code: res.statusCode ?? 200, latency: res.latencyMs ?? 0 }),
        );
      } else {
        toast.warning(t("pingDown", { error: res.errorMessage || `HTTP ${res.statusCode}` }));
      }
    },
  };
}
