"use client";

import { BellRing, MonitorSmartphone } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";

import { usePushDevices } from "../hooks/use-push-devices";
import { usePushRegistration } from "./hooks/use-push-registration";

/** @param props - Có quyền đăng ký. @returns Trạng thái thông báo trình duyệt + thiết bị đã bật. */
export function PushDeviceCard({ canCreate }: { canCreate: boolean }) {
  const t = useTranslations("system.notifications.push");
  const format = useFormatter();
  const push = usePushRegistration(canCreate);
  const devices = usePushDevices();
  return (
    <section className="space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-medium">
          <MonitorSmartphone className="size-4" aria-hidden />
          {t("title")}
        </p>
        {push.supported && push.permission !== "granted" ? (
          <Button
            type="button"
            size="sm"
            onClick={() => void push.enable()}
            disabled={push.busy || push.permission === "denied"}
          >
            <BellRing />
            {t("enable")}
          </Button>
        ) : null}
      </div>
      <p className="text-muted-foreground text-sm">
        {!push.supported
          ? t("unsupported")
          : push.permission === "denied"
            ? t("denied")
            : push.permission === "granted"
              ? t("granted")
              : t("hint")}
      </p>
      {devices.data?.length ? (
        <ul className="text-sm">
          {devices.data.map((device) => (
            <li key={device.id} className="flex justify-between gap-2">
              <span>{device.label || "—"}</span>
              <span className="text-muted-foreground">
                {device.lastSeenAt
                  ? format.dateTime(new Date(device.lastSeenAt), { dateStyle: "short" })
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
