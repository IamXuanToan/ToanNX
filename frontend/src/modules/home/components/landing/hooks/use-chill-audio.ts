"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useStoredPreference } from "@/shares/hooks/use-stored-preference";

export type ChillTrack = "lofi" | "rain" | "storm" | "ocean";

/**
 * Thuộc tính của hook `useChillAudio`.
 */
export interface UseChillAudioProps {
  /** Giao diện đang ở chế độ ban ngày hay ban đêm */
  isDay?: boolean;
  /** Track âm thanh được hệ thống thời tiết gợi ý */
  suggestedTrack?: ChillTrack;
  /** Tín hiệu kích hoạt tiếng sấm sét từ canvas */
  thunderTrigger?: number;
}

const VOLUME_STORAGE_KEY = "audio_volume";
const MUTED_STORAGE_KEY = "audio_muted";

const isValidVolume = (value: unknown): value is number =>
  typeof value === "number" && !Number.isNaN(value) && value >= 0 && value <= 100;

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

/**
 * Hook quản lý toàn bộ hệ thống âm thanh Web Audio API Synthesizer cho ChillAudio:
 * - Khởi tạo AudioContext an toàn.
 * - Bộ tổng hợp âm thanh Lofi Melody, Mưa rơi, Dông bão & Sấm sét, Sóng biển.
 * - Điều khiển Play/Pause, âm lượng và Mute kèm lưu vào LocalStorage.
 *
 * @param props - Thuộc tính `UseChillAudioProps`.
 * @returns Trạng thái phát nhạc, track đang chọn, âm lượng, trạng thái mute và các handler điều khiển.
 */
export function useChillAudio({ suggestedTrack, thunderTrigger }: UseChillAudioProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<ChillTrack>(suggestedTrack || "lofi");
  const [prevSuggestedTrack, setPrevSuggestedTrack] = useState(suggestedTrack);

  if (suggestedTrack && suggestedTrack !== prevSuggestedTrack) {
    setPrevSuggestedTrack(suggestedTrack);
    if (!isPlaying) {
      setCurrentTrack(suggestedTrack);
    }
  }

  const [volume, setVolume] = useStoredPreference<number>(VOLUME_STORAGE_KEY, 70, isValidVolume);
  const [isMuted, setIsMuted] = useStoredPreference<boolean>(MUTED_STORAGE_KEY, false, isBoolean);

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
      snapFilter.type = "highpass";
      snapFilter.frequency.setValueAtTime(1400, now);

      const snapGain = ctx.createGain();
      snapGain.gain.setValueAtTime(0.4, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      snapSource.connect(snapFilter);
      snapFilter.connect(snapGain);
      snapGain.connect(masterGain);
      snapSource.start(now);

      // ----------------------------------------------------
      // TẦNG 2: SÓNG XUNG KÍCH BỘC PHÁT (Shockwave Boom / Impact)
      // ----------------------------------------------------
      const boomOsc = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boomOsc.type = "sine";
      boomOsc.frequency.setValueAtTime(160, now + 0.02);
      boomOsc.frequency.exponentialRampToValueAtTime(32, now + 0.65);

      boomGain.gain.setValueAtTime(0.001, now);
      boomGain.gain.linearRampToValueAtTime(0.7, now + 0.035);
      boomGain.gain.exponentialRampToValueAtTime(0.005, now + 0.7);

      boomOsc.connect(boomGain);
      boomGain.connect(masterGain);
      boomOsc.start(now);
      boomOsc.stop(now + 0.75);

      // ----------------------------------------------------
      // TẦNG 3: SẤM RỀN SIÊU TRẦM KÉO DÀI (Deep Sub-bass Rolling Rumble)
      // ----------------------------------------------------
      const rumbleLen = Math.floor(ctx.sampleRate * 4.5);
      const rumbleBuffer = ctx.createBuffer(2, rumbleLen, ctx.sampleRate);
      const leftRumble = rumbleBuffer.getChannelData(0);
      const rightRumble = rumbleBuffer.getChannelData(1);

      let lastL = 0;
      let lastR = 0;
      for (let i = 0; i < rumbleLen; i++) {
        const whiteL = Math.random() * 2 - 1;
        const whiteR = Math.random() * 2 - 1;
        lastL = (lastL + 0.035 * whiteL) / 1.035;
        lastR = (lastR + 0.035 * whiteR) / 1.035;

        const tSec = i / ctx.sampleRate;
        const swell =
          Math.sin(tSec * 1.8) * 0.35 +
          Math.sin(tSec * 3.7 + 0.4) * 0.25 +
          Math.sin(tSec * 0.9) * 0.2;
        const env = Math.exp(-tSec / 1.6) * Math.max(0, 0.4 + swell);

        leftRumble[i] = lastL * 3.5 * env;
        rightRumble[i] = lastR * 3.5 * env;
      }

      const rumbleSource = ctx.createBufferSource();
      rumbleSource.buffer = rumbleBuffer;

      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = "lowpass";
      rumbleFilter.frequency.setValueAtTime(140, now);
      rumbleFilter.frequency.linearRampToValueAtTime(65, now + 4.2);

      const rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.01, now);
      rumbleGain.gain.linearRampToValueAtTime(0.75, now + 0.1);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 4.4);

      rumbleSource.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(masterGain);
      rumbleSource.start(now);
    } catch {
      // Bỏ qua lỗi audio context trên mobile/trình duyệt chặn autoplay
    }
  }, [getAudioContext]);

  // Lắng nghe tín hiệu sấm sét từ canvas
  useEffect(() => {
    if (thunderTrigger && thunderTrigger > 0) {
      playThunderSound();
    }
  }, [thunderTrigger, playThunderSound]);

  // 1. Synth Giai điệu Lofi Chill Hoài Niệm (Chords & Arpeggio)
  const playLofiMusic = useCallback((ctx: AudioContext, destination: AudioNode) => {
    const chords = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 349.23], // G7
    ];

    let isRunning = true;
    let step = 0;
    let timerId: NodeJS.Timeout | null = null;

    const stepLofi = () => {
      if (!isRunning) return;
      const currentChord = chords[step % chords.length];
      const now = ctx.currentTime;

      currentChord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = idx % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(650, now);

        gain.gain.setValueAtTime(0.001, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.045, now + idx * 0.1 + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 2.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 2.4);
      });

      step++;
      timerId = setTimeout(stepLofi, 2400);
    };

    stepLofi();

    return {
      stop: () => {
        isRunning = false;
        if (timerId) clearTimeout(timerId);
      },
    };
  }, []);

  // 2. Synth Tiếng Mưa Rơi Êm Dịu (Soft Pink Noise Rain)
  const playRainSound = useCallback((ctx: AudioContext, destination: AudioNode) => {
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    let b0L = 0,
      b1L = 0,
      b2L = 0;
    let b0R = 0,
      b1R = 0,
      b2R = 0;

    for (let i = 0; i < bufferSize; i++) {
      const whiteL = Math.random() * 2 - 1;
      b0L = 0.99886 * b0L + whiteL * 0.0555179;
      b1L = 0.99332 * b1L + whiteL * 0.0750759;
      b2L = 0.969 * b2L + whiteL * 0.153852;
      dataL[i] = (b0L + b1L + b2L + whiteL * 0.5362) * 0.065;

      const whiteR = Math.random() * 2 - 1;
      b0R = 0.99886 * b0R + whiteR * 0.0555179;
      b1R = 0.99332 * b1R + whiteR * 0.0750759;
      b2R = 0.969 * b2R + whiteR * 0.153852;
      dataR[i] = (b0R + b1R + b2R + whiteR * 0.5362) * 0.065;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1100, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 1.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    noise.start();

    return {
      stop: () => {
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        setTimeout(() => noise.stop(), 650);
      },
    };
  }, []);

  // 3. Synth Tiếng Dông Bão & Sấm Sét (Heavy Rain, Wind Swells & Thunder)
  const playStormSound = useCallback(
    (ctx: AudioContext, destination: AudioNode) => {
      const rain = playRainSound(ctx, destination);

      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 2.8;
      }

      const windNoise = ctx.createBufferSource();
      windNoise.buffer = buffer;
      windNoise.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = "bandpass";
      windFilter.frequency.setValueAtTime(320, ctx.currentTime);
      windFilter.Q.setValueAtTime(2.5, ctx.currentTime);

      const windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0.12, ctx.currentTime);

      windNoise.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(destination);

      windNoise.start();

      return {
        stop: () => {
          rain.stop();
          windNoise.stop();
        },
      };
    },
    [playRainSound],
  );

  // 4. Synth Tiếng Sóng Biển Vỗ Bờ (Ocean Waves Periodic Swells)
  const playOceanSound = useCallback((ctx: AudioContext, destination: AudioNode) => {
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    let lastL = 0;
    let lastR = 0;
    for (let i = 0; i < bufferSize; i++) {
      const whiteL = Math.random() * 2 - 1;
      const whiteR = Math.random() * 2 - 1;
      lastL = (lastL + 0.02 * whiteL) / 1.02;
      lastR = (lastR + 0.02 * whiteR) / 1.02;
      dataL[i] = lastL * 3.0;
      dataR[i] = lastR * 3.0;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(450, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.02, ctx.currentTime);

    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // Chu kỳ sóng vỗ 8 giây
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.14, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    noise.start();
    lfo.start();

    return {
      stop: () => {
        noise.stop();
        lfo.stop();
      },
    };
  }, []);

  // Bật / tắt thanh âm thanh
  const togglePlay = useCallback(() => {
    const { ctx, masterGain } = getAudioContext();

    if (isPlaying) {
      if (activeNodesRef.current) {
        activeNodesRef.current.stop();
        activeNodesRef.current = null;
      }
      setIsPlaying(false);
    } else {
      if (activeNodesRef.current) {
        activeNodesRef.current.stop();
      }

      if (currentTrack === "lofi") {
        activeNodesRef.current = playLofiMusic(ctx, masterGain);
      } else if (currentTrack === "rain") {
        activeNodesRef.current = playRainSound(ctx, masterGain);
      } else if (currentTrack === "storm") {
        activeNodesRef.current = playStormSound(ctx, masterGain);
      } else if (currentTrack === "ocean") {
        activeNodesRef.current = playOceanSound(ctx, masterGain);
      }
      setIsPlaying(true);
    }
  }, [
    isPlaying,
    currentTrack,
    getAudioContext,
    playLofiMusic,
    playRainSound,
    playStormSound,
    playOceanSound,
  ]);

  // Chuyển đổi track âm thanh
  const switchTrack = useCallback(
    (track: ChillTrack) => {
      if (currentTrack === track) return;
      setCurrentTrack(track);

      if (isPlaying) {
        const { ctx, masterGain } = getAudioContext();
        if (activeNodesRef.current) {
          activeNodesRef.current.stop();
        }

        if (track === "lofi") {
          activeNodesRef.current = playLofiMusic(ctx, masterGain);
        } else if (track === "rain") {
          activeNodesRef.current = playRainSound(ctx, masterGain);
        } else if (track === "storm") {
          activeNodesRef.current = playStormSound(ctx, masterGain);
        } else if (track === "ocean") {
          activeNodesRef.current = playOceanSound(ctx, masterGain);
        }
      }
    },
    [
      currentTrack,
      isPlaying,
      getAudioContext,
      playLofiMusic,
      playRainSound,
      playStormSound,
      playOceanSound,
    ],
  );

  // Tự động phát khi tải trang lần đầu (chuẩn UX cá nhân yên bình)
  useEffect(() => {
    const handleFirstUserInteraction = () => {
      const { ctx, masterGain } = getAudioContext();
      if (!isPlaying && !activeNodesRef.current) {
        if (currentTrack === "lofi") {
          activeNodesRef.current = playLofiMusic(ctx, masterGain);
        } else if (currentTrack === "rain") {
          activeNodesRef.current = playRainSound(ctx, masterGain);
        } else if (currentTrack === "storm") {
          activeNodesRef.current = playStormSound(ctx, masterGain);
        } else if (currentTrack === "ocean") {
          activeNodesRef.current = playOceanSound(ctx, masterGain);
        }
        setIsPlaying(true);
      }
      window.removeEventListener("pointerdown", handleFirstUserInteraction);
      window.removeEventListener("keydown", handleFirstUserInteraction);
    };

    window.addEventListener("pointerdown", handleFirstUserInteraction, { once: true });
    window.addEventListener("keydown", handleFirstUserInteraction, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handleFirstUserInteraction);
      window.removeEventListener("keydown", handleFirstUserInteraction);
      if (activeNodesRef.current) {
        activeNodesRef.current.stop();
      }
    };
  }, [
    currentTrack,
    getAudioContext,
    isPlaying,
    playLofiMusic,
    playRainSound,
    playStormSound,
    playOceanSound,
  ]);

  // Xử lý thay đổi âm lượng
  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    const shouldMute = newVal === 0;
    setIsMuted(shouldMute);

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
      if (masterGainRef.current && audioCtxRef.current) {
        const targetGain = (restored / 100) * 0.45;
        masterGainRef.current.gain.setTargetAtTime(
          targetGain,
          audioCtxRef.current.currentTime,
          0.05,
        );
      }
    } else {
      setIsMuted(true);
      if (masterGainRef.current && audioCtxRef.current) {
        masterGainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.05);
      }
    }
  };

  return {
    isPlaying,
    currentTrack,
    volume,
    isMuted,
    togglePlay,
    toggleMute,
    handleVolumeChange,
    switchTrack,
  };
}
