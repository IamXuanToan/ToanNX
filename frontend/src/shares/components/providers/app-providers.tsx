"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { type ReactNode, useState } from "react";

import { Toaster } from "@/shares/components/ui/sonner";
import { TooltipProvider } from "@/shares/components/ui/tooltip";
import { createQueryClient } from "@/shares/lib/query-client";

/**
 * Provider dùng chung: theme, React Query, tooltip, toast.
 *
 * @param props - Nội dung con.
 * @returns Cây provider.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
