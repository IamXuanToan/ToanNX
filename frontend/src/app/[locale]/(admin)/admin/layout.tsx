import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminShell } from "@/modules/manage-app/components/admin-shell";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Layout khu vực quản trị (được proxy kiểm tra lạc quan; backend kiểm tra thực sự).
 *
 * @param props - Nội dung trang.
 * @returns Khung quản trị.
 */
export default function AdminLayout({ children }: LayoutProps<"/[locale]/admin">) {
  return (
    <Suspense>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
