import type { ReactNode } from "react";

import { PortalShell } from "@/modules/portal/components/layout/portal-shell";

/**
 * Layout cho Client Portal (Studio cá nhân):
 * Quản lý trang tổng quan, danh sách trang cá nhân, link rút gọn và hồ sơ người dùng.
 *
 * @param props - Nội dung con.
 * @returns Khung Portal.
 */
export default function PortalRouteLayout({ children }: { children: ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
