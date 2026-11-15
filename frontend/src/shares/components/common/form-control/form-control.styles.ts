/**
 * Class chuẩn của mọi control dạng nút mở popover (SelectField, MultiSelect, DatePicker, TimePicker…):
 * cùng chiều cao 40px, bo `rounded-xl`, viền, nền, focus và trạng thái lỗi với `Input`.
 */
export const FORM_CONTROL_TRIGGER_CLASS =
  "border-input bg-card focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 flex h-10 w-full min-w-0 items-center gap-2 rounded-xl border px-3 text-left text-sm outline-none transition-colors focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3";

/** Khung popover chuẩn của control (bo, đệm như menu). */
export const FORM_CONTROL_POPOVER_CLASS = "gap-1 rounded-xl p-1";

/** Một dòng lựa chọn trong popover (cao tối thiểu 40px). */
export const FORM_CONTROL_OPTION_CLASS =
  "flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm outline-none";
