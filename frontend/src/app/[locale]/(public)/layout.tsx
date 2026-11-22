import { PublicLayout } from "@/modules/home/components/layout/public-layout";

/**
 * Layout khu vực công khai.
 *
 * @param props - Nội dung con.
 * @returns Khung công khai.
 */
export default function PublicRouteLayout({ children }: LayoutProps<"/[locale]">) {
  return <PublicLayout>{children}</PublicLayout>;
}
