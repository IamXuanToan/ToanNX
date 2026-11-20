"use client";

import { Music, Pause, Play, Volume1, Volume2, VolumeX, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import { Slider } from "@/shares/components/ui/slider";

import { type ChillTrack, useChillAudio } from "./hooks/use-chill-audio";

export type { ChillTrack };

export interface ChillAudioProps {
  /** Chế độ ban ngày / ban đêm */
  isDay?: boolean;
  /** Track âm thanh gợi ý theo thời tiết */
  suggestedTrack?: ChillTrack;
  /** Tín hiệu tia sét từ canvas để phát tiếng sấm */
  thunderTrigger?: number;
}

/**
 * Trình phát thanh âm thư giãn & Hệ thống mô phỏng âm thanh thời tiết (Web Audio API Synthesizer):
 * - Tự động phát âm thanh theo thời tiết thực tế (Mưa, Dông bão, Nắng, Sương mù).
 * - Điều khiển âm lượng chuẩn Shadcn UI Slider kèm lưu trạng thái vào Storage.
 * - 4 chế độ âm thanh: Lofi Chill Melody, Mưa rơi êm dịu, Dông bão & Sấm sét, Sóng biển bình yên.
 *
 * @param props - Thuộc tính `ChillAudioProps`.
 * @returns Giao diện trình phát nhạc.
 */
export function ChillAudio({ isDay = true, suggestedTrack, thunderTrigger }: ChillAudioProps) {
  const t = useTranslations("common.home.audio");
  const {
    isPlaying,
    currentTrack,
    volume,
    isMuted,
    togglePlay,
    toggleMute,
    handleVolumeChange,
    switchTrack,
  } = useChillAudio({ isDay, suggestedTrack, thunderTrigger });

  return (
    <div
      className={`flex w-full items-center justify-between gap-2.5 rounded-2xl border p-3 shadow-xl backdrop-blur-md transition-all duration-700 sm:px-5 ${
        isDay
          ? "border-white/40 bg-white/30 text-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
          : "border-white/10 bg-black/30 text-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
      }`}
    >
      {/* 1. Nút Play / Pause và Tên bài hát */}
      <div className="flex items-center gap-2.5">
        <Button
          type="button"
          size="icon"
          onClick={togglePlay}
          aria-label={isPlaying ? t("paused") : t("nowPlaying")}
          className={`size-8.5 rounded-full shadow-md transition-transform hover:scale-105 active:scale-95 ${
            isDay ? "bg-slate-900 text-white" : "bg-white text-slate-950"
          }`}
        >
          {isPlaying ? (
            <Pause className={`size-3.5 ${isDay ? "fill-white" : "fill-slate-950"}`} />
          ) : (
            <Play className={`ml-0.5 size-3.5 ${isDay ? "fill-white" : "fill-slate-950"}`} />
          )}
        </Button>

        <div className="flex items-center gap-1.5">
          <Music className={`size-3.5 ${isDay ? "text-slate-600" : "text-slate-400"}`} />
          <div className="flex flex-col">
            <span
              className={`text-xs leading-tight font-semibold whitespace-nowrap ${
                isDay ? "text-slate-800" : "text-slate-200"
              }`}
            >
              {currentTrack === "lofi"
                ? t("trackLofi")
                : currentTrack === "rain"
                  ? t("trackRain")
                  : currentTrack === "storm"
                    ? t("trackStorm")
                    : t("trackOcean")}
            </span>
            <span
              className={`text-[10px] leading-tight ${isDay ? "text-slate-500" : "text-slate-400"}`}
            >
              {isPlaying ? t("nowPlaying") : t("paused")}
            </span>
          </div>
        </div>

        {/* Thanh equalizer chuyển động */}
        {isPlaying ? (
          <div className="hidden h-3.5 items-end gap-0.5 px-0.5 sm:flex" aria-hidden="true">
            <span className="h-full w-0.5 animate-[pulse_0.6s_ease-in-out_infinite] bg-emerald-500" />
            <span className="h-2/3 w-0.5 animate-[pulse_0.9s_ease-in-out_infinite_0.2s] bg-emerald-500" />
            <span className="h-4/5 w-0.5 animate-[pulse_0.75s_ease-in-out_infinite_0.4s] bg-emerald-500" />
          </div>
        ) : null}
      </div>

      {/* 2. Bộ chọn không gian âm thanh (Pills gọn gàng) */}
      <div
        className={`flex items-center gap-1 rounded-lg border p-1 ${
          isDay ? "border-white/40 bg-white/30" : "border-white/5 bg-white/[0.03]"
        }`}
      >
        {(
          [
            { key: "lofi", labelKey: "tabLofi" },
            { key: "rain", labelKey: "tabRain" },
            { key: "storm", labelKey: "tabStorm", icon: Zap },
            { key: "ocean", labelKey: "tabOcean" },
          ] as const
        ).map((item) => {
          const Icon = "icon" in item ? item.icon : null;
          const isActive = currentTrack === item.key;
          return (
            <Button
              key={item.key}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => switchTrack(item.key)}
              className={`h-6.5 gap-1 rounded-md px-2 text-[11px] font-medium transition-all ${
                isActive
                  ? isDay
                    ? "bg-white font-semibold text-slate-900 shadow-xs"
                    : "bg-white/20 font-semibold text-white shadow-xs"
                  : isDay
                    ? "text-slate-600 hover:bg-white/40 hover:text-slate-900"
                    : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
              }`}
            >
              {Icon ? <Icon className="size-2.5 text-amber-400" /> : null}
              <span>{t(item.labelKey as Parameters<typeof t>[0])}</span>
            </Button>
          );
        })}
      </div>

      {/* 3. Nút chỉnh âm lượng chuẩn Shadcn UI Slider trên cùng 1 dòng */}
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          title={isMuted ? t("trackMute") : `${t("volume")}: ${volume}%`}
          aria-label={isMuted ? t("trackMute") : `${t("volume")}: ${volume}%`}
          className={`size-7.5 rounded-full transition-colors ${
            isDay
              ? "text-slate-600 hover:bg-slate-900/5 hover:text-slate-900"
              : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
          }`}
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="size-3.5 text-rose-500" />
          ) : volume < 50 ? (
            <Volume1 className="size-3.5" />
          ) : (
            <Volume2 className="size-3.5" />
          )}
        </Button>

        {/* Thanh trượt âm lượng Slider Shadcn UI */}
        <div className="flex items-center gap-1">
          <Slider
            value={[isMuted ? 0 : volume]}
            min={0}
            max={100}
            step={1}
            onValueChange={([val]) => handleVolumeChange(val ?? 0)}
            className="w-14 cursor-pointer sm:w-20"
            aria-label={t("volume")}
          />
          <span
            className={`w-6 text-right font-mono text-[10px] font-semibold ${
              isDay ? "text-slate-500" : "text-slate-400"
            }`}
          >
            {isMuted ? "0%" : `${volume}%`}
          </span>
        </div>
      </div>
    </div>
  );
}
