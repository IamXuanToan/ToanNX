"use client";

import { Loader2, Maximize, Minimize, Pause, Play, Volume1, Volume2, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";

import { Button } from "@/shares/components/ui/button";
import { Slider } from "@/shares/components/ui/slider";

import { formatVideoTime, useAttachmentVideoPlayer } from "./hooks/use-attachment-video-player";

/** Thuộc tính của component trình phát video. */
export type AttachmentVideoPlayerProps = {
  /** Đường dẫn video. */
  src: string;
  /** Tên hiển thị của video. */
  title?: string;
  /** Callback khi xảy ra lỗi phát video. */
  onError?: () => void;
  /** Class tùy biến ngoài. */
  className?: string;
};

/**
 * Trình phát video chuyên dụng với thanh điều khiển tuỳ biến, nút phát, âm lượng lưu localStorage và toàn màn hình.
 *
 * @param props - Thuộc tính `AttachmentVideoPlayerProps`.
 * @returns Trình phát video với giao diện hiện đại và trải nghiệm mượt mà.
 */
export function AttachmentVideoPlayer({
  src,
  title,
  onError,
  className,
}: AttachmentVideoPlayerProps) {
  const t = useTranslations("system.attachment");
  const {
    videoRef,
    containerRef,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    volume,
    isMuted,
    isFullscreen,
    showControls,
    isBuffering,
    setIsBuffering,
    handleMouseMove,
    togglePlay,
    handleSeek,
    handleVolumeChange,
    toggleMute,
    toggleFullscreen,
  } = useAttachmentVideoPlayer();

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "group/video relative flex size-full items-center justify-center overflow-hidden rounded-xl bg-black select-none",
        className,
      )}
    >
      {/* Thẻ video HTML5 ngầm */}
      <video
        ref={videoRef}
        src={src}
        aria-label={title || "Video"}
        playsInline
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) setDuration(videoRef.current.duration);
        }}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onError={onError}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        className="size-full object-contain"
      />

      {/* Hiệu ứng loading xoay khi video đang đệm */}
      {isBuffering && (
        <div className="backdrop-blur-2xs pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
          <Loader2 className="size-10 animate-spin text-white" />
        </div>
      )}

      {/* Nút Play to ở giữa màn hình khi tạm dừng */}
      {!isPlaying && !isBuffering && (
        <Button
          type="button"
          variant="default"
          size="icon"
          onClick={togglePlay}
          aria-label={t("playVideoAria")}
          className="absolute size-14 rounded-full shadow-lg backdrop-blur-md transition-transform duration-200 hover:scale-110 active:scale-95"
        >
          <Play className="ml-0.5 size-6 fill-current" />
        </Button>
      )}

      {/* Thanh điều khiển nổi phía dưới (tự ẩn khi phát) */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6 transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        {/* Thanh tua tiến độ (Progress bar) dùng chuẩn shadcn/ui Slider */}
        <div className="w-full px-1">
          <Slider
            value={[progressPercent]}
            min={0}
            max={100}
            step={0.1}
            onValueChange={([val]) => val !== undefined && handleSeek(val)}
            aria-label={t("seekVideoAria")}
            className="[&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:border-primary cursor-pointer py-1 [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-track]]:bg-white/30"
          />
        </div>

        {/* Cụm nút thao tác bên dưới thanh tiến độ */}
        <div className="mt-1 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            {/* Nút Play / Pause */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              aria-label={isPlaying ? t("pauseAria") : t("playAria")}
              className="size-8 text-white hover:bg-white/10 hover:text-white"
            >
              {isPlaying ? (
                <Pause className="size-4.5 fill-current" />
              ) : (
                <Play className="size-4.5 fill-current" />
              )}
            </Button>

            {/* Cụm Âm lượng */}
            <div className="group/vol flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                aria-label={isMuted ? t("unmuteAria") : t("muteAria")}
                className="size-8 text-white hover:bg-white/10 hover:text-white"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="size-4.5" />
                ) : volume < 0.5 ? (
                  <Volume1 className="size-4.5" />
                ) : (
                  <Volume2 className="size-4.5" />
                )}
              </Button>

              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([val]) => val !== undefined && handleVolumeChange(val)}
                aria-label={t("volumeAria")}
                className="[&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:border-primary w-16 cursor-pointer sm:w-20 [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-track]]:bg-white/30"
              />
            </div>

            {/* Thời gian hiển thị */}
            <span className="text-xs font-medium text-white/80 tabular-nums">
              {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Nút Toàn màn hình */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? t("exitFullscreenAria") : t("fullscreenAria")}
              className="size-8 text-white hover:bg-white/10 hover:text-white"
            >
              {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
