"use client";

import { cn } from "cn";
import { Eye, EyeOff, Lock } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";

import { usePasswordInput } from "./hooks/use-password-input";

/**
 * Ô nhập mật khẩu chuẩn (theo CommonPasswordInput của Medoly): icon khoá bên trái, nút hiện/ẩn bên phải.
 * Dùng được với `form.register(...)`; truyền `autoComplete="new-password"` ở form tạo/đổi mật khẩu.
 *
 * @param props - Thuộc tính input HTML (trừ `type`).
 * @returns Ô nhập mật khẩu.
 */
export function PasswordInput({
  className,
  disabled,
  ...props
}: Omit<ComponentProps<"input">, "type">) {
  const { visible, toggle, label } = usePasswordInput();

  return (
    <div className="relative">
      <Lock
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
      />
      <Input
        type={visible ? "text" : "password"}
        autoCapitalize="none"
        spellCheck={false}
        disabled={disabled}
        className={cn("pr-11 pl-9", className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={toggle}
        aria-label={label}
        aria-pressed={visible}
        className="text-muted-foreground hover:text-primary absolute top-1/2 right-0.5 size-9 -translate-y-1/2 rounded-lg"
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  );
}
