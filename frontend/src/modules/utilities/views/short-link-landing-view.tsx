import type { PublicShortLink } from "../types/short-link.types";
import { ShortLinkLandingCard } from "../components/short-link-landing-card";

/** Trang trung gian công khai của một link rút gọn. */
export function ShortLinkLandingView({ slug, link }: { slug: string; link: PublicShortLink }) {
  return (
    <div className="animate-in fade-in zoom-in-95 w-full max-w-lg duration-200">
      <ShortLinkLandingCard slug={slug} link={link} />
    </div>
  );
}
