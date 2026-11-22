"use client";

import { useEffect, useRef, useState } from "react";

import {
  DEFAULT_MEDIA_VOLUME,
  MEDIA_PLAYER_MUTED_KEY,
  MEDIA_PLAYER_VOLUME_KEY,
} from "../../../constants/media-player";

/**
 * Định dạng số giây thành chuỗi thời gian hiển thị `mm:ss` hoặc `hh:mm:ss`.
 *
 * @param seconds - Số giây thời lượng media.
 * @returns Chuỗi thời gian đã chuẩn hóa.
 */
export function formatVideoTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

/**
 * Hook điều khiển trình phát video: phát/tạm dừng, tua, âm lượng lưu localStorage và toàn màn hình.
 *
 * @returns Các state và hàm điều khiển trình phát video.
 */
export function useAttachmentVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Khởi tạo âm lượng từ localStorage một cách an toàn
  const [volume, setVolumeState] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_MEDIA_VOLUME;
    try {
      const savedVolume = localStorage.getItem(MEDIA_PLAYER_VOLUME_KEY);
      if (savedVolume !== null) {
        const parsed = parseFloat(savedVolume);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) return parsed;
      }
    } catch {
      // Bỏ qua lỗi truy cập localStorage
    }
    return DEFAULT_MEDIA_VOLUME;
  });

  // Khởi tạo cờ tắt tiếng từ localStorage
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const savedMuted = localStorage.getItem(MEDIA_PLAYER_MUTED_KEY);
      return savedMuted === "true";
    } catch {
      return false;
    }
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Đồng bộ âm lượng và cờ tắt tiếng vào thẻ video thực
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Tự động ẩn thanh điều khiển khi không di chuột
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 2500);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  };

  const handleSeek = (newTimePercent: number) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const targetTime = (newTimePercent / 100) * duration;
    video.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleVolumeChange = (newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clamped);
    if (videoRef.current) {
      videoRef.current.volume = clamped;
      if (clamped > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
    try {
      localStorage.setItem(MEDIA_PLAYER_VOLUME_KEY, String(clamped));
    } catch {
      // Bỏ qua lỗi lưu localStorage
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);

    try {
      localStorage.setItem(MEDIA_PLAYER_MUTED_KEY, String(nextMuted));
    } catch {
      // Bỏ qua lỗi lưu localStorage
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      void container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  return {
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
  };
}
