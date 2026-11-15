"use client";

import { ArrowLeft, SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { ErrorState } from "./error-state";

/**
 * Lỗi khi tải một bản ghi: 404 (đã xóa, id sai, của người khác) hiện "Không tìm thấy" kèm nút quay về,
 * không có Thử lại vì thử lại cũng vô ích; lỗi khác hiện thông báo đã dịch theo mã kèm Thử lại.
 *
 * @param props - Lỗi của truy vấn, hàm thử lại, nơi quay về khi không tìm thấy.
 * @returns Khối lỗi.
 */
export function QueryErrorState({
  error,
  onRetry,
  backHref,
}: {
  error: unknown;
  onRetry?: () => void;
  backHref?: ComponentProps<typeof Link>["href"];
}) {
  const t = useTranslations("errors.recordNotFound");
  const errorMessage = useApiErrorMessage();
  if (!isApiError(error) || error.status !== 404) {
    return <ErrorState message={errorMessage(error)} onRetry={onRetry} />;
  }
  return (
    <div role="alert" className="bg-card rounded-xl border p-6 text-center">
      <div className="bg-muted text-muted-foreground mx-auto flex size-10 items-center justify-center rounded-lg">
        <SearchX className="size-5" />
      </div>
      <p className="mt-3 text-sm font-semibold">{t("title")}</p>
      <p className="text-muted-foreground mt-1 text-sm">{t("description")}</p>
      {backHref ? (
        <Button asChild variant="outline" className="mt-4">
          <Link href={backHref}>
            <ArrowLeft />
            {t("back")}
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
