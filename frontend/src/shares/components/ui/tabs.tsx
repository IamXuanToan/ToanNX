"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Tabs as TabsPrimitive } from "radix-ui";

/** Khung tab chuẩn shadcn/ui với hành vi bàn phím của Radix. */
function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2",
        orientation === "horizontal" ? "flex-col" : "flex-row",
        className,
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex items-center justify-start rounded-xl p-1 sm:p-1.5 text-muted-foreground transition-colors group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col group-data-vertical/tabs:w-full group-data-[orientation=horizontal]/tabs:min-h-10 max-w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
  {
    variants: {
      variant: {
        default:
          "bg-muted/80 dark:bg-muted/50 border border-border/60 shadow-2xs gap-1 justify-start",
        line: "gap-2 border-b border-border bg-transparent p-0 rounded-none justify-start",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/** Danh sách tab theo kiểu mặc định của shadcn/ui hỗ trợ responsive và cuộn ngang mượt mà. */
function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

/** Nút chọn tab với màu nền active rõ ràng, bóng đổ tinh tế, trạng thái hover và focus chuẩn mực. */
function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-200 outline-none select-none sm:px-4 sm:text-sm",
        "text-muted-foreground hover:text-foreground hover:bg-background/50 dark:hover:bg-muted/70",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
        "group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Trạng thái Active - Segmented Pill (variant=default)
        "group-data-[variant=default]/tabs-list:data-[state=active]:bg-background group-data-[variant=default]/tabs-list:data-[state=active]:text-foreground group-data-[variant=default]/tabs-list:data-[state=active]:border-border/60 group-data-[variant=default]/tabs-list:data-[state=active]:border group-data-[variant=default]/tabs-list:data-[state=active]:font-semibold group-data-[variant=default]/tabs-list:data-[state=active]:shadow-xs",
        "dark:group-data-[variant=default]/tabs-list:data-[state=active]:bg-card dark:group-data-[variant=default]/tabs-list:data-[state=active]:text-foreground dark:group-data-[variant=default]/tabs-list:data-[state=active]:border-border/80 dark:group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm",
        "group-data-[variant=default]/tabs-list:data-active:bg-background group-data-[variant=default]/tabs-list:data-active:text-foreground group-data-[variant=default]/tabs-list:data-active:border-border/60 group-data-[variant=default]/tabs-list:data-active:border group-data-[variant=default]/tabs-list:data-active:font-semibold group-data-[variant=default]/tabs-list:data-active:shadow-xs",
        "dark:group-data-[variant=default]/tabs-list:data-active:bg-card dark:group-data-[variant=default]/tabs-list:data-active:text-foreground dark:group-data-[variant=default]/tabs-list:data-active:border-border/80 dark:group-data-[variant=default]/tabs-list:data-active:shadow-sm",
        // Trạng thái Active - Underline (variant=line)
        "group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:border-b-2 group-data-[variant=line]/tabs-list:border-transparent group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:px-3 group-data-[variant=line]/tabs-list:py-2.5",
        "group-data-[variant=line]/tabs-list:data-[state=active]:border-primary group-data-[variant=line]/tabs-list:data-[state=active]:text-primary group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:font-semibold group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none",
        "group-data-[variant=line]/tabs-list:data-active:border-primary group-data-[variant=line]/tabs-list:data-active:text-primary group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:font-semibold group-data-[variant=line]/tabs-list:data-active:shadow-none",
        className,
      )}
      {...props}
    />
  );
}

/** Vùng nội dung tương ứng với tab đang chọn. */
function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("mt-2 flex-1 text-sm outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
