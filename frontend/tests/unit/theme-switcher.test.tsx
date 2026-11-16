// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ThemeSwitcher } from "@/shares/components/layout/theme-switcher";

const mockSetTheme = vi.fn();
let mockTheme = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      toggle: "Đổi giao diện",
      light: "Sáng",
      dark: "Tối",
      system: "Theo hệ thống",
    };
    return map[key] ?? key;
  },
}));

vi.mock("@/shares/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("ThemeSwitcher", () => {
  it("xoay vòng qua 3 theme khi bấm: light -> dark -> system -> light", () => {
    mockTheme = "light";
    const { rerender } = render(<ThemeSwitcher />);

    const button = screen.getByTestId("theme-switcher");
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");

    mockTheme = "dark";
    rerender(<ThemeSwitcher />);
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith("system");

    mockTheme = "system";
    rerender(<ThemeSwitcher />);
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });
});
