"use client";

import {
  ArrowUpRight,
  Briefcase,
  FolderGit2,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "cn";

import { Link } from "@/i18n/navigation";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { toSafeHttpUrl, toSafeImageSrc } from "@/shares/lib/safe-url";

import { useResolvedPageTheme } from "../../hooks/use-resolved-page-theme";
import type { BioSkill, PublicPage } from "../../types/page.types";
import { BioLinkIcon, getLinkPlatformIcon } from "./bio-link-icon";

/**
 * Hiển thị trang Hồ sơ năng lực (Bio & Portfolio) theo phong cách Bento Grid hiện đại,
 * tối ưu trải nghiệm trực quan, nhận diện mạng xã hội thông minh và hiệu ứng tương tác cao cấp.
 *
 * @param props - Dữ liệu trang công khai.
 * @returns Giao diện Bio & Portfolio.
 */
export function BioPageRenderer({ page }: { page: PublicPage }) {
  const t = useTranslations("utilities.customPages.bio");
  const config = page.contentConfig as unknown as Record<string, unknown> | undefined;
  const rawProfile = (config?.profile as Record<string, unknown>) ?? {};
  const profile = {
    displayName: String(rawProfile.displayName || rawProfile.display_name || ""),
    headline: String(rawProfile.headline || ""),
    bioText: String(rawProfile.bioText || rawProfile.bio_text || ""),
    avatarUrl: rawProfile.avatarUrl
      ? String(rawProfile.avatarUrl)
      : rawProfile.avatar_url
        ? String(rawProfile.avatar_url)
        : undefined,
    location: rawProfile.location ? String(rawProfile.location) : undefined,
    email: rawProfile.email ? String(rawProfile.email) : undefined,
    website: rawProfile.website ? String(rawProfile.website) : undefined,
  };
  const rawLinks = (config?.links ?? []) as Array<Record<string, unknown>>;
  const links = rawLinks
    .filter((l) => l.isVisible !== false && l.is_visible !== false)
    .map((l) => ({
      id: String(l.id ?? ""),
      url: String(l.url ?? ""),
      title: String(l.title ?? ""),
      description: l.description ? String(l.description) : undefined,
      iconUrl: l.iconUrl ? String(l.iconUrl) : l.icon_url ? String(l.icon_url) : undefined,
      highlight: Boolean(l.highlight),
      isVisible: true,
    }));
  const rawExperiences = (config?.experiences ?? []) as Array<Record<string, unknown>>;
  const experiences = rawExperiences.map((exp) => ({
    id: String(exp.id ?? ""),
    company: String(exp.company ?? ""),
    role: String(exp.role ?? ""),
    period: String(exp.period ?? ""),
    description: exp.description ? String(exp.description) : undefined,
  }));
  const skills = (config?.skills ?? []) as BioSkill[];
  const rawProjects = (config?.projects ?? []) as Array<Record<string, unknown>>;
  const projects = rawProjects.map((proj) => ({
    id: String(proj.id ?? ""),
    title: String(proj.title ?? ""),
    description: proj.description ? String(proj.description) : undefined,
    url: proj.url ? String(proj.url) : undefined,
    tags: (proj.tags as string[]) ?? [],
  }));
  const { pageThemeScope, buttonStyle, customStyle } = useResolvedPageTheme(page);
  const buttonRadiusClass =
    buttonStyle === "square"
      ? "rounded-none"
      : buttonStyle === "pill"
        ? "rounded-full"
        : "rounded-2xl";

  const displayName = profile.displayName || page.title;

  const safeWebsite = toSafeHttpUrl(profile.website, { allowRelative: false });
  const coverUrl = toSafeImageSrc(
    page.coverUrl ||
      (config?.coverUrl as string) ||
      (config?.cover_url as string) ||
      (rawProfile.coverUrl as string) ||
      (rawProfile.cover_url as string),
  );
  const avatarUrl = toSafeImageSrc(
    page.avatarUrl ||
      profile.avatarUrl ||
      (config?.avatarUrl as string) ||
      (config?.avatar_url as string),
  );

  return (
    <main
      style={customStyle}
      data-page-theme={pageThemeScope}
      className="bg-background text-foreground min-h-svh pb-20 transition-colors duration-200"
    >
      {/* 1. Ảnh bìa (Cover Banner) */}
      {coverUrl ? (
        <div className="relative h-36 w-full overflow-hidden sm:h-56">
          <Image
            src={coverUrl}
            alt={page.title}
            fill
            sizes="100vw"
            priority
            unoptimized
            className="object-cover"
          />
          <div className="from-background/60 absolute inset-0 bg-gradient-to-t to-transparent" />
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-xl px-3.5 pt-5 sm:px-4 sm:pt-6">
        {/* 2. Profile Bento Header */}
        <header className="mb-7 flex flex-col items-center text-center sm:mb-8">
          {avatarUrl ? (
            <div
              className={cn(
                "ring-primary/20 bg-card relative z-10 mb-4 size-24 shrink-0 overflow-hidden rounded-full shadow-2xl ring-4 sm:size-28",
                coverUrl && "-mt-16 sm:-mt-20",
              )}
            >
              <Image
                src={avatarUrl}
                alt={page.title}
                fill
                sizes="112px"
                unoptimized
                className="object-cover"
              />
              <span className="bg-primary text-primary-foreground ring-background absolute right-1.5 bottom-1.5 flex size-5 items-center justify-center rounded-full shadow-sm ring-2">
                <Sparkles className="size-3" />
              </span>
            </div>
          ) : coverUrl ? null : (
            <div
              className={cn(
                "bg-primary text-primary-foreground ring-primary/20 relative z-10 mb-4 flex size-24 items-center justify-center rounded-full text-2xl font-black shadow-xl ring-4",
              )}
            >
              {(displayName || page.title).slice(0, 2).toUpperCase()}
            </div>
          )}

          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{displayName}</h1>

          {profile.headline ? (
            <div className="bg-primary/10 text-primary border-primary/20 mt-2 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold shadow-2xs">
              <span>{profile.headline}</span>
            </div>
          ) : null}

          <p className="text-muted-foreground mt-2.5 max-w-md text-xs leading-relaxed sm:text-sm">
            {profile.bioText || page.description}
          </p>

          {/* Meta: Địa điểm, Email, Website */}
          {(profile.location || profile.email || profile.website) && (
            <div className="text-muted-foreground mt-3.5 flex max-w-full flex-wrap items-center justify-center gap-2 text-xs">
              {profile.location ? (
                <span className="bg-muted/60 text-muted-foreground border-border/50 flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs">
                  <MapPin className="text-primary size-3.5 shrink-0" />
                  <span className="truncate">{profile.location}</span>
                </span>
              ) : null}
              {profile.email ? (
                <span className="bg-muted/60 text-muted-foreground border-border/50 flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs">
                  <Mail className="text-primary size-3.5 shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </span>
              ) : null}
              {safeWebsite ? (
                <Button
                  asChild
                  variant="ghost"
                  className="bg-muted/60 text-muted-foreground border-border/50 hover:text-primary h-auto max-w-full min-w-0 rounded-full border px-3 py-1 text-xs whitespace-normal transition-colors"
                >
                  <Link href={safeWebsite as never} target="_blank" rel="noopener noreferrer">
                    <Globe className="text-primary mr-1.5 size-3.5 shrink-0" />
                    <span className="truncate">{safeWebsite.replace(/^https?:\/\//, "")}</span>
                  </Link>
                </Button>
              ) : null}
            </div>
          )}
        </header>

        {/* 3. Danh sách liên kết Bento Hub */}
        {links.length > 0 ? (
          <section className="mb-10 flex flex-col gap-3">
            {links.map((link) => {
              const safeLinkUrl = toSafeHttpUrl(link.url, { allowRelative: false });
              if (!safeLinkUrl) return null;
              const platform = getLinkPlatformIcon(safeLinkUrl, link.title);

              return (
                <Button
                  key={link.id}
                  asChild
                  variant="outline"
                  className={cn(
                    "border-border/80 bg-card group hover:border-primary/50 relative h-auto w-full items-center justify-between p-3 text-left font-normal whitespace-normal shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-3.5",
                    buttonRadiusClass,
                    link.highlight &&
                      "ring-primary/40 border-primary/40 from-primary/5 via-card to-card bg-gradient-to-r shadow-sm ring-2",
                  )}
                >
                  <Link href={safeLinkUrl as never} target="_blank" rel="noopener noreferrer">
                    <div className="flex min-w-0 flex-1 items-center gap-3 pr-2 sm:gap-3.5">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl p-2 transition-colors duration-200 group-hover:scale-105 sm:size-11 sm:p-2.5",
                          platform.bg,
                        )}
                      >
                        <BioLinkIcon
                          url={link.url}
                          title={link.title}
                          iconUrl={link.iconUrl}
                          size={24}
                          className="size-6 object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-foreground group-hover:text-primary line-clamp-2 text-sm leading-snug font-semibold transition-colors">
                          {link.title}
                        </div>
                        {link.description ? (
                          <div className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">
                            {link.description}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="bg-muted/50 group-hover:bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors">
                      <ArrowUpRight className="text-muted-foreground group-hover:text-primary size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </Link>
                </Button>
              );
            })}
          </section>
        ) : null}

        {/* 4. Kinh nghiệm làm việc (Timeline style) */}
        {experiences.length > 0 ? (
          <section className="mb-10 space-y-4">
            <div className="border-border/80 flex items-center gap-2 border-b pb-2.5">
              <div className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-lg">
                <Briefcase className="size-3.5" />
              </div>
              <h2 className="text-foreground text-xs font-bold tracking-wider uppercase">
                {t("experiences")}
              </h2>
            </div>
            <div className="space-y-3.5">
              {experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="border-border/80 bg-card hover:border-primary/40 rounded-2xl border p-4 shadow-2xs transition-all hover:shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-foreground text-sm font-bold">{exp.role}</span>
                    {exp.period ? (
                      <Badge
                        variant="secondary"
                        className="rounded-lg px-2 py-0.5 text-[11px] font-semibold"
                      >
                        {exp.period}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-primary mt-1 text-xs font-semibold">{exp.company}</div>
                  {exp.description ? (
                    <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                      {exp.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* 5. Kỹ năng chuyên môn (Skill Cloud) */}
        {skills.length > 0 ? (
          <section className="mb-10 space-y-4">
            <div className="border-border/80 flex items-center gap-2 border-b pb-2.5">
              <div className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-lg">
                <GraduationCap className="size-3.5" />
              </div>
              <h2 className="text-foreground text-xs font-bold tracking-wider uppercase">
                {t("skills")}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="border-border/80 bg-card hover:border-primary/40 flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-medium shadow-2xs transition-all hover:shadow-xs"
                >
                  <span className="bg-primary size-1.5 rounded-full" />
                  <span className="text-foreground font-semibold">{skill.name}</span>
                  {skill.level ? (
                    <span className="text-muted-foreground text-[10px]">· {skill.level}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* 6. Dự án tiêu biểu (Bento Cards) */}
        {projects.length > 0 ? (
          <section className="space-y-4">
            <div className="border-border/80 flex items-center gap-2 border-b pb-2.5">
              <div className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-lg">
                <FolderGit2 className="size-3.5" />
              </div>
              <h2 className="text-foreground text-xs font-bold tracking-wider uppercase">
                {t("projects")}
              </h2>
            </div>
            <div className="space-y-3.5">
              {projects.map((proj) => {
                const safeProjUrl = toSafeHttpUrl(proj.url, { allowRelative: false });
                return (
                  <div
                    key={proj.id}
                    className="border-border/80 bg-card group hover:border-primary/40 rounded-2xl border p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-foreground group-hover:text-primary text-sm font-bold transition-colors">
                        {proj.title}
                      </h3>
                      {safeProjUrl ? (
                        <Button
                          asChild
                          variant="ghost"
                          size="icon-xs"
                          className="text-primary bg-primary/5 hover:bg-primary/15 size-7 rounded-full"
                        >
                          <Link
                            href={safeProjUrl as never}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ArrowUpRight className="size-4" />
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                    {proj.description ? (
                      <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                        {proj.description}
                      </p>
                    ) : null}
                    {proj.tags && proj.tags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {proj.tags.map((tg) => (
                          <span
                            key={tg}
                            className="bg-muted/70 text-muted-foreground border-border/50 rounded-md border px-2 py-0.5 text-[10px] font-medium"
                          >
                            {tg}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
