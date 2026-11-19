"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/auth/hooks/use-permission";

import { ShortLinkProfile } from "../components/short-link-profile/short-link-profile";
import { SHORT_LINK_PERMISSIONS } from "../permissions/short-link-permission";

/**
 * Trang chi tiết link rút gọn.
 *
 * @param props - Id và slot lịch sử thay đổi.
 * @returns Giao diện chi tiết.
 */
export function ShortLinkDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canUpdate = usePermission(SHORT_LINK_PERMISSIONS.update);
  return <ShortLinkProfile id={id} canUpdate={canUpdate} history={history} />;
}
