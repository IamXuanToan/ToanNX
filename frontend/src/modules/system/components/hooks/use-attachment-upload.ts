"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { useUploadAttachment } from "../../hooks/use-upload-attachment";
import type { Attachment } from "../../types/attachment.types";
import { UNFILED_FOLDER } from "../../constants/media-types";
import { useAttachmentFolders } from "../../hooks/use-attachment-folders";

type UploadJob = {
  id: string;
  name: string;
  status: "waiting" | "uploading" | "uploaded" | "failed";
  error?: string;
};

/** @param props - Chế độ upload và callback của nơi dùng. @returns Hàng đợi tuần tự, trạng thái từng tệp và input. */
export function useAttachmentUpload({
  imageOnly,
  multiple,
  onUploaded,
  onBusyChange,
  canReadFolders = false,
}: {
  imageOnly: boolean;
  multiple: boolean;
  onUploaded?: (file: Attachment) => void;
  onBusyChange?: (busy: boolean) => void;
  canReadFolders?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const busyRef = useRef(false);
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [busy, setBusy] = useState(false);
  const [folderId, setFolderId] = useState(UNFILED_FOLDER);
  const folderQuery = useAttachmentFolders(canReadFolders, ["MINE"]);
  if (
    folderId !== UNFILED_FOLDER &&
    folderQuery.data &&
    !folderQuery.data.some((folder) => folder.id === folderId)
  ) {
    setFolderId(UNFILED_FOLDER);
  }
  const mutation = useUploadAttachment();
  const errorMessage = useApiErrorMessage();
  const t = useTranslations("system.attachment");

  const registerInput = (node: HTMLInputElement | null) => {
    inputRef.current = node;
  };

  const openFileChooser = () => {
    inputRef.current?.click();
  };

  const upload = async (files: File[]) => {
    if (busyRef.current || !files.length) return;
    const picked = multiple ? files : files.slice(0, 1);
    const nextJobs: UploadJob[] = picked.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      status: "waiting",
    }));
    setJobs(nextJobs);
    busyRef.current = true;
    setBusy(true);
    onBusyChange?.(true);
    try {
      for (const [index, file] of picked.entries()) {
        const id = nextJobs[index].id;
        setJobs((current) =>
          current.map((job) => (job.id === id ? { ...job, status: "uploading" } : job)),
        );
        try {
          const uploaded = await mutation.mutateAsync({
            file,
            folderId: folderId === UNFILED_FOLDER ? null : folderId,
          });
          if (imageOnly && !uploaded.contentType.startsWith("image/")) {
            setJobs((current) =>
              current.map((job) =>
                job.id === id ? { ...job, status: "failed", error: t("imageOnly") } : job,
              ),
            );
            continue;
          }
          setJobs((current) =>
            current.map((job) => (job.id === id ? { ...job, status: "uploaded" } : job)),
          );
          onUploaded?.(uploaded);
        } catch (error) {
          setJobs((current) =>
            current.map((job) =>
              job.id === id ? { ...job, status: "failed", error: errorMessage(error) } : job,
            ),
          );
        }
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  };

  return {
    registerInput,
    openFileChooser,
    busy,
    jobs,
    upload,
    folderId,
    setFolderId,
    folderQuery,
  };
}
