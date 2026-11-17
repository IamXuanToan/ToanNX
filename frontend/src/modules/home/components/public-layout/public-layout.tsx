"use client";

import { type ReactNode, Suspense } from "react";

import { usePathname } from "@/i18n/navigation";

import { PublicHeader } from "../public-header/public-header";

/**
 * Khung khu vực công khai: header, nội dung, footer.
 * Trên trang Home: ẩn footer tĩnh để không gian Three.js 3D tràn viền toàn màn hình.
 *
 * @param props - Nội dung trang.
 * @returns Khung công khai.
 */
export function PublicLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className={`flex min-h-svh flex-col ${isHome ? "overflow-x-hidden" : ""}`}>
      <Suspense>
        <PublicHeader />
      </Suspense>
      <main className="flex-1">{children}</main>
      {!isHome ? (
        <footer className="text-muted-foreground border-t py-6 text-center text-xs">
          © {new Date().getFullYear()} TOANNX · toannx.com
        </footer>
      ) : null}
    </div>
  );
}
