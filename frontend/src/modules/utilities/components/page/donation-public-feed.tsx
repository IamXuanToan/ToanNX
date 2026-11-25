"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Clock, Heart, Loader2, Sparkles, Trophy } from "lucide-react";
import { useFormatter, useNow } from "next-intl";
import { useEffect, useMemo, useRef } from "react";

import { Badge } from "@/shares/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shares/components/ui/tabs";

import { donationKeys } from "@/modules/utilities/constants/query-keys";
import { donationService } from "../../services/donation.service";
import type {
  DonationPublicFeedItem,
  DonationPublicLeaderboardItem,
} from "../../types/donation.types";

const DEMO_LEADERBOARD_ITEMS: DonationPublicLeaderboardItem[] = [
  {
    id: "demo-gold",
    donorTitle: "Soái ca hào phóng",
    amount: 1000000,
    hideAmount: false,
    giftLabel: "Tài trợ máy chủ 1 tháng",
    tier: "GOLD",
    tierExpiresAt: new Date(Date.now() + 28 * 86400000).toISOString(),
    message: "Ủng hộ tác giả duy trì máy chủ và phát triển thêm tính năng mới!",
    receivedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "demo-silver",
    donorTitle: "Nàng thơ xinh đẹp",
    amount: 500000,
    hideAmount: false,
    giftLabel: "Bữa lẩu ấm cúng",
    tier: "SILVER",
    tierExpiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    message: "Cảm ơn bạn vì những công cụ tiện ích rất tuyệt vời!",
    receivedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "demo-bronze",
    donorTitle: "Người hâm mộ bí ẩn",
    amount: 100000,
    hideAmount: false,
    giftLabel: "1 cuốn sách công nghệ",
    tier: "BRONZE",
    tierExpiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    message: "Chúc bạn luôn giữ vững đam mê và nhiều sức khỏe!",
    receivedAt: new Date(Date.now() - 14400000).toISOString(),
  },
];

const DEMO_FEED_ITEMS: DonationPublicFeedItem[] = [
  {
    id: "demo-f-1",
    donorTitle: "Bạn dev ẩn danh",
    amount: 50000,
    hideAmount: false,
    giftType: "COFFEE",
    giftLabel: "1 ly cà phê muối",
    tier: "NORMAL",
    tierExpiresAt: null,
    message: "Mời bạn ly cafe sáng làm việc cho tỉnh táo nhé!",
    receivedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "demo-f-2",
    donorTitle: "Soái ca hào phóng",
    amount: 1000000,
    hideAmount: false,
    giftType: "SPECIAL",
    giftLabel: "Tài trợ máy chủ 1 tháng",
    tier: "GOLD",
    tierExpiresAt: new Date(Date.now() + 28 * 86400000).toISOString(),
    message: "Ủng hộ tác giả duy trì máy chủ và phát triển thêm tính năng mới!",
    receivedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "demo-f-3",
    donorTitle: "Nàng thơ xinh đẹp",
    amount: 500000,
    hideAmount: false,
    giftType: "HOTPOT",
    giftLabel: "Bữa lẩu ấm cúng",
    tier: "SILVER",
    tierExpiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    message: "Cảm ơn bạn vì những công cụ tiện ích rất tuyệt vời!",
    receivedAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

/**
 * Tính toán chuỗi đếm ngược thời gian còn lại (Live Countdown).
 */
function getCountdownText(expiresAt: string | null, nowMs: number): string {
  if (!expiresAt) return "";
  const diff = new Date(expiresAt).getTime() - nowMs;
  if (diff <= 0) return "Đã hết hạn";

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `Còn ${days} ngày ${hours} giờ`;
  }
  if (hours > 0) {
    return `Còn ${hours} giờ ${minutes} phút`;
  }
  return `Còn ${minutes} phút`;
}

/**
 * Component hiển thị Dòng tin Tri ân (Live Ticker) và Bảng Vinh danh (Leaderboard đếm ngược)
 * trên trang Donate công khai. Hỗ trợ Infinite scroll tự động cuộn tải thêm và ẩn số tiền.
 */
export function DonationPublicFeed({
  pageId,
  hideAmount = false,
  preview = false,
}: {
  pageId: string;
  hideAmount?: boolean;
  preview?: boolean;
}) {
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const nowMs = now.getTime();

  const hasPageId = Boolean(pageId && pageId.trim() !== "");

  // Truy vấn Feed các lượt ủng hộ với cơ chế Infinite Scroll (tự động load khi cuộn)
  const feedInfiniteQuery = useInfiniteQuery({
    queryKey: donationKeys?.feed
      ? donationKeys.feed(pageId)
      : (["utilities", "donations", "feed", pageId] as const),
    queryFn: ({ pageParam = 1 }) => donationService.getPublicFeed(pageId, 20, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length >= 20 ? allPages.length + 1 : undefined;
    },
    enabled: hasPageId,
    refetchInterval: hasPageId ? 20000 : false,
  });

  const feedItems = useMemo(() => {
    return feedInfiniteQuery.data?.pages.flatMap((page) => page) ?? [];
  }, [feedInfiniteQuery.data]);

  // Observer sentinel ở đáy danh sách để kích hoạt tải trang tiếp theo khi cuộn
  const observerRef = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feedInfiniteQuery;

  useEffect(() => {
    const el = observerRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Truy vấn Bảng Vinh danh
  const leaderboardQuery = useQuery({
    queryKey: donationKeys?.leaderboard
      ? donationKeys.leaderboard(pageId)
      : (["utilities", "donations", "leaderboard", pageId] as const),
    queryFn: () => donationService.getPublicLeaderboard(pageId),
    enabled: hasPageId,
    refetchInterval: hasPageId ? 30000 : false,
  });

  if (!hasPageId && !preview) {
    return null;
  }

  const rawLeaderboardItems = leaderboardQuery.data ?? [];
  const isDemo = preview && feedItems.length === 0 && rawLeaderboardItems.length === 0;

  const effectiveFeedItems = isDemo ? DEMO_FEED_ITEMS : feedItems;
  const effectiveLeaderboardItems = isDemo ? DEMO_LEADERBOARD_ITEMS : rawLeaderboardItems;

  // Lọc theo từng bảng vinh danh
  const goldItems = effectiveLeaderboardItems.filter(
    (i) => i.tier === "GOLD" || i.tier === "DIAMOND",
  );
  const silverItems = effectiveLeaderboardItems.filter((i) => i.tier === "SILVER");
  const bronzeItems = effectiveLeaderboardItems.filter((i) => i.tier === "BRONZE");

  if (effectiveFeedItems.length === 0 && effectiveLeaderboardItems.length === 0) {
    return null;
  }

  // Helper kiểm tra giao dịch có cần ẩn số tiền không
  const isItemAmountHidden = (item: { hideAmount?: boolean; amount: number | null }) =>
    Boolean(hideAmount || item.hideAmount || item.amount === null);

  const topRecentItem = effectiveFeedItems[0];

  return (
    <div className="w-full space-y-4 pt-6">
      {/* 1. Dòng chữ tri ân nhỏ gọn, thanh lịch (Ticker Pill) */}
      {topRecentItem && (
        <div className="flex w-full justify-center">
          <div className="border-border/70 bg-card/90 hover:bg-card inline-flex max-w-full items-center gap-2 rounded-full border px-4 py-1.5 text-xs shadow-2xs backdrop-blur-xs transition-colors">
            <Heart className="size-3.5 shrink-0 animate-pulse fill-current text-rose-500" />
            <span className="text-primary shrink-0 font-bold">Tri ân:</span>
            <div className="max-w-[260px] min-w-0 truncate sm:max-w-md">
              <span className="text-foreground font-bold">{topRecentItem.donorTitle}</span>
              <span className="text-muted-foreground mx-1">•</span>
              <span className="text-primary font-semibold">{topRecentItem.giftLabel}</span>
              {!isItemAmountHidden(topRecentItem) && topRecentItem.amount !== null && (
                <span className="ml-1 font-bold text-amber-600 dark:text-amber-400">
                  ({topRecentItem.amount.toLocaleString("vi-VN")} ₫)
                </span>
              )}
              {topRecentItem.message && (
                <span className="text-muted-foreground ml-1.5 italic">
                  &ldquo;{topRecentItem.message}&rdquo;
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Bảng Vinh danh & Lịch sử ủng hộ - Thiết kế to rõ, sang trọng */}
      <div className="border-border/80 bg-card/80 rounded-2xl border p-4 shadow-sm backdrop-blur-xs sm:p-6">
        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="bg-muted/50 grid h-10 w-full grid-cols-2 p-1">
            <TabsTrigger value="leaderboard" className="gap-2 text-xs font-bold sm:text-sm">
              <Trophy className="size-4 text-amber-500" />
              <span>Bảng Vinh danh</span>
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-2 text-xs font-bold sm:text-sm">
              <Sparkles className="text-primary size-4" />
              <span>Ủng hộ gần đây</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Bảng Vinh danh */}
          <TabsContent value="leaderboard" className="mt-4 space-y-4">
            {effectiveLeaderboardItems.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-xs sm:text-sm">
                Chưa có ai trên Bảng Vinh danh. Hãy là người đầu tiên ủng hộ nhé!
              </p>
            ) : (
              <div className="space-y-3">
                {/* Bảng Vàng */}
                {goldItems.map((item) => {
                  const hide = isItemAmountHidden(item);
                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-yellow-500/35 bg-gradient-to-r from-yellow-500/15 via-amber-500/10 to-transparent p-3.5 shadow-2xs sm:p-4"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="h-5 bg-yellow-500 px-2 text-xs font-bold text-yellow-950 shadow-2xs">
                            🥇 Vàng
                          </Badge>
                          <span className="text-foreground text-sm font-bold sm:text-base">
                            {item.donorTitle}
                          </span>
                        </div>
                        {item.message && (
                          <p className="text-muted-foreground/90 text-xs leading-relaxed break-words whitespace-pre-line italic sm:text-[13px]">
                            &ldquo;{item.message}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 space-y-1 text-right">
                        {hide ? (
                          <p className="text-xs font-bold text-yellow-700 sm:text-sm dark:text-yellow-400">
                            {item.giftLabel}
                          </p>
                        ) : (
                          <p className="text-sm font-extrabold text-amber-600 sm:text-base dark:text-amber-400">
                            {item.amount?.toLocaleString("vi-VN")} ₫
                          </p>
                        )}
                        {item.tierExpiresAt && (
                          <div className="text-muted-foreground flex items-center justify-end gap-1 text-[11px]">
                            <Clock className="size-3" />
                            <span>{getCountdownText(item.tierExpiresAt, nowMs)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Bảng Bạc */}
                {silverItems.map((item) => {
                  const hide = isItemAmountHidden(item);
                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-slate-400/35 bg-gradient-to-r from-slate-300/20 via-slate-200/10 to-transparent p-3.5 shadow-2xs sm:p-4"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="h-5 bg-slate-400 px-2 text-xs font-bold text-slate-950 shadow-2xs">
                            🥈 Bạc
                          </Badge>
                          <span className="text-foreground text-sm font-bold sm:text-base">
                            {item.donorTitle}
                          </span>
                        </div>
                        {item.message && (
                          <p className="text-muted-foreground/90 text-xs leading-relaxed break-words whitespace-pre-line italic sm:text-[13px]">
                            &ldquo;{item.message}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 space-y-1 text-right">
                        {hide ? (
                          <p className="text-xs font-bold text-slate-700 sm:text-sm dark:text-slate-300">
                            {item.giftLabel}
                          </p>
                        ) : (
                          <p className="text-sm font-extrabold text-slate-800 sm:text-base dark:text-slate-200">
                            {item.amount?.toLocaleString("vi-VN")} ₫
                          </p>
                        )}
                        {item.tierExpiresAt && (
                          <div className="text-muted-foreground flex items-center justify-end gap-1 text-[11px]">
                            <Clock className="size-3" />
                            <span>{getCountdownText(item.tierExpiresAt, nowMs)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Bảng Đồng */}
                {bronzeItems.map((item) => {
                  const hide = isItemAmountHidden(item);
                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-amber-600/35 bg-gradient-to-r from-amber-600/15 via-amber-700/10 to-transparent p-3.5 shadow-2xs sm:p-4"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="h-5 bg-amber-600 px-2 text-xs font-bold text-amber-50 shadow-2xs">
                            🥉 Đồng
                          </Badge>
                          <span className="text-foreground text-sm font-bold sm:text-base">
                            {item.donorTitle}
                          </span>
                        </div>
                        {item.message && (
                          <p className="text-muted-foreground/90 text-xs leading-relaxed break-words whitespace-pre-line italic sm:text-[13px]">
                            &ldquo;{item.message}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 space-y-1 text-right">
                        {hide ? (
                          <p className="text-xs font-bold text-amber-700 sm:text-sm dark:text-amber-400">
                            {item.giftLabel}
                          </p>
                        ) : (
                          <p className="text-sm font-extrabold text-amber-700 sm:text-base dark:text-amber-400">
                            {item.amount?.toLocaleString("vi-VN")} ₫
                          </p>
                        )}
                        {item.tierExpiresAt && (
                          <div className="text-muted-foreground flex items-center justify-end gap-1 text-[11px]">
                            <Clock className="size-3" />
                            <span>{getCountdownText(item.tierExpiresAt, nowMs)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Tab Lịch sử gần đây (Infinite Scroll - tự động cuộn tải thêm) */}
          <TabsContent value="recent" className="mt-4">
            <div className="max-h-[480px] space-y-2.5 overflow-y-auto pr-1">
              {effectiveFeedItems.map((item) => {
                const hide = isItemAmountHidden(item);
                return (
                  <div
                    key={item.id}
                    className="border-border/60 bg-muted/20 hover:bg-muted/30 flex items-start justify-between gap-3 rounded-xl border p-3 text-xs transition-colors"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-foreground font-bold">{item.donorTitle}</span>
                        <span className="text-muted-foreground text-[11px]">•</span>
                        <span className="text-primary font-semibold">{item.giftLabel}</span>
                      </div>
                      {item.message && (
                        <p className="text-muted-foreground/90 text-xs leading-relaxed break-words whitespace-pre-line italic">
                          &ldquo;{item.message}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 space-y-0.5 text-right">
                      {!hide && item.amount !== null && (
                        <p className="font-extrabold text-amber-600 dark:text-amber-400">
                          {item.amount.toLocaleString("vi-VN")} ₫
                        </p>
                      )}
                      <p className="text-muted-foreground text-[11px]">
                        {format.relativeTime(new Date(item.receivedAt), { now: new Date(now) })}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Phần tử Sentinel để tự động trigger fetch trang tiếp */}
              {!isDemo && <div ref={observerRef} className="h-4 w-full" />}

              {!isDemo && isFetchingNextPage && (
                <div className="text-muted-foreground flex items-center justify-center gap-2 py-3 text-xs">
                  <Loader2 className="text-primary size-4 animate-spin" />
                  <span>Đang tải thêm lượt ủng hộ...</span>
                </div>
              )}

              {!hasNextPage && effectiveFeedItems.length > 0 && (
                <p className="text-muted-foreground/60 py-2 text-center text-[11px]">
                  {isDemo
                    ? "Dữ liệu mẫu xem trước trực quan"
                    : "Đã hiển thị toàn bộ các lượt ủng hộ"}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
