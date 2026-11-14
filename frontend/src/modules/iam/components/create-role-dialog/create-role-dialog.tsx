"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shares/components/ui/dialog";

import { RoleForm } from "../role-form/role-form";
import { useCreateRoleDialog } from "./hooks/use-create-role-dialog";

/**
 * Nút + dialog tạo vai trò.
 *
 * @returns Dialog tạo vai trò.
 */
export function CreateRoleDialog() {
  const t = useTranslations("iam.roles");
  const { open, setOpen, onDone } = useCreateRoleDialog();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          {t("create")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("create")}</DialogTitle>
          <DialogDescription>{t("createDescription")}</DialogDescription>
        </DialogHeader>
        <RoleForm onDone={onDone} />
      </DialogContent>
    </Dialog>
  );
}
