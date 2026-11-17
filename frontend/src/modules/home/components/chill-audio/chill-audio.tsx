"use client";

import { Music, Pause, Play, Volume1, Volume2, VolumeX, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/shares/components/ui/button";
import { Slider } from "@/shares/components/ui/slider";

export type ChillTrack = "lofi" | "rain" | "storm" | "ocean";

interface ChillAudioProps {
  isDay?: boolean;
  suggestedTrack?: ChillTrack;
  thunderTrigger?: number; // Nhận tín hiệu khi có tia sét trên canvas
}

const VOLUME_STORAGE_KEY = "audio_volume";
const MUTED_STORAGE_KEY = "audio_muted";

function getInitialVolume(): number {
  if (typeof window === "undefined") return 70;
  try {
    const saved = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (saved !== null) {
      const parsed = Number(saved);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        return parsed;
      }
    }
  } catch {
    // bỏ qua
  }
  return 70;
}

function getInitialMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const saved = localStorage.getItem(MUTED_STORAGE_KEY);
    return saved === "true";
  } catch {
    // bỏ qua
  }
  return false;
}

/**
 * Trình phát thanh âm thư giãn & Hệ thống mô phỏng âm thanh thời tiết (Web Audio API Synthesizer):
 * - Tự động phát âm thanh theo thời tiết thực tế (Mưa, Dông bão, Nắng, Sương mù).
 * - Điều khiển âm lượng chuẩn Shadcn UI Slider kèm lưu trạng thái vào Storage (không dùng tiền tố toannx_).
 * - Mô phỏng sấm sét chân thực 3 tầng: Tia chớp nổ đanh (Electric Snap) + Sóng xung kích (Shockwave boom) + Sấm rền siêu trầm (Deep sub-bass rolling rumble 4.5s).
 * - 4 chế độ âm thanh: Lofi Chill Melody, Mưa rơi êm dịu, Dông bão & Sấm sét, Sóng biển bình yên.
 */
export function ChillAudio({ isDay = true, suggestedTrack, thunderTrigger }: ChillAudioProps) {
  const t = useTranslations("common.home.audio");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<ChillTrack>(suggestedTrack || "lofi");
  const [volume, setVolume] = useState<number>(getInitialVolume);
  const [isMuted, setIsMuted] = useState<boolean>(getInitialMuted);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const activeNodesRef = useRef<{ stop: () => void } | null>(null);

  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Khởi tạo và truy xuất AudioContext chuẩn bảo mật trình duyệt
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const masterGain = ctx.createGain();
      const currentGain = isMutedRef.current ? 0 : (volumeRef.current / 100) * 0.45;
      masterGain.gain.setValueAtTime(currentGain, ctx.currentTime);
      masterGain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      masterGainRef.current = masterGain;
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return { ctx: audioCtxRef.current, masterGain: masterGainRef.current! };
  }, []);

  // Mô phỏng âm thanh tiếng sấm sét điện ảnh chân thực 3 tầng
  const playThunderSound = useCallback(() => {
    if (isMutedRef.current) return;
    try {
      const { ctx, masterGain } = getAudioContext();
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;

      // ----------------------------------------------------
      // TẦNG 1: TIA SÉT NỔ ĐANH (Sharp Electric Snap / Crack)
      // ----------------------------------------------------
      const snapLen = Math.floor(ctx.sampleRate * 0.12);
      const snapBuffer = ctx.createBuffer(2, snapLen, ctx.sampleRate);
      const leftSnap = snapBuffer.getChannelData(0);
      const rightSnap = snapBuffer.getChannelData(1);
      for (let i = 0; i < snapLen; i++) {
        const decay = Math.exp(-i / (ctx.sampleRate * 0.022));
        leftSnap[i] = (Math.random() * 2 - 1) * decay;
        rightSnap[i] = (Math.random() * 2 - 1) * decay;
      }
      const snapSource = ctx.createBufferSource();
      snapSource.buffer = snapBuffer;

      const snapFilter = ctx.createBiquadFilter();
      snapFilter.type = "bandpass";
      snapFilter.frequency.setValueAtTime(2400, now);
      snapFilter.frequency.exponentialRampToValueAtTime(900, now + 0.11);
      snapFilter.Q.setValueAtTime(2.6, now);

      const snapGain = ctx.createGain();
      snapGain.gain.setValueAtTime(0.85, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      snapSource.connect(snapFilter);
      snapFilter.connect(snapGain);
      snapGain.connect(masterGain);
      snapSource.start(now);

      // ----------------------------------------------------
      // TẦNG 2: SÓNG XUNG KÍCH SẤM SÉT (Sonic Boom Shockwave)
      // ----------------------------------------------------
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(155, now + 0.01);
      osc.frequency.exponentialRampToValueAtTime(46, now + 0.35);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.001, now + 0.01);
      oscGain.gain.linearRampToValueAtTime(0.9, now + 0.04);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(now + 0.01);
      osc.stop(now + 0.55);

      // ----------------------------------------------------
      // TẦNG 3: SẤM RỀN TẦNG SỐ TRẦM VANG VỌNG (Sub-bass Rolling Rumble - 4.6s)
      // ----------------------------------------------------
      const rumbleLen = Math.floor(ctx.sampleRate * 4.6);
      const rumbleBuffer = ctx.createBuffer(2, rumbleLen, ctx.sampleRate);
      const leftRumble = rumbleBuffer.getChannelData(0);
      const rightRumble = rumbleBuffer.getChannelData(1);
      let lastL = 0;
      let lastR = 0;
      for (let i = 0; i < rumbleLen; i++) {
        const whiteL = Math.random() * 2 - 1;
        const whiteR = Math.random() * 2 - 1;
        lastL = (lastL + 0.038 * whiteL) / 1.032;
        lastR = (lastR + 0.038 * whiteR) / 1.032;

        const sec = i / ctx.sampleRate;
        const rollEnvelope =
          0.75 * Math.exp(-sec * 0.85) +
          0.6 * Math.sin(sec * 1.9) * Math.exp(-sec * 0.48) +
          0.38 * Math.sin(sec * 3.6) * Math.exp(-sec * 0.72);
        const normEnv = Math.max(0, rollEnvelope);

        leftRumble[i] = lastL * normEnv;
        rightRumble[i] = lastR * normEnv;
      }

      const rumbleSource = ctx.createBufferSource();
      rumbleSource.buffer = rumbleBuffer;

      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = "lowpass";
      rumbleFilter.frequency.setValueAtTime(175, now + 0.02);
      rumbleFilter.frequency.exponentialRampToValueAtTime(50, now + 4.2);
      rumbleFilter.Q.setValueAtTime(3.4, now);

      const rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.001, now);
      rumbleGain.gain.linearRampToValueAtTime(0.95, now + 0.07);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);

      rumbleSource.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(masterGain);
      rumbleSource.start(now + 0.02);
    } catch {
      // AudioContext bị hạn chế bởi trình duyệt
    }
  }, [getAudioContext]);

  // Kích hoạt tiếng sấm khi nhận tín hiệu từ Canvas thời tiết
  useEffect(() => {
    if (thunderTrigger && thunderTrigger > 0) {
      playThunderSound();
    }
  }, [thunderTrigger, playThunderSound]);

  const stopCurrentSound = () => {
    if (activeNodesRef.current) {
      try {
        activeNodesRef.current.stop();
      } catch {
        // bỏ qua
      }
      activeNodesRef.current = null;
    }
  };

  const startTrack = useCallback(
    (track: ChillTrack) => {
      stopCurrentSound();
      const { ctx, masterGain } = getAudioContext();

      if (track === "lofi") {
        const chords = [
          [261.63, 329.63, 392.0, 493.88], // Cmaj7
          [220.0, 261.63, 329.63, 392.0], // Am7
          [174.61, 261.63, 329.63, 349.23], // Fmaj7
          [196.0, 246.94, 293.66, 392.0], // G6
        ];

        let chordIndex = 0;
        let isRunning = true;
        let activeOscs: OscillatorNode[] = [];

        const playChord = () => {
          if (!isRunning) return;

          activeOscs.forEach((o) => {
            try {
              o.stop();
              o.disconnect();
            } catch {
              // bỏ qua
            }
          });
          activeOscs = [];

          const now = ctx.currentTime;
          const freqs = chords[chordIndex % chords.length];
          chordIndex++;

          const chordGain = ctx.createGain();
          chordGain.gain.setValueAtTime(0.001, now);
          chordGain.gain.linearRampToValueAtTime(0.2, now + 1.2);
          chordGain.gain.exponentialRampToValueAtTime(0.001, now + 4.8);

          const filter = ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(650, now);
          filter.Q.setValueAtTime(1.5, now);

          chordGain.connect(filter);
          filter.connect(masterGain);

          freqs.forEach((f) => {
            const osc = ctx.createOscillator();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(f, now);
            osc.connect(chordGain);
            osc.start(now);
            osc.stop(now + 5.0);
            activeOscs.push(osc);
          });

          if (isRunning) {
            timerId = window.setTimeout(playChord, 4600);
          }
        };

        let timerId = window.setTimeout(playChord, 100);

        activeNodesRef.current = {
          stop: () => {
            isRunning = false;
            clearTimeout(timerId);
            activeOscs.forEach((o) => {
              try {
                o.stop();
                o.disconnect();
              } catch {
                // bỏ qua
              }
            });
          },
        };
      } else if (track === "rain") {
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const rainFilter = ctx.createBiquadFilter();
        rainFilter.type = "lowpass";
        rainFilter.frequency.setValueAtTime(950, ctx.currentTime);

        const rainGain = ctx.createGain();
        rainGain.gain.setValueAtTime(0.35, ctx.currentTime);

        whiteNoise.connect(rainFilter);
        rainFilter.connect(rainGain);
        rainGain.connect(masterGain);
        whiteNoise.start();

        activeNodesRef.current = {
          stop: () => {
            try {
              whiteNoise.stop();
              whiteNoise.disconnect();
            } catch {
              // bỏ qua
            }
          },
        };
      } else if (track === "storm") {
        // Mưa dồn dập + tiếng gió rít
        const bufferSize = ctx.sampleRate * 3;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.04 * white) / 1.04;
          output[i] = lastOut;
        }

        const stormNoise = ctx.createBufferSource();
        stormNoise.buffer = noiseBuffer;
        stormNoise.loop = true;

        const stormFilter = ctx.createBiquadFilter();
        stormFilter.type = "lowpass";
        stormFilter.frequency.setValueAtTime(1400, ctx.currentTime);

        const stormGain = ctx.createGain();
        stormGain.gain.setValueAtTime(0.48, ctx.currentTime);

        stormNoise.connect(stormFilter);
        stormFilter.connect(stormGain);
        stormGain.connect(masterGain);
        stormNoise.start();

        // Gió rít theo đợt
        const windInterval = setInterval(() => {
          if (!audioCtxRef.current) return;
          const tNow = audioCtxRef.current.currentTime;
          stormFilter.frequency.setTargetAtTime(1200 + Math.random() * 800, tNow, 1.2);
        }, 2000);

        activeNodesRef.current = {
          stop: () => {
            clearInterval(windInterval);
            try {
              stormNoise.stop();
              stormNoise.disconnect();
            } catch {
              // bỏ qua
            }
          },
        };
      } else if (track === "ocean") {
        const bufferSize = ctx.sampleRate * 3;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const oceanNoise = ctx.createBufferSource();
        oceanNoise.buffer = noiseBuffer;
        oceanNoise.loop = true;

        const oceanFilter = ctx.createBiquadFilter();
        oceanFilter.type = "bandpass";
        oceanFilter.frequency.setValueAtTime(320, ctx.currentTime);
        oceanFilter.Q.setValueAtTime(1.8, ctx.currentTime);

        const oceanGain = ctx.createGain();
        oceanGain.gain.setValueAtTime(0.05, ctx.currentTime);

        let waveTime = 0;
        const waveInterval = setInterval(() => {
          if (!audioCtxRef.current) return;
          waveTime += 0.1;
          const swell = (Math.sin(waveTime * 0.7) + 1) / 2;
          oceanGain.gain.setTargetAtTime(0.1 + swell * 0.35, ctx.currentTime, 0.2);
          oceanFilter.frequency.setTargetAtTime(250 + swell * 400, ctx.currentTime, 0.2);
        }, 100);

        oceanNoise.connect(oceanFilter);
        oceanFilter.connect(oceanGain);
        oceanGain.connect(masterGain);
        oceanNoise.start();

        activeNodesRef.current = {
          stop: () => {
            clearInterval(waveInterval);
            try {
              oceanNoise.stop();
              oceanNoise.disconnect();
            } catch {
              // bỏ qua
            }
          },
        };
      }
    },
    [getAudioContext],
  );

  const userChoseTrackRef = useRef(false);
  const currentTrackRef = useRef(currentTrack);
  const isPlayingRef = useRef(isPlaying);
  const suggestedTrackRef = useRef(suggestedTrack);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    suggestedTrackRef.current = suggestedTrack;
  }, [suggestedTrack]);

  // Tự động chuyển bài nhạc tương ứng khi thời tiết thay đổi (nếu người dùng chưa chọn thủ công)
  useEffect(() => {
    if (
      suggestedTrack &&
      !userChoseTrackRef.current &&
      suggestedTrack !== currentTrackRef.current
    ) {
      setCurrentTrack(suggestedTrack);
      if (isPlayingRef.current) {
        startTrack(suggestedTrack);
      }
    }
  }, [suggestedTrack, startTrack]);

  // Mở khóa âm thanh khi người dùng chạm hoặc tương tác với trang
  useEffect(() => {
    const handleFirstGesture = () => {
      if (!audioCtxRef.current || audioCtxRef.current.state === "suspended") {
        const { ctx } = getAudioContext();
        ctx.resume().catch(() => {});
      }
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
    };

    window.addEventListener("pointerdown", handleFirstGesture, { once: true });
    window.addEventListener("keydown", handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
      stopCurrentSound();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [getAudioContext]);

  const togglePlay = () => {
    if (isPlaying) {
      stopCurrentSound();
      setIsPlaying(false);
    } else {
      startTrack(currentTrack);
      setIsPlaying(true);
      if (currentTrack === "storm") {
        setTimeout(() => {
          playThunderSound();
        }, 400);
      }
    }
  };

  const changeTrack = (track: ChillTrack) => {
    userChoseTrackRef.current = true;
    setCurrentTrack(track);
    startTrack(track);
    setIsPlaying(true);
    if (track === "storm") {
      setTimeout(() => {
        playThunderSound();
      }, 400);
    }
  };

  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    const shouldMute = newVal === 0;
    setIsMuted(shouldMute);

    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(newVal));
      localStorage.setItem(MUTED_STORAGE_KEY, shouldMute ? "true" : "false");
    } catch {
      // bỏ qua
    }

    if (masterGainRef.current && audioCtxRef.current) {
      const targetGain = shouldMute ? 0 : (newVal / 100) * 0.45;
      masterGainRef.current.gain.setTargetAtTime(targetGain, audioCtxRef.current.currentTime, 0.05);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      const restored = volume === 0 ? 70 : volume;
      setVolume(restored);
      setIsMuted(false);
      try {
        localStorage.setItem(MUTED_STORAGE_KEY, "false");
        localStorage.setItem(VOLUME_STORAGE_KEY, String(restored));
      } catch {
        // bỏ qua
      }
      if (masterGainRef.current && audioCtxRef.current) {
        const targetGain = (restored / 100) * 0.45;
        masterGainRef.current.gain.setTargetAtTime(targetGain, audioCtxRef.current.currentTime, 0.05);
      }
    } else {
      setIsMuted(true);
      try {
        localStorage.setItem(MUTED_STORAGE_KEY, "true");
      } catch {
        // bỏ qua
      }
      if (masterGainRef.current && audioCtxRef.current) {
        masterGainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.05);
      }
    }
  };

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
              className={`text-xs font-semibold leading-tight whitespace-nowrap ${
                isDay ? "text-slate-800" : "text-slate-200"
              }`}
            >
              {currentTrack === "lofi"
                ? "Lofi Melody"
                : currentTrack === "rain"
                  ? "Mưa rơi êm"
                  : currentTrack === "storm"
                    ? "Dông bão"
                    : "Sóng biển"}
            </span>
            <span className={`text-[10px] leading-tight ${isDay ? "text-slate-500" : "text-slate-400"}`}>
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
            { key: "lofi", label: "Lofi" },
            { key: "rain", label: "Mưa" },
            { key: "storm", label: "Bão", icon: Zap },
            { key: "ocean", label: "Sóng" },
          ] as { key: ChillTrack; label: string; icon?: typeof Zap }[]
        ).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => changeTrack(item.key)}
              className={`flex items-center gap-0.5 rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                currentTrack === item.key
                  ? isDay
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white/20 text-white shadow-sm"
                  : isDay
                    ? "text-slate-600 hover:text-slate-900"
                    : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {Icon ? <Icon className="size-2.5 text-amber-400" /> : null}
              <span>{item.label}</span>
            </button>
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
