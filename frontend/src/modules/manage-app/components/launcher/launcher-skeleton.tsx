"use client";

import { Skeleton } from "@/shares/components/ui/skeleton";

/** Khung chờ của màn chọn module: lưới thẻ giữ chỗ. */
export function LauncherSkeleton() {
  return (
    <div className="bg-canvas flex min-h-svh flex-col" aria-busy="true">
      <div className="bg-card flex h-16 items-center border-b px-4 sm:px-6">
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>
      <div className="flex flex-1 items-start justify-center px-4 py-8 sm:px-6 sm:py-12 lg:items-center">
        <div className="w-full max-w-4xl space-y-7">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-6 w-44 rounded-full" />
            <Skeleton className="h-8 w-60 rounded-xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((key) => (
              <Skeleton key={key} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-6 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
