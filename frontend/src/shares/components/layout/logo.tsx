import { cn } from "cn";

import { LogoMark } from "./logo-mark";

/**
 * Logo ngang: biểu tượng + chữ ToanNX.
 *
 * @param props - className của khối logo.
 * @returns Logo ngang.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-base font-semibold tracking-[0.18em]">ToanNX</span>
    </span>
  );
}
