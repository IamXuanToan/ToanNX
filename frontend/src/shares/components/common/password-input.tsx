"use client";

import { cn } from "cn";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ComponentProps, useState } from "react";

import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";

/**
 * Ô nhập mật khẩu có nút hiện/ẩn (tham khảo PasswordInputCommon của Medoly,
 * bỏ icon khóa và màu hardcode, dùng token theme).
 *
 * @param props - Thuộc tính input HTML (trừ `type`).
 * @returns Ô nhập mật khẩu.
 */
export function PasswordInput({
  className,
  disabled,
  ...props
}: Omit<ComponentProps<"input">, "type">) {
  const t = useTranslations("common.password");
  const [visible, setVisible] = useState(false);
  const label = visible ? t("hide") : t("show");
  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cn("pr-9", className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        onClick={() => setVisible((value) => !value)}
        aria-label={label}
        aria-pressed={visible}
        className="text-muted-foreground absolute top-1/2 right-0.5 -translate-y-1/2"
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  );
}
