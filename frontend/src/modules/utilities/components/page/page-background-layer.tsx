"use client";

import { cn } from "cn";
import Image from "next/image";
import type { CSSProperties } from "react";

import { toSafeImageSrc } from "@/shares/lib/safe-url";

import { buildPatternStyle } from "../../lib/page-patterns";
import type { ResolvedAppearance } from "../../lib/page-theme";

/**
 * Lớp nền toàn trang cho Custom Page (`solid`, `gradient`, `image`, `pattern`) kèm hiệu ứng mờ/phủ
 * và chuyển động ambient nhẹ (luôn tôn trọng `prefers-reduced-motion`).
 *
 * @param props - Thông số `appearance`, URL ảnh nền công khai và alt ảnh.
 * @returns Lớp nền trang `pointer-events-none`.
 */
export function PageBackgroundLayer({
  appearance,
  backgroundImageUrl,
  alt,
}: {
  appearance: ResolvedAppearance;
  backgroundImageUrl?: string | null;
  alt: string;
}) {
  const safeBgUrl = toSafeImageSrc(backgroundImageUrl);
  const {
    backgroundType,
    gradientType,
    gradientAngle,
    gradientColors,
    patternKey,
    backgroundFit,
    backgroundBlur,
    overlayColor,
    overlayOpacity,
    ambientMotion,
  } = appearance;

  const gradientStyle: CSSProperties | undefined =
    backgroundType === "gradient"
      ? {
          backgroundImage:
            gradientType === "radial"
              ? `radial-gradient(circle at 30% 20%, ${gradientColors.join(", ")})`
              : `linear-gradient(${gradientAngle}deg, ${gradientColors.join(", ")})`,
        }
      : undefined;

  const patternStyle = backgroundType === "pattern" ? buildPatternStyle(patternKey) : undefined;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {backgroundType === "gradient" ? (
        <div
          style={gradientStyle}
          className={cn(
            "absolute inset-0",
            ambientMotion === "gradient_flow" && "page-ambient-gradient_flow",
          )}
        />
      ) : null}

      {backgroundType === "pattern" ? (
        <div style={patternStyle} className="absolute inset-0" />
      ) : null}

      {backgroundType === "image" && safeBgUrl ? (
        <>
          {backgroundFit === "tile" ? (
            <div
              className="absolute inset-0 bg-repeat"
              style={{
                backgroundImage: `url("${safeBgUrl}")`,
                backgroundSize: "320px auto",
                filter: backgroundBlur > 0 ? `blur(${backgroundBlur}px)` : undefined,
                transform: backgroundBlur > 0 ? "scale(1.06)" : undefined,
              }}
            />
          ) : (
            <Image
              src={safeBgUrl}
              alt={alt}
              fill
              sizes="100vw"
              unoptimized
              className={cn(
                backgroundFit === "contain" ? "object-contain" : "object-cover",
                "transition-all duration-300",
              )}
              style={{
                filter: backgroundBlur > 0 ? `blur(${backgroundBlur}px)` : undefined,
                transform: backgroundBlur > 0 ? "scale(1.06)" : undefined,
              }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: overlayColor,
              opacity: overlayOpacity / 100,
            }}
          />
        </>
      ) : null}

      {ambientMotion === "floating_orbs" ? (
        <>
          <div
            className="page-ambient-orb absolute -top-24 -left-24 size-80 rounded-full opacity-25 blur-3xl"
            style={{ backgroundColor: "var(--primary)" }}
          />
          <div
            className="page-ambient-orb absolute -right-24 bottom-10 size-72 rounded-full opacity-20 blur-3xl"
            style={{
              backgroundColor: "var(--ring)",
              animationDelay: "-6s",
            }}
          />
        </>
      ) : null}
    </div>
  );
}
