// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import commonVi from "@/messages/vi.json";
import { RecordHistory } from "@/modules/system/components/journal-entry/record-history";
import systemVi from "@/modules/system/messages/vi.json";
import { journalEntryService } from "@/modules/system/services/journal-entry.service";
import workspaceVi from "@/modules/workspace/messages/vi.json";
import { ActivityTimeline } from "@/shares/components/common/activity-timeline";
import type {
  ActivityItem,
  ActivityTimelineFilterOption,
} from "@/shares/types/activity-timeline.types";
import type { HistoryEntry, Paginated } from "@/shares/types/api.types";

const mockForRecordPage = vi.fn<typeof journalEntryService.forRecordPage>();

vi.mock("@/modules/system/services/journal-entry.service", () => ({
  journalEntryService: {
    forRecordPage: (...args: Parameters<typeof journalEntryService.forRecordPage>) =>
      mockForRecordPage(...args),
  },
}));

const FIXED_NOW = new Date("2026-11-27T12:05:00Z");
const TEST_MESSAGES = {
  ...commonVi,
  system: systemVi,
  workspace: workspaceVi,
};

function renderWithIntl(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider
        locale="vi"
        timeZone="Asia/Ho_Chi_Minh"
        now={FIXED_NOW}
        messages={TEST_MESSAGES}
      >
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ActivityTimeline common component", () => {
  it("hiển thị skeleton khi đang tải và EmptyState khi không có dữ liệu", () => {
    const { rerender } = renderWithIntl(
      <ActivityTimeline
        items={[]}
        emptyTitle="Chưa có lịch sử"
        emptyDescription="Mọi thay đổi sẽ hiện tại đây"
        isLoading
      />,
    );
    expect(screen.queryByText("Chưa có lịch sử")).toBeNull();

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <NextIntlClientProvider
          locale="vi"
          timeZone="Asia/Ho_Chi_Minh"
          now={FIXED_NOW}
          messages={TEST_MESSAGES}
        >
          <ActivityTimeline
            items={[]}
            emptyTitle="Chưa có lịch sử"
            emptyDescription="Mọi thay đổi sẽ hiện tại đây"
          />
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );
    expect(screen.getByText("Chưa có lịch sử")).toBeTruthy();
    expect(screen.getByText("Mọi thay đổi sẽ hiện tại đây")).toBeTruthy();
  });

  it("hiển thị lỗi kèm nút Thử lại và gọi onRetry khi bấm", () => {
    const onRetry = vi.fn();
    renderWithIntl(
      <ActivityTimeline
        items={[]}
        emptyTitle="Trống"
        isError
        errorMessage="Không tải được lịch sử"
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText("Không tải được lịch sử")).toBeTruthy();
    fireEvent.click(screen.getByRole("button"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("render đầy đủ badge hành động, actor, TimestampText, diff mảng +/- và thu gọn khi > 8 trường", () => {
    const manyChanges = Array.from({ length: 10 }, (_, idx) => ({
      field: `Trường ${idx + 1}`,
      before: `Cũ ${idx + 1}`,
      after: `Mới ${idx + 1}`,
    }));

    const items: ActivityItem[] = [
      {
        id: "act-1",
        dateTime: "2026-11-27T12:00:00Z",
        actor: "Nguyễn Xuân Toàn (toannx)",
        action: "đã cập nhật",
        actionBadge: "Cập nhật",
        tone: "update",
        changes: [
          {
            field: "Kênh nhận thông báo",
            before: "Web",
            after: "Web, Telegram",
            added: ["Telegram"],
            removed: ["Email"],
          },
          ...manyChanges,
        ],
      },
      {
        id: "act-2",
        dateTime: "2026-11-27T10:00:00Z",
        actor: "Hệ thống",
        isSystem: true,
        action: "đã thực hiện sự kiện",
        actionBadge: "Sự kiện",
        tone: "event",
        changes: [],
      },
    ];

    const filters: ActivityTimelineFilterOption[] = [
      { value: "ALL", label: "Tất cả", count: 2 },
      { value: "UPDATE", label: "Cập nhật", count: 1 },
    ];
    const onFilterChange = vi.fn();
    const onLoadMore = vi.fn();

    renderWithIntl(
      <ActivityTimeline
        items={items}
        emptyTitle="Trống"
        filterOptions={filters}
        activeFilter="ALL"
        onFilterChange={onFilterChange}
        totalCount={5}
        hasMore
        onLoadMore={onLoadMore}
      />,
    );

    expect(screen.getByText("Nguyễn Xuân Toàn (toannx)")).toBeTruthy();
    expect(screen.getByText("Hệ thống")).toBeTruthy();
    expect(screen.getByText(/27\/11\/2026 19:00:00/)).toBeTruthy();
    expect(screen.getByText(/5 phút trước/)).toBeTruthy();
    expect(screen.getByText("Kênh nhận thông báo")).toBeTruthy();
    expect(screen.getByText("Telegram")).toBeTruthy();
    expect(screen.getByText("Email")).toBeTruthy();

    // Chỉ 8 trường đầu được hiện trước khi mở rộng
    expect(screen.queryByText("Trường 10")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Xem tất cả 11 trường/ }));
    expect(screen.getByText("Trường 10")).toBeTruthy();

    // Bấm filter & phân trang Xem hoạt động cũ hơn
    fireEvent.click(screen.getByRole("button", { name: /Cập nhật/ }));
    expect(onFilterChange).toHaveBeenCalledWith("UPDATE");

    fireEvent.click(screen.getByRole("button", { name: commonVi.common.timeline.loadMore }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});

describe("RecordHistory tích hợp API phân trang, lọc và định dạng enum/ngày", () => {
  it("tải lịch sử từ API, format field/enum/ngày tiếng Việt, lọc loại thao tác và bấm xem thêm", async () => {
    const page1: Paginated<HistoryEntry> = {
      items: [
        {
          id: "j-1",
          createdAt: "2026-11-27T12:00:00Z",
          action: "UPDATE",
          event: "",
          resource: "workspace.reminder",
          objectId: "r-1",
          objectLabel: "Nhắc việc",
          actorId: "u-1",
          actorLabel: "toannx",
          actorDisplayName: "Nguyễn Xuân Toàn (toannx)",
          changes: {
            notification_channels: [["WEBSITE"], ["WEBSITE", "TELEGRAM"]],
            priority: ["MEDIUM", "HIGH"],
            due_date: ["2026-11-27", "2026-11-28"],
          },
          requestId: "req-1",
        },
        {
          id: "j-2",
          createdAt: "2026-11-27T11:00:00Z",
          action: "CREATE",
          event: "",
          resource: "workspace.reminder",
          objectId: "r-1",
          objectLabel: "Nhắc việc",
          actorId: null,
          actorLabel: "",
          actorDisplayName: "",
          changes: {
            title: [null, "Nhắc việc mới"],
            recurrence: [null, "NONE"],
          },
          requestId: "req-2",
        },
      ],
      pagination: { page: 1, pageSize: 10, total: 3, totalPages: 2 },
    };

    const page2: Paginated<HistoryEntry> = {
      items: [
        {
          id: "j-3",
          createdAt: "2026-11-26T10:00:00Z",
          action: "EVENT",
          event: "workspace.reminder_sent",
          resource: "workspace.reminder",
          objectId: "r-1",
          objectLabel: "Nhắc việc",
          actorId: null,
          actorLabel: "",
          actorDisplayName: "",
          changes: {},
          requestId: "req-3",
        },
      ],
      pagination: { page: 2, pageSize: 10, total: 3, totalPages: 2 },
    };

    mockForRecordPage.mockImplementation(async (_path, params) =>
      params?.page === 2 ? page2 : page1,
    );

    renderWithIntl(
      <RecordHistory
        path="/workspace/reminders/r-1/history"
        fieldPrefix="workspace.reminders.fields"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Nguyễn Xuân Toàn (toannx)")).toBeTruthy();
    });

    // Nhãn field và ngày đã được chuẩn hóa thay cho mã thô
    expect(screen.getByText("Kênh nhận thông báo")).toBeTruthy();
    expect(screen.queryByText("notification_channels")).toBeNull();
    expect(screen.queryByText("2026-11-27")).toBeNull();
    expect(screen.getByText("27/11/2026")).toBeTruthy();
    expect(screen.getByText("28/11/2026")).toBeTruthy();
    expect(screen.queryByText("MEDIUM")).toBeNull();
    expect(screen.queryByText("NONE")).toBeNull();

    // Lọc chỉ còn Tạo mới
    const filterCreateBtn = screen
      .getAllByRole("button")
      .find((btn) => btn.textContent?.includes(systemVi.journal.actionBadges.CREATE));
    expect(filterCreateBtn).toBeDefined();
    fireEvent.click(filterCreateBtn!);
    expect(screen.queryByText("Kênh nhận thông báo")).toBeNull();
    expect(screen.getByText("Nhắc việc mới")).toBeTruthy();

    // Bỏ lọc về Tất cả
    const filterAllBtn = screen
      .getAllByRole("button")
      .find((btn) => btn.textContent?.includes(commonVi.common.timeline.allActions));
    fireEvent.click(filterAllBtn!);
    expect(screen.getByText("Kênh nhận thông báo")).toBeTruthy();

    // Bấm Xem hoạt động cũ hơn để tải trang 2
    fireEvent.click(screen.getByRole("button", { name: commonVi.common.timeline.loadMore }));
    await waitFor(() => {
      expect(mockForRecordPage).toHaveBeenCalledWith(
        "/workspace/reminders/r-1/history",
        expect.objectContaining({ page: 2, pageSize: 10 }),
        expect.any(AbortSignal),
      );
    });
    expect(screen.getAllByText(systemVi.journal.actionBadges.EVENT).length).toBeGreaterThanOrEqual(
      2,
    );
  });
});
