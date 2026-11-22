"use client";

import { Skeleton } from "@/shares/components/ui/skeleton";

/** Khung chờ của không gian module: sidebar + nội dung giữ chỗ. */
export function WorkspaceSkeleton() {
  return (
    <div className="bg-canvas flex min-h-svh" aria-busy="true">
      <div className="bg-sidebar hidden w-64 md:block">
        <div className="flex h-16 items-center border-b px-3">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-1 p-3">
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex-1">
        <div className="bg-card flex h-16 items-center border-b px-6">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-6 h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
