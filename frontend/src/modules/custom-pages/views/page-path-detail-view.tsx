"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/auth/hooks/use-permission";

import { PagePathProfile } from "../components/page-path-profile/page-path-profile";
import { CUSTOM_PAGES_PERMISSIONS as P } from "../constants/custom-pages-permissions";

/**
 * Trang chi tiết đường dẫn giữa.
 *
 * @param props - Id và slot lịch sử thay đổi.
 * @returns Giao diện chi tiết.
 */
export function PagePathDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canUpdate = usePermission(P.pathUpdate);
  return <PagePathProfile id={id} canUpdate={canUpdate} history={history} />;
}
