"use client";

import type { ReactNode } from "react";

import { FormPage } from "@/shares/components/common/form-page/form-page";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { useQrCode } from "../../hooks/use-qr-codes";
import { QrCodeForm } from "../qr-code-form/qr-code-form";

/**
 * Chi tiết mã QR: đúng `QrCodeForm` của trang tạo, cộng lịch sử thay đổi (page ghép qua slot).
 *
 * @param props - Id, quyền sửa, slot lịch sử.
 * @returns Trang chi tiết.
 */
export function QrCodeProfile({
  id,
  canUpdate,
  history,
}: {
  id: string;
  canUpdate: boolean;
  history?: ReactNode;
}) {
  const query = useQrCode(id);
  const errorMessage = useApiErrorMessage();
  if (query.isPending) return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  if (query.isError)
    return <ErrorState message={errorMessage(query.error)} onRetry={() => query.refetch()} />;
  return (
    <FormPage title={query.data.name}>
      <QrCodeForm code={query.data} disabled={!canUpdate} />
      {history ? <div className="mt-6">{history}</div> : null}
    </FormPage>
  );
}
