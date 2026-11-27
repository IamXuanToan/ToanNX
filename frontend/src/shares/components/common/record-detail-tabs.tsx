"use client";

import { FileText, History } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shares/components/ui/tabs";
import { useTabState } from "@/shares/hooks/use-tab-state";

/** Một tab mở rộng giữa tab `Thông tin chung` và tab `Lịch sử thay đổi`. */
export type RecordDetailTabItem = {
  value: string;
  label: ReactNode;
  content: ReactNode;
};

/**
 * Khung tab chuẩn cho mọi trang chi tiết bản ghi:
 * - Tab `general` (`Thông tin chung`): chứa form chính của bản ghi.
 * - Các `extraTabs` tùy chọn (ví dụ Bảo hành & Sửa chữa, Lịch sử thanh toán...).
 * - Tab `history` (`Lịch sử thay đổi`): tự động hiển thị khi truyền slot `history` (mọi model dùng `JournalTracker`).
 * - Đồng bộ tab đang chọn với URL query `?tab=...` qua `useTabState` (`window.history.replaceState`).
 *
 * @param props - Nội dung tab thông tin chung, tab phụ, slot lịch sử và nhãn tab chung tùy chọn.
 * @returns Khối Tabs chuẩn hóa của trang chi tiết.
 */
export function RecordDetailTabs({
  general,
  extraTabs = [],
  history,
  generalLabel,
  defaultTab = "general",
}: {
  general: ReactNode;
  extraTabs?: RecordDetailTabItem[];
  history?: ReactNode;
  generalLabel?: ReactNode;
  defaultTab?: string;
}) {
  const tTabs = useTranslations("common.tabs");
  const validTabs = [
    "general",
    ...extraTabs.map((tab) => tab.value),
    ...(history ? ["history"] : []),
  ];
  const [activeTab, setActiveTab] = useTabState({
    validTabs,
    defaultTab,
  });

  if (!history && extraTabs.length === 0) {
    return <>{general}</>;
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="max-w-full scrollbar-none justify-start overflow-x-auto">
        <TabsTrigger value="general" className="gap-1.5">
          <FileText aria-hidden className="size-3.5 shrink-0" />
          <span>{generalLabel ?? tTabs("general")}</span>
        </TabsTrigger>
        {extraTabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
        {history ? (
          <TabsTrigger value="history" className="gap-1.5">
            <History aria-hidden className="size-3.5 shrink-0" />
            <span>{tTabs("history")}</span>
          </TabsTrigger>
        ) : null}
      </TabsList>

      <TabsContent value="general" className="mt-4">
        {general}
      </TabsContent>
      {extraTabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4">
          {tab.content}
        </TabsContent>
      ))}
      {history ? (
        <TabsContent value="history" className="mt-4">
          {history}
        </TabsContent>
      ) : null}
    </Tabs>
  );
}
