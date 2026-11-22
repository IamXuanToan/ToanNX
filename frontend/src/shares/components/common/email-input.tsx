"use client";

import { cn } from "cn";
import { Mail } from "lucide-react";
import type { ComponentProps } from "react";

import { Input } from "@/shares/components/ui/input";

/**
 * Ô nhập email chuẩn: icon thư, `type="email"`, `autoComplete="email"`, `inputMode="email"`,
 * tắt tự viết hoa/sửa chính tả. Dùng được với `form.register(...)` (nhận mọi prop của `<input>`).
 *
 * @param props - Prop của `<input>` (trừ `type`).
 * @returns Ô nhập email.
 */
export function EmailInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  return (
    <div className="relative">
      <Mail
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
      />
      <Input
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        className={cn("pl-9", className)}
        {...props}
      />
    </div>
  );
}
