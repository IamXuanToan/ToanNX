// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { env } from "@/shares/config/env";
import { getCroppedImageCanvas } from "@/modules/system/lib/crop-image-canvas";
import { attachmentService } from "@/modules/system/services/attachment.service";

/**
 * Trình sửa ảnh đọc bytes trực tiếp qua backend (`…/content?stream=1`): URL R2 khác origin không có CORS thì
 * `fetch`/canvas bị chặn ("Failed to fetch").
 */
afterEach(() => {
  vi.unstubAllGlobals();
});

const CROP = { x: 0, y: 0, width: 10, height: 10 };

describe("trình sửa ảnh: tải ảnh", () => {
  it("URL đọc nội dung là đường dẫn qua backend", () => {
    expect(attachmentService.contentStreamUrl("abc")).toBe(
      `${env.apiBaseUrl}/system/attachments/abc/content?stream=1`,
    );
  });

  it("gọi fetch trực tiếp tới URL truyền vào với credentials include", async () => {
    const fetchMock = vi.fn(async () => new Response("", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
    const url = attachmentService.contentStreamUrl("abc");

    await expect(getCroppedImageCanvas({ imageSrc: url, pixelCrop: CROP })).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledWith(url, { credentials: "include" });
  });

  it("backend trả lỗi: báo lỗi, không lặng lẽ thử tải trực tiếp từ storage", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 404 })),
    );
    await expect(
      getCroppedImageCanvas({
        imageSrc: `${env.apiBaseUrl}/system/attachments/x/content?stream=1`,
        pixelCrop: CROP,
      }),
    ).rejects.toBeInstanceOf(Error);
  });
});

/** Canvas giả (jsdom không vẽ được): ghi lại kích thước, lệnh drawImage và tham số toBlob. */
function stubCanvas() {
  const draws: number[][] = [];
  const exports: { type?: string; quality?: number; width: number; height: number }[] = [];
  const context = {
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "low",
    translate: vi.fn(),
    rotate: vi.fn(),
    beginPath: vi.fn(),
    fillText: vi.fn(),
    font: "",
    globalAlpha: 1,
    fillStyle: "",
    shadowColor: "",
    arc: vi.fn(),
    closePath: vi.fn(),
    clip: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    drawImage: vi.fn((...args: unknown[]) => draws.push(args.slice(1).map(Number))),
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
    this: HTMLCanvasElement,
    callback: BlobCallback,
    type?: string,
    quality?: number,
  ) {
    exports.push({ type, quality, width: this.width, height: this.height });
    callback(new Blob(["x"], { type }));
  });
  return { draws, exports, context };
}

describe("trình sửa ảnh: giữ chất lượng ảnh gốc", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(new Blob(["img"]), { status: 200 })),
    );
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: () => "blob:x",
      revokeObjectURL: () => undefined,
    });
    // Ảnh gốc 2000×1000: onload ngay khi gán src.
    vi.stubGlobal(
      "Image",
      class {
        naturalWidth = 2000;
        naturalHeight = 1000;
        width = 2000;
        height = 1000;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("PNG giữ PNG (không nén JPEG), ảnh xuất đúng kích thước vùng cắt, vẽ 1:1 bằng số nguyên", async () => {
    const { draws, exports } = stubCanvas();
    const result = await getCroppedImageCanvas({
      imageSrc: "/api/v1/system/attachments/a/content?stream=1",
      sourceType: "image/png",
      pixelCrop: { x: 10.4, y: 20.6, width: 1500.4, height: 800.6 },
    });

    expect(result.mimeType).toBe("image/png");
    expect(result.extension).toBe("png");
    expect(exports.at(-1)).toEqual({
      type: "image/png",
      quality: undefined,
      width: 1500,
      height: 801,
    });
    // Lệnh vẽ cuối: nguồn và đích cùng kích thước số nguyên (không co giãn).
    expect(draws.at(-1)).toEqual([10, 21, 1500, 801, 0, 0, 1500, 801]);
  });

  it("JPEG giữ JPEG chất lượng cao 0.95", async () => {
    const { exports } = stubCanvas();
    const result = await getCroppedImageCanvas({
      imageSrc: "/x",
      sourceType: "image/jpeg",
      pixelCrop: { x: 0, y: 0, width: 2000, height: 1000 },
    });
    expect(result.extension).toBe("jpg");
    expect(exports.at(-1)).toMatchObject({
      type: "image/jpeg",
      quality: 0.95,
      width: 2000,
      height: 1000,
    });
  });

  it('kiểu "Ảnh gốc" (không truyền vùng cắt): xuất trọn ảnh đúng độ phân giải gốc', async () => {
    const { exports } = stubCanvas();
    await getCroppedImageCanvas({ imageSrc: "/x", sourceType: "image/png" });
    expect(exports.at(-1)).toMatchObject({ width: 2000, height: 1000 });
  });

  it('"Ảnh gốc" + xoay 90°: trọn ảnh, đổi chiều rộng/cao', async () => {
    const { exports } = stubCanvas();
    await getCroppedImageCanvas({ imageSrc: "/x", sourceType: "image/png", rotation: 90 });
    expect(exports.at(-1)).toMatchObject({ width: 1000, height: 2000 });
  });

  it('cỡ chữ watermark theo % chiều rộng ảnh xuất (khớp thanh "Cỡ chữ")', async () => {
    const { context } = stubCanvas();
    await getCroppedImageCanvas({
      imageSrc: "/x",
      pixelCrop: { x: 0, y: 0, width: 1000, height: 500 },
      watermark: {
        enabled: true,
        text: "ToanNX",
        position: "bottom-right",
        opacity: 80,
        fontSize: 50,
        color: "#FFFFFF",
      },
    });
    // 1000 × 50 / 500 = 100px (10% chiều rộng).
    expect(context.font).toBe("bold 100px sans-serif");
    expect(context.fillText).toHaveBeenCalledWith("ToanNX", expect.any(Number), expect.any(Number));
  });

  it("ảnh nhỏ: chữ watermark không nhỏ hơn mức tối thiểu đọc được", async () => {
    const { context } = stubCanvas();
    await getCroppedImageCanvas({
      imageSrc: "/x",
      pixelCrop: { x: 0, y: 0, width: 100, height: 100 },
      watermark: {
        enabled: true,
        text: "ToanNX",
        position: "center",
        opacity: 80,
        fontSize: 10,
        color: "#000000",
      },
    });
    expect(context.font).toBe("bold 14px sans-serif");
  });

  it("màu chữ watermark tùy chọn: tô đúng mã màu, bóng tương phản theo độ sáng", async () => {
    const { context } = stubCanvas();
    await getCroppedImageCanvas({
      imageSrc: "/x",
      pixelCrop: { x: 0, y: 0, width: 1000, height: 500 },
      watermark: {
        enabled: true,
        text: "ToanNX",
        position: "top-left",
        opacity: 80,
        fontSize: 28,
        color: "#E11D48",
      },
    });
    expect(context.fillStyle).toBe("#E11D48");
    // Đỏ đậm là màu tối → bóng sáng.
    expect(context.shadowColor).toBe("rgba(255, 255, 255, 0.75)");
  });

  it("cắt tròn luôn PNG để giữ nền trong suốt", async () => {
    const { exports } = stubCanvas();
    await getCroppedImageCanvas({
      imageSrc: "/x",
      sourceType: "image/jpeg",
      isRound: true,
      pixelCrop: { x: 0, y: 0, width: 500, height: 500 },
    });
    expect(exports.at(-1)?.type).toBe("image/png");
  });
});
