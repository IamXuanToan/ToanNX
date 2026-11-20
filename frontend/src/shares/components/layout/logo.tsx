import Image from "next/image";

import { cn } from "cn";

/** Ảnh logo đã cắt sát và thu nhỏ, sinh bằng `scripts/build_brand_assets.py` từ `public/brand/logo.png`. */
const LOGO_MARK_SRC = "/brand/logo-mark.png";
/** Cạnh ảnh gốc của `logo-mark.png` (px); kích thước hiển thị do `className` quyết định. */
const LOGO_MARK_SIZE = 256;

type LogoMarkProps = {
  className?: string;
  /** Tiêu đề cho trình đọc màn hình; bỏ trống khi logo đi kèm chữ TOANNX. */
  title?: string;
};

/**
 * Biểu tượng cỏ bốn lá của TOANNX (ảnh PNG nền trong suốt, giữ nguyên màu thương hiệu ở cả hai theme).
 *
 * @param props - className (mặc định `size-8`) và tiêu đề truy cập.
 * @returns Ảnh logo.
 */
export function LogoMark({ className, title }: LogoMarkProps) {
  return (
    <Image
      src={LOGO_MARK_SRC}
      width={LOGO_MARK_SIZE}
      height={LOGO_MARK_SIZE}
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      priority
      className={cn("size-8 shrink-0 object-contain", className)}
    />
  );
}

/**
 * Logo ngang: biểu tượng + chữ TOANNX.
 *
 * @param props - className của khối logo.
 * @returns Logo ngang.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-base font-semibold tracking-[0.18em]">TOANNX</span>
    </span>
  );
}
