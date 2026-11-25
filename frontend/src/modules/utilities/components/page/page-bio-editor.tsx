"use client";

import {
  Briefcase,
  ExternalLink,
  Eye,
  EyeOff,
  FolderGit2,
  Globe,
  GraduationCap,
  Link2,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Link } from "@/i18n/navigation";
import { SortableList } from "@/shares/components/common/sortable-list";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shares/components/ui/card";
import { Checkbox } from "@/shares/components/ui/checkbox";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";
import { Textarea } from "@/shares/components/ui/textarea";
import { toSafeHttpUrl } from "@/shares/lib/safe-url";

import type { BioContentConfig, BioExperience, BioProject, BioSkill } from "../../types/page.types";
import { BioLinkIcon } from "./bio-link-icon";

/**
 * Trình biên tập nội dung trang Hồ sơ năng lực (Bio & Portfolio):
 * Hỗ trợ quản lý thông tin cá nhân, mạng xã hội, mốc kinh nghiệm, kỹ năng và dự án nổi bật.
 *
 * @param props - Cấu hình Bio hiện tại, hàm cập nhật và cờ vô hiệu hóa.
 * @returns Giao diện chỉnh sửa Bio đã được nội địa hóa đa ngôn ngữ (i18n).
 */
export function PageBioEditor({
  config,
  onChange,
  disabled = false,
}: {
  config: BioContentConfig;
  onChange: (updated: BioContentConfig) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("utilities.customPages.pages.bioEditor");

  const profile = config.profile ?? { displayName: "", headline: "", bioText: "" };
  const experiences = config.experiences ?? [];
  const skills = config.skills ?? [];
  const projects = config.projects ?? [];

  // State thêm mốc kinh nghiệm mới
  const [newExp, setNewExp] = useState<Omit<BioExperience, "id">>({
    company: "",
    role: "",
    period: "",
    description: "",
  });
  const [showAddExp, setShowAddExp] = useState(false);

  // State sửa mốc kinh nghiệm
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [editingExp, setEditingExp] = useState<BioExperience | null>(null);

  // State thêm kỹ năng mới
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("");

  // State sửa kỹ năng
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<BioSkill | null>(null);

  // State thêm dự án mới
  const [newProject, setNewProject] = useState<Omit<BioProject, "id">>({
    title: "",
    description: "",
    url: "",
    tags: [],
  });
  const [newProjectTag, setNewProjectTag] = useState("");
  const [showAddProject, setShowAddProject] = useState(false);

  // State sửa dự án
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<BioProject | null>(null);
  const [editingProjectTag, setEditingProjectTag] = useState("");

  const updateProfile = (field: keyof typeof profile, value: string) => {
    onChange({
      ...config,
      profile: {
        ...profile,
        [field]: value,
      },
    });
  };

  const handleAddExperience = () => {
    if (!newExp.company.trim() || !newExp.role.trim()) return;
    const item: BioExperience = {
      ...newExp,
      id: "exp-" + Date.now(),
    };
    onChange({
      ...config,
      experiences: [item, ...experiences],
    });
    setNewExp({ company: "", role: "", period: "", description: "" });
    setShowAddExp(false);
  };

  const handleRemoveExperience = (id: string) => {
    onChange({
      ...config,
      experiences: experiences.filter((e) => e.id !== id),
    });
    if (editingExpId === id) {
      setEditingExpId(null);
      setEditingExp(null);
    }
  };

  const startEditExperience = (exp: BioExperience) => {
    setEditingExpId(exp.id);
    setEditingExp({ ...exp });
  };

  const handleUpdateExperience = () => {
    if (!editingExp || !editingExp.company.trim() || !editingExp.role.trim()) return;
    onChange({
      ...config,
      experiences: experiences.map((e) => (e.id === editingExp.id ? editingExp : e)),
    });
    setEditingExpId(null);
    setEditingExp(null);
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const item: BioSkill = {
      id: "skill-" + Date.now(),
      name: newSkillName.trim(),
      level: newSkillLevel.trim() || undefined,
    };
    onChange({
      ...config,
      skills: [...skills, item],
    });
    setNewSkillName("");
    setNewSkillLevel("");
  };

  const handleRemoveSkill = (id: string) => {
    onChange({
      ...config,
      skills: skills.filter((s) => s.id !== id),
    });
    if (editingSkillId === id) {
      setEditingSkillId(null);
      setEditingSkill(null);
    }
  };

  const startEditSkill = (skill: BioSkill) => {
    setEditingSkillId(skill.id);
    setEditingSkill({ ...skill });
  };

  const handleUpdateSkill = () => {
    if (!editingSkill || !editingSkill.name.trim()) return;
    onChange({
      ...config,
      skills: skills.map((s) => (s.id === editingSkill.id ? editingSkill : s)),
    });
    setEditingSkillId(null);
    setEditingSkill(null);
  };

  const handleAddProject = () => {
    if (!newProject.title.trim()) return;
    const tags = newProjectTag
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const item: BioProject = {
      ...newProject,
      tags,
      id: "proj-" + Date.now(),
    };
    onChange({
      ...config,
      projects: [item, ...projects],
    });
    setNewProject({ title: "", description: "", url: "", tags: [] });
    setNewProjectTag("");
    setShowAddProject(false);
  };

  const handleRemoveProject = (id: string) => {
    onChange({
      ...config,
      projects: projects.filter((p) => p.id !== id),
    });
    if (editingProjectId === id) {
      setEditingProjectId(null);
      setEditingProject(null);
      setEditingProjectTag("");
    }
  };

  const startEditProject = (proj: BioProject) => {
    setEditingProjectId(proj.id);
    setEditingProject({ ...proj });
    setEditingProjectTag(proj.tags?.join(", ") ?? "");
  };

  const handleUpdateProject = () => {
    if (!editingProject || !editingProject.title.trim()) return;
    const tags = editingProjectTag
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const updated: BioProject = {
      ...editingProject,
      tags,
    };
    onChange({
      ...config,
      projects: projects.map((p) => (p.id === updated.id ? updated : p)),
    });
    setEditingProjectId(null);
    setEditingProject(null);
    setEditingProjectTag("");
  };

  const links = (config.links ?? []) as Array<{
    id: string;
    title: string;
    url: string;
    description?: string;
    iconUrl?: string;
    highlight?: boolean;
    sortOrder: number;
    isVisible: boolean;
  }>;

  // State thêm link mới
  const [newLink, setNewLink] = useState({
    title: "",
    url: "",
    description: "",
    iconUrl: "",
    highlight: false,
  });
  const [showAddLink, setShowAddLink] = useState(false);

  // State sửa link
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<{
    id: string;
    title: string;
    url: string;
    description?: string;
    iconUrl?: string;
    highlight?: boolean;
    sortOrder: number;
    isVisible: boolean;
  } | null>(null);

  const handleAddLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) return;
    const item = {
      id: "link-" + Date.now(),
      title: newLink.title.trim(),
      url: newLink.url.trim(),
      description: newLink.description.trim() || undefined,
      iconUrl: newLink.iconUrl.trim() || undefined,
      highlight: newLink.highlight,
      sortOrder: links.length + 1,
      isVisible: true,
    };
    onChange({
      ...config,
      links: [...links, item],
    });
    setNewLink({ title: "", url: "", description: "", iconUrl: "", highlight: false });
    setShowAddLink(false);
  };

  const handleRemoveLink = (id: string) => {
    onChange({
      ...config,
      links: links.filter((l) => l.id !== id),
    });
    if (editingLinkId === id) {
      setEditingLinkId(null);
      setEditingLink(null);
    }
  };

  const startEditLink = (l: (typeof links)[number]) => {
    setEditingLinkId(l.id);
    setEditingLink({ ...l });
  };

  const handleUpdateLink = () => {
    if (!editingLink || !editingLink.title.trim() || !editingLink.url.trim()) return;
    onChange({
      ...config,
      links: links.map((l) => (l.id === editingLink.id ? editingLink : l)),
    });
    setEditingLinkId(null);
    setEditingLink(null);
  };

  const handleToggleLinkVisibility = (id: string) => {
    onChange({
      ...config,
      links: links.map((l) => (l.id === id ? { ...l, isVisible: !l.isVisible } : l)),
    });
  };

  const handleReorderExperiences = (newExperiences: typeof experiences) => {
    onChange({
      ...config,
      experiences: newExperiences,
    });
  };

  const handleReorderSkills = (newSkills: typeof skills) => {
    onChange({
      ...config,
      skills: newSkills,
    });
  };

  const handleReorderProjects = (newProjects: typeof projects) => {
    onChange({
      ...config,
      projects: newProjects,
    });
  };

  const handleReorderLinks = (newLinks: typeof links) => {
    const updated = newLinks.map((item, idx) => ({
      ...item,
      sortOrder: idx,
    }));
    onChange({
      ...config,
      links: updated,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Thông tin cá nhân & Chức danh */}
      <Card className="border-border bg-card rounded-xl border shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <User className="text-primary size-4" />
            <span>{t("personalInfoTitle")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t("displayName")}</Label>
              <Input
                placeholder={t("displayNamePlaceholder")}
                value={profile.displayName}
                onChange={(e) => updateProfile("displayName", e.target.value)}
                disabled={disabled}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t("headline")}</Label>
              <Input
                placeholder={t("headlinePlaceholder")}
                value={profile.headline ?? ""}
                onChange={(e) => updateProfile("headline", e.target.value)}
                disabled={disabled}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t("bioText")}</Label>
            <Textarea
              rows={3}
              placeholder={t("bioTextPlaceholder")}
              value={profile.bioText}
              onChange={(e) => updateProfile("bioText", e.target.value)}
              disabled={disabled}
              className="text-xs"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-medium">
                <MapPin className="text-muted-foreground size-3" />
                <span>{t("location")}</span>
              </Label>
              <Input
                placeholder={t("locationPlaceholder")}
                value={profile.location ?? ""}
                onChange={(e) => updateProfile("location", e.target.value)}
                disabled={disabled}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-medium">
                <Mail className="text-muted-foreground size-3" />
                <span>{t("email")}</span>
              </Label>
              <Input
                type="email"
                placeholder={t("emailPlaceholder")}
                value={profile.email ?? ""}
                onChange={(e) => updateProfile("email", e.target.value)}
                disabled={disabled}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-medium">
                <Globe className="text-muted-foreground size-3" />
                <span>{t("website")}</span>
              </Label>
              <Input
                placeholder={t("websitePlaceholder")}
                value={profile.website ?? ""}
                onChange={(e) => updateProfile("website", e.target.value)}
                disabled={disabled}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Kinh nghiệm làm việc (Experience) */}
      <Card className="border-border bg-card rounded-xl border shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Briefcase className="text-primary size-4" />
            <span>{t("experiencesTitle", { count: experiences.length })}</span>
          </CardTitle>
          {!showAddExp ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddExp(true)}
              disabled={disabled}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <Plus className="size-3.5" />
              <span>{t("addExperience")}</span>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddExp ? (
            <div className="border-primary/20 bg-primary/5 space-y-3 rounded-xl border p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 text-xs font-medium">
                    <span>{t("company")}</span>
                    <span aria-hidden className="text-destructive text-sm leading-none font-medium">
                      *
                    </span>
                  </Label>
                  <Input
                    placeholder={t("companyPlaceholder")}
                    value={newExp.company}
                    onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 text-xs font-medium">
                    <span>{t("role")}</span>
                    <span aria-hidden className="text-destructive text-sm leading-none font-medium">
                      *
                    </span>
                  </Label>
                  <Input
                    placeholder={t("rolePlaceholder")}
                    value={newExp.role}
                    onChange={(e) => setNewExp({ ...newExp, role: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("period")}</Label>
                  <Input
                    placeholder={t("periodPlaceholder")}
                    value={newExp.period}
                    onChange={(e) => setNewExp({ ...newExp, period: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("expDescription")}</Label>
                <Textarea
                  rows={2}
                  placeholder={t("expDescriptionPlaceholder")}
                  value={newExp.description}
                  onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddExp(false)}
                  className="h-8 text-xs"
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddExperience}
                  className="h-8 text-xs"
                >
                  {t("saveExperience")}
                </Button>
              </div>
            </div>
          ) : null}

          {experiences.length === 0 && !showAddExp ? (
            <p className="text-muted-foreground py-4 text-center text-xs">
              {t("emptyExperiences")}
            </p>
          ) : (
            <SortableList
              items={experiences}
              onReorder={handleReorderExperiences}
              disabled={disabled}
              dragHandlePosition="left"
              className="divide-border divide-y"
              renderItem={(exp) =>
                editingExpId === exp.id && editingExp ? (
                  <div
                    key={exp.id}
                    className="border-primary/30 bg-primary/5 my-2 space-y-3 rounded-xl border p-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1 text-xs font-medium">
                          <span>{t("company")}</span>
                          <span
                            aria-hidden
                            className="text-destructive text-sm leading-none font-medium"
                          >
                            *
                          </span>
                        </Label>
                        <Input
                          placeholder={t("companyPlaceholder")}
                          value={editingExp.company}
                          onChange={(e) =>
                            setEditingExp({ ...editingExp, company: e.target.value })
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1 text-xs font-medium">
                          <span>{t("role")}</span>
                          <span
                            aria-hidden
                            className="text-destructive text-sm leading-none font-medium"
                          >
                            *
                          </span>
                        </Label>
                        <Input
                          placeholder={t("rolePlaceholder")}
                          value={editingExp.role}
                          onChange={(e) => setEditingExp({ ...editingExp, role: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t("period")}</Label>
                        <Input
                          placeholder={t("periodPlaceholder")}
                          value={editingExp.period}
                          onChange={(e) => setEditingExp({ ...editingExp, period: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("expDescription")}</Label>
                      <Textarea
                        rows={2}
                        placeholder={t("expDescriptionPlaceholder")}
                        value={editingExp.description ?? ""}
                        onChange={(e) =>
                          setEditingExp({ ...editingExp, description: e.target.value })
                        }
                        className="text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingExpId(null);
                          setEditingExp(null);
                        }}
                        className="h-8 text-xs"
                      >
                        {t("cancel")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleUpdateExperience}
                        className="h-8 text-xs"
                      >
                        {t("updateExperience")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div key={exp.id} className="flex items-start justify-between py-3">
                    <div className="min-w-0 pr-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-foreground text-xs font-semibold">{exp.role}</span>
                        <span className="text-muted-foreground text-xs">{t("at")}</span>
                        <span className="text-primary text-xs font-medium">{exp.company}</span>
                        {exp.period ? (
                          <Badge variant="secondary" className="px-2 py-0 text-[10px]">
                            {exp.period}
                          </Badge>
                        ) : null}
                      </div>
                      {exp.description ? (
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                          {exp.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => startEditExperience(exp)}
                        disabled={disabled}
                        className="h-7 gap-1 px-2.5 text-xs font-medium"
                      >
                        <Pencil className="size-3" />
                        <span>{t("editExperience")}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleRemoveExperience(exp.id)}
                        disabled={disabled}
                        className="text-muted-foreground hover:text-destructive size-7"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              }
            />
          )}
        </CardContent>
      </Card>

      {/* 3. Kỹ năng chuyên môn (Skills) */}
      <Card className="border-border bg-card rounded-xl border shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <GraduationCap className="text-primary size-4" />
            <span>{t("skillsTitle", { count: skills.length })}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder={t("skillNamePlaceholder")}
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              disabled={disabled}
              className="h-8.5 min-w-[200px] flex-1 text-xs"
            />
            <Input
              placeholder={t("skillLevelPlaceholder")}
              value={newSkillLevel}
              onChange={(e) => setNewSkillLevel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              disabled={disabled}
              className="h-8.5 w-40 text-xs"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddSkill}
              disabled={disabled || !newSkillName.trim()}
              className="h-8.5 gap-1.5 text-xs font-medium"
            >
              <Plus className="size-3.5" />
              <span>{t("addSkill")}</span>
            </Button>
          </div>

          <div className="pt-1">
            {skills.length === 0 ? (
              <p className="text-muted-foreground text-xs">{t("emptySkills")}</p>
            ) : (
              <SortableList
                items={skills}
                onReorder={handleReorderSkills}
                disabled={disabled}
                dragHandlePosition="left"
                className="flex flex-wrap gap-2"
                renderItem={(skill) =>
                  editingSkillId === skill.id && editingSkill ? (
                    <div
                      key={skill.id}
                      className="border-primary/40 bg-primary/10 flex items-center gap-1.5 rounded-lg border p-1.5 shadow-2xs"
                    >
                      <Input
                        value={editingSkill.name}
                        onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                        placeholder={t("skillNamePlaceholder")}
                        className="h-7 w-32 text-xs"
                        autoFocus
                      />
                      <Input
                        value={editingSkill.level ?? ""}
                        onChange={(e) =>
                          setEditingSkill({
                            ...editingSkill,
                            level: e.target.value || undefined,
                          })
                        }
                        placeholder={t("skillLevelPlaceholder")}
                        className="h-7 w-24 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleUpdateSkill}
                        disabled={!editingSkill.name.trim()}
                        className="h-7 px-2 text-xs"
                      >
                        {t("updateSkill")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSkillId(null);
                          setEditingSkill(null);
                        }}
                        className="h-7 px-2 text-xs"
                      >
                        {t("cancel")}
                      </Button>
                    </div>
                  ) : (
                    <div
                      key={skill.id}
                      className="border-border bg-card hover:border-primary/40 flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium shadow-2xs transition-all"
                    >
                      <span className="text-foreground font-semibold">{skill.name}</span>
                      {skill.level ? (
                        <span className="text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-[10px]">
                          {skill.level}
                        </span>
                      ) : null}
                      <div className="border-border/60 flex items-center gap-1 border-l pl-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => startEditSkill(skill)}
                          disabled={disabled}
                          className="text-muted-foreground hover:text-foreground size-5 p-0"
                          title={t("editSkill")}
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleRemoveSkill(skill.id)}
                          disabled={disabled}
                          className="text-muted-foreground hover:text-destructive size-5 p-0"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  )
                }
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. Dự án tiêu biểu (Projects) */}
      <Card className="border-border bg-card rounded-xl border shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <FolderGit2 className="text-primary size-4" />
            <span>{t("projectsTitle", { count: projects.length })}</span>
          </CardTitle>
          {!showAddProject ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddProject(true)}
              disabled={disabled}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <Plus className="size-3.5" />
              <span>{t("addProject")}</span>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddProject ? (
            <div className="border-primary/20 bg-primary/5 space-y-3 rounded-xl border p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 text-xs font-medium">
                    <span>{t("projectTitle")}</span>
                    <span aria-hidden className="text-destructive text-sm leading-none font-medium">
                      *
                    </span>
                  </Label>
                  <Input
                    placeholder={t("projectTitlePlaceholder")}
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("projectUrl")}</Label>
                  <Input
                    placeholder={t("projectUrlPlaceholder")}
                    value={newProject.url ?? ""}
                    onChange={(e) => setNewProject({ ...newProject, url: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("projectDescription")}</Label>
                <Textarea
                  rows={2}
                  placeholder={t("projectDescriptionPlaceholder")}
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("projectTags")}</Label>
                <Input
                  placeholder={t("projectTagsPlaceholder")}
                  value={newProjectTag}
                  onChange={(e) => setNewProjectTag(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddProject(false)}
                  className="h-8 text-xs"
                >
                  {t("cancel")}
                </Button>
                <Button type="button" size="sm" onClick={handleAddProject} className="h-8 text-xs">
                  {t("saveProject")}
                </Button>
              </div>
            </div>
          ) : null}

          {projects.length === 0 && !showAddProject ? (
            <p className="text-muted-foreground py-4 text-center text-xs">{t("emptyProjects")}</p>
          ) : (
            <SortableList
              items={projects}
              onReorder={handleReorderProjects}
              disabled={disabled}
              dragHandlePosition="left"
              className="divide-border divide-y"
              renderItem={(proj) =>
                editingProjectId === proj.id && editingProject ? (
                  <div
                    key={proj.id}
                    className="border-primary/30 bg-primary/5 my-2 space-y-3 rounded-xl border p-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1 text-xs font-medium">
                          <span>{t("projectTitle")}</span>
                          <span
                            aria-hidden
                            className="text-destructive text-sm leading-none font-medium"
                          >
                            *
                          </span>
                        </Label>
                        <Input
                          placeholder={t("projectTitlePlaceholder")}
                          value={editingProject.title}
                          onChange={(e) =>
                            setEditingProject({ ...editingProject, title: e.target.value })
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t("projectUrl")}</Label>
                        <Input
                          placeholder={t("projectUrlPlaceholder")}
                          value={editingProject.url ?? ""}
                          onChange={(e) =>
                            setEditingProject({ ...editingProject, url: e.target.value })
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("projectDescription")}</Label>
                      <Textarea
                        rows={2}
                        placeholder={t("projectDescriptionPlaceholder")}
                        value={editingProject.description ?? ""}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            description: e.target.value,
                          })
                        }
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("projectTags")}</Label>
                      <Input
                        placeholder={t("projectTagsPlaceholder")}
                        value={editingProjectTag}
                        onChange={(e) => setEditingProjectTag(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingProjectId(null);
                          setEditingProject(null);
                          setEditingProjectTag("");
                        }}
                        className="h-8 text-xs"
                      >
                        {t("cancel")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleUpdateProject}
                        className="h-8 text-xs"
                      >
                        {t("updateProject")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div key={proj.id} className="flex items-start justify-between py-3">
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-xs font-semibold">{proj.title}</span>
                        {toSafeHttpUrl(proj.url, { allowRelative: false }) ? (
                          <Button
                            asChild
                            variant="ghost"
                            size="icon-xs"
                            className="text-primary size-5 p-0"
                          >
                            <Link
                              href={toSafeHttpUrl(proj.url, { allowRelative: false }) as never}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="size-3" />
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                      {proj.description ? (
                        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                          {proj.description}
                        </p>
                      ) : null}
                      {proj.tags && proj.tags.length > 0 ? (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {proj.tags.map((tg) => (
                            <span
                              key={tg}
                              className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-[10px]"
                            >
                              {tg}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => startEditProject(proj)}
                        disabled={disabled}
                        className="h-7 gap-1 px-2.5 text-xs font-medium"
                      >
                        <Pencil className="size-3" />
                        <span>{t("editProject")}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleRemoveProject(proj.id)}
                        disabled={disabled}
                        className="text-muted-foreground hover:text-destructive size-7"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              }
            />
          )}
        </CardContent>
      </Card>

      {/* 5. Liên kết nổi bật & Mạng xã hội (Links) */}
      <Card className="border-border bg-card rounded-xl border shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Link2 className="text-primary size-4" />
            <span>{t("linksTitle", { count: links.length })}</span>
          </CardTitle>
          {!showAddLink ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddLink(true)}
              disabled={disabled}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <Plus className="size-3.5" />
              <span>{t("addLink")}</span>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddLink ? (
            <div className="border-primary/20 bg-primary/5 space-y-3 rounded-xl border p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 text-xs font-medium">
                    <span>{t("linkTitle")}</span>
                    <span aria-hidden className="text-destructive text-sm leading-none font-medium">
                      *
                    </span>
                  </Label>
                  <Input
                    placeholder={t("linkTitlePlaceholder")}
                    value={newLink.title}
                    onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 text-xs font-medium">
                    <span>{t("linkUrl")}</span>
                    <span aria-hidden className="text-destructive text-sm leading-none font-medium">
                      *
                    </span>
                  </Label>
                  <Input
                    placeholder={t("linkUrlPlaceholder")}
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("linkDescription")}</Label>
                <Input
                  placeholder={t("linkDescriptionPlaceholder")}
                  value={newLink.description}
                  onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t("linkIcon")}</Label>
                  <span className="text-muted-foreground text-[11px]">{t("autoIconHint")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="border-border bg-card flex size-8 shrink-0 items-center justify-center rounded-lg border p-1 shadow-2xs">
                    <BioLinkIcon
                      url={newLink.url}
                      title={newLink.title}
                      iconUrl={newLink.iconUrl}
                      size={20}
                      className="size-5"
                    />
                  </div>
                  <Input
                    placeholder={t("linkIconPlaceholder")}
                    value={newLink.iconUrl}
                    onChange={(e) => setNewLink({ ...newLink, iconUrl: e.target.value })}
                    className="h-8 flex-1 text-xs"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="bio-add-link-highlight"
                    checked={newLink.highlight}
                    onCheckedChange={(checked) =>
                      setNewLink({ ...newLink, highlight: Boolean(checked) })
                    }
                  />
                  <Label
                    htmlFor="bio-add-link-highlight"
                    className="flex cursor-pointer items-center gap-1 text-xs font-medium"
                  >
                    <Sparkles className="size-3 text-amber-500" />
                    <span>{t("linkHighlight")}</span>
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddLink(false)}
                    className="h-8 text-xs"
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddLink}
                    disabled={!newLink.title.trim() || !newLink.url.trim()}
                    className="h-8 text-xs"
                  >
                    {t("saveLink")}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {links.length === 0 && !showAddLink ? (
            <p className="text-muted-foreground py-4 text-center text-xs">{t("emptyLinks")}</p>
          ) : (
            <SortableList
              items={links}
              onReorder={handleReorderLinks}
              disabled={disabled}
              dragHandlePosition="left"
              className="divide-border divide-y"
              renderItem={(link) =>
                editingLinkId === link.id && editingLink ? (
                  <div
                    key={link.id}
                    className="border-primary/30 bg-primary/5 my-2 space-y-3 rounded-xl border p-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1 text-xs font-medium">
                          <span>{t("linkTitle")}</span>
                          <span
                            aria-hidden
                            className="text-destructive text-sm leading-none font-medium"
                          >
                            *
                          </span>
                        </Label>
                        <Input
                          placeholder={t("linkTitlePlaceholder")}
                          value={editingLink.title}
                          onChange={(e) =>
                            setEditingLink({ ...editingLink, title: e.target.value })
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1 text-xs font-medium">
                          <span>{t("linkUrl")}</span>
                          <span
                            aria-hidden
                            className="text-destructive text-sm leading-none font-medium"
                          >
                            *
                          </span>
                        </Label>
                        <Input
                          placeholder={t("linkUrlPlaceholder")}
                          value={editingLink.url}
                          onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("linkDescription")}</Label>
                      <Input
                        placeholder={t("linkDescriptionPlaceholder")}
                        value={editingLink.description ?? ""}
                        onChange={(e) =>
                          setEditingLink({ ...editingLink, description: e.target.value })
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">{t("linkIcon")}</Label>
                        <span className="text-muted-foreground text-[11px]">
                          {t("autoIconHint")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="border-border bg-card flex size-8 shrink-0 items-center justify-center rounded-lg border p-1 shadow-2xs">
                          <BioLinkIcon
                            url={editingLink.url}
                            title={editingLink.title}
                            iconUrl={editingLink.iconUrl}
                            size={20}
                            className="size-5"
                          />
                        </div>
                        <Input
                          placeholder={t("linkIconPlaceholder")}
                          value={editingLink.iconUrl ?? ""}
                          onChange={(e) =>
                            setEditingLink({ ...editingLink, iconUrl: e.target.value })
                          }
                          className="h-8 flex-1 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`bio-edit-link-highlight-${editingLink.id}`}
                          checked={Boolean(editingLink.highlight)}
                          onCheckedChange={(checked) =>
                            setEditingLink({ ...editingLink, highlight: Boolean(checked) })
                          }
                        />
                        <Label
                          htmlFor={`bio-edit-link-highlight-${editingLink.id}`}
                          className="flex cursor-pointer items-center gap-1 text-xs font-medium"
                        >
                          <Sparkles className="size-3 text-amber-500" />
                          <span>{t("linkHighlight")}</span>
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingLinkId(null);
                            setEditingLink(null);
                          }}
                          className="h-8 text-xs"
                        >
                          {t("cancel")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleUpdateLink}
                          disabled={!editingLink.title.trim() || !editingLink.url.trim()}
                          className="h-8 text-xs"
                        >
                          {t("updateLink")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={link.id} className="flex items-start justify-between py-3">
                    <div className="flex min-w-0 items-start gap-3 pr-4">
                      <div className="border-border bg-muted/40 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border p-1 shadow-2xs">
                        <BioLinkIcon
                          url={link.url}
                          title={link.title}
                          iconUrl={link.iconUrl}
                          size={20}
                          className="size-5"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground text-xs font-semibold">
                            {link.title}
                          </span>
                          {link.highlight ? (
                            <Badge
                              variant="outline"
                              className="gap-1 border-amber-500/40 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-600 dark:text-amber-400"
                            >
                              <Sparkles className="size-2.5" />
                              <span>{t("highlightBadge")}</span>
                            </Badge>
                          ) : null}
                          {toSafeHttpUrl(link.url, { allowRelative: false }) ? (
                            <Button
                              asChild
                              variant="ghost"
                              size="icon-xs"
                              className="text-primary size-5 p-0"
                            >
                              <Link
                                href={toSafeHttpUrl(link.url, { allowRelative: false }) as never}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="size-3" />
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                        {link.description ? (
                          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                            {link.description}
                          </p>
                        ) : null}
                        <p className="text-muted-foreground/80 mt-0.5 truncate font-mono text-[11px]">
                          {link.url}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleToggleLinkVisibility(link.id)}
                        disabled={disabled}
                        className="text-muted-foreground hover:text-foreground size-7"
                        title={link.isVisible ? t("visible") : t("hidden")}
                      >
                        {link.isVisible ? (
                          <Eye className="size-3.5" />
                        ) : (
                          <EyeOff className="text-muted-foreground/50 size-3.5" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => startEditLink(link)}
                        disabled={disabled}
                        className="h-7 gap-1 px-2.5 text-xs font-medium"
                      >
                        <Pencil className="size-3" />
                        <span>{t("editLink")}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleRemoveLink(link.id)}
                        disabled={disabled}
                        className="text-muted-foreground hover:text-destructive size-7"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
