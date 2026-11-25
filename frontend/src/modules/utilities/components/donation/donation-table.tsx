"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, ShieldAlert } from "lucide-react";
import { useFormatter } from "next-intl";
import { toast } from "sonner";

import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { TableStatusSwitch } from "@/shares/components/common/table-status-switch";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shares/components/ui/tooltip";
import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { useTableState } from "@/shares/hooks/use-table-state";
import { createBooleanBulkStatus } from "@/shares/lib/bulk-status";

import { donationKeys } from "../../constants/query-keys";
import { donationService } from "../../services/donation.service";
import type { DonationTier, DonationTransaction } from "../../types/donation.types";

const TIER_BADGES: Record<DonationTier, { label: string; className: string }> = {
  NORMAL: { label: "Thường", className: "bg-muted text-muted-foreground border-transparent" },
  BRONZE: {
    label: "Bảng Đồng",
    className:
      "bg-amber-600/10 text-amber-700 dark:text-amber-400 border-amber-600/30 font-semibold",
  },
  SILVER: {
    label: "Bảng Bạc",
    className:
      "bg-slate-300/30 text-slate-700 dark:text-slate-300 border-slate-400/40 font-semibold",
  },
  GOLD: {
    label: "Bảng Vàng",
    className:
      "bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/40 font-bold",
  },
  DIAMOND: {
    label: "Kim Cương",
    className: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/40 font-extrabold",
  },
};

export function DonationTable({
  ownerId,
  pageId,
  canUpdate = true,
  dateFrom,
  dateTo,
}: {
  ownerId?: string;
  pageId?: string;
  canUpdate?: boolean;
  dateFrom?: string;
  dateTo?: string;
}) {
  const queryClient = useQueryClient();
  const format = useFormatter();

  const tableState = useTableState({
    filterKeys: ["tier", "status"] as const,
  });

  const selectedTier = tableState.getFilterValues("tier");
  const statusFilter = tableState.getFilterValues("status");

  const queryParams = {
    page: tableState.filters.page,
    pageSize: tableState.filters.pageSize,
    search: tableState.filters.search || undefined,
    ordering: tableState.filters.ordering,
    owner: ownerId,
    page_id: pageId,
    tier: selectedTier.length > 0 ? (selectedTier[0] as DonationTier) : undefined,
    isCensored: statusFilter.includes("censored") ? true : undefined,
    isHidden: statusFilter.includes("hidden") ? true : undefined,
    dateFrom,
    dateTo,
  };

  const { data, isLoading } = useQuery({
    queryKey: donationKeys.list(queryParams),
    queryFn: () => donationService.list(queryParams),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isHidden }: { id: string; isHidden: boolean }) =>
      donationService.toggleHidden(id, isHidden),
    onSuccess: (updated) => {
      toast.success(updated.isHidden ? "Đã ẩn bình luận" : "Đã hiện bình luận");
      queryClient.invalidateQueries({ queryKey: donationKeys.all });
    },
    onError: () => {
      toast.error("Không thể cập nhật trạng thái bình luận");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => donationService.delete(id),
    onSuccess: () => {
      toast.success("Đã xóa lượt quyên góp");
      queryClient.invalidateQueries({ queryKey: donationKeys.all });
    },
    onError: () => {
      toast.error("Không thể xóa lượt quyên góp");
    },
  });

  const bulk = useBulkActions<DonationTransaction>({
    service: donationService,
    invalidate: [donationKeys.all],
  });

  const handleExport = () => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://api.toannx.com";
    const exportUrl = `${origin}/api/v1/utilities/donations/export?${new URLSearchParams(
      Object.entries({
        owner: ownerId,
        page_id: pageId,
        tier: selectedTier.length > 0 ? selectedTier[0] : undefined,
        date_from: dateFrom,
        date_to: dateTo,
      }).filter(([, v]) => v !== undefined) as [string, string][],
    )}`;
    window.open(exportUrl, "_blank");
  };

  const columns: DataTableColumn<DonationTransaction>[] = [
    {
      id: "time",
      header: "Thời gian",
      cell: (item) => (
        <span className="text-muted-foreground font-mono text-xs whitespace-nowrap">
          {format.dateTime(new Date(item.receivedAt), {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </span>
      ),
    },
    {
      id: "page",
      header: "Trang nhận",
      cell: (item) => (
        <div className="max-w-[140px] truncate">
          <span className="text-xs font-medium" title={item.pageTitle}>
            {item.pageTitle}
          </span>
        </div>
      ),
    },
    {
      id: "donor",
      header: "Danh xưng tri ân",
      cell: (item) => (
        <div className="space-y-0.5 whitespace-nowrap">
          <span className="text-primary text-xs font-semibold">{item.donorTitle}</span>
          <p className="text-muted-foreground font-mono text-[11px]">ID: {item.sepayId}</p>
        </div>
      ),
    },
    {
      id: "amount",
      header: "Số tiền",
      cell: (item) => (
        <div className="space-y-0.5 whitespace-nowrap">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
            {item.amount.toLocaleString("vi-VN")} ₫
          </span>
          <p className="text-muted-foreground text-[11px]">{item.giftLabel}</p>
        </div>
      ),
    },
    {
      id: "tier",
      header: "Bảng vinh danh",
      cell: (item) => {
        const tierInfo = TIER_BADGES[item.tier] ?? TIER_BADGES.NORMAL;
        return (
          <Badge variant="outline" className={`${tierInfo.className} whitespace-nowrap`}>
            {tierInfo.label}
          </Badge>
        );
      },
    },
    {
      id: "message",
      header: "Lời nhắn",
      cell: (item) => (
        <div className="max-w-md min-w-[200px] space-y-1">
          {item.isCensored ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
              <ShieldAlert className="size-3.5 shrink-0" />
              <span>Đã che vi phạm từ ngữ</span>
            </div>
          ) : (
            <p
              className="line-clamp-2 text-xs leading-relaxed break-words"
              title={item.message || undefined}
            >
              {item.message || "—"}
            </p>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-muted-foreground cursor-pointer truncate font-mono text-[10px]">
                Gốc: {item.originalContent}
              </p>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm text-xs">{item.originalContent}</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (item) => (
        <div className="space-y-1 whitespace-nowrap">
          {item.isCensored && (
            <Badge variant="destructive" className="block w-fit text-[10px]">
              Vi phạm từ ngữ
            </Badge>
          )}
          <TableStatusSwitch
            checked={!item.isHidden}
            onLabel="Hiển thị"
            offLabel="Đã ẩn"
            aria-label={item.isHidden ? "Hiển thị lời nhắn" : "Ẩn lời nhắn"}
            disabled={toggleMutation.isPending}
            onCheckedChange={
              canUpdate
                ? (checked) => toggleMutation.mutate({ id: item.id, isHidden: !checked })
                : undefined
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Bộ lọc thanh công cụ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Bảng vinh danh"
            value={selectedTier}
            onValueChange={(val) => tableState.setFilterValues("tier", val)}
            options={[
              { value: "BRONZE", label: "Bảng Đồng (≥100k)" },
              { value: "SILVER", label: "Bảng Bạc (≥200k)" },
              { value: "GOLD", label: "Bảng Vàng (≥500k)" },
              { value: "DIAMOND", label: "Bảng Kim Cương (≥1M)" },
              { value: "NORMAL", label: "Bình thường (<100k)" },
            ]}
          />
          <FilterSelect
            label="Trạng thái"
            value={statusFilter}
            onValueChange={(val) => tableState.setFilterValues("status", val)}
            options={[
              { value: "censored", label: "Bị kiểm duyệt từ xấu" },
              { value: "hidden", label: "Chủ trang đã ẩn" },
            ]}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="h-9 gap-1.5 text-xs font-medium"
        >
          <Download className="size-3.5" />
          <span>Xuất báo cáo CSV</span>
        </Button>
      </div>

      {/* Bảng dữ liệu DataTable */}
      <DataTable
        tableId="donations"
        columns={columns}
        rows={data?.items}
        getRowId={(row) => row.id}
        getRowLabel={(row) => `${row.donorTitle} (${row.amount.toLocaleString("vi-VN")} đ)`}
        isLoading={isLoading}
        pagination={
          data?.pagination
            ? {
                value: data.pagination,
                onPageChange: tableState.onPageChange,
                onPageSizeChange: tableState.onPageSizeChange,
              }
            : undefined
        }
        search={{
          value: tableState.search.value,
          onValueChange: tableState.search.onValueChange,
          placeholder: "Tìm kiếm người ủng hộ, nội dung...",
        }}
        onDelete={(row) => deleteMutation.mutateAsync(row.id)}
        can={{ update: canUpdate, delete: canUpdate }}
        onBulkDelete={canUpdate ? bulk.bulkDelete : undefined}
        bulkStatus={
          canUpdate
            ? createBooleanBulkStatus<DonationTransaction>(
                { on: "Hiển thị bình luận", off: "Ẩn bình luận" },
                (rows, on) => bulk.bulkUpdate(rows, { isHidden: !on }),
              )
            : undefined
        }
      />
    </div>
  );
}
