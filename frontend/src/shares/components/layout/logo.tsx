import { cn } from "cn";

type LogoMarkProps = {
  className?: string;
  /** Tiêu đề cho trình đọc màn hình; bỏ trống khi logo đi kèm chữ TOANNX. */
  title?: string;
};

/**
 * Biểu tượng chữ T cách điệu của TOANNX (SVG, dùng màu theo `currentColor`/token theme).
 * Khối vuông bo góc + chữ T hình học + điểm vuông "nx" ở góc dưới phải.
 *
 * @param props - className và tiêu đề truy cập.
 * @returns SVG logo.
 */
export function LogoMark({ className, title }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d="M8 8h16v4.5h-5.75V24h-4.5V12.5H8z" className="fill-primary-foreground" />
      <rect x="20.5" y="19.5" width="4.5" height="4.5" rx="1" className="fill-primary-foreground" />
    </svg>
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
