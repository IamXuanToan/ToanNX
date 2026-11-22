import { HomeView } from "@/modules/home/views/landing/home-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ alternates: "/" });

/**
 * Trang chủ.
 *
 * @returns HomeView.
 */
export default function HomePage() {
  return <HomeView />;
}
