// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shares/components/ui/tabs";

describe("Tabs và TabsTrigger chuẩn hệ thống", () => {
  afterEach(() => {
    cleanup();
  });

  it("gắn data-pointer-focus khi bấm chuột và gỡ khi điều hướng bàn phím hoặc blur", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>,
    );

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    const tab2 = screen.getByRole("tab", { name: "Tab 2" });

    // Bấm chuột: gắn data-pointer-focus để không hiện viền focus như input
    fireEvent.pointerDown(tab2);
    expect(tab2.getAttribute("data-pointer-focus")).toBe("true");
    expect(tab2.className).toContain("data-[state=active]:bg-card");
    expect(tab2.className).toContain("[&:not([data-pointer-focus])]:focus-visible:ring-2");

    // Điều hướng bàn phím: xóa data-pointer-focus trên các tab để giữ focus ring
    fireEvent.keyDown(tab2, { key: "ArrowLeft" });
    expect(tab2.hasAttribute("data-pointer-focus")).toBe(false);
    expect(tab1.hasAttribute("data-pointer-focus")).toBe(false);

    // Rời khỏi tab: xóa data-pointer-focus
    fireEvent.pointerDown(tab1);
    expect(tab1.getAttribute("data-pointer-focus")).toBe("true");
    fireEvent.blur(tab1);
    expect(tab1.hasAttribute("data-pointer-focus")).toBe(false);
  });
});
