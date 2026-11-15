import { type ReactNode, Suspense } from "react";

import { PublicHeader } from "../public-header/public-header";

/**
 * Khung khu vực công khai: header, nội dung, footer.
 *
 * @param props - Nội dung trang.
 * @returns Khung công khai.
 */
export function PublicLayout({ children }: { children: ReactNode }) {
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
