"use client";

import { type ReactNode, Suspense } from "react";

import { usePathname } from "@/i18n/navigation";
import { RESERVED_SEGMENTS } from "@/modules/utilities/constants/routes";

import { PublicHeader } from "./public-header";

/**
 * Kiểm tra xem pathname có phải là trang công khai tùy chỉnh (Link-in-bio, Store, Donation) hay không.
 * Các trang này độc lập hoàn toàn, không mang header/footer của hệ thống ToanNX.
 */
function isStandaloneCustomPage(pathname: string): boolean {
  const clean = pathname.replace(/^\/(?:vi|en)(?=\/|$)/, "") || "/";
  if (
    clean.startsWith("/page-view") ||
    clean.includes("/page-view/") ||
    clean.startsWith("/demo")
  ) {
    return true;
  }
  const parts = clean.split("/").filter(Boolean);
  if (parts.length === 2) {
    const [segment, slug] = parts.map((p) => p.toLowerCase());
    if (!RESERVED_SEGMENTS.has(segment) && /^[a-z0-9-]{1,64}$/.test(slug)) {
      return true;
    }
  }
  return false;
}

/**
 * Khung khu vực công khai: header, nội dung, footer.
 * Trên trang Home: ẩn footer tĩnh để không gian Three.js 3D tràn viền toàn màn hình.
 * Trên trang tùy chỉnh (Custom Pages, Bio, Affiliate, Donation, Demo): ẩn sạch header và footer hệ thống.
 *
 * @param props - Nội dung trang.
 * @returns Khung công khai.
 */
export function PublicLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isStandalone = isStandaloneCustomPage(pathname);

  if (isStandalone) {
    return <>{children}</>;
  }

  return (
    <div className={`flex min-h-svh flex-col ${isHome ? "overflow-x-hidden" : ""}`}>
      <Suspense>
        <PublicHeader />
      </Suspense>
      <main className="flex-1">{children}</main>
      {!isHome ? (
        <footer className="text-muted-foreground border-t py-6 text-center text-xs">
          © {new Date().getFullYear()} ToanNX · toannx.com
        </footer>
      ) : null}
    </div>
  );
}
