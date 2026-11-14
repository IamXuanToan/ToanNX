import { Suspense } from "react";

import { PublicHeader } from "@/shares/components/layout/public-header";

/**
 * Layout khu vực công khai.
 *
 * @param props - Nội dung con.
 * @returns Layout.
 */
export default function PublicLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <div className="flex min-h-svh flex-col">
      <Suspense>
        <PublicHeader />
      </Suspense>
      <main className="flex-1">{children}</main>
      <footer className="text-muted-foreground border-t py-6 text-center text-xs">
        © {new Date().getFullYear()} TOANNX · toannx.com
      </footer>
    </div>
  );
}
