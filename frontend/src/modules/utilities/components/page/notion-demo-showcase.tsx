"use client";

import {
  Braces,
  Copy,
  Eye,
  Heart,
  MessageSquare,
  Moon,
  Package,
  PanelTop,
  Pencil,
  PlusCircle,
  RotateCcw,
  Sparkles,
  Sun,
  Type,
  UserCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { TiptapBasicEditor } from "@/shares/components/common/tiptap-basic-editor";
import { TiptapCommentEditor } from "@/shares/components/common/tiptap-comment-editor";
import { TiptapContent } from "@/shares/components/common/tiptap-content";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Card } from "@/shares/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";

import { DEMO_TEMPLATE_TYPE } from "../../constants/page-constants";
import { UTILITIES_ROUTES } from "../../constants/routes";
import { PAGE_EXTENSIONS } from "../../extensions/page-extensions";
import { useNotionDemo } from "./hooks/use-notion-demo";
import { NotionDemoEditor } from "./notion-demo-editor";

/**
 * Trang trình diễn trọn bộ 3 loại Editor dùng chung của hệ thống tại `/demo/editor`:
 * 1) `TiptapEditor`: Bộ Full hợp nhất Simple Sticky Toolbar + Notion-like (kéo dòng `⠿`, `/`, Bubble Menu).
 * 2) `TiptapBasicEditor`: Bộ Basic cho mô tả (chỉ in đậm, in nghiêng).
 * 3) `TiptapCommentEditor`: Bộ Comment (gọn cho bình luận, `Ctrl+Enter` gửi nhanh).
 */
export function NotionDemoShowcase() {
  const tDemo = useTranslations("utilities.customPages.demo");
  const t = useTranslations("utilities.customPages.notionDemo");
  const state = useNotionDemo();

  return (
    <div className="bg-canvas flex min-h-svh flex-col">
      {/* Header Studio thống nhất với TemplateDemoShowcase */}
      <div className="bg-card/90 sticky top-0 z-30 shadow-2xs backdrop-blur-md">
        <header className="border-border flex flex-wrap items-center justify-between gap-2.5 border-b px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-foreground text-sm font-bold tracking-tight">ToanNX</span>
              <Badge variant="secondary" className="gap-1 text-[11px] font-semibold">
                <Sparkles className="text-primary size-3" />
                <span>{t("badge")}</span>
              </Badge>
            </Link>
          </div>

          {/* Bộ chuyển đổi các trang Demo */}
          <div className="border-border bg-muted/40 order-3 flex w-full max-w-full flex-wrap items-center justify-center gap-1 rounded-xl border p-1 shadow-inner lg:order-none lg:w-auto lg:flex-nowrap">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              asChild
              className="h-8 shrink-0 gap-1.5 px-2.5 text-xs font-medium sm:px-3"
            >
              <Link href={UTILITIES_ROUTES.demoType(DEMO_TEMPLATE_TYPE.AFFILIATE)}>
                <Package className="size-3.5" />
                <span>{tDemo("affiliate")}</span>
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              asChild
              className="h-8 shrink-0 gap-1.5 px-2.5 text-xs font-medium sm:px-3"
            >
              <Link href={UTILITIES_ROUTES.demoType(DEMO_TEMPLATE_TYPE.BIO)}>
                <UserCheck className="size-3.5" />
                <span>{tDemo("bio")}</span>
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              asChild
              className="h-8 shrink-0 gap-1.5 px-2.5 text-xs font-medium sm:px-3"
            >
              <Link href={UTILITIES_ROUTES.demoType(DEMO_TEMPLATE_TYPE.DONATION)}>
                <Heart className="size-3.5" />
                <span>{tDemo("donation")}</span>
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="default"
              asChild
              className="h-8 shrink-0 gap-1.5 px-2.5 text-xs font-medium sm:px-3"
            >
              <Link href={UTILITIES_ROUTES.demoEditor}>
                <Sparkles className="size-3.5" />
                <span>{tDemo("notionEditor")}</span>
              </Link>
            </Button>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button asChild size="sm" className="h-8 gap-1.5 text-xs font-semibold shadow-xs">
              <Link href={UTILITIES_ROUTES.pageCreate}>
                <PlusCircle className="size-3.5" />
                <span>{tDemo("createPage")}</span>
              </Link>
            </Button>
          </div>
        </header>

        {/* Thanh chọn 1 trong 3 bộ Editor + điều khiển chế độ */}
        <div className="border-border/70 bg-background/90 border-b">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4">
            {/* Chuyển đổi giữa 3 bộ: Full / Basic / Comment */}
            <div className="border-border bg-muted/40 flex flex-wrap items-center gap-1 rounded-lg border p-0.5">
              <Button
                type="button"
                size="xs"
                variant={state.suiteMode === "full" ? "secondary" : "ghost"}
                onClick={() => state.setSuiteMode("full")}
                className="h-7 gap-1.5 rounded-md px-2.5 text-xs font-medium"
              >
                <Sparkles className="size-3.5" />
                <span>{t("suiteFullTitle")}</span>
              </Button>
              <Button
                type="button"
                size="xs"
                variant={state.suiteMode === "basic" ? "secondary" : "ghost"}
                onClick={() => state.setSuiteMode("basic")}
                className="h-7 gap-1.5 rounded-md px-2.5 text-xs font-medium"
              >
                <Type className="size-3.5" />
                <span>{t("suiteBasicTitle")}</span>
              </Button>
              <Button
                type="button"
                size="xs"
                variant={state.suiteMode === "comment" ? "secondary" : "ghost"}
                onClick={() => state.setSuiteMode("comment")}
                className="h-7 gap-1.5 rounded-md px-2.5 text-xs font-medium"
              >
                <MessageSquare className="size-3.5" />
                <span>{t("suiteCommentTitle")}</span>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {state.suiteMode === "full" ? (
                <>
                  <div className="border-border bg-muted/40 flex items-center rounded-lg border p-0.5">
                    <Button
                      type="button"
                      size="xs"
                      variant={state.previewMode === "edit" ? "secondary" : "ghost"}
                      onClick={() => state.setPreviewMode("edit")}
                      className="h-7 gap-1.5 rounded-md px-2 text-xs"
                    >
                      <Pencil className="size-3.5" />
                      <span>{t("editMode")}</span>
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant={state.previewMode === "read" ? "secondary" : "ghost"}
                      onClick={() => state.setPreviewMode("read")}
                      className="h-7 gap-1.5 rounded-md px-2 text-xs"
                    >
                      <Eye className="size-3.5" />
                      <span>{t("previewMode")}</span>
                    </Button>
                  </div>

                  {state.previewMode === "edit" ? (
                    <Button
                      type="button"
                      size="xs"
                      variant={state.showToolbar ? "secondary" : "outline"}
                      onClick={() => state.setShowToolbar(!state.showToolbar)}
                      className="h-7 gap-1.5 rounded-lg px-2 text-xs"
                    >
                      <PanelTop className="size-3.5" />
                      <span className="hidden sm:inline">
                        {state.showToolbar ? t("hideToolbarLabel") : t("showToolbarLabel")}
                      </span>
                    </Button>
                  ) : null}

                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => state.setDarkCanvas(!state.darkCanvas)}
                    aria-label={state.darkCanvas ? t("lightCanvas") : t("darkCanvas")}
                    className="h-7 gap-1.5 rounded-lg px-2 text-xs"
                  >
                    {state.darkCanvas ? (
                      <Sun className="size-3.5" />
                    ) : (
                      <Moon className="size-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {state.darkCanvas ? t("lightCanvas") : t("darkCanvas")}
                    </span>
                  </Button>
                </>
              ) : null}

              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => state.setJsonOpen(true)}
                className="h-7 gap-1.5 rounded-lg px-2 text-xs"
              >
                <Braces className="size-3.5" />
                <span>{t("viewJson")}</span>
              </Button>

              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={state.handleResetSample}
                aria-label={t("resetSample")}
                title={t("resetSample")}
                className="h-7 gap-1.5 rounded-lg px-2 text-xs"
              >
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">{t("resetSample")}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Vùng Canvas trình diễn bộ Editor đang chọn */}
      <main className="flex-1 px-2.5 py-5 sm:px-6 sm:py-8">
        {state.suiteMode === "full" ? (
          <div className="space-y-3">
            <p className="text-muted-foreground mx-auto max-w-4xl px-1 text-xs">
              {t("suiteFullDesc")}
            </p>
            <NotionDemoEditor
              docSnapshot={state.docSnapshot}
              onDocChange={state.setDocSnapshot}
              title={state.title}
              onTitleChange={state.setTitle}
              icon={state.icon}
              onIconChange={state.setIcon}
              cover={state.cover}
              hasCover={state.hasCover}
              onCycleCover={state.handleCycleCover}
              onRemoveCover={state.handleRemoveCover}
              previewMode={state.previewMode}
              showToolbar={state.showToolbar}
              darkCanvas={state.darkCanvas}
              insertItems={state.insertItems}
            />
          </div>
        ) : state.suiteMode === "basic" ? (
          <Card className="mx-auto max-w-3xl gap-4 rounded-2xl p-5 shadow-sm sm:p-6">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">{t("suiteBasicTitle")}</h2>
              <p className="text-muted-foreground text-xs">{t("suiteBasicDesc")}</p>
            </div>
            <TiptapBasicEditor
              value={state.basicDoc}
              onChange={state.setBasicDoc}
              label={t("suiteBasicTitle")}
              maxLength={300}
            />
            <div className="border-border/70 bg-muted/20 space-y-1.5 rounded-xl border p-4">
              <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                {t("previewMode")}
              </p>
              <TiptapContent content={state.basicDoc} className="text-sm [&_p]:my-1" />
            </div>
          </Card>
        ) : (
          <Card className="mx-auto max-w-3xl gap-4 rounded-2xl p-5 shadow-sm sm:p-6">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">{t("suiteCommentTitle")}</h2>
              <p className="text-muted-foreground text-xs">{t("suiteCommentDesc")}</p>
            </div>
            <TiptapCommentEditor
              label={t("suiteCommentTitle")}
              replyingTo={state.replyingTo}
              onCancel={state.replyingTo ? state.clearReply : state.restoreReplySample}
              onSubmit={state.handlePostComment}
              maxLength={500}
            />
            {state.comments.length > 0 ? (
              <div className="space-y-2.5 pt-2">
                {state.comments.map((cmt) => (
                  <div
                    key={cmt.id}
                    className="border-border/70 bg-muted/20 rounded-xl border px-4 py-2.5"
                  >
                    <TiptapContent
                      content={cmt.doc}
                      extensions={PAGE_EXTENSIONS}
                      className="text-sm [&_p]:my-1"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        )}
      </main>

      {/* Dialog xem JSON Tiptap */}
      <Dialog open={state.jsonOpen} onOpenChange={state.setJsonOpen}>
        <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl p-0">
          <DialogHeader className="shrink-0 border-b px-5 py-4">
            <DialogTitle>{t("jsonTitle")}</DialogTitle>
            <DialogDescription>{t("jsonDescription")}</DialogDescription>
          </DialogHeader>
          <pre className="bg-muted/40 max-h-[55vh] flex-1 overflow-auto p-5 font-mono text-xs leading-relaxed">
            {JSON.stringify(state.activeJsonSnapshot, null, 2)}
          </pre>
          <DialogFooter className="mx-0 mb-0 shrink-0 border-t px-5 py-3">
            <Button type="button" variant="outline" onClick={() => void state.handleCopyJson()}>
              <Copy className="mr-1.5 size-3.5" />
              {t("copyJson")}
            </Button>
            <Button type="button" onClick={() => state.setJsonOpen(false)}>
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
