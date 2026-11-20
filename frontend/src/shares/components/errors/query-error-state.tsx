"use client";

import { ArrowLeft, RotateCw, SearchX, ServerCrash, ShieldAlert, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";
import { cn } from "cn";

import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";
import { Card, CardContent } from "@/shares/components/ui/card";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { CLIENT_ERROR_CODES, isApiError } from "@/shares/lib/api/api-error";

import { ErrorState } from "./error-state";

/**
 * Khối hiển thị lỗi truy vấn bản ghi (QueryErrorState):
 * - 404 (Không tìm thấy): Hiện icon `SearchX` kèm nút quay về danh sách / trang trước.
 * - 403 (Từ chối truy cập): Hiện icon `ShieldAlert` kèm thông báo bảo mật và nút quay lại.
 * - Mất mạng / Timeout: Hiện icon `WifiOff` kèm nút Thử kết nối lại.
 * - Lỗi 500+ máy chủ: Hiện icon `ServerCrash` kèm nút Thử lại.
 * - Lỗi khác: Hiện thông báo lỗi đã dịch theo mã và nút Thử lại.
 *
 * @param props - Lỗi của truy vấn, hàm thử lại, đường dẫn quay về khi không tìm thấy, và className tùy biến.
 * @returns Khối trạng thái lỗi thích ứng thông minh theo mã lỗi, chuẩn hóa Shadcn UI & i18n.
 */
export function QueryErrorState({
  error,
  onRetry,
  backHref,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  backHref?: ComponentProps<typeof Link>["href"];
  className?: string;
}) {
  const tNotFound = useTranslations("errors.recordNotFound");
  const tForbidden = useTranslations("errors.forbidden");
  const tNetwork = useTranslations("errors.network");
  const tServer = useTranslations("errors.serverError");
  const errorMessage = useApiErrorMessage();
  const router = useRouter();

  if (!isApiError(error)) {
    return <ErrorState message={errorMessage(error)} onRetry={onRetry} className={className} />;
  }

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  // 1. Lỗi 404 - Bản ghi không tồn tại hoặc đã xóa
  if (error.status === 404) {
    return (
      <Card
        role="alert"
        aria-live="polite"
        className={cn("rounded-2xl border text-center shadow-2xs", className)}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8">
          <div className="bg-muted text-muted-foreground ring-muted/20 mx-auto flex size-12 items-center justify-center rounded-2xl ring-4">
            <SearchX className="size-6" />
          </div>
          <p className="text-foreground mt-3.5 text-sm font-semibold tracking-tight sm:text-base">
            {tNotFound("title")}
          </p>
          <p className="text-muted-foreground mt-1 max-w-sm text-xs leading-relaxed sm:text-sm">
            {tNotFound("description")}
          </p>
          {backHref ? (
            <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl shadow-2xs">
              <Link href={backHref}>
                <ArrowLeft className="size-3.5" />
                {tNotFound("back")}
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 rounded-xl shadow-2xs"
              onClick={handleBack}
            >
              <ArrowLeft className="size-3.5" />
              {tNotFound("backPrevious")}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // 2. Lỗi 403 - Không có quyền truy cập bản ghi
  if (error.status === 403) {
    return (
      <Card
        role="alert"
        aria-live="polite"
        className={cn(
          "border-destructive/30 bg-destructive/5 rounded-2xl text-center shadow-2xs",
          className,
        )}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8">
          <div className="bg-destructive/10 text-destructive ring-destructive/5 mx-auto flex size-12 items-center justify-center rounded-2xl ring-4">
            <ShieldAlert className="size-6" />
          </div>
          <p className="text-foreground mt-3.5 text-sm font-semibold tracking-tight sm:text-base">
            {tForbidden("title")}
          </p>
          <p className="text-muted-foreground mt-1 max-w-sm text-xs leading-relaxed sm:text-sm">
            {tForbidden("description")}
          </p>
          {backHref ? (
            <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl shadow-2xs">
              <Link href={backHref}>
                <ArrowLeft className="size-3.5" />
                {tForbidden("back")}
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 rounded-xl shadow-2xs"
              onClick={handleBack}
            >
              <ArrowLeft className="size-3.5" />
              {tForbidden("backPrevious")}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // 3. Lỗi Mất mạng / Timeout
  if (
    error.code === CLIENT_ERROR_CODES.network ||
    error.code === CLIENT_ERROR_CODES.timeout ||
    error.status === 0
  ) {
    return (
      <Card
        role="alert"
        aria-live="polite"
        className={cn("border-border/80 bg-muted/20 rounded-2xl text-center shadow-2xs", className)}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8">
          <div className="bg-muted text-muted-foreground ring-muted/20 mx-auto flex size-12 items-center justify-center rounded-2xl ring-4">
            <WifiOff className="size-6" />
          </div>
          <p className="text-foreground mt-3.5 text-sm font-semibold tracking-tight sm:text-base">
            {tNetwork("title")}
          </p>
          <p className="text-muted-foreground mt-1 max-w-sm text-xs leading-relaxed sm:text-sm">
            {tNetwork("description")}
          </p>
          {onRetry ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 rounded-xl shadow-2xs"
              onClick={onRetry}
            >
              <RotateCw className="size-3.5" />
              {tNetwork("retry")}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  // 4. Lỗi Máy chủ 500+
  if (error.status >= 500) {
    return (
      <Card
        role="alert"
        aria-live="polite"
        className={cn(
          "border-destructive/30 bg-destructive/5 rounded-2xl text-center shadow-2xs",
          className,
        )}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8">
          <div className="bg-destructive/10 text-destructive ring-destructive/5 mx-auto flex size-12 items-center justify-center rounded-2xl ring-4">
            <ServerCrash className="size-6" />
          </div>
          <p className="text-foreground mt-3.5 text-sm font-semibold tracking-tight sm:text-base">
            {tServer("title")}
          </p>
          <p className="text-muted-foreground mt-1 max-w-sm text-xs leading-relaxed sm:text-sm">
            {tServer("description")}
          </p>
          {onRetry ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 rounded-xl shadow-2xs"
              onClick={onRetry}
            >
              <RotateCw className="size-3.5" />
              {tServer("retry")}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  // 5. Mặc định: ErrorState với message dịch theo mã
  return <ErrorState message={errorMessage(error)} onRetry={onRetry} className={className} />;
}
