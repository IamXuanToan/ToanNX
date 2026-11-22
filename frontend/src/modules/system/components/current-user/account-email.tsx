"use client";

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
    <span className="flex min-w-0" title={email}>
      <span className="truncate">{email.slice(0, at)}</span>
      <span className="shrink-0">{email.slice(at)}</span>
    </span>
  );
}
