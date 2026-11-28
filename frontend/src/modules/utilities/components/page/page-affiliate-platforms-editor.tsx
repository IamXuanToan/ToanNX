"use client";

import { Check, FlaskConical, Pencil, Plus, Store, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { SortableList } from "@/shares/components/common/sortable-list";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Checkbox } from "@/shares/components/ui/checkbox";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";
import { sanitizeCodeInput } from "@/shares/lib/code-slug-input";

import {
  getAffiliatePlatformName,
  isValidPlatformRegex,
  matchAffiliatePlatformByUrl,
} from "../../constants/affiliate-platforms";
import type { AffiliatePlatformConfig } from "../../types/page.types";

/**
 * Trình quản lý danh sách Nơi bán (Platform + Shortcode + Regex URL) riêng cho từng trang Affiliate.
 */
export function PageAffiliatePlatformsEditor({
  platforms,
  onAddPlatform,
  onUpdatePlatform,
  onRemovePlatform,
  onReorderPlatforms,
  disabled = false,
}: {
  platforms: AffiliatePlatformConfig[];
  onAddPlatform: (input: { name: string; code: string; urlPattern: string }) => void;
  onUpdatePlatform: (
    id: string,
    patch: Partial<Pick<AffiliatePlatformConfig, "name" | "code" | "urlPattern" | "isVisible">>,
  ) => void;
  onRemovePlatform: (id: string) => void;
  onReorderPlatforms: (platforms: AffiliatePlatformConfig[]) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("utilities.customPages.pages.platformsEditor");
  const tTable = useTranslations("common.table");
  const tQuick = useTranslations("utilities.customPages.quickAdd");
  const tCommon = useTranslations("common.actions");

  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [newPattern, setNewPattern] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editPattern, setEditPattern] = useState("");
  const [testUrl, setTestUrl] = useState("");

  const handleNameChange = (val: string) => {
    setNewName(val);
    if (!codeTouched) {
      setNewCode(sanitizeCodeInput(val.toLowerCase().replace(/\s+/g, "_")));
    }
  };

  const handleAdd = () => {
    const cleanName = newName.trim();
    const cleanCode = sanitizeCodeInput(
      newCode.trim() || cleanName.toLowerCase().replace(/\s+/g, "_"),
    );
    const cleanPattern = newPattern.trim();
    if (!cleanName || !cleanCode) {
      toast.error(t("requiredError"));
      return;
    }
    if (cleanCode === "custom" || platforms.some((p) => p.code === cleanCode)) {
      toast.error(t("duplicateCodeError"));
      return;
    }
    if (!isValidPlatformRegex(cleanPattern)) {
      toast.error(t("invalidRegexError"));
      return;
    }
    onAddPlatform({ name: cleanName, code: cleanCode, urlPattern: cleanPattern });
    setNewName("");
    setNewCode("");
    setCodeTouched(false);
    setNewPattern("");
  };

  const startEdit = (plat: AffiliatePlatformConfig) => {
    setEditingId(plat.id);
    setEditName(plat.name);
    setEditCode(plat.code);
    setEditPattern(plat.urlPattern);
  };

  const saveEdit = (id: string) => {
    const cleanName = editName.trim();
    const cleanCode = sanitizeCodeInput(editCode.trim());
    const cleanPattern = editPattern.trim();
    if (!cleanName || !cleanCode) {
      toast.error(t("requiredError"));
      return;
    }
    if (cleanCode === "custom" || platforms.some((p) => p.id !== id && p.code === cleanCode)) {
      toast.error(t("duplicateCodeError"));
      return;
    }
    if (!isValidPlatformRegex(cleanPattern)) {
      toast.error(t("invalidRegexError"));
      return;
    }
    onUpdatePlatform(id, { name: cleanName, code: cleanCode, urlPattern: cleanPattern });
    setEditingId(null);
  };

  const matchedTestCode = testUrl.trim() ? matchAffiliatePlatformByUrl(testUrl, platforms) : "";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{t("title")}</h3>
        <p className="text-muted-foreground text-xs">{t("description")}</p>
      </div>

      {/* Form thêm nơi bán mới cho riêng trang này */}
      <div className="border-border bg-muted/20 grid gap-2.5 rounded-xl border p-3 sm:grid-cols-12">
        <div className="space-y-1 sm:col-span-4">
          <Label className="text-[11px] font-medium">{t("nameLabel")}</Label>
          <Input
            placeholder={t("namePlaceholder")}
            value={newName}
            onChange={(e) => handleNameChange(e.target.value)}
            disabled={disabled}
            className="h-9 text-xs"
          />
        </div>
        <div className="space-y-1 sm:col-span-3">
          <Label className="text-[11px] font-medium">{t("codeLabel")}</Label>
          <Input
            placeholder={t("codePlaceholder")}
            value={newCode}
            onChange={(e) => {
              setCodeTouched(true);
              setNewCode(sanitizeCodeInput(e.target.value.toLowerCase()));
            }}
            disabled={disabled}
            className="h-9 font-mono text-xs"
          />
        </div>
        <div className="space-y-1 sm:col-span-4">
          <Label className="text-[11px] font-medium">{t("regexLabel")}</Label>
          <Input
            placeholder={t("regexPlaceholder")}
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            disabled={disabled}
            className="h-9 font-mono text-xs"
          />
        </div>
        <div className="flex items-end sm:col-span-1">
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={disabled || !newName.trim()}
            className="h-9 w-full gap-1 text-xs"
          >
            <Plus className="size-3.5" />
            <span className="sm:hidden">{t("add")}</span>
          </Button>
        </div>
      </div>

      {/* Danh sách nơi bán riêng của trang */}
      {platforms.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-xl border border-dashed py-6 text-center text-xs">
          {t("empty")}
        </div>
      ) : (
        <SortableList
          items={platforms}
          onReorder={onReorderPlatforms}
          disabled={disabled}
          className="space-y-2"
          renderItem={(plat) => {
            const isEditing = editingId === plat.id;
            return (
              <div className="border-border bg-card flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5">
                {isEditing ? (
                  <div className="grid flex-1 gap-2 sm:grid-cols-3">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder={t("nameLabel")}
                      className="h-8 text-xs"
                    />
                    <Input
                      value={editCode}
                      onChange={(e) => setEditCode(sanitizeCodeInput(e.target.value.toLowerCase()))}
                      placeholder={t("codeLabel")}
                      className="h-8 font-mono text-xs"
                    />
                    <Input
                      value={editPattern}
                      onChange={(e) => setEditPattern(e.target.value)}
                      placeholder={t("regexLabel")}
                      className="h-8 font-mono text-xs"
                    />
                  </div>
                ) : (
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <Checkbox
                      checked={plat.isVisible !== false}
                      onCheckedChange={(checked) =>
                        onUpdatePlatform(plat.id, { isVisible: Boolean(checked) })
                      }
                      disabled={disabled}
                    />
                    <Store className="text-muted-foreground size-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-foreground text-xs font-semibold">{plat.name}</span>
                        <Badge variant="secondary" className="h-4.5 px-1.5 font-mono text-[10px]">
                          {plat.code}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground truncate font-mono text-[11px]">
                        {plat.urlPattern || t("noRegex")}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex shrink-0 items-center gap-1">
                  {isEditing ? (
                    <>
                      <AppTooltip content={tCommon("save")}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={tCommon("save")}
                          onClick={() => saveEdit(plat.id)}
                          className="h-7 w-7 text-emerald-600"
                        >
                          <Check className="size-3.5" />
                        </Button>
                      </AppTooltip>
                      <AppTooltip content={tCommon("cancel")}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={tCommon("cancel")}
                          onClick={() => setEditingId(null)}
                          className="h-7 w-7"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </AppTooltip>
                    </>
                  ) : (
                    <>
                      <AppTooltip content={tCommon("edit")}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={tCommon("edit")}
                          onClick={() => startEdit(plat)}
                          disabled={disabled}
                          className="h-7 w-7"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </AppTooltip>
                      <AppTooltip content={tTable("delete")}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={tTable("delete")}
                          onClick={() => onRemovePlatform(plat.id)}
                          disabled={disabled}
                          className="text-destructive hover:bg-destructive/10 h-7 w-7"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </AppTooltip>
                    </>
                  )}
                </div>
              </div>
            );
          }}
        />
      )}

      {/* Kiểm thử nhanh URL khớp Regex */}
      <div className="border-border bg-muted/20 space-y-2 rounded-xl border p-3">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <FlaskConical className="text-primary size-3.5" />
          <span>{t("testUrlLabel")}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder={t("testUrlPlaceholder")}
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="h-8 flex-1 text-xs"
          />
          {matchedTestCode ? (
            <Badge
              variant={matchedTestCode === "custom" ? "outline" : "default"}
              className="text-xs"
            >
              {getAffiliatePlatformName(matchedTestCode, platforms, tQuick("platformCustom"))} (
              {matchedTestCode})
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  );
}
