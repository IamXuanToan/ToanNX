"use client";

import type { ReactNode } from "react";

import { Button } from "@/shares/components/ui/button";

type TiptapToggleProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

export function TiptapToggle({ label, active, disabled, onClick, children }: TiptapToggleProps) {
  return (
    <Button
      type="button"
      size="icon"
      variant={active ? "secondary" : "ghost"}
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
