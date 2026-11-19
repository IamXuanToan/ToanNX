"use client";

import { useEffect, useState } from "react";

import { isApiError } from "@/shares/lib/api/api-error";

import { shortLinkService } from "../../../services/short-link.service";
import type { PublicShortLink } from "../../../types/short-link.types";

/** Quản lý mở khóa và đếm ngược trên trang trung gian. */
export function useShortLinkLanding(slug: string, link: PublicShortLink, preview: boolean) {
  const [password, setPassword] = useState("");
  const [destination, setDestination] = useState<string | null>(
    link.hasPassword ? null : link.destinationUrl,
  );
  const [remaining, setRemaining] = useState(link.autoRedirectSeconds);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    if (!destination || preview || remaining === null || remaining <= 0) return;
    const timer = window.setTimeout(
      () => setRemaining((value) => (value === null ? null : value - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [destination, preview, remaining]);

  useEffect(() => {
    if (destination && !preview && remaining === 0) window.location.assign(destination);
  }, [destination, preview, remaining]);

  async function unlock() {
    setIsUnlocking(true);
    setErrorCode(null);
    try {
      const url = preview ? link.destinationUrl : await shortLinkService.unlock(slug, password);
      setDestination(url);
      setRemaining(link.autoRedirectSeconds);
      setPassword("");
    } catch (error) {
      setErrorCode(isApiError(error) ? error.code : "UNKNOWN");
    } finally {
      setIsUnlocking(false);
    }
  }

  function proceed() {
    if (destination && !preview) window.location.assign(destination);
  }

  return {
    password,
    setPassword,
    destination,
    totalSeconds: link.autoRedirectSeconds,
    remaining,
    isUnlocking,
    errorCode,
    unlock,
    proceed,
  };
}
