"use client";

import { useEffect } from "react";

import { clientErrorService } from "../services/client-error.service";

/**
 * Báo lỗi của error boundary về BE một lần cho mỗi lỗi.
 *
 * @param error - Lỗi Next.js truyền vào error boundary.
 */
export function useReportClientError(error: unknown) {
  useEffect(() => {
    void clientErrorService.report(error);
  }, [error]);
}
