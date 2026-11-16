import { expect, test } from "@playwright/test";

import { loginViaUi } from "./helpers";

test("bộ lọc trạng thái có hai thao tác cùng hàng và chọn tất cả rồi xóa lọc", async ({ page }) => {
  await loginViaUi(page);
  await page.goto("/vi/quan-tri/link-rut-gon");
  await page.getByRole("button", { name: "Trạng thái", exact: true }).click();

  const selectAll = page.getByRole("button", { name: "Chọn tất cả", exact: true });
  const clear = page.getByRole("button", { name: "Xoá lọc", exact: true });
  await expect(selectAll).toBeVisible();
  await expect(clear).toBeVisible();
  await expect(clear).toBeDisabled();
  await expect
    .poll(async () => {
      const [selectAllBox, clearBox] = await Promise.all([
        selectAll.boundingBox(),
        clear.boundingBox(),
      ]);
      return {
        sameRow: selectAllBox?.y === clearBox?.y,
        sameHeight: selectAllBox?.height === clearBox?.height,
      };
    })
    .toEqual({ sameRow: true, sameHeight: true });
  await expect(
    page
      .getByRole("listbox", { name: "Trạng thái" })
      .getByRole("checkbox", { name: "Chọn tất cả" }),
  ).toHaveCount(0);

  await selectAll.click();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("status"))
    .toBe("ACTIVE,INACTIVE,EXPIRED");
  await expect(selectAll).toBeDisabled();
  await expect(clear).toBeEnabled();

  await clear.click();
  await expect.poll(() => new URL(page.url()).searchParams.get("status")).toBeNull();
  await expect(selectAll).toBeEnabled();
});
