"use client";

import { AppTooltip } from "@/shares/components/common/app-tooltip";

/**
 * Email một dòng: cắt phần trước `@`, giữ nguyên tên miền.
 *
 * @param props - Email.
 * @returns Email rút gọn.
 */
export function AccountEmail({ email }: { email: string }) {
  const at = email.lastIndexOf("@");
  if (at < 0) return <span className="block truncate">{email}</span>;
  return (
    <AppTooltip content={email}>
      <span className="flex min-w-0">
        <span className="truncate">{email.slice(0, at)}</span>
        <span className="shrink-0">{email.slice(at)}</span>
      </span>
    </AppTooltip>
  );
}
