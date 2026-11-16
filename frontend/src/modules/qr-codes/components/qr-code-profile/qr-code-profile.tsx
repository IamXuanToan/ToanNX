"use client";

import type { ReactNode } from "react";

import { FormPage } from "@/shares/components/common/form-page/form-page";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { QR_CODES_ROUTES } from "../../constants/routes";
import { useQrCode } from "../../hooks/use-qr-codes";
import { QrCodeForm } from "../qr-code-form/qr-code-form";
import type { QrLogoUpload } from "../qr-code-form/qr-code-form";

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
  LogoUpload,
}: {
  id: string;
  canUpdate: boolean;
  history?: ReactNode;
  LogoUpload: QrLogoUpload;
}) {
  const query = useQrCode(id);
  if (query.isPending) return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  if (query.isError)
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={QR_CODES_ROUTES.codes}
      />
    );
  return (
    <FormPage title={query.data.name}>
      <QrCodeForm code={query.data} disabled={!canUpdate} LogoUpload={LogoUpload} />
      {history ? <div className="mt-6">{history}</div> : null}
    </FormPage>
  );
}
