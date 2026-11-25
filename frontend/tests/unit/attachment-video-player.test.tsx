// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { AttachmentVideoPlayer } from "@/modules/system/components/attachment/attachment-video-player";
import {
  MEDIA_PLAYER_MUTED_KEY,
  MEDIA_PLAYER_VOLUME_KEY,
} from "@/modules/system/constants/media-player";
import systemVi from "@/modules/system/messages/vi.json";

function renderWithIntl(ui: ReactNode) {
  return render(
    <NextIntlClientProvider locale="vi" messages={{ system: systemVi }}>
      {ui}
    </NextIntlClientProvider>,
  );
}

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("AttachmentVideoPlayer", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("khởi tạo âm lượng từ localStorage và cập nhật khi người dùng kéo thanh trượt", () => {
    localStorage.setItem(MEDIA_PLAYER_VOLUME_KEY, "0.65");
    localStorage.setItem(MEDIA_PLAYER_MUTED_KEY, "false");

    renderWithIntl(<AttachmentVideoPlayer src="https://example.com/demo.mp4" title="Demo Video" />);

    const slider = screen.getByRole("slider", { name: "Điều chỉnh âm lượng" });
    expect(slider.getAttribute("aria-valuenow")).toBe("0.65");

    // Thay đổi âm lượng qua tương tác bàn phím chuẩn Radix UI Slider
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(Number(localStorage.getItem(MEDIA_PLAYER_VOLUME_KEY))).toBeLessThan(0.65);
  });

  it("có thể bật tắt tiếng và lưu cờ tắt tiếng vào localStorage", () => {
    renderWithIntl(<AttachmentVideoPlayer src="https://example.com/demo.mp4" title="Demo Video" />);

    const muteBtn = screen.getByLabelText("Tắt tiếng");
    fireEvent.click(muteBtn);

    expect(localStorage.getItem(MEDIA_PLAYER_MUTED_KEY)).toBe("true");
  });
});
