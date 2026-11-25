"use client";

import { useEffect, useRef } from "react";

import { DEFAULT_TIMEZONE } from "@/shares/constants/locale";

import { getTimezoneClockMinutes, parseClockMinutes } from "../../../lib/weather-detection";
import { calculateAstronomicalMoonPhase } from "../../../store/weather-store";

export type WeatherEffectType = "auto" | "rain" | "storm" | "sunny" | "fog" | "night";
export type RainIntensityType = "light" | "medium" | "heavy";

export interface WeatherCanvasProps {
  effect: WeatherEffectType;
  temperature?: number;
  isDay?: boolean;
  windSpeed?: number;
  rainIntensity?: RainIntensityType;
  sunrise?: string;
  sunset?: string;
  moonPhase?: number;
  onThunderStrike?: () => void;
  locale?: string;
}

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
}

interface Splash {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

interface Drip {
  x: number;
  y: number;
  speedY: number;
  alpha: number;
}

interface Leaf {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotSpeed: number;
  color: string;
}

interface Firefly {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  phase: number;
  speedX: number;
  speedY: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
  hasSpike?: boolean;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
}

interface FogPuff {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  speedX: number;
  baseAlpha: number;
  phase: number;
  layer: "back" | "mid" | "front";
}

interface MistParticle {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  alpha: number;
  phase: number;
}

interface WindStream {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
}

interface FoliageCluster {
  x: number;
  y: number;
  r: number;
  phase: number;
  depth: number;
}

interface SmokePuff {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speedX: number;
  speedY: number;
}

interface LightningSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
}

interface LightningBolt {
  segments: LightningSegment[];
  alpha: number;
}

interface Thief {
  active: boolean;
  state: "sneaking" | "alerted" | "bitten" | "fleeing";
  x: number;
  y: number;
  speed: number;
  bubbleText: string;
  timer: number;
}

/**
 * Tạo mạng lưới tia sét phân nhánh ziczac tự nhiên
 */
function createLightningTree(startX: number, startY: number, targetY: number): LightningSegment[] {
  const segments: LightningSegment[] = [];

  function generateBranch(
    x: number,
    y: number,
    angle: number,
    length: number,
    branchWidth: number,
    depth: number,
  ) {
    if (depth > 4 || length < 12) return;

    let currX = x;
    let currY = y;
    const steps = Math.max(3, Math.floor(length / 22));

    for (let s = 0; s < steps; s++) {
      const stepLen = length / steps;
      const jitter = (Math.random() - 0.5) * 0.7;
      const branchAngle = angle + jitter;
      const nextX = currX + Math.sin(branchAngle) * stepLen;
      const nextY = currY + Math.cos(branchAngle) * stepLen;

      segments.push({
        x1: currX,
        y1: currY,
        x2: nextX,
        y2: nextY,
        width: Math.max(1, branchWidth),
      });

      if (Math.random() < 0.38 && depth < 3) {
        const forkDirection = Math.random() > 0.5 ? 1 : -1;
        const forkAngle = branchAngle + forkDirection * (0.45 + Math.random() * 0.4);
        generateBranch(nextX, nextY, forkAngle, stepLen * 3.2, branchWidth * 0.6, depth + 1);
      }

      currX = nextX;
      currY = nextY;
      if (currY >= targetY) break;
    }
  }

  generateBranch(startX, startY, (Math.random() - 0.5) * 0.35, targetY - startY, 4.0, 0);
  return segments;
}

/**
 * Vẽ mặt trăng theo pha thiên văn học (Moon Phase Terminator):
 * Tự động tạo hình Trăng rằm tròn vành vạnh (Full Moon), Trăng bán nguyệt (Quarter), hoặc Trăng lưỡi liềm (Crescent)
 * khớp chính xác với ngày âm lịch/dương lịch thực tế.
 */
function drawRealisticMoon(
  ctx: CanvasRenderingContext2D,
  moonX: number,
  moonY: number,
  radius: number,
  moonPhase: number,
) {
  const phase = ((moonPhase % 1) + 1) % 1;
  const illumination = (1 - Math.cos(phase * Math.PI * 2)) / 2;

  // 1. Quầng sáng hào quang mặt trăng (Halo)
  const haloRadius = radius * (2.2 + illumination * 2.8);
  const moonHalo = ctx.createRadialGradient(moonX, moonY, radius * 0.3, moonX, moonY, haloRadius);
  moonHalo.addColorStop(0, `rgba(225, 240, 255, ${0.32 * (0.2 + illumination * 0.8)})`);
  moonHalo.addColorStop(0.35, `rgba(190, 220, 255, ${0.1 * (0.2 + illumination * 0.8)})`);
  moonHalo.addColorStop(1, "rgba(180, 205, 245, 0)");

  ctx.fillStyle = moonHalo;
  ctx.beginPath();
  ctx.arc(moonX, moonY, haloRadius, 0, Math.PI * 2);
  ctx.fill();

  // 2. Thân đĩa mặt trăng tối (Bóng mờ mặt trăng)
  ctx.beginPath();
  ctx.arc(moonX, moonY, radius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(16, 24, 42, 0.78)";
  ctx.fill();

  // Trăng non (New Moon) tối mờ
  if (illumination < 0.02) {
    return;
  }

  // 3. Vẽ phần được chiếu sáng theo thuật toán Terminator thiên văn
  ctx.save();
  ctx.beginPath();
  ctx.arc(moonX, moonY, radius, 0, Math.PI * 2);
  ctx.clip();

  ctx.translate(moonX, moonY);

  ctx.beginPath();
  // phase <= 0.5: Trăng mọc phía bên phải (Waxing)
  // phase > 0.5: Trăng mọc phía bên trái (Waning)
  const isWaxing = phase <= 0.5;
  ctx.arc(0, 0, radius, -Math.PI / 2, Math.PI / 2, !isWaxing);

  const cosPhase = Math.cos(phase * Math.PI * 2);
  const ellipseRadiusX = Math.abs(radius * cosPhase);

  if (typeof ctx.ellipse === "function") {
    ctx.ellipse(
      0,
      0,
      Math.max(ellipseRadiusX, 0.1),
      radius,
      0,
      Math.PI / 2,
      -Math.PI / 2,
      cosPhase < 0,
    );
  } else {
    ctx.lineTo(0, -radius);
  }
  ctx.closePath();

  ctx.fillStyle = "rgba(252, 253, 255, 0.98)";
  ctx.shadowColor = "rgba(215, 238, 255, 0.95)";
  ctx.shadowBlur = radius * (0.8 + illumination * 0.6);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 4. Các vết đốm bề mặt mặt trăng (Craters / Maria)
  if (illumination > 0.12) {
    ctx.fillStyle = "rgba(175, 198, 225, 0.22)";
    ctx.beginPath();
    ctx.arc(-radius * 0.22, -radius * 0.2, radius * 0.2, 0, Math.PI * 2);
    ctx.arc(radius * 0.26, -radius * 0.14, radius * 0.18, 0, Math.PI * 2);
    ctx.arc(-radius * 0.1, radius * 0.28, radius * 0.25, 0, Math.PI * 2);
    ctx.arc(radius * 0.28, radius * 0.22, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Canvas nghệ thuật thiên nhiên và thế giới thu nhỏ (Cozy Little Home Diorama):
 * - Hồ cá Koi sinh thái & Bến câu cá (Fish Pond & Fishing Dock): Hồ nước ngọc bích, đàn cá Koi bơi lội, lá sen, hoa súng, bến gỗ mộc.
 * - Nhân vật bạn nam 22 tuổi chill chill:
 *    + Ban ngày trời đẹp: Ngồi câu cá thong thả trên bến gỗ, phao câu nhấp nhô, cá cắn mồi kéo cần thú vị ("Cắn câu rồi! 🎣").
 *    + Khi mưa bão: Trú mưa dưới hiên nhà Ghibli ấm cúng, ôm cốc cà phê nóng bốc khói ngắm mưa ("Mưa chill quá ☕").
 *    + Ban đêm: Ngồi ghế hiên nhà dưới ánh đèn lồng ngắm trăng sao ("Trời đêm bình yên ✨").
 * - Khu vườn hoa cảnh (Blooming Flower Garden): Luống hoa cúc họa mi, tulip, oải hương, hàng rào gỗ trắng mộc mạc.
 * - Thú cưng phóng to rõ nét (kích thước lớn, to rõ, dễ thương):
 *    + Chuồng chó bề thế & Chú chó Shiba (scale 1.65x) thông minh, đuôi vẫy vui tươi.
 *    + Nhà cây nhiều tầng & Chú mèo mướp (scale 1.55x) vằn vện, chữ M trên trán, mắt ngọc biếc, đuôi sọc đung đưa.
 * - Ngôi nhà nhỏ phong cách Studio Ghibli: Mái ngói xếp lớp tỉ mỉ, cửa sổ lồi tỏa ánh sáng vàng ấm có bồn hoa nở rộ, ống khói đá nhả khói êm đềm, hiên gỗ có đèn lồng ấm cúng.
 * - Kịch bản khách đêm hài hước: Khách đêm lén lút bị chú chó giữ nhà phát hiện và chạy vui vẻ.
 * - Tối ưu di động: Chỉ kích hoạt animation trên tablet trở lên (>= 768px).
 */
export function useWeatherCanvas({
  effect,
  temperature = 28,
  isDay = true,
  windSpeed = 12,
  rainIntensity = "medium",
  sunrise,
  sunset,
  moonPhase,
  onThunderStrike,
  locale = "vi",
}: WeatherCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onThunderStrikeRef = useRef(onThunderStrike);
  const localeRef = useRef(locale);

  useEffect(() => {
    onThunderStrikeRef.current = onThunderStrike;
  }, [onThunderStrike]);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  const activeEffect: "rain" | "storm" | "sunny" | "fog" | "night" =
    effect === "auto" ? (!isDay ? "night" : "sunny") : effect;

  const effectiveNight = activeEffect === "night" || !isDay;
  const effectiveDay = !effectiveNight;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (window.innerWidth < 768) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // ==========================================
    // 1. Cấu hình hạt & đối tượng thiên nhiên
    // ==========================================
    const isStormMode = activeEffect === "storm";
    const isRainMode = activeEffect === "rain" || isStormMode;
    const isFogMode = activeEffect === "fog";

    // Mưa rơi
    const dropCount = isStormMode
      ? 680
      : rainIntensity === "light"
        ? 110
        : rainIntensity === "medium"
          ? 280
          : 540;

    const rainDrops: RainDrop[] = Array.from({ length: dropCount }, () => ({
      x: Math.random() * (width + 500) - 250,
      y: Math.random() * height,
      length: isStormMode
        ? 26 + Math.random() * 22
        : rainIntensity === "light"
          ? 8 + Math.random() * 8
          : rainIntensity === "medium"
            ? 14 + Math.random() * 12
            : 22 + Math.random() * 18,
      speed: isStormMode
        ? 25 + Math.random() * 14
        : rainIntensity === "light"
          ? 9 + Math.random() * 4
          : rainIntensity === "medium"
            ? 15 + Math.random() * 7
            : 22 + Math.random() * 10,
      opacity: isStormMode
        ? 0.45 + Math.random() * 0.45
        : rainIntensity === "light"
          ? 0.22 + Math.random() * 0.28
          : 0.35 + Math.random() * 0.45,
    }));

    const splashes: Splash[] = [];
    const drips: Drip[] = [];
    const activeBolts: LightningBolt[] = [];

    // Khói ống khói ngôi nhà
    const chimneySmoke: SmokePuff[] = Array.from({ length: 10 }, () => ({
      x: 0,
      y: 0,
      size: 3 + Math.random() * 3.5,
      alpha: Math.random() * 0.5,
      speedX: 0.2 + Math.random() * 0.3,
      speedY: 0.5 + Math.random() * 0.4,
    }));

    // Ngàn sao cho đêm sao
    const stars: Star[] = Array.from({ length: 160 }, () => {
      const isMajor = Math.random() < 0.1;
      const colorRoll = Math.random();
      const color =
        colorRoll < 0.6
          ? "rgba(250, 252, 255,"
          : colorRoll < 0.85
            ? "rgba(200, 230, 255,"
            : "rgba(255, 242, 210,";

      return {
        x: Math.random() * width,
        y: Math.random() * (height * 0.75),
        size: isMajor ? 1.8 + Math.random() * 1.3 : 0.7 + Math.random() * 1.1,
        baseAlpha: 0.35 + Math.random() * 0.6,
        twinkleSpeed: 1.2 + Math.random() * 3.2,
        twinklePhase: Math.random() * Math.PI * 2,
        color,
        hasSpike: isMajor,
      };
    });

    let shootingStarTimer = 0;
    let currentShootingStar: ShootingStar | null = null;

    // Sương mù đa tầng
    const fogPuffs: FogPuff[] = Array.from({ length: 34 }, (_, i) => {
      const layer: "back" | "mid" | "front" = i < 11 ? "back" : i < 22 ? "mid" : "front";
      const speedX =
        layer === "back"
          ? 0.25 + Math.random() * 0.35
          : layer === "mid"
            ? 0.45 + Math.random() * 0.45
            : 0.65 + Math.random() * 0.55;
      const radiusX =
        layer === "front"
          ? 360 + Math.random() * 260
          : layer === "mid"
            ? 280 + Math.random() * 220
            : 220 + Math.random() * 180;
      const radiusY = radiusX * (0.35 + Math.random() * 0.2);
      const baseAlpha =
        layer === "front"
          ? 0.13 + Math.random() * 0.08
          : layer === "mid"
            ? 0.16 + Math.random() * 0.1
            : 0.19 + Math.random() * 0.12;

      return {
        x: Math.random() * (width + 600) - 300,
        y:
          layer === "front"
            ? height * 0.42 + Math.random() * (height * 0.55)
            : layer === "mid"
              ? height * 0.25 + Math.random() * (height * 0.55)
              : height * 0.1 + Math.random() * (height * 0.5),
        radiusX,
        radiusY,
        speedX,
        baseAlpha,
        phase: Math.random() * Math.PI * 2,
        layer,
      };
    });

    const mistParticles: MistParticle[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 2.5 + Math.random() * 4.5,
      speedX: 0.35 + Math.random() * 0.75,
      speedY: (Math.random() - 0.5) * 0.2,
      alpha: 0.12 + Math.random() * 0.22,
      phase: Math.random() * Math.PI * 2,
    }));

    // Lá rụng bay theo gió
    const leafCount = isStormMode ? 55 : 32;
    const leaves: Leaf[] = Array.from({ length: leafCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 4 + Math.random() * 5,
      speedX: isStormMode ? 3.5 + Math.random() * 5.5 : 1.4 + Math.random() * 2.8,
      speedY: isStormMode ? 1.2 + Math.random() * 3.0 : 0.8 + Math.random() * 1.6,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * (isStormMode ? 0.25 : 0.09),
      color: isStormMode
        ? Math.random() > 0.4
          ? "rgba(60, 95, 65, 0.85)"
          : "rgba(90, 75, 55, 0.85)"
        : effectiveDay
          ? activeEffect === "sunny"
            ? Math.random() > 0.4
              ? "rgba(235, 175, 75, 0.85)"
              : "rgba(120, 195, 85, 0.85)"
            : "rgba(95, 175, 105, 0.8)"
          : "rgba(55, 105, 75, 0.7)",
    }));

    // Đom đóm đêm
    const fireflies: Firefly[] = Array.from({ length: 28 }, () => ({
      x: width * 0.18 + (Math.random() - 0.5) * 280,
      y: height * 0.65 + (Math.random() - 0.5) * 240,
      radius: 1.2 + Math.random() * 1.8,
      baseAlpha: 0.3 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.3,
    }));

    // Làn gió lướt qua
    const windStreams: WindStream[] = Array.from({ length: isStormMode ? 14 : 7 }, () => ({
      x: -Math.random() * 400,
      y: Math.random() * height * 0.85,
      length: isStormMode ? 160 + Math.random() * 260 : 90 + Math.random() * 180,
      speed: isStormMode ? 8 + Math.random() * 12 : 4 + Math.random() * 6,
      alpha: isStormMode ? 0.08 + Math.random() * 0.12 : 0.04 + Math.random() * 0.08,
    }));

    // Cụm tán lá cây cổ thụ
    const foliageClusters: FoliageCluster[] = [
      { x: -130, y: -260, r: 42, phase: 0.2, depth: 0 },
      { x: -105, y: -290, r: 38, phase: 0.5, depth: 1 },
      { x: -155, y: -235, r: 34, phase: 0.8, depth: 1 },
      { x: -85, y: -250, r: 36, phase: 1.1, depth: 2 },
      { x: -120, y: -210, r: 30, phase: 1.4, depth: 2 },
      { x: -60, y: -330, r: 46, phase: 1.7, depth: 0 },
      { x: -40, y: -365, r: 40, phase: 2.0, depth: 1 },
      { x: -80, y: -350, r: 38, phase: 2.3, depth: 1 },
      { x: -50, y: -300, r: 35, phase: 2.6, depth: 2 },
      { x: 0, y: -410, r: 52, phase: 2.9, depth: 0 },
      { x: 25, y: -440, r: 44, phase: 3.2, depth: 1 },
      { x: -25, y: -435, r: 42, phase: 3.5, depth: 1 },
      { x: 45, y: -410, r: 38, phase: 3.8, depth: 2 },
      { x: -40, y: -405, r: 36, phase: 4.1, depth: 2 },
      { x: 10, y: -465, r: 32, phase: 4.4, depth: 2 },
      { x: 80, y: -360, r: 48, phase: 4.7, depth: 0 },
      { x: 115, y: -385, r: 42, phase: 5.0, depth: 1 },
      { x: 65, y: -390, r: 38, phase: 5.3, depth: 1 },
      { x: 135, y: -350, r: 36, phase: 5.6, depth: 2 },
      { x: 95, y: -330, r: 34, phase: 5.9, depth: 2 },
      { x: 160, y: -290, r: 44, phase: 0.3, depth: 0 },
      { x: 195, y: -305, r: 38, phase: 0.6, depth: 1 },
      { x: 145, y: -320, r: 35, phase: 0.9, depth: 1 },
      { x: 215, y: -280, r: 32, phase: 1.2, depth: 2 },
      { x: 175, y: -260, r: 30, phase: 1.5, depth: 2 },
      { x: 15, y: -340, r: 48, phase: 1.8, depth: 0 },
      { x: -15, y: -310, r: 42, phase: 2.1, depth: 1 },
      { x: 35, y: -295, r: 38, phase: 2.4, depth: 1 },
      { x: -5, y: -270, r: 34, phase: 2.7, depth: 2 },
    ];

    // ==========================================
    // KỊCH BẢN BAN ĐÊM: ÔNG ĂN TRỘM VÀ CHÚ CHÓ GIỮ NHÀ
    // ==========================================
    const thief: Thief = {
      active: false,
      state: "sneaking",
      x: -50,
      y: 0,
      speed: 1.2,
      bubbleText: "",
      timer: 0,
    };

    let thiefCooldown = 4.0; // Xuất hiện lần đầu sau 4s khi vào ban đêm

    let animationFrameId = 0;
    let time = 0;
    let lightningTimer = isStormMode ? 3.0 : 0;
    let lightningOpacity = 0;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      if (width < 768) {
        cancelAnimationFrame(animationFrameId);
        ctx.clearRect(0, 0, width, height);
        return;
      }
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", handleResize);

    // Click vào góc dưới màn hình có thể kích hoạt ăn trộm ngay (Easter egg)
    const handleCanvasClick = (e: MouseEvent) => {
      if (effectiveNight && !thief.active && e.clientY > window.innerHeight * 0.6) {
        thief.active = true;
        thief.state = "sneaking";
        const clickTreeBaseX = Math.max(width * 0.14, 115);
        thief.x = Math.max(clickTreeBaseX - 30, 20);
        thief.bubbleText = localeRef.current === "en" ? "Shh... 🤫" : "Suỵt... 🤫";
        thief.timer = 0;
      }
    };

    window.addEventListener("click", handleCanvasClick);

    const triggerLightning = () => {
      lightningOpacity = 0.98;
      const startX = width * 0.2 + Math.random() * (width * 0.6);
      const startY = 8;
      const targetY = height * 0.72 + Math.random() * (height * 0.2);

      const boltSegments = createLightningTree(startX, startY, targetY);
      activeBolts.push({
        segments: boltSegments,
        alpha: 1.0,
      });

      if (onThunderStrikeRef.current) {
        onThunderStrikeRef.current();
      }

      // Mô phỏng chớp nháy đúp đa tầng (Double/Triple strike flicker)
      setTimeout(() => {
        lightningOpacity = 0.75;
      }, 50);

      if (Math.random() < 0.6) {
        setTimeout(() => {
          lightningOpacity = 0.85;
          const subBolt = createLightningTree(
            startX + (Math.random() - 0.5) * 120,
            startY,
            targetY,
          );
          activeBolts.push({
            segments: subBolt,
            alpha: 0.92,
          });
        }, 110);
      }
    };

    const drawGroundMist = (
      layerIdx: number,
      baseY: number,
      waveHeight: number,
      speed: number,
      alpha: number,
    ) => {
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 35) {
        const wave =
          Math.sin(time * speed + x * 0.0035 + layerIdx * 1.6) * waveHeight +
          Math.sin(time * speed * 1.5 - x * 0.006) * (waveHeight * 0.45);
        ctx.lineTo(x, baseY + wave);
      }
      ctx.lineTo(width, height);
      ctx.closePath();

      const mistGrad = ctx.createLinearGradient(0, baseY - waveHeight, 0, height);
      const colorPrefix = effectiveNight ? "32, 45, 65" : "228, 238, 246";
      mistGrad.addColorStop(0, `rgba(${colorPrefix}, 0)`);
      mistGrad.addColorStop(0.45, `rgba(${colorPrefix}, ${alpha * 0.55})`);
      mistGrad.addColorStop(1, `rgba(${colorPrefix}, ${alpha})`);

      ctx.fillStyle = mistGrad;
      ctx.fill();
    };

    const drawFogPuff = (puff: FogPuff) => {
      ctx.save();
      ctx.translate(puff.x, puff.y);
      ctx.scale(1, puff.radiusY / puff.radiusX);

      const pGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, puff.radiusX);
      const currentAlpha = puff.baseAlpha * (0.85 + Math.sin(time * 0.8 + puff.phase) * 0.15);
      const colorPrefix = effectiveNight ? "28, 40, 60" : "232, 240, 248";

      pGrad.addColorStop(0, `rgba(${colorPrefix}, ${currentAlpha})`);
      pGrad.addColorStop(0.55, `rgba(${colorPrefix}, ${currentAlpha * 0.5})`);
      pGrad.addColorStop(1, `rgba(${colorPrefix}, 0)`);

      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(0, 0, puff.radiusX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // ==========================================
    // 2. Vòng lặp Render 60 FPS
    // ==========================================
    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      if (document.hidden) return;

      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      // --- TÍNH TOÁN GIÓ & GIÓ GIẬT ---
      const gustCycle = (Math.sin(time * (isStormMode ? 1.6 : 0.85)) + 1) / 2;
      const gustFactor = Math.pow(gustCycle, isStormMode ? 1.8 : 2.5);
      const baseWindFactor = Math.min(
        Math.max((windSpeed * (isStormMode ? 1.8 : 1)) / 12, 0.5),
        isStormMode ? 4.5 : 2.8,
      );
      const totalWind = baseWindFactor + gustFactor * (isStormMode ? 2.6 : 1.6);
      const windAngle = (isStormMode ? 0.32 : 0.16) * totalWind;

      // Chu trình sinh hoạt & dạo chơi của bạn nam, chú chó và chú mèo (84 giây / vòng)
      const tCycle = time % 84;

      // Hàm vẽ bong bóng thoại hoạt họa chuẩn đẹp
      const drawSpeechBubble = (
        bx: number,
        by: number,
        text: string,
        options?: {
          tailX?: number;
          tailY?: number;
          bg?: string;
          border?: string;
          textColor?: string;
          fontSize?: number;
        },
      ) => {
        if (!text) return;
        const bg = options?.bg ?? "#ffffff";
        const border = options?.border ?? "#2ec4b6";
        const textColor = options?.textColor ?? "#1d3557";
        const fontSize = options?.fontSize ?? 9.5;

        ctx.save();
        ctx.font = `bold ${fontSize}px sans-serif`;
        const textWidth = ctx.measureText(text).width;
        const paddingX = 8;
        const bubbleW = textWidth + paddingX * 2;
        const bubbleH = fontSize + 8;
        const rx = bx - bubbleW / 2;
        const ry = by - bubbleH;

        ctx.shadowColor = "rgba(0, 0, 0, 0.14)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = bg;
        ctx.strokeStyle = border;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(rx, ry, bubbleW, bubbleH, [5, 5, 5, 5]);
        ctx.fill();
        ctx.stroke();

        ctx.shadowColor = "transparent";
        const tailTipX = options?.tailX ?? bx;
        const tailTipY = options?.tailY ?? by + 4;
        ctx.beginPath();
        ctx.moveTo(bx - 3.5, ry + bubbleH - 0.5);
        ctx.lineTo(tailTipX, tailTipY);
        ctx.lineTo(bx + 3.5, ry + bubbleH - 0.5);
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(bx - 3.5, ry + bubbleH);
        ctx.lineTo(tailTipX, tailTipY);
        ctx.lineTo(bx + 3.5, ry + bubbleH);
        ctx.strokeStyle = border;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, bx, ry + bubbleH / 2);
        ctx.restore();
      };

      // ==========================================
      // A. NỀN TRỜI & ÁNH SÁNG THIÊN THỂ (QUỸ ĐẠO THỰC TẾ)
      // ==========================================
      const now = new Date();
      const currentMinutes = getTimezoneClockMinutes(DEFAULT_TIMEZONE, now);

      const sunriseMinutes = parseClockMinutes(sunrise) ?? 5 * 60 + 50;
      const sunsetMinutes = parseClockMinutes(sunset) ?? 17 * 60 + 15;

      const isRealDayTime = currentMinutes >= sunriseMinutes && currentMinutes <= sunsetMinutes;
      let realSunProgress = 0.5;
      if (isRealDayTime) {
        realSunProgress = (currentMinutes - sunriseMinutes) / (sunsetMinutes - sunriseMinutes);
      } else if (currentMinutes > sunsetMinutes) {
        realSunProgress = 1.0;
      } else {
        realSunProgress = 0.0;
      }

      // Khi người dùng bấm xem thủ công "sunny" vào ban đêm: hiển thị mặt trời ở vị trí 14h chiều (0.72)
      const effectiveSunProgress =
        activeEffect === "sunny" && !isRealDayTime
          ? 0.72
          : Math.min(Math.max(realSunProgress, 0), 1);
      const sunX = width * (0.12 + 0.76 * effectiveSunProgress);
      const sunY = height * (0.58 - 0.42 * Math.sin(effectiveSunProgress * Math.PI));

      // Mặt trăng: bắt đầu mọc lúc hoàng hôn (sunset), lên thiên đỉnh nửa đêm, lặn lúc bình minh
      const totalNightMinutes = 24 * 60 - sunsetMinutes + sunriseMinutes;
      let minutesIntoNight = 0;
      if (currentMinutes >= sunsetMinutes) {
        minutesIntoNight = currentMinutes - sunsetMinutes;
      } else if (currentMinutes < sunriseMinutes) {
        minutesIntoNight = 24 * 60 - sunsetMinutes + currentMinutes;
      } else {
        minutesIntoNight = totalNightMinutes * 0.78;
      }
      const nightProgress = Math.min(Math.max(minutesIntoNight / totalNightMinutes, 0), 1);
      const moonX = width * (0.12 + 0.76 * nightProgress);
      const moonY = height * (0.58 - 0.42 * Math.sin(nightProgress * Math.PI));

      const effectiveMoonPhase =
        typeof moonPhase === "number" && !isNaN(moonPhase)
          ? moonPhase
          : calculateAstronomicalMoonPhase(now);

      if (isStormMode) {
        const stormGrad = ctx.createLinearGradient(0, 0, 0, height);
        stormGrad.addColorStop(0, "rgba(22, 28, 44, 0.72)");
        stormGrad.addColorStop(0.5, "rgba(35, 45, 68, 0.55)");
        stormGrad.addColorStop(1, "rgba(20, 25, 38, 0.78)");
        ctx.fillStyle = stormGrad;
        ctx.fillRect(0, 0, width, height);
      } else if (effectiveNight) {
        const nightGrad = ctx.createLinearGradient(0, 0, 0, height);
        nightGrad.addColorStop(0, "rgba(6, 10, 22, 0.95)");
        nightGrad.addColorStop(0.55, "rgba(12, 19, 38, 0.88)");
        nightGrad.addColorStop(1, "rgba(15, 24, 46, 0.82)");
        ctx.fillStyle = nightGrad;
        ctx.fillRect(0, 0, width, height);

        // Ngàn sao lấp lánh (giảm độ sáng khi trời mưa/sương che phủ ban đêm)
        const starDim = isRainMode ? 0.2 : isFogMode ? 0.38 : 1;
        for (let i = 0; i < stars.length; i++) {
          const st = stars[i];
          const twinkle = (Math.sin(time * st.twinkleSpeed + st.twinklePhase) + 1) / 2;
          const alpha = st.baseAlpha * (0.35 + twinkle * 0.65) * starDim;

          ctx.beginPath();
          ctx.arc(st.x, st.y, st.size, 0, Math.PI * 2);
          ctx.fillStyle = `${st.color} ${alpha})`;
          ctx.shadowColor = "rgba(220, 240, 255, 0.8)";
          ctx.shadowBlur = st.hasSpike ? 8 : 3;
          ctx.fill();

          if (st.hasSpike && twinkle > 0.78) {
            const spikeLen = st.size * 3.6;
            ctx.strokeStyle = `${st.color} ${alpha * 0.65})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(st.x - spikeLen, st.y);
            ctx.lineTo(st.x + spikeLen, st.y);
            ctx.moveTo(st.x, st.y - spikeLen);
            ctx.lineTo(st.x, st.y + spikeLen);
            ctx.stroke();
          }
        }
        ctx.shadowBlur = 0;

        // Sao băng lướt qua bầu trời
        shootingStarTimer += 0.016;
        if (shootingStarTimer > 6.0 + Math.random() * 6.0 && !currentShootingStar) {
          shootingStarTimer = 0;
          currentShootingStar = {
            x: Math.random() * (width * 0.65),
            y: Math.random() * (height * 0.35),
            length: 110 + Math.random() * 80,
            speed: 16 + Math.random() * 8,
            angle: 0.58 + (Math.random() - 0.5) * 0.2,
            alpha: 1.0,
          };
        }

        if (currentShootingStar) {
          const ss = currentShootingStar;
          ss.x += Math.cos(ss.angle) * ss.speed;
          ss.y += Math.sin(ss.angle) * ss.speed;
          ss.alpha -= 0.024;

          const tailX = ss.x - Math.cos(ss.angle) * ss.length;
          const tailY = ss.y - Math.sin(ss.angle) * ss.length;

          const starGrad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
          starGrad.addColorStop(0, `rgba(255, 255, 255, ${ss.alpha})`);
          starGrad.addColorStop(0.3, `rgba(200, 230, 255, ${ss.alpha * 0.6})`);
          starGrad.addColorStop(1, "rgba(180, 220, 255, 0)");

          ctx.lineWidth = 1.6;
          ctx.strokeStyle = starGrad;
          ctx.beginPath();
          ctx.moveTo(ss.x, ss.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();

          if (ss.alpha <= 0 || ss.x > width || ss.y > height) {
            currentShootingStar = null;
          }
        }

        // Mặt trăng theo pha thiên văn học thực tế (Full moon vào ngày Rằm 15-16, khuyết/bán nguyệt các ngày khác)
        drawRealisticMoon(ctx, moonX, moonY, 32, effectiveMoonPhase);
      } else {
        if (activeEffect === "sunny") {
          const minutesToSunset = sunsetMinutes - currentMinutes;
          const minutesFromSunrise = currentMinutes - sunriseMinutes;
          const sunsetWarmth =
            isRealDayTime && minutesToSunset >= 0 && minutesToSunset <= 50
              ? 1 - minutesToSunset / 50
              : 0;
          const sunriseWarmth =
            isRealDayTime && minutesFromSunrise >= 0 && minutesFromSunrise <= 50
              ? 1 - minutesFromSunrise / 50
              : 0;
          const twilightRatio = Math.max(sunsetWarmth, sunriseWarmth);

          const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
          skyGrad.addColorStop(
            0,
            twilightRatio > 0
              ? `rgba(${Math.round(215 - twilightRatio * 45)}, ${Math.round(238 - twilightRatio * 68)}, ${Math.round(255 - twilightRatio * 55)}, 0.55)`
              : "rgba(215, 238, 255, 0.45)",
          );
          skyGrad.addColorStop(
            0.6,
            twilightRatio > 0
              ? `rgba(255, ${Math.round(248 - twilightRatio * 42)}, ${Math.round(255 - twilightRatio * 80)}, ${0.2 + twilightRatio * 0.2})`
              : "rgba(240, 248, 255, 0.2)",
          );
          skyGrad.addColorStop(
            1,
            twilightRatio > 0
              ? `rgba(255, ${Math.round(250 - twilightRatio * 65)}, ${Math.round(235 - twilightRatio * 95)}, ${0.35 + twilightRatio * 0.25})`
              : "rgba(255, 250, 235, 0.35)",
          );
          ctx.fillStyle = skyGrad;
          ctx.fillRect(0, 0, width, height);

          const glareIntensity = Math.min(Math.max((temperature - 20) / 14, 0.5), 1.25);
          const baseSunRadius = 150 * glareIntensity;

          const sunGrad = ctx.createRadialGradient(
            sunX,
            sunY,
            25,
            sunX,
            sunY,
            baseSunRadius * (1.8 + Math.sin(time * 0.8) * 0.1),
          );
          sunGrad.addColorStop(0, `rgba(255, 245, 210, ${0.48 * glareIntensity})`);
          sunGrad.addColorStop(0.35, `rgba(255, 205, 110, ${0.22 * glareIntensity})`);
          sunGrad.addColorStop(0.7, `rgba(255, 160, 80, ${0.07 * glareIntensity})`);
          sunGrad.addColorStop(1, "rgba(255, 140, 50, 0)");

          ctx.fillStyle = sunGrad;
          ctx.beginPath();
          ctx.arc(sunX, sunY, baseSunRadius * 2.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(sunX, sunY, 34, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 235, 0.95)";
          ctx.shadowColor = "rgba(255, 215, 100, 0.9)";
          ctx.shadowBlur = 45;
          ctx.fill();
          ctx.shadowBlur = 0;

          const rayCount = 10;
          const rayLength = 380 * glareIntensity;
          const rayAngleOffset = time * 0.04;

          for (let i = 0; i < rayCount; i++) {
            const angle = (i * Math.PI * 2) / rayCount + rayAngleOffset;
            ctx.save();
            ctx.translate(sunX, sunY);
            ctx.rotate(angle);
            const rayGrad = ctx.createLinearGradient(0, 0, rayLength, 0);
            rayGrad.addColorStop(0, `rgba(255, 245, 190, ${0.14 * glareIntensity})`);
            rayGrad.addColorStop(0.5, `rgba(255, 215, 130, ${0.04 * glareIntensity})`);
            rayGrad.addColorStop(1, "rgba(255, 200, 100, 0)");
            ctx.fillStyle = rayGrad;
            ctx.beginPath();
            ctx.moveTo(38, -14);
            ctx.lineTo(rayLength, 0);
            ctx.lineTo(38, 14);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        } else if (activeEffect === "rain") {
          const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
          skyGrad.addColorStop(0, "rgba(185, 205, 225, 0.35)");
          skyGrad.addColorStop(1, "rgba(205, 220, 235, 0.2)");
          ctx.fillStyle = skyGrad;
          ctx.fillRect(0, 0, width, height);
        } else if (isFogMode) {
          const fogGrad = ctx.createLinearGradient(0, 0, 0, height);
          fogGrad.addColorStop(0, "rgba(215, 230, 242, 0.75)");
          fogGrad.addColorStop(0.5, "rgba(228, 238, 246, 0.65)");
          fogGrad.addColorStop(1, "rgba(238, 245, 250, 0.85)");
          ctx.fillStyle = fogGrad;
          ctx.fillRect(0, 0, width, height);

          const sunFogGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 180);
          sunFogGrad.addColorStop(0, "rgba(255, 252, 235, 0.6)");
          sunFogGrad.addColorStop(0.3, "rgba(255, 248, 215, 0.25)");
          sunFogGrad.addColorStop(1, "rgba(255, 245, 200, 0)");
          ctx.fillStyle = sunFogGrad;
          ctx.beginPath();
          ctx.arc(sunX, sunY, 180, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ==========================================
      // B. SƯƠNG MÙ TẦNG SÂU (BACKGROUND FOG)
      // ==========================================
      if (isFogMode) {
        for (let i = 0; i < fogPuffs.length; i++) {
          const puff = fogPuffs[i];
          if (puff.layer !== "back") continue;

          puff.x += puff.speedX * (totalWind * 0.6);
          if (puff.x > width + puff.radiusX) {
            puff.x = -puff.radiusX;
            puff.y = height * 0.1 + Math.random() * (height * 0.5);
          }
          drawFogPuff(puff);
        }
      }

      // --- CHỚP SẤM VÀ TIA SÉT ---
      const shouldTriggerLightning =
        isStormMode || (activeEffect === "rain" && rainIntensity === "heavy");

      if (shouldTriggerLightning) {
        lightningTimer += 0.016;
        const triggerThreshold = isStormMode ? 3.5 + Math.random() * 4.5 : 9.0 + Math.random() * 7;
        if (lightningTimer > triggerThreshold) {
          lightningTimer = 0;
          triggerLightning();
        }
      }

      if (lightningOpacity > 0) {
        lightningOpacity = Math.max(0, lightningOpacity - 0.045);
        ctx.fillStyle = `rgba(235, 245, 255, ${lightningOpacity})`;
        ctx.fillRect(0, 0, width, height);
      }

      for (let b = activeBolts.length - 1; b >= 0; b--) {
        const bolt = activeBolts[b];
        bolt.alpha -= 0.055;
        if (bolt.alpha <= 0) {
          activeBolts.splice(b, 1);
          continue;
        }

        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Tầng 1: Vầng sáng ion hóa màu tím lam lan tỏa khắp bầu trời
        ctx.shadowColor = "rgba(135, 205, 255, 0.95)";
        ctx.shadowBlur = 35;
        ctx.strokeStyle = `rgba(160, 220, 255, ${bolt.alpha * 0.45})`;
        for (let s = 0; s < bolt.segments.length; s++) {
          const seg = bolt.segments[s];
          ctx.lineWidth = seg.width * 3.2;
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
        }

        // Tầng 2: Luồng điện cao thế xanh ngọc điện tử
        ctx.shadowColor = "rgba(180, 240, 255, 1.0)";
        ctx.shadowBlur = 16;
        ctx.strokeStyle = `rgba(205, 245, 255, ${bolt.alpha * 0.8})`;
        for (let s = 0; s < bolt.segments.length; s++) {
          const seg = bolt.segments[s];
          ctx.lineWidth = seg.width * 1.8;
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
        }

        // Tầng 3: Lõi plasma trắng tinh chói lòa
        ctx.shadowBlur = 6;
        ctx.strokeStyle = `rgba(255, 255, 255, ${bolt.alpha})`;
        for (let s = 0; s < bolt.segments.length; s++) {
          const seg = bolt.segments[s];
          ctx.lineWidth = Math.max(1, seg.width * 0.9);
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // --- LÀN GIÓ THOẢNG QUA ---
      ctx.lineWidth = isStormMode ? 1.8 : 1.2;
      for (let i = 0; i < windStreams.length; i++) {
        const ws = windStreams[i];
        ws.x += ws.speed * totalWind;
        if (ws.x > width + 250) {
          ws.x = -ws.length - Math.random() * 200;
          ws.y = Math.random() * height * 0.85;
        }

        ctx.beginPath();
        ctx.strokeStyle = isStormMode
          ? `rgba(200, 225, 255, ${ws.alpha * 1.2})`
          : effectiveDay
            ? `rgba(180, 215, 240, ${ws.alpha * (0.8 + gustFactor * 0.6)})`
            : `rgba(230, 245, 255, ${ws.alpha * (0.6 + gustFactor * 0.6)})`;
        ctx.moveTo(ws.x, ws.y);
        ctx.bezierCurveTo(
          ws.x + ws.length * 0.4,
          ws.y + Math.sin(time * 2 + i) * 14,
          ws.x + ws.length * 0.7,
          ws.y - Math.sin(time * 2 + i) * 14,
          ws.x + ws.length,
          ws.y + 4,
        );
        ctx.stroke();
      }

      // ==========================================
      // B.2. DẢI ĐẤT CHÂN TRANG XANH MƯỢT (MINIMAL FOOTER DIORAMA GROUND)
      // ==========================================
      // Bối cục tinh giản ở sát đáy màn hình để không che lấp các card trung tâm
      const groundBaseY = height - 50;

      const treeBaseX = Math.max(width * 0.08, 75);
      const cottageW = 155;
      const cottageX = width - cottageW - 25;
      const cottageY = groundBaseY - 6;

      const dogHouseX = cottageX - 82;
      const dogHouseY = groundBaseY - 4;

      const catCondoX = dogHouseX - 60;
      const catCondoY = groundBaseY - 4;

      // Hồ cá & Bến câu cá
      const pondX = Math.max(treeBaseX + 135, width * 0.25);
      const pondY = groundBaseY + 12;
      const pondRadiusX = Math.min(65, width * 0.07);
      const pondRadiusY = 17;

      // 1. Thảm cỏ xanh chân trang uốn lượn mềm mại
      ctx.beginPath();
      ctx.moveTo(0, groundBaseY - 10);
      ctx.bezierCurveTo(
        width * 0.28,
        groundBaseY - 18,
        width * 0.65,
        groundBaseY - 6,
        width,
        groundBaseY - 12,
      );
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();

      const lawnGrad = ctx.createLinearGradient(0, groundBaseY - 18, 0, height);
      if (isStormMode) {
        lawnGrad.addColorStop(0, "#2c5436");
        lawnGrad.addColorStop(0.5, "#204028");
        lawnGrad.addColorStop(1, "#14281a");
      } else if (effectiveDay) {
        lawnGrad.addColorStop(0, "#5ba349");
        lawnGrad.addColorStop(0.38, "#478939");
        lawnGrad.addColorStop(0.75, "#376f2d");
        lawnGrad.addColorStop(1, "#275220");
      } else {
        lawnGrad.addColorStop(0, "#1c3c22");
        lawnGrad.addColorStop(0.5, "#112817");
        lawnGrad.addColorStop(1, "#09170d");
      }
      ctx.fillStyle = lawnGrad;
      ctx.fill();

      // 2. Dải viền đất mộc chân trang
      ctx.beginPath();
      ctx.moveTo(0, height - 16);
      ctx.bezierCurveTo(width * 0.35, height - 22, width * 0.7, height - 14, width, height - 16);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();

      const soilGrad = ctx.createLinearGradient(0, height - 22, 0, height);
      soilGrad.addColorStop(0, effectiveDay ? "#3b2316" : "#170e08");
      soilGrad.addColorStop(1, effectiveDay ? "#20120a" : "#0c0704");
      ctx.fillStyle = soilGrad;
      ctx.fill();

      // 3. Đường sỏi cuội nhỏ nhắn nối bến câu cá với hiên nhà
      const pathStartX = pondX + pondRadiusX + 10;
      const pathEndX = cottageX + 18;
      const stoneCount = Math.max(5, Math.floor((pathEndX - pathStartX) / 32));

      for (let s = 0; s < stoneCount; s++) {
        const tStep = s / stoneCount;
        const sx = pathStartX + tStep * (pathEndX - pathStartX) + Math.sin(s * 1.8) * 3;
        const sy = groundBaseY + 6 + Math.cos(s * 1.5) * 2;

        ctx.beginPath();
        ctx.ellipse(sx, sy, 6.5 + (s % 3), 2.8, 0.08, 0, Math.PI * 2);
        ctx.fillStyle = effectiveDay ? "rgba(185, 175, 160, 0.85)" : "rgba(85, 90, 100, 0.75)";
        ctx.fill();
        ctx.strokeStyle = effectiveDay ? "rgba(135, 125, 110, 0.4)" : "rgba(45, 50, 55, 0.5)";
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // ==========================================
      // D. CÂY CỔ THỤ NGHỆ THUẬT (ANCIENT GHIBLI TREE)
      // ==========================================
      // Tăng kích thước 0.68 và chi tiết hóa toàn bộ thân cây, rễ, vân vỏ, cành nhánh và tán lá hữu cơ
      const treeScale = 0.68;
      const trunkSway =
        Math.sin(time * (isStormMode ? 1.8 : 1.2)) * (isStormMode ? 0.055 : 0.024) * totalWind +
        gustFactor * (isStormMode ? 0.12 : 0.06) * baseWindFactor;

      ctx.save();
      ctx.translate(treeBaseX, groundBaseY + 6);
      ctx.scale(treeScale, treeScale);

      // 1. Rễ cây cổ thụ gồ ghề cắm sâu xuống lòng đất
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.strokeStyle = isStormMode
        ? "rgba(35, 20, 14, 0.95)"
        : effectiveDay
          ? "rgba(68, 42, 28, 0.95)"
          : "rgba(28, 16, 11, 0.95)";

      ctx.beginPath();
      ctx.moveTo(-16, 4);
      ctx.quadraticCurveTo(-60, 16, -115, 22);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(16, 4);
      ctx.quadraticCurveTo(70, 18, 135, 25);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-8, 2);
      ctx.quadraticCurveTo(-35, 24, -80, 28);
      ctx.lineWidth = 7;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(8, 2);
      ctx.quadraticCurveTo(45, 22, 90, 26);
      ctx.lineWidth = 7.5;
      ctx.stroke();

      // Cỏ xanh mướt đung đưa dưới gốc cây cổ thụ
      for (let g = 0; g < 32; g++) {
        const gx = -115 + g * 7.8;
        const gLen = 15 + Math.sin(g * 1.5) * 9;
        const gBend = Math.sin(time * 3 + g) * 4.5 * totalWind + totalWind * 3.2;

        ctx.beginPath();
        ctx.strokeStyle = isStormMode
          ? "rgba(30, 65, 40, 0.85)"
          : effectiveDay
            ? g % 2 === 0
              ? "rgba(65, 145, 75, 0.85)"
              : "rgba(110, 185, 80, 0.75)"
            : g % 2 === 0
              ? "rgba(35, 75, 45, 0.85)"
              : "rgba(50, 110, 65, 0.65)";
        ctx.lineWidth = 1.8;
        ctx.moveTo(gx, 4);
        ctx.quadraticCurveTo(gx + gBend * 0.5, 4 - gLen * 0.6, gx + gBend, 4 - gLen);
        ctx.stroke();
      }

      // 2. Thân cây & Vân gỗ cổ thụ uốn lượn tự nhiên
      ctx.rotate(trunkSway);
      ctx.beginPath();
      ctx.moveTo(-32, 4);
      ctx.bezierCurveTo(-26, -110, -18 + trunkSway * 35, -230, -10, -340);
      ctx.lineTo(12, -340);
      ctx.bezierCurveTo(20 + trunkSway * 35, -230, 28, -110, 36, 4);
      ctx.closePath();

      const woodGrad = ctx.createLinearGradient(-32, 0, 36, 0);
      if (isStormMode) {
        woodGrad.addColorStop(0, "#1a0f0a");
        woodGrad.addColorStop(0.3, "#2d180e");
        woodGrad.addColorStop(0.7, "#422516");
        woodGrad.addColorStop(1, "#1c100a");
      } else if (effectiveDay) {
        woodGrad.addColorStop(0, "#381f13");
        woodGrad.addColorStop(0.28, "#53301c");
        woodGrad.addColorStop(0.65, "#6f4327");
        woodGrad.addColorStop(0.88, "#835030");
        woodGrad.addColorStop(1, "#3c2114");
      } else {
        woodGrad.addColorStop(0, "#160e09");
        woodGrad.addColorStop(0.35, "#24160e");
        woodGrad.addColorStop(0.7, "#352014");
        woodGrad.addColorStop(1, "#180f0a");
      }
      ctx.fillStyle = woodGrad;
      ctx.fill();

      // Vân vỏ cây cổ thụ đa tầng
      for (let b = -22; b <= 24; b += 6) {
        ctx.beginPath();
        ctx.strokeStyle = effectiveDay
          ? b < 0
            ? "rgba(35, 18, 10, 0.55)"
            : "rgba(160, 110, 75, 0.35)"
          : "rgba(15, 8, 5, 0.6)";
        ctx.lineWidth = b % 12 === 0 ? 1.8 : 1.1;
        ctx.moveTo(b * 1.15, 2);
        ctx.bezierCurveTo(
          b * 0.95 + Math.sin(b) * 4,
          -100,
          b * 0.7 + trunkSway * 30,
          -220,
          b * 0.45,
          -336,
        );
        ctx.stroke();
      }

      // Hốc cây cổ thụ rêu phong (Tree Hollow)
      ctx.beginPath();
      ctx.ellipse(-2, -165, 7, 13, -0.08, 0, Math.PI * 2);
      ctx.fillStyle = isStormMode ? "#100906" : effectiveDay ? "#23130b" : "#0d0704";
      ctx.fill();
      ctx.strokeStyle = effectiveDay ? "rgba(95, 155, 75, 0.6)" : "rgba(45, 80, 40, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Mảng rêu xanh bám quanh hốc cây & gốc rễ
      ctx.fillStyle = effectiveDay ? "rgba(85, 145, 65, 0.65)" : "rgba(40, 80, 45, 0.5)";
      ctx.beginPath();
      ctx.ellipse(-8, -160, 4.5, 9, 0.15, 0, Math.PI * 2);
      ctx.ellipse(5, -170, 3.8, 7, -0.15, 0, Math.PI * 2);
      ctx.ellipse(-16, -25, 9, 20, 0.1, 0, Math.PI * 2);
      ctx.ellipse(18, -15, 8, 16, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Cụm nấm đỏ chấm trắng mọc ở gốc cây
      const drawTreeMushroom = (mx: number, my: number, size: number) => {
        ctx.save();
        ctx.fillStyle = "#e9ecef";
        ctx.fillRect(mx - size * 0.25, my - size * 0.8, size * 0.5, size * 0.8);
        ctx.beginPath();
        ctx.arc(mx, my - size * 0.8, size, Math.PI, 0);
        ctx.fillStyle = "#e63946";
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(mx - size * 0.4, my - size * 1.1, size * 0.22, 0, Math.PI * 2);
        ctx.arc(mx + size * 0.35, my - size * 1.05, size * 0.2, 0, Math.PI * 2);
        ctx.arc(mx, my - size * 1.35, size * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      drawTreeMushroom(-40, 2, 5.5);
      drawTreeMushroom(-48, 3, 4.2);
      drawTreeMushroom(38, 3, 4.8);

      // Cành nhánh cổ thụ vươn rộng
      const branchSway =
        Math.sin(time * (isStormMode ? 2.5 : 1.8)) * (isStormMode ? 0.09 : 0.045) * totalWind;

      // Hàm vẽ các cành nhánh chính
      const drawMainBranches = () => {
        // Cành lớn vươn sang trái
        ctx.save();
        ctx.translate(0, -210);
        ctx.rotate(-0.55 + branchSway);
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.quadraticCurveTo(-50, -45, -120, -65);
        ctx.lineWidth = 14;
        ctx.strokeStyle = isStormMode ? "#2a160c" : effectiveDay ? "#4c2c1a" : "#24140c";
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-55, -48);
        ctx.quadraticCurveTo(-85, -85, -130, -105);
        ctx.lineWidth = 7;
        ctx.stroke();

        // Dây leo buông rủ
        ctx.beginPath();
        ctx.moveTo(-100, -65);
        ctx.quadraticCurveTo(-105, -20, -98 + Math.sin(time * 2.5) * 12, 14);
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = isStormMode
          ? "rgba(45, 80, 50, 0.85)"
          : effectiveDay
            ? "rgba(95, 160, 85, 0.85)"
            : "rgba(45, 90, 50, 0.75)";
        ctx.stroke();
        ctx.restore();

        // Cành lớn vươn sang phải (che phủ bến câu cá & bờ hồ)
        ctx.save();
        ctx.translate(0, -260);
        ctx.rotate(0.48 + branchSway * 1.3);
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.quadraticCurveTo(60, -50, 165, -75);
        ctx.lineWidth = 15;
        ctx.strokeStyle = isStormMode ? "#301a0e" : effectiveDay ? "#55321f" : "#28160e";
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(80, -52);
        ctx.quadraticCurveTo(120, -90, 165, -115);
        ctx.lineWidth = 7.5;
        ctx.stroke();

        // Dây leo buông rủ
        ctx.beginPath();
        ctx.moveTo(135, -72);
        ctx.quadraticCurveTo(140, -30, 134 + Math.sin(time * 2.8) * 12, 10);
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = isStormMode
          ? "rgba(50, 90, 55, 0.85)"
          : effectiveDay
            ? "rgba(105, 175, 90, 0.85)"
            : "rgba(45, 95, 55, 0.75)";
        ctx.stroke();
        ctx.restore();

        // Nhánh ngọn vươn lên đỉnh tán
        ctx.save();
        ctx.translate(0, -340);
        ctx.rotate(branchSway * 0.8);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-15, -45, 12, -100);
        ctx.lineWidth = 9.5;
        ctx.strokeStyle = isStormMode ? "#2a160c" : effectiveDay ? "#4c2c1a" : "#20120a";
        ctx.stroke();
        ctx.restore();
      };

      // 3. Hàm vẽ khối tán lá hữu cơ Ghibli không bị hạt tròn nhân tạo
      const drawOrganicCluster = (
        ox: number,
        oy: number,
        radius: number,
        dark: string,
        mid: string,
        light: string,
        tip: string,
        phase: number,
      ) => {
        const lobes = 7;

        // Tầng 1: Lớp bóng tối sâu bên dưới (Deep underside shadow)
        ctx.fillStyle = dark;
        ctx.beginPath();
        for (let l = 0; l <= lobes; l++) {
          const ang = (l % lobes) * ((Math.PI * 2) / lobes);
          const rLobe = radius * (1.02 + Math.sin(ang * 2 + phase) * 0.12);
          const lx = ox + Math.cos(ang) * rLobe;
          const ly = oy + 6 + Math.sin(ang) * (rLobe * 0.9);
          if (l === 0) ctx.moveTo(lx, ly);
          else {
            const prevAng = ((l - 1) % lobes) * ((Math.PI * 2) / lobes);
            const midAng = (prevAng + ang) / 2;
            const bulge = radius * (1.14 + Math.cos(midAng * 3 + phase) * 0.1);
            ctx.quadraticCurveTo(
              ox + Math.cos(midAng) * bulge,
              oy + 6 + Math.sin(midAng) * (bulge * 0.92),
              lx,
              ly,
            );
          }
        }
        ctx.closePath();
        ctx.fill();

        // Tầng 2: Thân tán lá chính hữu cơ (Main foliage volume)
        ctx.fillStyle = mid;
        ctx.beginPath();
        for (let l = 0; l <= lobes; l++) {
          const ang = (l % lobes) * ((Math.PI * 2) / lobes);
          const rLobe = radius * (0.96 + Math.sin(ang * 2 + phase) * 0.11);
          const lx = ox + Math.cos(ang) * rLobe;
          const ly = oy + Math.sin(ang) * (rLobe * 0.9);
          if (l === 0) ctx.moveTo(lx, ly);
          else {
            const prevAng = ((l - 1) % lobes) * ((Math.PI * 2) / lobes);
            const midAng = (prevAng + ang) / 2;
            const bulge = radius * (1.08 + Math.cos(midAng * 3 + phase) * 0.09);
            ctx.quadraticCurveTo(
              ox + Math.cos(midAng) * bulge,
              oy + Math.sin(midAng) * (bulge * 0.9),
              lx,
              ly,
            );
          }
        }
        ctx.closePath();
        ctx.fill();

        // Tầng 3: Khối đón nắng nghiêng trái trên (Sunlit foliage crest)
        ctx.fillStyle = light;
        ctx.beginPath();
        const crestOx = ox - radius * 0.18;
        const crestOy = oy - radius * 0.22;
        const crestR = radius * 0.72;
        for (let l = 0; l <= 6; l++) {
          const ang = (l % 6) * ((Math.PI * 2) / 6);
          const rLobe = crestR * (0.95 + Math.sin(ang * 2 + phase + 1) * 0.1);
          const lx = crestOx + Math.cos(ang) * rLobe;
          const ly = crestOy + Math.sin(ang) * (rLobe * 0.9);
          if (l === 0) ctx.moveTo(lx, ly);
          else {
            const prevAng = ((l - 1) % 6) * ((Math.PI * 2) / 6);
            const midAng = (prevAng + ang) / 2;
            const bulge = crestR * (1.08 + Math.cos(midAng * 2 + phase) * 0.08);
            ctx.quadraticCurveTo(
              crestOx + Math.cos(midAng) * bulge,
              crestOy + Math.sin(midAng) * (bulge * 0.9),
              lx,
              ly,
            );
          }
        }
        ctx.closePath();
        ctx.fill();

        // Tầng 4: Điểm sáng viền lá đón nắng ấm rực rỡ (Highlight rim)
        ctx.fillStyle = tip;
        ctx.beginPath();
        const tipOx = ox - radius * 0.26;
        const tipOy = oy - radius * 0.32;
        const tipR = radius * 0.44;
        for (let l = 0; l <= 5; l++) {
          const ang = (l % 5) * ((Math.PI * 2) / 5);
          const rLobe = tipR * (0.94 + Math.sin(ang * 2 + phase + 2) * 0.1);
          const lx = tipOx + Math.cos(ang) * rLobe;
          const ly = tipOy + Math.sin(ang) * (rLobe * 0.88);
          if (l === 0) ctx.moveTo(lx, ly);
          else {
            const prevAng = ((l - 1) % 5) * ((Math.PI * 2) / 5);
            const midAng = (prevAng + ang) / 2;
            const bulge = tipR * (1.06 + Math.cos(midAng * 2 + phase) * 0.08);
            ctx.quadraticCurveTo(
              tipOx + Math.cos(midAng) * bulge,
              tipOy + Math.sin(midAng) * (bulge * 0.88),
              lx,
              ly,
            );
          }
        }
        ctx.closePath();
        ctx.fill();

        // Tầng 5: Đốm lá li ti viền ngoài xào xạc theo gió
        ctx.fillStyle = tip;
        for (let f = 0; f < 3; f++) {
          const fAng = -Math.PI * 0.7 + f * 0.45 + Math.sin(phase) * 0.2;
          const fx = ox + Math.cos(fAng) * (radius * 0.92);
          const fy = oy + Math.sin(fAng) * (radius * 0.82);
          ctx.beginPath();
          ctx.ellipse(fx, fy, radius * 0.12, radius * 0.07, fAng, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      // 4. Vẽ cụm tán lá 3 tầng chiều sâu
      for (let depth = 0; depth < 3; depth++) {
        // Vẽ cành cây sau khi vẽ xong tầng tán lá nền (depth 0) để tạo cảm giác cành len lỏi tự nhiên
        if (depth === 1) {
          drawMainBranches();
        }

        for (let i = 0; i < foliageClusters.length; i++) {
          const fc = foliageClusters[i];
          if (fc.depth !== depth) continue;

          const clusterSwayX =
            Math.sin(time * 2.2 + fc.phase) * (isStormMode ? 6 : 3) * totalWind +
            gustFactor * (isStormMode ? 9 : 5);
          const clusterSwayY = Math.cos(time * 2.5 + fc.phase) * (isStormMode ? 4 : 2) * totalWind;

          const cx = fc.x + clusterSwayX;
          const cy = fc.y + clusterSwayY;

          let darkTone = "#16331a";
          let midTone = "#2d6335";
          let lightTone = "#56984e";
          let tipTone = "#7ebf58";

          if (isStormMode) {
            darkTone = "#0d1e11";
            midTone = "#1a3821";
            lightTone = "#2c5434";
            tipTone = "#3f7249";
          } else if (effectiveNight) {
            darkTone = "#0a180e";
            midTone = "#142c19";
            lightTone = "#204627";
            tipTone = "#2f6037";
          } else if (activeEffect === "sunny") {
            darkTone = "#1e4425";
            midTone = "#387841";
            lightTone = "#6ba84b";
            tipTone = "#94d65a";
          }

          drawOrganicCluster(cx, cy, fc.r, darkTone, midTone, lightTone, tipTone, fc.phase);

          if (isRainMode && depth === 2 && Math.random() < (isStormMode ? 0.05 : 0.02)) {
            drips.push({
              x: treeBaseX + cx * treeScale,
              y: groundBaseY + (cy + fc.r) * treeScale,
              speedY: 2.5 + Math.random() * 3,
              alpha: 0.8,
            });
          }
        }
      }

      ctx.restore();

      // ==========================================
      // E. NGÔI NHÀ CỔ TÍCH CHÂU ÂU GHIBLI (FAIRY TALE ALPINE COTTAGE)
      // ==========================================
      ctx.save();
      ctx.translate(cottageX, cottageY);
      ctx.scale(0.85, 0.85);

      // 1. Bóng đổ đa tầng dưới móng nhà
      ctx.beginPath();
      ctx.ellipse(cottageW * 0.52, 7, cottageW * 0.58, 14, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
      ctx.fill();

      // 2. Chân móng xếp đá tảng tự nhiên (Stone Masonry Foundation)
      const fndH = 16;
      ctx.beginPath();
      ctx.roundRect(0, -fndH, cottageW, fndH, [0, 0, 6, 6]);
      const stoneGrad = ctx.createLinearGradient(0, -fndH, 0, 0);
      stoneGrad.addColorStop(0, effectiveDay ? "#8a7b6b" : "#322b24");
      stoneGrad.addColorStop(1, effectiveDay ? "#645749" : "#1e1914");
      ctx.fillStyle = stoneGrad;
      ctx.fill();

      // Họa tiết vân đá tảng xếp lớp
      ctx.strokeStyle = effectiveDay ? "rgba(55, 45, 35, 0.5)" : "rgba(12, 10, 8, 0.65)";
      ctx.lineWidth = 1.2;
      for (let st = 18; st < cottageW; st += 24) {
        ctx.beginPath();
        ctx.moveTo(st, -fndH);
        ctx.lineTo(st, 0);
        ctx.stroke();
      }
      for (let sl = -fndH / 2; sl < 0; sl += fndH / 2) {
        ctx.beginPath();
        ctx.moveTo(0, sl);
        ctx.lineTo(cottageW, sl);
        ctx.stroke();
      }

      // ----------------------------------------
      // 3. KHỐI GIAN CHÍNH: TẦNG 1 (MAIN HALL - GROUND FLOOR)
      // ----------------------------------------
      const mainLeft = 45;
      const mainW = cottageW - mainLeft;
      const floor1H = 58;
      const floor1Y = -fndH - floor1H;

      // Tường gạch thẻ đất nung cổ điển / Gạch mộc ấm áp
      ctx.beginPath();
      ctx.roundRect(mainLeft, floor1Y, mainW, floor1H, [4, 4, 0, 0]);
      const brickGrad = ctx.createLinearGradient(mainLeft, floor1Y, mainLeft, -fndH);
      brickGrad.addColorStop(0, effectiveDay ? "#b85d43" : "#441d13");
      brickGrad.addColorStop(0.5, effectiveDay ? "#a44e36" : "#36160d");
      brickGrad.addColorStop(1, effectiveDay ? "#8b3d27" : "#2a1008");
      ctx.fillStyle = brickGrad;
      ctx.fill();

      // Đường chỉ gạch đất nung tinh tế
      ctx.strokeStyle = effectiveDay ? "rgba(75, 25, 15, 0.35)" : "rgba(20, 5, 2, 0.45)";
      ctx.lineWidth = 1;
      for (let b = floor1Y + 10; b < -fndH; b += 10) {
        ctx.beginPath();
        ctx.moveTo(mainLeft, b);
        ctx.lineTo(cottageW, b);
        ctx.stroke();
      }

      // Dây thường xuân xanh leo bám bên tường góc phải
      ctx.fillStyle = effectiveDay ? "#2d6a4f" : "#122a20";
      const ivyNodes = [
        { x: cottageW - 4, y: -fndH - 12, r: 6 },
        { x: cottageW - 7, y: -fndH - 24, r: 7.5 },
        { x: cottageW - 5, y: -fndH - 38, r: 6.5 },
        { x: cottageW - 10, y: -fndH - 50, r: 5 },
      ];
      for (let iv = 0; iv < ivyNodes.length; iv++) {
        ctx.beginPath();
        ctx.arc(ivyNodes[iv].x, ivyNodes[iv].y, ivyNodes[iv].r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cửa sổ kính lớn 6 ô nghệ thuật (Grand Picture / Bay Window)
      const winX = mainLeft + 42;
      const winY = floor1Y + 8;
      const winW = 56;
      const winH = 40;

      // Quầng sáng ấm tỏa ra từ bên trong cửa sổ
      const winGlow = ctx.createRadialGradient(
        winX + winW / 2,
        winY + winH / 2,
        6,
        winX + winW / 2,
        winY + winH / 2,
        75,
      );
      winGlow.addColorStop(0, "rgba(255, 240, 140, 0.75)");
      winGlow.addColorStop(0.45, "rgba(255, 195, 65, 0.28)");
      winGlow.addColorStop(1, "rgba(255, 180, 50, 0)");
      ctx.fillStyle = winGlow;
      ctx.beginPath();
      ctx.arc(winX + winW / 2, winY + winH / 2, 75, 0, Math.PI * 2);
      ctx.fill();

      // Kính cửa sổ phát sáng vàng ấm
      ctx.fillStyle = effectiveDay ? "#fffadb" : "#ffd86b";
      ctx.beginPath();
      ctx.roundRect(winX, winY, winW, winH, [4, 4, 0, 0]);
      ctx.fill();
      ctx.strokeStyle = effectiveDay ? "#4a2a14" : "#1a0e06";
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // Nan gỗ chia 6 ô kính
      ctx.beginPath();
      ctx.moveTo(winX + winW / 3, winY);
      ctx.lineTo(winX + winW / 3, winY + winH);
      ctx.moveTo(winX + (winW * 2) / 3, winY);
      ctx.lineTo(winX + (winW * 2) / 3, winY + winH);
      ctx.moveTo(winX, winY + winH / 2);
      ctx.lineTo(winX + winW, winY + winH / 2);
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Rèm ren uốn lượn phong cách Ghibli
      ctx.fillStyle = effectiveDay ? "rgba(230, 95, 80, 0.55)" : "rgba(180, 50, 40, 0.7)";
      ctx.beginPath();
      ctx.moveTo(winX + 2, winY + 2);
      ctx.quadraticCurveTo(winX + 10, winY + winH / 2, winX + 4, winY + winH - 2);
      ctx.lineTo(winX + 2, winY + winH - 2);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(winX + winW - 2, winY + 2);
      ctx.quadraticCurveTo(winX + winW - 10, winY + winH / 2, winX + winW - 4, winY + winH - 2);
      ctx.lineTo(winX + winW - 2, winY + winH - 2);
      ctx.closePath();
      ctx.fill();

      // Máng hoa cửa sổ (Flower Window Box)
      const boxY = winY + winH;
      ctx.fillStyle = effectiveDay ? "#5c3317" : "#241307";
      ctx.fillRect(winX - 3, boxY, winW + 6, 9);
      ctx.strokeStyle = effectiveDay ? "#3d1f0a" : "#120803";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(winX - 3, boxY, winW + 6, 9);

      // Hoa cẩm tú cầu & hoa hồng nở rực rỡ trong máng
      const flColors = ["#e63946", "#ffb703", "#fb8500", "#ff006e", "#f72585", "#7209b7"];
      for (let fl = 0; fl < 10; fl++) {
        const fx = winX + 3 + fl * 5.4;
        const fy = boxY - 2 + Math.sin(fl * 1.6) * 3.2;

        ctx.fillStyle = "#38b000";
        ctx.beginPath();
        ctx.arc(fx - 1.5, fy + 2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = flColors[fl % flColors.length];
        ctx.beginPath();
        ctx.arc(fx, fy, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // ----------------------------------------
      // 4. KHỐI GIAN CHÍNH: TẦNG 2 & ÁP MÁI (HALF-TIMBER UPPER FLOOR & ATTIC)
      // ----------------------------------------
      const floor2H = 50;
      const floor2Y = floor1Y - floor2H;

      // Tường vôi màu kem bơ ấm áp phong cách châu Âu
      ctx.beginPath();
      ctx.rect(mainLeft + 4, floor2Y, mainW - 8, floor2H);
      const stuccoGrad = ctx.createLinearGradient(0, floor2Y, 0, floor1Y);
      stuccoGrad.addColorStop(0, effectiveDay ? "#fff8ec" : "#554c3e");
      stuccoGrad.addColorStop(1, effectiveDay ? "#eddcc6" : "#41382b");
      ctx.fillStyle = stuccoGrad;
      ctx.fill();

      // Dầm gỗ sồi Tudor (Half-Timbering Beams)
      ctx.strokeStyle = effectiveDay ? "#4a2a14" : "#1a0e06";
      ctx.lineWidth = 3.2;
      // Dầm viền đáy tầng 2
      ctx.beginPath();
      ctx.moveTo(mainLeft, floor1Y);
      ctx.lineTo(cottageW, floor1Y);
      ctx.stroke();

      // Cột dầm gỗ đứng
      ctx.beginPath();
      ctx.moveTo(mainLeft + 36, floor2Y);
      ctx.lineTo(mainLeft + 36, floor1Y);
      ctx.moveTo(cottageW - 36, floor2Y);
      ctx.lineTo(cottageW - 36, floor1Y);
      ctx.stroke();

      // Thanh gỗ bắt chéo chữ X cổ điển hai bên
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(mainLeft + 6, floor2Y);
      ctx.lineTo(mainLeft + 36, floor1Y);
      ctx.moveTo(mainLeft + 36, floor2Y);
      ctx.lineTo(mainLeft + 6, floor1Y);
      ctx.moveTo(cottageW - 36, floor2Y);
      ctx.lineTo(cottageW - 6, floor1Y);
      ctx.moveTo(cottageW - 6, floor2Y);
      ctx.lineTo(cottageW - 36, floor1Y);
      ctx.stroke();

      // Cửa sổ áp mái tròn (Round Attic Window) ở giữa tầng 2
      const atticX = (mainLeft + cottageW) / 2;
      const atticY = floor2Y + 24;
      const atticR = 11;

      // Quầng sáng từ gác xép
      const atticGlow = ctx.createRadialGradient(atticX, atticY, 2, atticX, atticY, 32);
      atticGlow.addColorStop(0, "rgba(255, 235, 120, 0.7)");
      atticGlow.addColorStop(1, "rgba(255, 180, 50, 0)");
      ctx.fillStyle = atticGlow;
      ctx.beginPath();
      ctx.arc(atticX, atticY, 32, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = effectiveDay ? "#fffadb" : "#ffd86b";
      ctx.beginPath();
      ctx.arc(atticX, atticY, atticR, 0, Math.PI * 2);
      ctx.fill();

      // Vành gỗ tròn & nan chữ thập
      ctx.strokeStyle = effectiveDay ? "#4a2a14" : "#1a0e06";
      ctx.lineWidth = 2.4;
      ctx.stroke();

      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(atticX - atticR, atticY);
      ctx.lineTo(atticX + atticR, atticY);
      ctx.moveTo(atticX, atticY - atticR);
      ctx.lineTo(atticX, atticY + atticR);
      ctx.stroke();

      // Mái vòm che nhỏ phía trên cửa sổ tròn
      ctx.strokeStyle = effectiveDay ? "#8b3d27" : "#2a1008";
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(atticX, atticY, atticR + 3, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();

      // ----------------------------------------
      // 5. ỐNG KHÓI ĐÁ MASONRY BỀ THẾ (GRAND STONE CHIMNEY)
      // ----------------------------------------
      const chimX = cottageW - 28;
      const chimY = floor2Y - 32;
      const chimW = 24;
      const chimH = 68;

      ctx.beginPath();
      ctx.rect(chimX, chimY, chimW, chimH);
      const chimGrad = ctx.createLinearGradient(chimX, 0, chimX + chimW, 0);
      chimGrad.addColorStop(0, effectiveDay ? "#754a3e" : "#2f1b16");
      chimGrad.addColorStop(0.5, effectiveDay ? "#916052" : "#3e241e");
      chimGrad.addColorStop(1, effectiveDay ? "#643c32" : "#24130f");
      ctx.fillStyle = chimGrad;
      ctx.fill();

      // Nắp chụp ống khói bằng đá
      ctx.fillStyle = effectiveDay ? "#4a2c24" : "#1a0d0a";
      ctx.fillRect(chimX - 3, chimY - 5, chimW + 6, 6);

      // Vân gạch đá trên ống khói
      ctx.strokeStyle = effectiveDay ? "rgba(45, 25, 20, 0.45)" : "rgba(10, 5, 4, 0.6)";
      ctx.lineWidth = 1;
      for (let cy = chimY + 8; cy < chimY + chimH; cy += 8) {
        ctx.beginPath();
        ctx.moveTo(chimX, cy);
        ctx.lineTo(chimX + chimW, cy);
        ctx.stroke();
      }

      // Khói nhả bồng bềnh uốn theo chiều gió
      for (let i = 0; i < chimneySmoke.length; i++) {
        const smk = chimneySmoke[i];
        smk.y -= smk.speedY;
        smk.x += smk.speedX + totalWind * 0.45;
        smk.size += 0.22;
        smk.alpha -= 0.007;

        if (smk.alpha <= 0) {
          smk.x = chimX + 12;
          smk.y = chimY - 5;
          smk.size = 4;
          smk.alpha = 0.62;
        }

        ctx.beginPath();
        ctx.arc(smk.x, smk.y, smk.size, 0, Math.PI * 2);
        ctx.fillStyle = effectiveDay
          ? `rgba(235, 240, 248, ${smk.alpha * 0.68})`
          : `rgba(175, 190, 215, ${smk.alpha * 0.48})`;
        ctx.fill();
      }

      // ----------------------------------------
      // 6. MÁI NGÓI DỐC CHỮ A UỐN CONG KIỂU GHIBLI (MAJESTIC SWEPT GABLE ROOF)
      // ----------------------------------------
      const roofPeakX = (mainLeft + cottageW) / 2 + 6;
      const roofPeakY = floor2Y - 26;
      const roofLeftX = mainLeft - 16;
      const roofRightX = cottageW + 16;
      const roofBaseY = floor2Y + 4;

      // Mái ngói dốc cong nhẹ uốn lượn (flared / swept curve)
      ctx.beginPath();
      ctx.moveTo(roofLeftX, roofBaseY);
      ctx.quadraticCurveTo(roofLeftX + 18, roofPeakY + 12, roofPeakX, roofPeakY);
      ctx.quadraticCurveTo(roofRightX - 18, roofPeakY + 12, roofRightX, roofBaseY);
      ctx.closePath();

      // Màu ngói xanh rêu đá Ghibli sâu thẳm / xanh ngọc bích cổ kính
      const roofGrad = ctx.createLinearGradient(0, roofPeakY, 0, roofBaseY);
      if (effectiveDay) {
        roofGrad.addColorStop(0, "#2a6f5e");
        roofGrad.addColorStop(0.4, "#215a4c");
        roofGrad.addColorStop(0.8, "#19453a");
        roofGrad.addColorStop(1, "#12332b");
      } else {
        roofGrad.addColorStop(0, "#163830");
        roofGrad.addColorStop(0.5, "#0f2621");
        roofGrad.addColorStop(1, "#091714");
      }
      ctx.fillStyle = roofGrad;
      ctx.fill();

      // Các hàng ngói vảy cá / ngói đất nung xếp lớp (Shingle Layer Curves)
      const roofRows = 5;
      for (let r = 1; r <= roofRows; r++) {
        const t = r / (roofRows + 1);
        const yRow = roofPeakY + (roofBaseY - roofPeakY) * t;
        const leftX = roofPeakX + (roofLeftX - roofPeakX) * t;
        const rightX = roofPeakX + (roofRightX - roofPeakX) * t;

        ctx.beginPath();
        ctx.moveTo(leftX, yRow);
        ctx.quadraticCurveTo(roofPeakX, yRow - 4, rightX, yRow);
        ctx.strokeStyle = effectiveDay ? "rgba(18, 51, 43, 0.6)" : "rgba(5, 15, 12, 0.7)";
        ctx.lineWidth = 2.6;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(leftX, yRow - 1.5);
        ctx.quadraticCurveTo(roofPeakX, yRow - 5.5, rightX, yRow - 1.5);
        ctx.strokeStyle = effectiveDay ? "rgba(82, 183, 136, 0.4)" : "rgba(42, 111, 94, 0.25)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Viền mép mái gỗ nổi dày
      ctx.beginPath();
      ctx.moveTo(roofLeftX - 2, roofBaseY + 2);
      ctx.quadraticCurveTo(roofLeftX + 18, roofPeakY + 12, roofPeakX, roofPeakY);
      ctx.quadraticCurveTo(roofRightX - 18, roofPeakY + 12, roofRightX + 2, roofBaseY + 2);
      ctx.strokeStyle = effectiveDay ? "#40916c" : "#1b4332";
      ctx.lineWidth = 3.6;
      ctx.stroke();

      // Chong chóng gió / Mũi tên gió (Weather Vane) trên đỉnh mái
      const vaneY = roofPeakY - 14;
      ctx.strokeStyle = effectiveDay ? "#ffd166" : "#806010";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(roofPeakX, roofPeakY);
      ctx.lineTo(roofPeakX, vaneY);
      ctx.stroke();

      // Mũi tên chỉ hướng gió
      const vaneAngle = totalWind * 0.15;
      ctx.save();
      ctx.translate(roofPeakX, vaneY);
      ctx.rotate(vaneAngle);
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(7, 0);
      ctx.lineTo(4, -3);
      ctx.moveTo(7, 0);
      ctx.lineTo(4, 3);
      ctx.stroke();
      // Chú gà trống nhỏ trên chong chóng
      ctx.fillStyle = effectiveDay ? "#e63946" : "#66181e";
      ctx.beginPath();
      ctx.arc(0, -3.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ----------------------------------------
      // 7. GIAN HIÊN CHE MƯA & CỬA GỖ VÒM (COVERED TIMBER PORCH & ENTRANCE)
      // ----------------------------------------
      const porchRoofLeft = -6;
      const porchRoofRight = mainLeft + 8;
      const porchRoofY1 = floor1Y - 10;
      const porchRoofY2 = floor1Y + 16;

      // Mái hiên che mưa dốc vươn rộng che chở
      ctx.beginPath();
      ctx.moveTo(porchRoofRight, porchRoofY1);
      ctx.lineTo(porchRoofLeft, porchRoofY2);
      ctx.lineTo(porchRoofLeft + 4, porchRoofY2 + 5);
      ctx.lineTo(porchRoofRight, porchRoofY1 + 5);
      ctx.closePath();
      const porchRoofGrad = ctx.createLinearGradient(0, porchRoofY1, 0, porchRoofY2);
      porchRoofGrad.addColorStop(0, effectiveDay ? "#2a6f5e" : "#163830");
      porchRoofGrad.addColorStop(1, effectiveDay ? "#19453a" : "#0f2621");
      ctx.fillStyle = porchRoofGrad;
      ctx.fill();
      ctx.strokeStyle = effectiveDay ? "#40916c" : "#1b4332";
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Cột trụ hiên gỗ sồi chạm khắc (2 cột đỡ mái hiên)
      const post1X = 6;
      const post2X = 48;
      const postY1 = porchRoofY2 + 3;
      const postY2 = -fndH;

      ctx.fillStyle = effectiveDay ? "#6b3c1b" : "#29160a";
      ctx.fillRect(post1X, postY1, 5.5, postY2 - postY1);
      ctx.fillRect(post2X, postY1, 5.5, postY2 - postY1);

      // Chân đế đá cột hiên
      ctx.fillStyle = effectiveDay ? "#8a7b6b" : "#322b24";
      ctx.fillRect(post1X - 2, postY2 - 4, 9.5, 4);
      ctx.fillRect(post2X - 2, postY2 - 4, 9.5, 4);

      // Lan can gỗ hiên nhà
      ctx.strokeStyle = effectiveDay ? "#542f15" : "#1c0f06";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(post1X + 5, -fndH - 14);
      ctx.lineTo(post2X, -fndH - 14);
      ctx.stroke();

      // Cửa chính vòm tròn bằng gỗ sồi cổ (Arched Oak Door)
      const doorX = 14;
      const doorY = -fndH - 52;
      const doorW = 32;
      const doorH = 52;

      ctx.beginPath();
      ctx.roundRect(doorX, doorY, doorW, doorH, [16, 16, 0, 0]);
      const doorGrad = ctx.createLinearGradient(doorX, 0, doorX + doorW, 0);
      doorGrad.addColorStop(0, effectiveDay ? "#5c3317" : "#241307");
      doorGrad.addColorStop(0.5, effectiveDay ? "#70401f" : "#2e1a0b");
      doorGrad.addColorStop(1, effectiveDay ? "#4e2a12" : "#1a0c04");
      ctx.fillStyle = doorGrad;
      ctx.fill();
      ctx.strokeStyle = effectiveDay ? "#381d09" : "#100602";
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // Ô kính tròn trên cửa chính phát sáng
      ctx.fillStyle = effectiveDay ? "#fffadb" : "#ffd86b";
      ctx.beginPath();
      ctx.arc(doorX + doorW / 2, doorY + 16, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = effectiveDay ? "#381d09" : "#100602";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Tay nắm cửa bằng đồng mạ vàng
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.arc(doorX + doorW - 6, doorY + 32, 2.4, 0, Math.PI * 2);
      ctx.fill();

      // Đèn lồng sắt treo hiên nhà (Hanging Porch Lantern)
      const lantX = post2X + 2;
      const lantY = postY1 + 10;

      const lantGlow = ctx.createRadialGradient(lantX, lantY + 4, 1, lantX, lantY + 4, 38);
      lantGlow.addColorStop(0, "rgba(255, 220, 110, 0.85)");
      lantGlow.addColorStop(0.5, "rgba(255, 180, 50, 0.25)");
      lantGlow.addColorStop(1, "rgba(255, 150, 30, 0)");
      ctx.fillStyle = lantGlow;
      ctx.beginPath();
      ctx.arc(lantX, lantY + 4, 38, 0, Math.PI * 2);
      ctx.fill();

      // Xích treo đèn
      ctx.strokeStyle = effectiveDay ? "#2d1f14" : "#110b07";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(lantX, postY1);
      ctx.lineTo(lantX, lantY);
      ctx.stroke();

      // Thân đèn lồng
      ctx.fillStyle = effectiveDay ? "#ffed99" : "#ffcc4d";
      ctx.fillRect(lantX - 4, lantY, 8, 10);
      ctx.strokeRect(lantX - 4, lantY, 8, 10);

      // Bậc thềm tam cấp xếp đá trước hiên
      ctx.fillStyle = effectiveDay ? "#8a7b6b" : "#322b24";
      ctx.beginPath();
      ctx.roundRect(doorX - 6, -10, doorW + 16, 5, [2, 2, 0, 0]);
      ctx.roundRect(doorX - 3, -5, doorW + 22, 5, [2, 2, 0, 0]);
      ctx.fill();
      ctx.strokeStyle = effectiveDay ? "rgba(50, 40, 30, 0.4)" : "rgba(10, 8, 6, 0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();

      // ==========================================
      // E.1. HỒ CÁ KOI SINH THÁI & BẾN CÂU CÁ (FISH POND & FISHING DOCK)
      // ==========================================
      ctx.save();

      // Bờ hồ xếp đá cuội tròn tự nhiên quanh mép nước
      const stoneStep = 0.38;
      for (let a = 0; a < Math.PI * 2; a += stoneStep) {
        const stoneDistX = pondRadiusX + 5 + Math.sin(a * 4) * 2;
        const stoneDistY = pondRadiusY + 3 + Math.cos(a * 3) * 1.5;
        const stX = pondX + Math.cos(a) * stoneDistX;
        const stY = pondY + Math.sin(a) * stoneDistY;
        const stRadius = 5.5 + Math.sin(a * 7) * 2;

        ctx.beginPath();
        ctx.ellipse(stX, stY, stRadius, stRadius * 0.55, a * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = effectiveDay
          ? Math.floor(a * 10) % 2 === 0
            ? "#96897b"
            : "#b5a898"
          : Math.floor(a * 10) % 2 === 0
            ? "#33312e"
            : "#45413c";
        ctx.fill();
        ctx.strokeStyle = effectiveDay ? "rgba(70, 60, 50, 0.4)" : "rgba(20, 20, 20, 0.5)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Mặt nước hồ cá (Gradient ngọc bích sâu thẳm trong veo)
      ctx.beginPath();
      ctx.ellipse(pondX, pondY, pondRadiusX, pondRadiusY, 0, 0, Math.PI * 2);
      const pondWaterGrad = ctx.createRadialGradient(
        pondX - 8,
        pondY - 4,
        6,
        pondX,
        pondY,
        pondRadiusX,
      );
      if (effectiveDay) {
        pondWaterGrad.addColorStop(0, "rgba(78, 195, 212, 0.92)");
        pondWaterGrad.addColorStop(0.65, "rgba(38, 142, 162, 0.96)");
        pondWaterGrad.addColorStop(1, "rgba(20, 92, 108, 0.98)");
      } else {
        pondWaterGrad.addColorStop(0, "rgba(26, 75, 92, 0.9)");
        pondWaterGrad.addColorStop(0.65, "rgba(14, 46, 58, 0.95)");
        pondWaterGrad.addColorStop(1, "rgba(8, 26, 34, 0.98)");
      }
      ctx.fillStyle = pondWaterGrad;
      ctx.fill();

      // Gợn sóng nước hồ lăn tăn
      const rippleWave = Math.sin(time * 2.5);
      ctx.strokeStyle = effectiveDay ? "rgba(255, 255, 255, 0.35)" : "rgba(160, 220, 240, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(
        pondX - 6 + rippleWave * 3,
        pondY - 3,
        pondRadiusX * 0.6,
        pondRadiusY * 0.55,
        0,
        0,
        Math.PI,
      );
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(
        pondX + 10 - rippleWave * 2,
        pondY + 4,
        pondRadiusX * 0.45,
        pondRadiusY * 0.4,
        0,
        0.2,
        Math.PI * 0.9,
      );
      ctx.stroke();

      // Đàn cá Koi bơi lội dưới làn nước (3 chú cá Koi xinh đẹp)
      const koiList = [
        {
          angle: time * 0.95,
          rX: pondRadiusX * 0.62,
          rY: pondRadiusY * 0.55,
          color: "#f77f00",
          spot: "#d62828",
          size: 8.5,
        },
        {
          angle: time * 0.78 + Math.PI,
          rX: pondRadiusX * 0.48,
          rY: pondRadiusY * 0.42,
          color: "#fcbf49",
          spot: "#ffffff",
          size: 7.5,
        },
        {
          angle: -time * 0.85 + 1.2,
          rX: pondRadiusX * 0.35,
          rY: pondRadiusY * 0.32,
          color: "#e63946",
          spot: "#ffffff",
          size: 6.8,
        },
      ];

      for (let k = 0; k < koiList.length; k++) {
        const koi = koiList[k];
        const kx = pondX + Math.cos(koi.angle) * koi.rX;
        const ky = pondY + Math.sin(koi.angle) * koi.rY;
        const heading = koi.angle + Math.PI / 2 + (k === 2 ? Math.PI : 0);
        const tailWiggle = Math.sin(time * 7 + k * 2) * 0.4;

        ctx.save();
        ctx.translate(kx, ky);
        ctx.rotate(heading);

        // Đuôi cá quẫy sóng
        ctx.save();
        ctx.rotate(tailWiggle);
        ctx.beginPath();
        ctx.moveTo(0, koi.size * 0.8);
        ctx.lineTo(-koi.size * 0.45, koi.size * 1.55);
        ctx.lineTo(koi.size * 0.45, koi.size * 1.55);
        ctx.closePath();
        ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
        ctx.fill();
        ctx.restore();

        // Thân cá Koi hình thoi mượt mà
        ctx.beginPath();
        ctx.ellipse(0, 0, koi.size * 0.38, koi.size * 0.95, 0, 0, Math.PI * 2);
        ctx.fillStyle = koi.color;
        ctx.fill();

        // Đốm hoa văn trên lưng cá
        ctx.beginPath();
        ctx.ellipse(0, -koi.size * 0.2, koi.size * 0.24, koi.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = koi.spot;
        ctx.fill();

        // Vây ngực cá trong suốt
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.ellipse(-koi.size * 0.4, 0, koi.size * 0.28, koi.size * 0.15, -0.5, 0, Math.PI * 2);
        ctx.ellipse(koi.size * 0.4, 0, koi.size * 0.28, koi.size * 0.15, 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Lá sen (Lily pads) và Hoa sen/súng nở trên mặt hồ
      const lilyPads = [
        { x: pondX - pondRadiusX * 0.45, y: pondY - 4, r: 8.5 },
        { x: pondX + pondRadiusX * 0.38, y: pondY - 6, r: 7.2 },
        { x: pondX + pondRadiusX * 0.15, y: pondY + 6, r: 6.5 },
      ];

      for (let lp = 0; lp < lilyPads.length; lp++) {
        const pad = lilyPads[lp];
        ctx.save();
        ctx.translate(pad.x, pad.y);
        ctx.fillStyle = effectiveDay ? "#2d6a4f" : "#132a20";
        ctx.beginPath();
        ctx.arc(0, 0, pad.r, 0.35, Math.PI * 2 - 0.35);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = effectiveDay ? "#40916c" : "#1b4332";
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Hoa sen nở trên lá sen thứ nhất
        if (lp === 0) {
          ctx.fillStyle = "#ff70a6";
          ctx.beginPath();
          ctx.arc(2, -3, 3.5, 0, Math.PI * 2);
          ctx.arc(-2, -3, 3.5, 0, Math.PI * 2);
          ctx.arc(0, -5, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffd166";
          ctx.beginPath();
          ctx.arc(0, -3, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Cầu gỗ / Bến câu cá (Wooden Fishing Dock) vươn ra bờ hồ bên trái
      const dockX = pondX - pondRadiusX - 18;
      const dockY = pondY - 8;
      const dockW = 58;
      const dockH = 11;

      // Cọc gỗ cắm mép nước
      ctx.fillStyle = effectiveDay ? "#583a24" : "#1f150d";
      ctx.fillRect(dockX + dockW - 7, dockY + dockH - 2, 5, 13);
      ctx.fillRect(dockX + 12, dockY + dockH - 2, 5, 10);

      // Tấm ván gỗ bến câu
      ctx.fillStyle = effectiveDay ? "#9c6644" : "#3b2619";
      ctx.fillRect(dockX, dockY, dockW, dockH);
      ctx.strokeStyle = effectiveDay ? "#7f4f24" : "#24170f";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(dockX, dockY, dockW, dockH);

      // Vạch các thớ gỗ lát sàn bến
      for (let px = dockX + 8; px < dockX + dockW; px += 8) {
        ctx.beginPath();
        ctx.moveTo(px, dockY);
        ctx.lineTo(px, dockY + dockH);
        ctx.stroke();
      }

      ctx.restore();

      // ==========================================
      // E.2. KHU VƯỜN HOA & HÀNG RÀO MỘC MẠC (ARTISTIC RUSTIC FENCE & FLOWER BUSHES)
      // ==========================================
      ctx.save();

      // 1. Hàng rào gỗ đồng quê 2 thanh ngang thanh thoát (Rustic 2-Rail Country Fence)
      const fenceX1 = catCondoX - 35;
      const fenceX2 = cottageX - 15;
      const fenceH = 24;
      const fenceY = groundBaseY - 14;

      // Cọc rào gỗ tròn mộc mạc (chỉ 5-6 cọc cách nhau 44px rộng rãi, không bị dày đặc như mã vạch)
      ctx.fillStyle = effectiveDay ? "#8d6a4a" : "#2b1e15";
      ctx.strokeStyle = effectiveDay ? "#6b4e33" : "#1a120c";
      ctx.lineWidth = 1;

      for (let fx = fenceX1; fx <= fenceX2; fx += 44) {
        ctx.beginPath();
        ctx.roundRect(fx - 2.5, fenceY - fenceH, 5, fenceH + 8, [2.5, 2.5, 0, 0]);
        ctx.fill();
        ctx.stroke();

        // Nút thớ gỗ
        ctx.fillStyle = effectiveDay ? "#6b4e33" : "#1a120c";
        ctx.beginPath();
        ctx.arc(fx, fenceY - fenceH * 0.45, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = effectiveDay ? "#8d6a4a" : "#2b1e15";
      }

      // 2 thanh gỗ ngang chạy dọc hàng rào
      ctx.fillStyle = effectiveDay ? "rgba(160, 125, 92, 0.95)" : "rgba(45, 32, 22, 0.95)";
      ctx.fillRect(fenceX1 - 4, fenceY - fenceH * 0.82, fenceX2 - fenceX1 + 8, 3.2);
      ctx.strokeRect(fenceX1 - 4, fenceY - fenceH * 0.82, fenceX2 - fenceX1 + 8, 3.2);

      ctx.fillRect(fenceX1 - 4, fenceY - fenceH * 0.38, fenceX2 - fenceX1 + 8, 3.2);
      ctx.strokeRect(fenceX1 - 4, fenceY - fenceH * 0.38, fenceX2 - fenceX1 + 8, 3.2);

      // 2. Các cụm hoa bụi tự nhiên mềm mại (Painterly Flower Clusters)
      // Cụm 1: Bụi hoa cẩm tú cầu xanh lam & hồng phấn cạnh hiên nhà
      const drawHydrangeaBush = (cx: number, cy: number, color: string, leafColor: string) => {
        // Tán lá xanh nền
        ctx.fillStyle = leafColor;
        ctx.beginPath();
        ctx.arc(cx - 10, cy - 6, 9, 0, Math.PI * 2);
        ctx.arc(cx + 8, cy - 8, 11, 0, Math.PI * 2);
        ctx.arc(cx, cy - 14, 12, 0, Math.PI * 2);
        ctx.arc(cx + 12, cy - 4, 8, 0, Math.PI * 2);
        ctx.fill();

        // Các chùm hoa nở rộ mềm mại
        ctx.fillStyle = color;
        const petals = [
          { x: cx - 6, y: cy - 14, r: 6.5 },
          { x: cx + 4, y: cy - 16, r: 7 },
          { x: cx - 10, y: cy - 8, r: 5.5 },
          { x: cx + 2, y: cy - 8, r: 6.5 },
          { x: cx + 10, y: cy - 10, r: 5.5 },
        ];
        for (const p of petals) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }

        // Nhụy hoa li ti
        ctx.fillStyle = effectiveDay ? "#ffffff" : "#d8e2dc";
        for (const p of petals) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      // Vẽ bụi hoa cạnh hiên nhà (Cottage base)
      drawHydrangeaBush(
        cottageX + 16,
        groundBaseY - 2,
        effectiveDay ? "#90e0ef" : "#2b4c59",
        effectiveDay ? "#2d6a4f" : "#132a20",
      );
      drawHydrangeaBush(
        cottageX + 38,
        groundBaseY + 2,
        effectiveDay ? "#f72585" : "#591334",
        effectiveDay ? "#1b4332" : "#0d1f18",
      );

      // Cụm 2: Cụm hoa hướng dương ven hàng rào
      const drawSunflower = (sx: number, sy: number) => {
        const sway = Math.sin(time * 2.5 + sx) * 2;
        ctx.strokeStyle = effectiveDay ? "#2d6a4f" : "#132a20";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(sx + sway * 0.4, sy - 12, sx + sway, sy - 24);
        ctx.stroke();

        ctx.fillStyle = effectiveDay ? "#ffb703" : "#664800";
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          ctx.beginPath();
          ctx.arc(sx + sway + Math.cos(a) * 6, sy - 24 + Math.sin(a) * 6, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = effectiveDay ? "#582f0e" : "#221205";
        ctx.beginPath();
        ctx.arc(sx + sway, sy - 24, 4.2, 0, Math.PI * 2);
        ctx.fill();
      };

      drawSunflower(dogHouseX - 22, groundBaseY - 4);
      drawSunflower(dogHouseX - 38, groundBaseY - 2);

      // Cụm 3: Cụm hoa oải hương (Lavender) ven hồ
      const drawLavender = (lx: number, ly: number) => {
        const sway = Math.sin(time * 3 + lx) * 2.2;
        ctx.strokeStyle = effectiveDay ? "#52b788" : "#1d4734";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.quadraticCurveTo(lx + sway * 0.5, ly - 8, lx + sway, ly - 16);
        ctx.stroke();

        ctx.fillStyle = effectiveDay ? "#7209b7" : "#320452";
        ctx.beginPath();
        ctx.arc(lx + sway, ly - 18, 2.2, 0, Math.PI * 2);
        ctx.arc(lx + sway - 1, ly - 15, 2.2, 0, Math.PI * 2);
        ctx.arc(lx + sway + 1, ly - 12, 2.2, 0, Math.PI * 2);
        ctx.fill();
      };

      drawLavender(pondX + pondRadiusX + 6, groundBaseY + 12);
      drawLavender(pondX + pondRadiusX + 16, groundBaseY + 14);
      drawLavender(pondX + pondRadiusX + 26, groundBaseY + 15);

      ctx.restore();

      // ==========================================
      // F. CHUỒNG RIÊNG CHO CHÚ CHÓ (DEDICATED DOGHOUSE - TO RÕ BỀ THẾ)
      // ==========================================
      ctx.save();
      ctx.translate(dogHouseX, dogHouseY);
      ctx.scale(0.85, 0.85);

      // Bóng đổ
      ctx.beginPath();
      ctx.ellipse(44, 4, 52, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
      ctx.fill();

      // Tường chuồng gỗ (mở rộng để chứa vừa chú chó to lớn)
      const dogW = 86;
      const dogH = 66;
      ctx.beginPath();
      ctx.roundRect(0, -dogH, dogW, dogH, [4, 4, 0, 0]);
      const dogWallGrad = ctx.createLinearGradient(0, -dogH, 0, 0);
      dogWallGrad.addColorStop(0, effectiveDay ? "#dfb079" : "#463422");
      dogWallGrad.addColorStop(1, effectiveDay ? "#b88750" : "#2c1f13");
      ctx.fillStyle = dogWallGrad;
      ctx.fill();

      // Mái ngói đỏ chuồng chó chữ A
      ctx.beginPath();
      ctx.moveTo(-8, -dogH);
      ctx.lineTo(dogW / 2, -dogH - 32);
      ctx.lineTo(dogW + 8, -dogH);
      ctx.closePath();
      const dogRoofGrad = ctx.createLinearGradient(0, -dogH - 32, 0, -dogH);
      dogRoofGrad.addColorStop(0, effectiveDay ? "#cc4c35" : "#441810");
      dogRoofGrad.addColorStop(1, effectiveDay ? "#993322" : "#280d08");
      ctx.fillStyle = dogRoofGrad;
      ctx.fill();
      ctx.strokeStyle = effectiveDay ? "#6e2114" : "#1a0805";
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // Cửa vòm ra vào rộng rãi
      const dogDoorW = 40;
      const dogDoorH = 50;
      const dogDoorX = (dogW - dogDoorW) / 2;
      const dogDoorY = -dogDoorH;

      ctx.beginPath();
      ctx.roundRect(dogDoorX, dogDoorY, dogDoorW, dogDoorH, [20, 20, 0, 0]);
      ctx.fillStyle = effectiveDay ? "#2b160b" : "#120803";
      ctx.fill();

      // Nệm ấm bên trong chuồng
      ctx.fillStyle = effectiveDay ? "#d94e34" : "#4d1b12";
      ctx.fillRect(dogDoorX + 2, -4, dogDoorW - 4, 4);

      // Biển tên hình khúc xương phía trên cửa (Bone Nameplate)
      const boneX = dogW / 2;
      const boneY = -dogH - 12;
      ctx.fillStyle = "#fffdf0";
      ctx.beginPath();
      ctx.roundRect(boneX - 16, boneY - 6, 32, 12, [5, 5, 5, 5]);
      ctx.fill();
      ctx.arc(boneX - 16, boneY - 5, 3.2, 0, Math.PI * 2);
      ctx.arc(boneX - 16, boneY + 5, 3.2, 0, Math.PI * 2);
      ctx.arc(boneX + 16, boneY - 5, 3.2, 0, Math.PI * 2);
      ctx.arc(boneX + 16, boneY + 5, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#8d5b2d";
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // Bát thức ăn của chó bên cạnh chuồng
      const bowlX = -18;
      const bowlY = 0;
      ctx.fillStyle = effectiveDay ? "#3a86ff" : "#1e4480";
      ctx.beginPath();
      ctx.ellipse(bowlX, bowlY - 3, 10, 4.8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // ==========================================
      // G. CHUỒNG RIÊNG CHO CHÚ MÈO MƯỚP (DEDICATED CAT CONDO - TO RỘNG)
      // ==========================================
      ctx.save();
      ctx.translate(catCondoX, catCondoY);
      ctx.scale(0.85, 0.85);

      // Bóng đổ
      ctx.beginPath();
      ctx.ellipse(35, 4, 42, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
      ctx.fill();

      // Tầng 1: Ngôi nhà hộp gỗ cho mèo mướp (Cat Cabin)
      const catBoxW = 66;
      const catBoxH = 58;
      ctx.beginPath();
      ctx.roundRect(0, -catBoxH, catBoxW, catBoxH, [4, 4, 0, 0]);
      const catWallGrad = ctx.createLinearGradient(0, -catBoxH, 0, 0);
      catWallGrad.addColorStop(0, effectiveDay ? "#cfb38a" : "#3d3224");
      catWallGrad.addColorStop(1, effectiveDay ? "#a88a62" : "#261e14");
      ctx.fillStyle = catWallGrad;
      ctx.fill();

      // Cửa vòm độc đáo hình ĐẦU MÈO CÓ TAI (Cat-Head Shaped Entry)
      const catEntryCenterX = catBoxW / 2;
      const catEntryCenterY = -catBoxH / 2 + 2;

      ctx.fillStyle = effectiveDay ? "#26160d" : "#0f0804";
      ctx.beginPath();
      ctx.arc(catEntryCenterX, catEntryCenterY, 16, 0, Math.PI * 2);
      ctx.fill();

      // Hai tai mèo nhọn của cửa
      ctx.beginPath();
      ctx.moveTo(catEntryCenterX - 13, catEntryCenterY - 6);
      ctx.lineTo(catEntryCenterX - 16, catEntryCenterY - 20);
      ctx.lineTo(catEntryCenterX - 5, catEntryCenterY - 13);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(catEntryCenterX + 5, catEntryCenterY - 13);
      ctx.lineTo(catEntryCenterX + 16, catEntryCenterY - 20);
      ctx.lineTo(catEntryCenterX + 13, catEntryCenterY - 6);
      ctx.closePath();
      ctx.fill();

      // Tầng 2: Cột cào móng (Scratching Post) nối lên ban công quan sát
      const postX = catBoxW / 2;
      const postTopY = -catBoxH - 44;

      ctx.strokeStyle = effectiveDay ? "#d4b58a" : "#4a3c2c";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(postX, -catBoxH);
      ctx.lineTo(postX, postTopY);
      ctx.stroke();

      // Vòng dây thừng quấn quanh cột cào móng
      ctx.strokeStyle = effectiveDay ? "#8a6d47" : "#261d13";
      ctx.lineWidth = 1.3;
      for (let r = -catBoxH - 5; r > postTopY; r -= 5) {
        ctx.beginPath();
        ctx.moveTo(postX - 6, r);
        ctx.lineTo(postX + 6, r);
        ctx.stroke();
      }

      // Ban công / Đĩa nệm quan sát tầng trên (Observation Perch)
      const balconyW = 74;
      ctx.beginPath();
      ctx.ellipse(postX, postTopY, balconyW * 0.42, 7.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = effectiveDay ? "#995d3f" : "#321e14";
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(postX, postTopY - 3, balconyW * 0.36, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = effectiveDay ? "#e76f51" : "#542114";
      ctx.fill();

      // Quả bóng len đung đưa dưới ban công (Dangling Yarn Ball)
      const yarnSwing = Math.sin(time * 3) * 3.5 + totalWind * 4.5;
      const yarnOriginX = postX + 18;
      const yarnOriginY = postTopY + 2;
      const yarnBallX = yarnOriginX + yarnSwing;
      const yarnBallY = yarnOriginY + 16;

      ctx.strokeStyle = effectiveDay ? "#ffb703" : "#805c00";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(yarnOriginX, yarnOriginY);
      ctx.lineTo(yarnBallX, yarnBallY);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(yarnBallX, yarnBallY, 4, 0, Math.PI * 2);
      ctx.fillStyle = effectiveDay ? "#e63946" : "#66181e";
      ctx.fill();

      ctx.restore();

      // ==========================================
      // H. NHÂN VẬT BẠN NAM 22 TUỔI CHILL CHILL (THE 22-YEAR-OLD GUY)
      // ==========================================
      const isIndoors = isRainMode;
      const isFishingBite = effectiveDay && !isIndoors && Math.sin(time * 0.9) > 0.78;
      const bobberRipple = isFishingBite ? Math.sin(time * 18) * 3.5 : Math.sin(time * 3.2) * 1.5;

      ctx.save();

      if (!isIndoors && effectiveDay) {
        // --- 1. BAN NGÀY: BẠN NAM (TOÀN 22 TUỔI) Ở BẾN CÂU CÁ & ĐI DẠO KHẮP VƯỜN ---
        const dockGuyX = dockX + 22;
        const dockGuyY = dockY - 3;
        const guyScale = 1.38;

        const treeSpotX = treeBaseX + 35;
        const cottageSpotX = cottageX + 25;
        const dogPetSpotX = dogHouseX - 18;
        const catPetSpotX = catCondoX - 8;
        const groundWalkY = height - 40;

        const pEase = (p: number) => {
          const clamped = Math.max(0, Math.min(1, p));
          return clamped * clamped * (3 - 2 * clamped);
        };

        // Phân bổ trạng thái hoạt cảnh trong chu trình 84s
        let guyState:
          | "sitting_fishing"
          | "stretching_at_dock"
          | "announcing_walk"
          | "walking_to_tree"
          | "looking_at_tree"
          | "walking_to_cottage"
          | "looking_at_cottage"
          | "petting_dog"
          | "petting_cat"
          | "announcing_return"
          | "walking_to_dock" = "sitting_fishing";

        let currGuyX = dockGuyX;
        let currGuyY = dockGuyY;
        let facingLeft = false;
        let guyBubbleText = "";
        const isCanvasEn = localeRef.current === "en";

        if (tCycle < 14) {
          guyState = "sitting_fishing";
          currGuyX = dockGuyX;
          currGuyY = dockGuyY;
          if (tCycle >= 6 && tCycle < 9) {
            guyBubbleText = isCanvasEn ? "Got a bite! 🎣" : "Cắn câu rồi! 🎣";
          }
        } else if (tCycle >= 14 && tCycle < 17) {
          guyState = "stretching_at_dock";
          currGuyX = dockGuyX;
          currGuyY = dockGuyY;
          guyBubbleText = isCanvasEn ? "Haaa~ refreshing ✨" : "Haaa~ sảng khoái ✨";
        } else if (tCycle >= 17 && tCycle < 19) {
          guyState = "announcing_walk";
          currGuyX = dockGuyX;
          currGuyY = dockGuyY;
          facingLeft = true;
          guyBubbleText = isCanvasEn ? "Time for a walk! 🚶‍♂️" : "Chán quá, đi dạo xíu nào! 🚶‍♂️";
        } else if (tCycle >= 19 && tCycle < 24) {
          guyState = "walking_to_tree";
          const p = (tCycle - 19) / 5;
          currGuyX = dockGuyX + (treeSpotX - dockGuyX) * pEase(p);
          currGuyY = groundWalkY;
          facingLeft = true;
        } else if (tCycle >= 24 && tCycle < 28) {
          guyState = "looking_at_tree";
          currGuyX = treeSpotX;
          currGuyY = groundWalkY;
          facingLeft = false;
          guyBubbleText = isCanvasEn ? "Nice shady tree 🍃" : "Cây to râm mát ghê 🍃";
        } else if (tCycle >= 28 && tCycle < 35) {
          guyState = "walking_to_cottage";
          const p = (tCycle - 28) / 7;
          currGuyX = treeSpotX + (cottageSpotX - treeSpotX) * pEase(p);
          currGuyY = groundWalkY;
          facingLeft = false;
        } else if (tCycle >= 35 && tCycle < 39) {
          guyState = "looking_at_cottage";
          currGuyX = cottageSpotX;
          currGuyY = groundWalkY;
          facingLeft = true;
          guyBubbleText = isCanvasEn ? "Home sweet home 🏡✨" : "Nhà mình ấm cúng ghê 🏡✨";
        } else if (tCycle >= 39 && tCycle < 46) {
          guyState = "petting_dog";
          currGuyX = dogPetSpotX;
          currGuyY = groundWalkY;
          facingLeft = true;
          if (tCycle >= 40 && tCycle < 44) {
            guyBubbleText = isCanvasEn ? "Good boy 🥰" : "Chó ngoan của anh nè 🥰";
          }
        } else if (tCycle >= 46 && tCycle < 53) {
          guyState = "petting_cat";
          currGuyX = catPetSpotX;
          currGuyY = groundWalkY;
          facingLeft = true;
          if (tCycle >= 47 && tCycle < 51) {
            guyBubbleText = isCanvasEn ? "Cute kitty 🐱💖" : "Mèo béo ngoan ghê 🐱💖";
          }
        } else if (tCycle >= 53 && tCycle < 56) {
          guyState = "announcing_return";
          currGuyX = catPetSpotX;
          currGuyY = groundWalkY;
          facingLeft = true;
          guyBubbleText = isCanvasEn
            ? "Nice walk, back to fishing! 🎣"
            : "Đi dạo đã ghê, câu tiếp thôi! 🎣";
        } else if (tCycle >= 56 && tCycle < 62) {
          guyState = "walking_to_dock";
          const p = (tCycle - 56) / 6;
          currGuyX = catPetSpotX + (dockGuyX - catPetSpotX) * pEase(p);
          currGuyY = groundWalkY;
          facingLeft = true;
        } else {
          guyState = "sitting_fishing";
          currGuyX = dockGuyX;
          currGuyY = dockGuyY;
          if (tCycle >= 68 && tCycle < 72) {
            guyBubbleText = isCanvasEn ? "Love you both 💖" : "Yêu hai đứa ghê 💖";
          } else if (tCycle >= 75 && tCycle < 78) {
            guyBubbleText = isCanvasEn ? "Got a bite! 🎣" : "Cắn câu rồi! 🎣";
          }
        }

        const isSittingAtDock = guyState === "sitting_fishing";
        const armSway = isFishingBite ? Math.sin(time * 16) * 1.5 : 0;

        // 1. VẼ GHẾ GỖ, XÔ CÁ & CẦN CÂU TẠI BẾN CÂU CÁ
        ctx.save();
        ctx.translate(dockGuyX, dockGuyY);
        ctx.scale(guyScale, guyScale);

        // Bóng đổ dưới ghế
        ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
        ctx.beginPath();
        ctx.ellipse(0, 8, 12, 2.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Chân ghế sồi & thanh giằng chịu lực
        ctx.strokeStyle = "#5a3a22";
        ctx.lineWidth = 2.4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-7.5, 1);
        ctx.lineTo(-9, 8);
        ctx.moveTo(5.5, 1);
        ctx.lineTo(7, 8);
        ctx.stroke();
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-8.2, 4.8);
        ctx.lineTo(6.2, 4.8);
        ctx.stroke();

        // Mặt đệm gỗ ghế bo góc
        ctx.fillStyle = "#8a5832";
        ctx.beginPath();
        ctx.roundRect(-10.5, -1.5, 21, 4.8, [1.8, 1.8, 1.2, 1.2]);
        ctx.fill();
        ctx.strokeStyle = "#5a3a22";
        ctx.lineWidth = 0.9;
        ctx.stroke();

        // Xô đựng cá tráng kẽm bên cạnh ghế
        ctx.fillStyle = "#78909c";
        ctx.beginPath();
        ctx.moveTo(-18.5, 1);
        ctx.lineTo(-12.5, 1);
        ctx.lineTo(-13.5, 9);
        ctx.lineTo(-17.5, 9);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#546e7a";
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.fillStyle = "#48cae4";
        ctx.fillRect(-17, 2, 4, 2);
        const fishTailWag = Math.sin(time * 6) * 1.5;
        ctx.fillStyle = "#ff7043";
        ctx.beginPath();
        ctx.moveTo(-15, 2);
        ctx.lineTo(-16 + fishTailWag, -1);
        ctx.lineTo(-14 + fishTailWag, -1);
        ctx.closePath();
        ctx.fill();

        // Khi bạn nam đi vắng: Cần câu tre gác nghiêng vào ghế bến
        if (!isSittingAtDock) {
          ctx.strokeStyle = "#a9714b";
          ctx.lineWidth = 3.0;
          ctx.beginPath();
          ctx.moveTo(-6, 2);
          ctx.lineTo(4, -3);
          ctx.stroke();

          ctx.strokeStyle = "#c68b59";
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(4, -3);
          ctx.quadraticCurveTo(18, -14, 28, -18);
          ctx.stroke();

          ctx.strokeStyle = "#b0bec5";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(28, -18, 0.8, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();

        // 2. VẼ BẠN NAM THEO TỪNG TRẠNG THÁI
        if (isSittingAtDock) {
          // --- BẠN NAM NGỒI GHẾ CÂU CÁ ---
          ctx.save();
          ctx.translate(dockGuyX, dockGuyY);
          ctx.scale(guyScale, guyScale);

          // Chân bạn nam (quần jogger xám than, giày sneaker trắng)
          ctx.fillStyle = "#374151";
          ctx.beginPath();
          ctx.roundRect(0, -6, 9.5, 5.8, [2.5, 2.5, 2, 2]);
          ctx.fill();
          ctx.beginPath();
          ctx.roundRect(5.5, -2, 4.8, 8.5, [1.5, 1.5, 2, 2]);
          ctx.fill();
          ctx.fillStyle = "#1f2937";
          ctx.fillRect(5.5, 5, 4.8, 1.5);

          ctx.fillStyle = "#2c333f";
          ctx.beginPath();
          ctx.roundRect(-4.5, -5, 4.5, 10, [2, 2, 2, 2]);
          ctx.fill();
          ctx.fillStyle = "#1a202c";
          ctx.fillRect(-4.5, 3.8, 4.5, 1.4);

          // Sneaker trắng thời trang
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(5.2, 6.2, 7.8, 3.8, [1.5, 2.5, 2, 1]);
          ctx.fill();
          ctx.strokeStyle = "#9ca3af";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(5.2, 8.8);
          ctx.lineTo(12.5, 8.8);
          ctx.stroke();
          ctx.fillStyle = "#4b5563";
          ctx.fillRect(5.2, 6.2, 1.8, 1.8);

          ctx.fillStyle = "#f3f4f6";
          ctx.beginPath();
          ctx.roundRect(-4.8, 5, 6.5, 3.2, [1, 2, 2, 1]);
          ctx.fill();

          // Thân áo hoodie oversize màu kem cát ấm áp
          ctx.fillStyle = "#f5eee6";
          ctx.beginPath();
          ctx.roundRect(-8, -23, 16.5, 18, [6, 6, 4, 4]);
          ctx.fill();

          // Mũ trùm hoodie sau gáy
          ctx.fillStyle = "#ded4c5";
          ctx.beginPath();
          ctx.arc(-2.5, -21.5, 6.8, Math.PI * 0.8, Math.PI * 2.2);
          ctx.fill();

          // Túi kangaroo trước bụng
          ctx.strokeStyle = "#ded4c5";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(-5, -13, 9.5, 6.5, [2, 2, 2, 2]);
          ctx.stroke();

          // Dây rút hoodie với chuôi kim loại vàng
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(-1.5, -19);
          ctx.lineTo(-2, -12);
          ctx.moveTo(1.8, -19);
          ctx.lineTo(2.2, -12);
          ctx.stroke();
          ctx.fillStyle = "#d4af37";
          ctx.fillRect(-2.5, -12, 1.2, 2);
          ctx.fillRect(1.7, -12, 1.2, 2);

          // Hai tay cầm cần câu trúc thư thái
          ctx.strokeStyle = "#f5eee6";
          ctx.lineWidth = 3.8;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(0, -17);
          ctx.lineTo(7.5, -11 + armSway);
          ctx.lineTo(13.5, -13 + armSway);
          ctx.stroke();

          ctx.fillStyle = "#fcd5b5";
          ctx.beginPath();
          ctx.arc(13.5, -13 + armSway, 2.2, 0, Math.PI * 2);
          ctx.fill();

          // CẦN CÂU TRÚC UỐN CONG DUYÊN DÁNG
          const rodStartX = 13.5;
          const rodStartY = -13 + armSway;
          const rodEndX = 32;
          const rodEndY = -20 + armSway * 1.4;

          ctx.strokeStyle = "#a9714b";
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(rodStartX - 4, rodStartY + 2);
          ctx.lineTo(rodStartX + 2, rodStartY - 1);
          ctx.stroke();

          ctx.fillStyle = "#78909c";
          ctx.beginPath();
          ctx.arc(rodStartX + 1, rodStartY + 3, 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffb703";
          ctx.fillRect(rodStartX, rodStartY + 1.8, 2, 2.4);

          ctx.strokeStyle = "#c68b59";
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(rodStartX, rodStartY);
          ctx.quadraticCurveTo(rodStartX + 10, rodStartY - 11, rodEndX, rodEndY);
          ctx.stroke();

          ctx.strokeStyle = "#6e421f";
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(rodStartX + 5, rodStartY - 3);
          ctx.lineTo(rodStartX + 6, rodStartY - 4.5);
          ctx.moveTo(rodStartX + 12, rodStartY - 7);
          ctx.lineTo(rodStartX + 13, rodStartY - 8.5);
          ctx.moveTo(rodStartX + 20, rodStartY - 12);
          ctx.lineTo(rodStartX + 21, rodStartY - 13.5);
          ctx.stroke();

          // Cổ áo & ĐẦU BẠN NAM
          ctx.fillStyle = "#fcd5b5";
          ctx.fillRect(-1.5, -25, 3.2, 3);
          ctx.beginPath();
          ctx.ellipse(0.5, -28.5, 6.4, 7.0, 0.05, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "rgba(255, 138, 101, 0.38)";
          ctx.beginPath();
          ctx.ellipse(3.2, -27, 2.0, 1.2, 0, 0, Math.PI * 2);
          ctx.ellipse(-2.2, -27, 1.6, 1.0, 0, 0, Math.PI * 2);
          ctx.fill();

          // Mắt anime sáng
          ctx.strokeStyle = "#2d1a10";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(2.8, -29, 2.0, Math.PI * 1.1, Math.PI * 1.9);
          ctx.stroke();
          ctx.fillStyle = "#5c3a21";
          ctx.beginPath();
          ctx.arc(2.8, -28.2, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(2.4, -28.6, 0.65, 0, Math.PI * 2);
          ctx.fill();

          // Nụ cười mỉm
          ctx.strokeStyle = "#8d4f36";
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.arc(2.5, -26, 1.4, 0.1, Math.PI * 0.9);
          ctx.stroke();

          // Tóc undercut & mái bồng bềnh
          ctx.fillStyle = "#3d261a";
          ctx.beginPath();
          ctx.arc(-0.2, -31, 7.5, Math.PI * 0.9, Math.PI * 2.1);
          ctx.fill();
          const hairBreeze = Math.sin(time * 3) * 0.6;
          ctx.beginPath();
          ctx.moveTo(-1, -33.5);
          ctx.quadraticCurveTo(5, -34, 4.8 + hairBreeze, -29);
          ctx.lineTo(1.8, -30.5);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#7f4f24";
          ctx.beginPath();
          ctx.ellipse(0, -34, 4.5, 1.6, -0.2, 0, Math.PI * 2);
          ctx.fill();

          // Tai nghe AirPods Pro trắng
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.ellipse(-3.6, -28, 1.4, 2.2, 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#9ca3af";
          ctx.fillRect(-3.9, -26.8, 0.8, 1.8);

          ctx.restore();
        } else if (guyState === "stretching_at_dock") {
          // --- BẠN NAM ĐỨNG VƯƠN VAI TẠI BẾN ---
          ctx.save();
          ctx.translate(dockGuyX, dockGuyY);
          ctx.scale(guyScale, guyScale);

          // Chân đứng thẳng
          ctx.fillStyle = "#374151";
          ctx.beginPath();
          ctx.roundRect(-4.5, -4, 4.2, 13, [1.5, 1.5, 1, 1]);
          ctx.roundRect(1.5, -4, 4.2, 13, [1.5, 1.5, 1, 1]);
          ctx.fill();
          ctx.fillStyle = "#1f2937";
          ctx.fillRect(-4.5, 7.5, 4.2, 1.5);
          ctx.fillRect(1.5, 7.5, 4.2, 1.5);

          // Giày sneaker trắng
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(-5.2, 9, 5.8, 3.2, [1, 2, 2, 1]);
          ctx.roundRect(1.2, 9, 5.8, 3.2, [1, 2, 2, 1]);
          ctx.fill();

          // Thân áo hoodie
          ctx.fillStyle = "#f5eee6";
          ctx.beginPath();
          ctx.roundRect(-7.5, -24, 15, 21, [5, 5, 3, 3]);
          ctx.fill();

          // Hai tay giơ cao qua đầu vươn vai thư giãn
          ctx.strokeStyle = "#f5eee6";
          ctx.lineWidth = 3.8;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(-4.5, -20);
          ctx.lineTo(-8, -36);
          ctx.moveTo(4.5, -20);
          ctx.lineTo(8, -36);
          ctx.stroke();

          ctx.fillStyle = "#fcd5b5";
          ctx.beginPath();
          ctx.arc(-8, -37, 2.2, 0, Math.PI * 2);
          ctx.arc(8, -37, 2.2, 0, Math.PI * 2);
          ctx.fill();

          // Đầu ngửa nhẹ hít thở không khí trong lành
          ctx.fillStyle = "#fcd5b5";
          ctx.fillRect(-1.5, -26, 3, 3);
          ctx.beginPath();
          ctx.ellipse(0, -30, 6.2, 6.8, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "rgba(255, 138, 101, 0.4)";
          ctx.beginPath();
          ctx.ellipse(2.5, -28.5, 1.8, 1.1, 0, 0, Math.PI * 2);
          ctx.ellipse(-2.5, -28.5, 1.8, 1.1, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#3d261a";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, -30.5, 1.8, 0.1, Math.PI * 0.9);
          ctx.stroke();

          // Tóc
          ctx.fillStyle = "#3d261a";
          ctx.beginPath();
          ctx.arc(0, -33, 7.2, Math.PI * 0.9, Math.PI * 2.1);
          ctx.fill();

          ctx.restore();
        } else if (
          guyState === "walking_to_tree" ||
          guyState === "walking_to_cottage" ||
          guyState === "walking_to_dock"
        ) {
          // --- BẠN NAM ĐANG ĐI DẠO BƯỚC CHÂN TỰ NHIÊN ---
          ctx.save();
          ctx.translate(currGuyX, currGuyY);
          ctx.scale(facingLeft ? -guyScale : guyScale, guyScale);

          const legSwing = Math.sin(time * 8) * 5.0;
          const bodyBob = Math.abs(Math.sin(time * 8)) * 1.5;

          // Bóng đổ dưới chân di chuyển
          ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
          ctx.beginPath();
          ctx.ellipse(0, 10.5 - bodyBob * 0.3, 8.5, 2.4, 0, 0, Math.PI * 2);
          ctx.fill();

          // Chân sau
          ctx.fillStyle = "#2c333f";
          ctx.beginPath();
          ctx.roundRect(-4.5 - legSwing * 0.8, -4 - bodyBob, 4.2, 13, [1.5, 1.5, 1, 1]);
          ctx.fill();
          ctx.fillStyle = "#f3f4f6";
          ctx.beginPath();
          ctx.roundRect(-5.2 - legSwing * 0.8, 9 - bodyBob, 5.8, 3.2, [1, 2, 2, 1]);
          ctx.fill();

          // Chân trước
          ctx.fillStyle = "#374151";
          ctx.beginPath();
          ctx.roundRect(1.5 + legSwing, -4 - bodyBob, 4.2, 13, [1.5, 1.5, 1, 1]);
          ctx.fill();
          ctx.fillStyle = "#1f2937";
          ctx.fillRect(1.5 + legSwing, 7.5 - bodyBob, 4.2, 1.5);
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(1.2 + legSwing, 9 - bodyBob, 5.8, 3.2, [1, 2, 2, 1]);
          ctx.fill();
          ctx.strokeStyle = "#9ca3af";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(1.2 + legSwing, 11.2 - bodyBob);
          ctx.lineTo(7 + legSwing, 11.2 - bodyBob);
          ctx.stroke();

          // Thân áo hoodie oversize
          ctx.fillStyle = "#f5eee6";
          ctx.beginPath();
          ctx.roundRect(-7.5, -24 - bodyBob, 15, 21, [5, 5, 3, 3]);
          ctx.fill();

          ctx.strokeStyle = "#ded4c5";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(-4.5, -13 - bodyBob, 9, 7, [2, 2, 2, 2]);
          ctx.stroke();

          // Dây rút hoodie đung đưa
          const cordSway = Math.sin(time * 8 + 1) * 1.5;
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(-1.8, -20 - bodyBob);
          ctx.lineTo(-2.2 + cordSway, -12 - bodyBob);
          ctx.moveTo(1.8, -20 - bodyBob);
          ctx.lineTo(2.2 + cordSway, -12 - bodyBob);
          ctx.stroke();
          ctx.fillStyle = "#d4af37";
          ctx.fillRect(-2.7 + cordSway, -12 - bodyBob, 1.2, 2);
          ctx.fillRect(1.7 + cordSway, -12 - bodyBob, 1.2, 2);

          // Hai cánh tay vung nhẹ tự nhiên
          const armSwingWalk = -legSwing * 0.9;
          ctx.strokeStyle = "#f5eee6";
          ctx.lineWidth = 3.6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(-4, -18 - bodyBob);
          ctx.lineTo(-8 - armSwingWalk, -9 - bodyBob);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(4, -18 - bodyBob);
          ctx.lineTo(7 + armSwingWalk, -9 - bodyBob);
          ctx.stroke();
          ctx.fillStyle = "#fcd5b5";
          ctx.beginPath();
          ctx.arc(7 + armSwingWalk, -9 - bodyBob, 2.2, 0, Math.PI * 2);
          ctx.fill();

          // Đầu & Khuôn mặt
          ctx.fillStyle = "#fcd5b5";
          ctx.fillRect(-1.5, -26 - bodyBob, 3, 3);
          ctx.beginPath();
          ctx.ellipse(0.5, -30 - bodyBob, 6.2, 6.8, 0.05, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "rgba(255, 138, 101, 0.4)";
          ctx.beginPath();
          ctx.ellipse(3.2, -28.5 - bodyBob, 1.8, 1.1, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#2d1a10";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(2.8, -30.5 - bodyBob, 1.8, Math.PI * 1.1, Math.PI * 1.9);
          ctx.stroke();
          ctx.fillStyle = "#5c3a21";
          ctx.beginPath();
          ctx.arc(2.8, -29.8 - bodyBob, 1.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(2.4, -30.2 - bodyBob, 0.6, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#8d4f36";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(2.5, -27.5 - bodyBob, 1.4, 0.1, Math.PI * 0.9);
          ctx.stroke();

          ctx.fillStyle = "#3d261a";
          ctx.beginPath();
          ctx.arc(0, -32.5 - bodyBob, 7.2, Math.PI * 0.9, Math.PI * 2.1);
          ctx.fill();

          ctx.restore();
        } else if (
          guyState === "looking_at_tree" ||
          guyState === "looking_at_cottage" ||
          guyState === "announcing_walk" ||
          guyState === "announcing_return"
        ) {
          // --- BẠN NAM ĐỨNG NGẮM CẢNH (HAI TAY ĐÚT TÚI HOODIE THƯ THÁI) ---
          ctx.save();
          ctx.translate(currGuyX, currGuyY);
          ctx.scale(facingLeft ? -guyScale : guyScale, guyScale);

          const breathStanding = Math.sin(time * 2.5) * 0.8;

          ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
          ctx.beginPath();
          ctx.ellipse(0, 10.5, 9, 2.5, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#374151";
          ctx.beginPath();
          ctx.roundRect(-4.5, -4, 4.2, 13, [1.5, 1.5, 1, 1]);
          ctx.roundRect(1.5, -4, 4.2, 13, [1.5, 1.5, 1, 1]);
          ctx.fill();
          ctx.fillStyle = "#1f2937";
          ctx.fillRect(-4.5, 7.5, 4.2, 1.5);
          ctx.fillRect(1.5, 7.5, 4.2, 1.5);

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(-5.2, 9, 5.8, 3.2, [1, 2, 2, 1]);
          ctx.roundRect(1.2, 9, 5.8, 3.2, [1, 2, 2, 1]);
          ctx.fill();

          ctx.fillStyle = "#f5eee6";
          ctx.beginPath();
          ctx.roundRect(-7.5, -24 + breathStanding * 0.4, 15, 21, [5, 5, 3, 3]);
          ctx.fill();

          ctx.strokeStyle = "#ded4c5";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(-4.5, -13 + breathStanding * 0.4, 9, 7, [2, 2, 2, 2]);
          ctx.stroke();

          // Hai tay đút túi kangaroo (chill pose)
          ctx.strokeStyle = "#f5eee6";
          ctx.lineWidth = 3.6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(-5.5, -18 + breathStanding * 0.4);
          ctx.lineTo(-2.5, -10 + breathStanding * 0.4);
          ctx.moveTo(5.5, -18 + breathStanding * 0.4);
          ctx.lineTo(2.5, -10 + breathStanding * 0.4);
          ctx.stroke();

          ctx.fillStyle = "#fcd5b5";
          ctx.fillRect(-1.5, -26 + breathStanding * 0.3, 3, 3);
          ctx.beginPath();
          ctx.ellipse(0.5, -30 + breathStanding * 0.3, 6.2, 6.8, 0.05, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "rgba(255, 138, 101, 0.4)";
          ctx.beginPath();
          ctx.ellipse(3.2, -28.5 + breathStanding * 0.3, 1.8, 1.1, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#2d1a10";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(2.8, -31 + breathStanding * 0.3, 1.8, Math.PI * 1.1, Math.PI * 1.9);
          ctx.stroke();
          ctx.fillStyle = "#5c3a21";
          ctx.beginPath();
          ctx.arc(2.8, -30.5 + breathStanding * 0.3, 1.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(2.4, -31 + breathStanding * 0.3, 0.6, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#8d4f36";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(2.5, -27.5 + breathStanding * 0.3, 1.4, 0.1, Math.PI * 0.9);
          ctx.stroke();

          ctx.fillStyle = "#3d261a";
          ctx.beginPath();
          ctx.arc(0, -32.5 + breathStanding * 0.3, 7.2, Math.PI * 0.9, Math.PI * 2.1);
          ctx.fill();

          ctx.restore();
        } else {
          // --- BẠN NAM CÚI NGƯỜI XUỐNG VUỐT VE CHÓ HOẶC MÈO ---
          ctx.save();
          ctx.translate(currGuyX, currGuyY);
          ctx.scale(facingLeft ? -guyScale : guyScale, guyScale);

          const petStrokeVal = Math.sin(time * 6) * 1.8;

          ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
          ctx.beginPath();
          ctx.ellipse(0, 10.5, 9, 2.5, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#374151";
          ctx.beginPath();
          ctx.roundRect(-4.5, -2, 4.5, 11, [2, 2, 1, 1]);
          ctx.roundRect(1.5, -2, 4.5, 11, [2, 2, 1, 1]);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(-5.2, 8.5, 5.8, 3.2, [1, 2, 2, 1]);
          ctx.roundRect(1.2, 8.5, 5.8, 3.2, [1, 2, 2, 1]);
          ctx.fill();

          ctx.fillStyle = "#f5eee6";
          ctx.beginPath();
          ctx.roundRect(-6.5, -20, 15, 18, [6, 6, 4, 4]);
          ctx.fill();

          // Tay phải tì gối, tay trái vươn xuống vuốt ve
          ctx.strokeStyle = "#f5eee6";
          ctx.lineWidth = 3.8;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(3, -15);
          ctx.lineTo(6, -6);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(-2, -15);
          ctx.lineTo(-12, -2 + petStrokeVal);
          ctx.stroke();
          ctx.fillStyle = "#fcd5b5";
          ctx.beginPath();
          ctx.arc(-12, -2 + petStrokeVal, 2.4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#fcd5b5";
          ctx.fillRect(-1.5, -23, 3.2, 3);
          ctx.beginPath();
          ctx.ellipse(0.5, -26.5, 6.2, 6.8, 0.15, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "rgba(255, 138, 101, 0.4)";
          ctx.beginPath();
          ctx.ellipse(3, -25, 1.8, 1.1, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#2d1a10";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(2.5, -26.5, 1.8, 0.1, Math.PI * 0.9);
          ctx.stroke();

          ctx.strokeStyle = "#8d4f36";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(2.2, -24, 1.4, 0.1, Math.PI * 0.9);
          ctx.stroke();

          ctx.fillStyle = "#3d261a";
          ctx.beginPath();
          ctx.arc(0, -29, 7.2, Math.PI * 0.9, Math.PI * 2.1);
          ctx.fill();

          ctx.restore();
        }

        // 3. BONG BÓNG THOẠI CỦA BẠN NAM
        if (guyBubbleText) {
          const bubbleX =
            isSittingAtDock || guyState === "stretching_at_dock" || guyState === "announcing_walk"
              ? dockGuyX
              : currGuyX;
          const bubbleY = isSittingAtDock ? dockGuyY - 52 : currGuyY - 56;
          drawSpeechBubble(bubbleX, bubbleY, guyBubbleText, {
            tailX: bubbleX,
            tailY: bubbleY + 14,
            border: guyBubbleText.includes("💖") ? "#ff758f" : "#2ec4b6",
            textColor: guyBubbleText.includes("💖") ? "#780016" : "#0f4c5c",
          });
        }

        // 4. DÂY CƯỚC CÂU & PHAO NỔI TRÊN MẶT NƯỚC HỒ (LUÔN HOẠT ĐỘNG DÙ BẠN NAM ĐI DẠO)
        const rodTipWorldX = isSittingAtDock ? dockGuyX + 32 * guyScale : dockGuyX + 28 * guyScale;
        const rodTipWorldY = isSittingAtDock
          ? dockGuyY - 20 * guyScale + armSway * 1.4
          : dockGuyY - 18 * guyScale;
        const bobberX = pondX - 16;
        const bobberY = pondY - 2 + bobberRipple;

        ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(rodTipWorldX, rodTipWorldY);
        ctx.quadraticCurveTo(
          (rodTipWorldX + bobberX) / 2,
          (rodTipWorldY + bobberY) / 2 + 6,
          bobberX,
          bobberY,
        );
        ctx.stroke();

        ctx.fillStyle = "#e63946";
        ctx.beginPath();
        ctx.arc(bobberX, bobberY, 2.8, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(bobberX, bobberY, 2.8, 0, Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#1d3557";
        ctx.lineWidth = 0.6;
        ctx.stroke();

        if (isFishingBite) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.ellipse(bobberX, bobberY + 2, 8, 3.5, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(bobberX, bobberY + 2, 14, 6, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (isIndoors) {
        // --- 2. KHI MƯA BÃO: BẠN NAM ĐỨNG TRÚ MƯA DƯỚI HIÊN NHÀ GHIBLI ---
        const porchGuyX = cottageX + 28;
        const porchGuyY = cottageY - 4;
        const porchScale = 1.35;

        ctx.save();
        ctx.translate(porchGuyX, porchGuyY);
        ctx.scale(porchScale, porchScale);

        // Chân & giày
        ctx.fillStyle = "#374151";
        ctx.beginPath();
        ctx.roundRect(-3.5, -8, 4.5, 14, [1.5, 1.5, 1, 1]);
        ctx.roundRect(2.5, -8, 4.5, 14, [1.5, 1.5, 1, 1]);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(-3.8, 6, 5.5, 3.2, [1, 2, 2, 1]);
        ctx.roundRect(2.2, 6, 5.5, 3.2, [1, 2, 2, 1]);
        ctx.fill();

        // Áo hoodie oversize
        ctx.fillStyle = "#f5eee6";
        ctx.beginPath();
        ctx.roundRect(-7.5, -26, 17, 19, [6, 6, 4, 4]);
        ctx.fill();

        // Hai tay ôm cốc cà phê nóng
        ctx.fillStyle = "#e76f51";
        ctx.beginPath();
        ctx.roundRect(1, -16, 7, 8, [1.5, 1.5, 2, 2]);
        ctx.fill();
        ctx.strokeStyle = "#c44536";
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Khói cà phê bốc lên mờ ảo
        const steamY = Math.sin(time * 4) * 3;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(4.5, -18);
        ctx.quadraticCurveTo(2.5 + steamY, -24, 5.5, -28);
        ctx.stroke();

        // Đầu bạn nam
        ctx.fillStyle = "#fcd5b5";
        ctx.beginPath();
        ctx.ellipse(2, -31, 6.4, 7.0, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mắt nhắm nhẹ thư thái lắng nghe tiếng mưa
        ctx.strokeStyle = "#3d261a";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(3.5, -31, 1.8, 0.15, Math.PI * 0.85);
        ctx.stroke();

        // Má hồng
        ctx.fillStyle = "rgba(255, 138, 101, 0.38)";
        ctx.beginPath();
        ctx.ellipse(3.8, -29.5, 1.8, 1.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tóc undercut
        ctx.fillStyle = "#3d261a";
        ctx.beginPath();
        ctx.arc(1.5, -33.5, 7.5, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();

        ctx.restore();

        // Bong bóng ngắm mưa
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#457b9d";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(porchGuyX - 24, porchGuyY - 58, 64, 18, [4, 4, 4, 4]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#1d3557";
        ctx.font = "bold 9.5px sans-serif";
        ctx.fillText(
          localeRef.current === "en" ? "Cozy rain ☕" : "Mưa chill quá ☕",
          porchGuyX - 20,
          porchGuyY - 46,
        );
      } else {
        // --- 3. BAN ĐÊM TRỜI QUANG: BẠN NAM NGỒI GHẾ GỖ HIÊN NHÀ NGẮM SAO ---
        const nightGuyX = cottageX + 26;
        const nightGuyY = cottageY - 4;
        const nightScale = 1.35;

        ctx.save();
        ctx.translate(nightGuyX, nightGuyY);
        ctx.scale(nightScale, nightScale);

        // Ghế gỗ hiên nhà
        ctx.fillStyle = "#4a3319";
        ctx.fillRect(-10, 0, 16, 5);
        ctx.fillRect(-8, 5, 3, 7);
        ctx.fillRect(3, 5, 3, 7);

        // Bạn nam ngồi thư giãn
        ctx.fillStyle = "#374151";
        ctx.fillRect(-2, -6, 5, 11);
        ctx.fillStyle = "#f5eee6";
        ctx.beginPath();
        ctx.roundRect(-6, -24, 14, 18, [5, 5, 3, 3]);
        ctx.fill();

        ctx.fillStyle = "#fcd5b5";
        ctx.beginPath();
        ctx.arc(1, -29, 6.5, 0, Math.PI * 2);
        ctx.fill();

        // Ánh đèn lồng hắt lên khuôn mặt
        ctx.fillStyle = "rgba(255, 220, 120, 0.35)";
        ctx.beginPath();
        ctx.arc(1, -29, 6.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#2b1a10";
        ctx.beginPath();
        ctx.arc(0.5, -31.5, 7.2, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();

        // Mắt ngước nhìn bầu trời sao
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(3, -29.5, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#111111";
        ctx.beginPath();
        ctx.arc(3.4, -29.8, 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      ctx.restore();

      // ==========================================
      // I. HÀNH VI CHÓ, MÈO MƯỚP & KỊCH BẢN ĐÊM HÀI HƯỚC
      // ==========================================

      // ----------------------------------------
      // KỊCH BẢN KHÁCH ĐÊM HÀI HƯỚC (NIGHTTIME VISITOR)
      // ----------------------------------------
      if (effectiveNight && !isStormMode) {
        if (!thief.active) {
          thiefCooldown -= 0.016;
          if (thiefCooldown <= 0) {
            thief.active = true;
            thief.state = "sneaking";
            thief.x = Math.max(treeBaseX - 35, 10);
            thief.y = groundBaseY - 2;
            thief.speed = 1.3;
            thief.bubbleText = localeRef.current === "en" ? "Shh... 🤫" : "Suỵt... 🤫";
            thief.timer = 0;
            thiefCooldown = 28.0 + Math.random() * 15.0; // Xuất hiện định kỳ
          }
        } else {
          thief.timer += 0.016;

          if (thief.state === "sneaking") {
            thief.x += thief.speed;
            if (thief.x >= dogHouseX - 65) {
              thief.state = "alerted";
              thief.timer = 0;
              thief.bubbleText =
                localeRef.current === "en" ? "Ah! Guard dog! 😱" : "Á! Chó giữ nhà! 😱";
            }
          } else if (thief.state === "alerted") {
            if (thief.timer > 0.8) {
              thief.state = "bitten";
              thief.timer = 0;
              thief.bubbleText =
                localeRef.current === "en"
                  ? "Ouch! It got my pants! 💥"
                  : "Úi chà! Bị túm gấu quần rồi! 💥";
            }
          } else if (thief.state === "bitten") {
            if (thief.timer > 1.2) {
              thief.state = "fleeing";
              thief.timer = 0;
              thief.bubbleText =
                localeRef.current === "en" ? "Run for it! 💨" : "Chạy mau thôiii! 💨";
            }
          } else if (thief.state === "fleeing") {
            thief.x -= 6.8; // Bỏ chạy thục mạng sang trái
            if (thief.x < -60) {
              thief.active = false;
            }
          }

          // Vẽ nhân vật khách đêm
          const tfX = thief.x;
          const tfY = thief.state === "bitten" ? groundBaseY - 14 : groundBaseY - 2;
          const sneakStep = Math.sin(time * 8) * 3;
          const runStep = Math.sin(time * 24) * 6;

          ctx.save();
          ctx.translate(tfX, tfY);

          // Hướng quay mặt
          if (thief.state === "fleeing") {
            ctx.scale(-1, 1);
          }

          // Bao tải vác trên vai
          ctx.beginPath();
          ctx.ellipse(-12, -26, 11, 15, -0.3, 0, Math.PI * 2);
          ctx.fillStyle = "#8a582e";
          ctx.fill();
          ctx.fillStyle = "#ffd166";
          ctx.font = "bold 9px sans-serif";
          ctx.fillText("?", -15, -23);

          // Thân áo kẻ sọc đen trắng
          ctx.beginPath();
          ctx.roundRect(-6, -28, 14, 20, [3, 3, 2, 2]);
          ctx.fillStyle = "#ffffff";
          ctx.fill();

          ctx.fillStyle = "#1e1e1e";
          ctx.fillRect(-6, -24, 14, 3);
          ctx.fillRect(-6, -18, 14, 3);
          ctx.fillRect(-6, -12, 14, 3);

          // Chân bước rón rén hoặc chạy hoảng loạn
          ctx.strokeStyle = "#1a1a1a";
          ctx.lineWidth = 3.2;
          ctx.lineCap = "round";

          if (thief.state === "fleeing") {
            ctx.beginPath();
            ctx.moveTo(-2, -8);
            ctx.lineTo(-7 + runStep, 2);
            ctx.moveTo(4, -8);
            ctx.lineTo(8 - runStep, 2);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(-2, -8);
            ctx.lineTo(-4, 0 + sneakStep);
            ctx.moveTo(4, -8);
            ctx.lineTo(6, 0 - sneakStep);
            ctx.stroke();
          }

          // Đầu & Mũ len đen (Beanie)
          ctx.beginPath();
          ctx.arc(2, -34, 7.5, 0, Math.PI * 2);
          ctx.fillStyle = "#ffd6a5";
          ctx.fill();

          // Mũ len đen
          ctx.beginPath();
          ctx.arc(2, -37, 7.8, Math.PI, 0);
          ctx.fillStyle = "#111111";
          ctx.fill();

          // Mặt nạ đen (Eye Mask)
          ctx.fillStyle = "#111111";
          ctx.beginPath();
          ctx.roundRect(-2, -36, 11, 4.5, [2, 2, 2, 2]);
          ctx.fill();

          // Mắt le lói sau mặt nạ
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(1, -34, 1, 0, Math.PI * 2);
          ctx.arc(6, -34, 1, 0, Math.PI * 2);
          ctx.fill();

          // Bong bóng thoại
          if (thief.bubbleText) {
            ctx.save();
            if (thief.state === "fleeing") ctx.scale(-1, 1);
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#222222";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(-25, -60, 78, 17, [4, 4, 4, 4]);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#111111";
            ctx.font = "bold 9px sans-serif";
            ctx.fillText(thief.bubbleText, -20, -48);
            ctx.restore();
          }

          ctx.restore();
        }
      }

      // Vị trí đích đến khi chó & mèo đi lại sum vầy cạnh bạn nam
      const targetDogX = effectiveDay ? dockX - 32 : cottageX - 16;
      const targetDogY = effectiveDay ? height - 38 : cottageY + 8;
      const targetCatX = effectiveDay ? dockX + 50 : cottageX + 50;
      const targetCatY = effectiveDay ? dockY - 3 : cottageY + 6;

      // ----------------------------------------
      // 1. CHÚ CHÓ (THE DOG - TO LỚN, KHỎE KHOẮN)
      // ----------------------------------------
      const isDogChasing =
        thief.active &&
        (thief.state === "bitten" || thief.state === "alerted" || thief.state === "fleeing");

      if (isDogChasing) {
        // --- CHÓ ĐUỔI THEO KHÁCH ĐÊM ---
        const dogChaseX =
          thief.state === "bitten" ? thief.x + 22 : Math.max(dogHouseX - 60, thief.x + 32);
        const dogChaseY = height - 38;

        ctx.save();
        ctx.translate(dogChaseX, dogChaseY);
        ctx.scale(-1.22, 1.22); // Phóng to 1.22x quay mặt sang trái

        // Thân chó chồm lên
        ctx.beginPath();
        ctx.ellipse(0, -6, 17, 10, -0.2, 0, Math.PI * 2);
        ctx.fillStyle = "#e09f4a";
        ctx.fill();

        // Đuôi dựng đứng báo động
        ctx.beginPath();
        ctx.moveTo(15, -4);
        ctx.lineTo(24, -14);
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#e09f4a";
        ctx.stroke();

        // Chân chó sải bước lao tới
        ctx.strokeStyle = "#c98836";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-18, 8);
        ctx.moveTo(8, 0);
        ctx.lineTo(4, 8);
        ctx.stroke();

        // Đầu chó lao tới sủa
        ctx.beginPath();
        ctx.arc(-14, -12, 9, 0, Math.PI * 2);
        ctx.fillStyle = "#e09f4a";
        ctx.fill();

        // Tai chó dựng đứng
        ctx.fillStyle = "#b87528";
        ctx.beginPath();
        ctx.ellipse(-10, -18, 3.5, 6, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Mõm chó đang há to sủa
        ctx.fillStyle = "#faebd7";
        ctx.beginPath();
        ctx.ellipse(-20, -10, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#e63946";
        ctx.beginPath();
        ctx.arc(-22, -9, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Mắt tròn bảo vệ nhà
        ctx.fillStyle = "#1e130c";
        ctx.beginPath();
        ctx.arc(-16, -14, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Bong bóng thoại sủa của chó
        drawSpeechBubble(-45, -42, localeRef.current === "en" ? "WOOF WOOF! 🐕" : "GÂU GÂU! 🐕", {
          tailX: -24,
          tailY: -26,
          bg: "#ffffff",
          border: "#e63946",
          textColor: "#d90429",
          fontSize: 9.5,
        });

        ctx.restore();
      } else if (isIndoors) {
        // --- CHÓ NẰM TRONG CHUỒNG CỦA MÌNH (TRÚ MƯA) ---
        const dogHeadX = dogHouseX + 43;
        const dogHeadY = dogHouseY - 24;

        ctx.save();
        ctx.translate(dogHeadX, dogHeadY);
        ctx.scale(1.22, 1.22); // Phóng to 1.22x

        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fillStyle = "#e09f4a";
        ctx.fill();

        // Tai cụp
        ctx.fillStyle = "#b87528";
        ctx.beginPath();
        ctx.ellipse(-9, 4, 4, 7, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(9, 4, 4, 7, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Mõm chó
        ctx.fillStyle = "#faebd7";
        ctx.beginPath();
        ctx.ellipse(0, 3.5, 6.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mũi đen
        ctx.fillStyle = "#2d1a10";
        ctx.beginPath();
        ctx.arc(0, 1.8, 2, 0, Math.PI * 2);
        ctx.fill();

        // Mắt tròn nhìn ngắm mưa
        ctx.fillStyle = "#1e130c";
        ctx.beginPath();
        ctx.arc(-3.8, -2, 1.8, 0, Math.PI * 2);
        ctx.arc(3.8, -2, 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(-4.2, -2.5, 0.7, 0, Math.PI * 2);
        ctx.arc(3.4, -2.5, 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Hai chân gối lên ngưỡng cửa
        ctx.fillStyle = "#e09f4a";
        ctx.beginPath();
        ctx.ellipse(-6, 13, 4.8, 3.5, 0, 0, Math.PI * 2);
        ctx.ellipse(6, 13, 4.8, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Bong bóng sủa khi ngắm mưa
        if (tCycle >= 5 && tCycle < 7.5) {
          drawSpeechBubble(
            dogHeadX,
            dogHeadY - 24,
            localeRef.current === "en" ? "Woof woof! 🌧️" : "Gâu gâu! 🌧️",
            {
              tailX: dogHeadX,
              tailY: dogHeadY - 12,
              border: "#e09f4a",
              textColor: "#7a3e0c",
            },
          );
        }
      } else {
        // --- CHU TRÌNH DẠO CHƠI, TỚI NẰM CẠNH BẠN NAM & VỀ NHÀ (CHÚ CHÓ 84S) ---
        const dogHomeX = dogHouseX - 44;
        const dogHomeY = height - 40;
        const treeDogX = treeBaseX + 45;
        const meetGuyTreeX = treeBaseX + 22;
        const cottageDogX = cottageX + 8;
        const pettedDogX = dogHouseX - 18;
        const dockDogX = targetDogX;
        const dockDogY = targetDogY;

        type DogActivityState = "home" | "walking" | "idle" | "being_petted" | "cuddled";

        let dogState: DogActivityState = "home";
        let currDogX = dogHomeX;
        let currDogY = dogHomeY;
        let dogFacingLeft = false;
        let dogBubbleText = "";

        const pDogEase = (p: number) => {
          const clamped = Math.max(0, Math.min(1, p));
          return clamped * clamped * (3 - 2 * clamped);
        };

        if (!effectiveDay) {
          // BAN ĐÊM TRỜI QUANG: Nằm ngoan bên hiên nhà Ghibli
          dogState = "cuddled";
          currDogX = cottageX - 16;
          currDogY = cottageY + 8;
          if (tCycle >= 20 && tCycle < 23) {
            dogBubbleText = localeRef.current === "en" ? "Zzz... 💤" : "Khò... 💤";
          }
        } else {
          // BAN NGÀY: Chu trình 84s khám phá vườn, đón chủ ở cây, ngắm nhà, được vuốt ve, ra bến câu
          if (tCycle < 10) {
            // 0 - 10s: Nằm nghỉ trên thảm đỏ chuồng phơi nắng
            dogState = "home";
            currDogX = dogHomeX;
            currDogY = dogHomeY;
            if (tCycle >= 4 && tCycle < 6.5) {
              dogBubbleText = localeRef.current === "en" ? "Woof woof! 🐕" : "Gâu gâu! 🐕";
            }
          } else if (tCycle >= 10 && tCycle < 17) {
            // 10 - 17s: Đứng dậy chạy tung tăng ra phía cây cổ thụ hít hoa cỏ
            dogState = "walking";
            const p = (tCycle - 10) / 7;
            currDogX = dogHomeX + (treeDogX - dogHomeX) * pDogEase(p);
            currDogY = dogHomeY;
            dogFacingLeft = true;
            if (tCycle >= 13 && tCycle < 15.5) {
              dogBubbleText = localeRef.current === "en" ? "Woof woof! 🍃🐾" : "Gâu gâu! 🍃🐾";
            }
          } else if (tCycle >= 17 && tCycle < 24) {
            // 17 - 24s: Nhìn thấy bạn Nam đang ra gốc cây! Chó chạy lại đón bạn Nam
            dogState = "walking";
            const p = (tCycle - 17) / 7;
            currDogX = treeDogX + (meetGuyTreeX - treeDogX) * pDogEase(p);
            currDogY = dogHomeY;
            dogFacingLeft = true;
            if (tCycle >= 19 && tCycle < 22) {
              dogBubbleText = localeRef.current === "en" ? "Woof woof! ❤️" : "Gâu gâu! ❤️";
            }
          } else if (tCycle >= 24 && tCycle < 28) {
            // 24 - 28s: Đứng quấn quýt bên chân bạn Nam ngắm cây cổ thụ
            dogState = "idle";
            currDogX = meetGuyTreeX;
            currDogY = dogHomeY;
            dogFacingLeft = false;
          } else if (tCycle >= 28 && tCycle < 35) {
            // 28 - 35s: Chạy lon ton theo sau bạn Nam sang phía ngôi nhà
            dogState = "walking";
            const p = (tCycle - 28) / 7;
            currDogX = meetGuyTreeX + (cottageDogX - meetGuyTreeX) * pDogEase(p);
            currDogY = dogHomeY;
            dogFacingLeft = false;
            if (tCycle >= 30 && tCycle < 32.5) {
              dogBubbleText = localeRef.current === "en" ? "Woof woof! 🏡" : "Gâu gâu! 🏡";
            }
          } else if (tCycle >= 35 && tCycle < 39) {
            // 35 - 39s: Đứng cạnh bạn Nam ngắm ngôi nhà
            dogState = "idle";
            currDogX = cottageDogX;
            currDogY = dogHomeY;
            dogFacingLeft = true;
          } else if (tCycle >= 39 && tCycle < 46) {
            // 39 - 46s: Được bạn Nam cúi xuống vuốt ve xoa đầu tại chuồng chó!
            dogState = "being_petted";
            currDogX = pettedDogX;
            currDogY = dogHomeY;
            dogFacingLeft = false;
            if (tCycle >= 40 && tCycle < 44.5) {
              dogBubbleText =
                localeRef.current === "en"
                  ? "Woof woof, so happy! 🐕✨"
                  : "Gâu gâu thích quá! 🐕✨";
            }
          } else if (tCycle >= 46 && tCycle < 56) {
            // 46 - 56s: Chạy trước ra bờ hồ / bến câu
            dogState = "walking";
            const p = (tCycle - 46) / 10;
            currDogX = pettedDogX + (dockDogX - pettedDogX) * pDogEase(p);
            currDogY = dogHomeY + (dockDogY - dogHomeY) * pDogEase(p);
            dogFacingLeft = true;
            if (tCycle >= 50 && tCycle < 53) {
              dogBubbleText =
                localeRef.current === "en" ? "Off to the pond! 🐾" : "Ra bờ hồ thôi! 🐾";
            }
          } else if (tCycle >= 56 && tCycle < 79) {
            // 56 - 79s: Nằm thảnh thơi trên thảm cỏ xanh bên bến câu
            dogState = "cuddled";
            currDogX = dockDogX;
            currDogY = dockDogY;
            if (tCycle >= 66 && tCycle < 69) {
              dogBubbleText = localeRef.current === "en" ? "Woof woof! 🐕" : "Gâu gâu! 🐕";
            } else if (tCycle >= 75 && tCycle < 78) {
              dogBubbleText = localeRef.current === "en" ? "Zzz... 💤" : "Khò khò... 💤";
            }
          } else {
            // 79 - 84s: Đi dạo thong thả về chuồng để lặp lại chu kỳ
            dogState = "walking";
            const p = (tCycle - 79) / 5;
            currDogX = dockDogX + (dogHomeX - dockDogX) * pDogEase(p);
            currDogY = dockDogY + (dogHomeY - dockDogY) * pDogEase(p);
            dogFacingLeft = false;
          }
        }

        // Vẽ tư thế chú chó tương ứng với trạng thái
        if (dogState === "home") {
          // Thảm tròn dệt đỏ nằm phơi nắng
          ctx.save();
          ctx.translate(currDogX, currDogY);
          ctx.scale(1.2, 1.2);

          const breath = Math.sin(time * 2.2) * 1.4;
          const tailWag = Math.sin(time * 6.5) * 0.42;

          ctx.beginPath();
          ctx.ellipse(0, 5, 30, 9, 0, 0, Math.PI * 2);
          ctx.fillStyle = effectiveDay ? "rgba(217, 78, 52, 0.85)" : "rgba(80, 26, 17, 0.85)";
          ctx.fill();
          ctx.strokeStyle = effectiveDay ? "#ffd166" : "#443410";
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Đuôi vẫy vui vẻ
          ctx.save();
          ctx.translate(-16, -2);
          ctx.rotate(-0.4 + tailWag);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-11, -6, -17, -3);
          ctx.lineWidth = 4.8;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#e09f4a";
          ctx.stroke();
          ctx.restore();

          // Thân chó nằm dài
          ctx.beginPath();
          ctx.ellipse(0, -3 + breath * 0.5, 18, 10.5 + breath * 0.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = "#e09f4a";
          ctx.fill();

          // Chân trước và sau
          ctx.beginPath();
          ctx.ellipse(-10, 4, 6.5, 3.5, 0, 0, Math.PI * 2);
          ctx.ellipse(10, 4, 6.5, 3.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = "#c98836";
          ctx.fill();

          // Đầu chú chó gối đầu thư thái
          ctx.beginPath();
          ctx.arc(14, -10 + breath * 0.4, 9, 0, Math.PI * 2);
          ctx.fillStyle = "#e09f4a";
          ctx.fill();

          // Tai cụp
          ctx.beginPath();
          ctx.ellipse(8, -7, 3.8, 6.2, 0.3, 0, Math.PI * 2);
          ctx.fillStyle = "#b87528";
          ctx.fill();

          // Mõm
          ctx.beginPath();
          ctx.ellipse(19, -8, 5.2, 4, 0, 0, Math.PI * 2);
          ctx.fillStyle = "#faebd7";
          ctx.fill();

          // Mũi
          ctx.beginPath();
          ctx.arc(22, -9.5, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = "#2d1a10";
          ctx.fill();

          // Lưỡi hồng thè nhẹ
          ctx.fillStyle = "#ff758f";
          ctx.beginPath();
          ctx.arc(20.5, -5.5, 1.8, 0, Math.PI);
          ctx.fill();

          // Đôi mắt khép cười híp mí phơi nắng
          ctx.beginPath();
          ctx.arc(15, -12, 2.5, 0.1, Math.PI * 0.9);
          ctx.lineWidth = 1.3;
          ctx.strokeStyle = "#4a2a10";
          ctx.stroke();

          ctx.restore();

          if (dogBubbleText) {
            drawSpeechBubble(currDogX + 18, currDogY - 28, dogBubbleText, {
              tailX: currDogX + 16,
              tailY: currDogY - 14,
              border: "#e09f4a",
              textColor: "#7a3e0c",
            });
          }
        } else if (dogState === "walking") {
          // --- CHÓ ĐANG ĐI BỘ / CHẠY LON TON QUA LẠI ---
          ctx.save();
          ctx.translate(currDogX, currDogY);
          ctx.scale(dogFacingLeft ? -1.2 : 1.2, 1.2);

          const trot = Math.abs(Math.sin(time * 10)) * 2.4;
          const legSwing = Math.sin(time * 10) * 5.5;

          // Thân chó
          ctx.beginPath();
          ctx.ellipse(0, -8 - trot, 17, 10, 0, 0, Math.PI * 2);
          ctx.fillStyle = "#e09f4a";
          ctx.fill();

          // 4 chân sải bước nhịp nhàng
          ctx.strokeStyle = "#c98836";
          ctx.lineWidth = 3.6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(8, -2 - trot);
          ctx.lineTo(8 + legSwing, 4);
          ctx.moveTo(11, -2 - trot);
          ctx.lineTo(11 - legSwing, 4);
          ctx.moveTo(-8, -2 - trot);
          ctx.lineTo(-8 - legSwing, 4);
          ctx.moveTo(-11, -2 - trot);
          ctx.lineTo(-11 + legSwing, 4);
          ctx.stroke();

          // Đuôi vẫy cao hào hứng
          ctx.save();
          ctx.translate(-15, -9 - trot);
          ctx.rotate(-0.3 + Math.sin(time * 14) * 0.45);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-8, -10, -14, -7);
          ctx.lineWidth = 4.2;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#e09f4a";
          ctx.stroke();
          ctx.restore();

          // Đầu chú chó ngẩng cao vui tươi
          ctx.beginPath();
          ctx.arc(14, -14 - trot, 9, 0, Math.PI * 2);
          ctx.fillStyle = "#e09f4a";
          ctx.fill();

          // Tai vểnh nhẹ
          ctx.fillStyle = "#b87528";
          ctx.beginPath();
          ctx.ellipse(9, -15 - trot, 3.8, 6.2, 0.2 + Math.sin(time * 10) * 0.15, 0, Math.PI * 2);
          ctx.fill();

          // Mõm
          ctx.fillStyle = "#faebd7";
          ctx.beginPath();
          ctx.ellipse(19, -13 - trot, 5.2, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          // Mũi
          ctx.fillStyle = "#2d1a10";
          ctx.beginPath();
          ctx.arc(22, -14 - trot, 1.8, 0, Math.PI * 2);
          ctx.fill();

          // Lưỡi hồng thè hớn hở
          ctx.fillStyle = "#ff758f";
          ctx.beginPath();
          ctx.arc(20.5, -10 - trot, 1.8, 0, Math.PI);
          ctx.fill();

          // Mắt tròn lanh lợi
          ctx.fillStyle = "#2d1a10";
          ctx.beginPath();
          ctx.arc(15, -16 - trot, 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(15.6, -16.5 - trot, 0.7, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();

          if (dogBubbleText) {
            drawSpeechBubble(currDogX, currDogY - 32, dogBubbleText, {
              tailX: currDogX + (dogFacingLeft ? -10 : 10),
              tailY: currDogY - 18,
              border: "#e09f4a",
              textColor: "#7a3e0c",
            });
          }
        } else if (dogState === "idle") {
          // --- CHÓ ĐỨNG CẠNH BẠN NAM NGẮM CẢNH (IDLE POSE) ---
          ctx.save();
          ctx.translate(currDogX, currDogY);
          ctx.scale(dogFacingLeft ? -1.2 : 1.2, 1.2);

          const idleBreath = Math.sin(time * 2.5) * 0.8;
          const idleTail = Math.sin(time * 8) * 0.4;

          // Thân chó đứng vững vàng
          ctx.beginPath();
          ctx.ellipse(0, -9 + idleBreath * 0.4, 17, 10 + idleBreath * 0.3, 0, 0, Math.PI * 2);
          ctx.fillStyle = "#e09f4a";
          ctx.fill();

          // 4 chân đứng vững
          ctx.strokeStyle = "#c98836";
          ctx.lineWidth = 3.6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(-9, -2);
          ctx.lineTo(-9, 4);
          ctx.moveTo(-6, -2);
          ctx.lineTo(-6, 4);
          ctx.moveTo(8, -2);
          ctx.lineTo(8, 4);
          ctx.moveTo(11, -2);
          ctx.lineTo(11, 4);
          ctx.stroke();

          // Đuôi vẫy vui
          ctx.save();
          ctx.translate(-15, -10 + idleBreath * 0.4);
          ctx.rotate(-0.3 + idleTail);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-9, -10, -15, -7);
          ctx.lineWidth = 4.2;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#e09f4a";
          ctx.stroke();
          ctx.restore();

          // Đầu ngẩng cao
          ctx.beginPath();
          ctx.arc(14, -15 + idleBreath * 0.3, 9, 0, Math.PI * 2);
          ctx.fillStyle = "#e09f4a";
          ctx.fill();

          // Tai vểnh
          ctx.fillStyle = "#b87528";
          ctx.beginPath();
          ctx.ellipse(9, -16 + idleBreath * 0.3, 3.8, 6.2, 0.25, 0, Math.PI * 2);
          ctx.fill();

          // Mõm
          ctx.fillStyle = "#faebd7";
          ctx.beginPath();
          ctx.ellipse(19, -14 + idleBreath * 0.3, 5.2, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          // Mũi
          ctx.fillStyle = "#2d1a10";
          ctx.beginPath();
          ctx.arc(22, -15 + idleBreath * 0.3, 1.8, 0, Math.PI * 2);
          ctx.fill();

          // Lưỡi hồng
          ctx.fillStyle = "#ff758f";
          ctx.beginPath();
          ctx.arc(20.5, -11 + idleBreath * 0.3, 1.8, 0, Math.PI);
          ctx.fill();

          // Mắt
          ctx.fillStyle = "#2d1a10";
          ctx.beginPath();
          ctx.arc(15, -17 + idleBreath * 0.3, 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(15.6, -17.5 + idleBreath * 0.3, 0.7, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();

          if (dogBubbleText) {
            drawSpeechBubble(currDogX, currDogY - 32, dogBubbleText, {
              tailX: currDogX + (dogFacingLeft ? -10 : 10),
              tailY: currDogY - 18,
              border: "#e09f4a",
              textColor: "#7a3e0c",
            });
          }
        } else if (dogState === "being_petted") {
          // --- CHÓ NGỒI ĐÓN BẠN NAM VUỐT VE (PETTED POSE) ---
          ctx.save();
          ctx.translate(currDogX, currDogY);
          ctx.scale(dogFacingLeft ? -1.2 : 1.2, 1.2);

          const petBreath = Math.sin(time * 3) * 0.8;
          const fastTail = Math.sin(time * 16) * 0.55;

          // Thân chó ngồi nghiêng
          ctx.beginPath();
          ctx.ellipse(-2, -6 + petBreath * 0.4, 15, 11, -0.22, 0, Math.PI * 2);
          ctx.fillStyle = "#e09f4a";
          ctx.fill();

          // Chân sau gập ngồi
          ctx.beginPath();
          ctx.ellipse(-10, 2, 7, 4.5, 0.2, 0, Math.PI * 2);
          ctx.fillStyle = "#c98836";
          ctx.fill();

          // Chân trước chống thẳng
          ctx.strokeStyle = "#c98836";
          ctx.lineWidth = 3.6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(6, 0);
          ctx.lineTo(6, 5);
          ctx.moveTo(9, 0);
          ctx.lineTo(9, 5);
          ctx.stroke();

          // Đuôi vẫy tít mù phấn khích
          ctx.save();
          ctx.translate(-14, -5);
          ctx.rotate(-0.35 + fastTail);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-10, -10, -16, -6);
          ctx.lineWidth = 4.5;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#e09f4a";
          ctx.stroke();
          ctx.restore();

          // Đầu ngửa lên đón tay xoa
          ctx.beginPath();
          ctx.arc(10, -15 + petBreath * 0.3, 9, 0, Math.PI * 2);
          ctx.fillStyle = "#e09f4a";
          ctx.fill();

          // Tai cụp mềm mại
          ctx.beginPath();
          ctx.ellipse(4, -14 + petBreath * 0.3, 3.8, 6.2, 0.4, 0, Math.PI * 2);
          ctx.fillStyle = "#b87528";
          ctx.fill();

          // Mõm
          ctx.fillStyle = "#faebd7";
          ctx.beginPath();
          ctx.ellipse(15, -13 + petBreath * 0.3, 5.2, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          // Mũi
          ctx.fillStyle = "#2d1a10";
          ctx.beginPath();
          ctx.arc(18, -14.5 + petBreath * 0.3, 1.8, 0, Math.PI * 2);
          ctx.fill();

          // Lưỡi hồng thè hớn hở
          ctx.fillStyle = "#ff758f";
          ctx.beginPath();
          ctx.arc(16.5, -10.5 + petBreath * 0.3, 2.0, 0, Math.PI);
          ctx.fill();

          // Mắt cười híp mí sung sướng (^ ‿ ^)
          ctx.beginPath();
          ctx.arc(11, -17 + petBreath * 0.3, 2.5, 0.1, Math.PI * 0.9);
          ctx.lineWidth = 1.3;
          ctx.strokeStyle = "#4a2a10";
          ctx.stroke();

          ctx.restore();

          if (dogBubbleText) {
            drawSpeechBubble(currDogX - 10, currDogY - 32, dogBubbleText, {
              tailX: currDogX,
              tailY: currDogY - 18,
              border: "#e09f4a",
              textColor: "#7a3e0c",
            });
          }
        } else {
          // --- CHÓ NẰM CẠNH BẠN NAM (CUDDLED COZY) ---
          ctx.save();
          ctx.translate(currDogX, currDogY);
          ctx.scale(1.2, 1.2);

          const cuddBreath = Math.sin(time * 2.2) * 1.2;
          const cuddTail = Math.sin(time * 5.5) * 0.35;

          // Đuôi vẫy ngoe nguẩy nhẹ nhàng hạnh phúc
          ctx.save();
          ctx.translate(-16, -2);
          ctx.rotate(-0.25 + cuddTail);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-10, -5, -16, -2);
          ctx.lineWidth = 4.5;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#e09f4a";
          ctx.stroke();
          ctx.restore();

          // Thân chó nằm áp bụng xuống thảm cỏ ấm
          ctx.beginPath();
          ctx.ellipse(0, -3 + cuddBreath * 0.5, 18, 10 + cuddBreath * 0.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = "#e09f4a";
          ctx.fill();

          // Hai chân trước duỗi thẳng gối cằm lên mép sàn bến
          ctx.beginPath();
          ctx.ellipse(14, 3, 7, 3, 0.1, 0, Math.PI * 2);
          ctx.ellipse(-10, 4, 6.5, 3.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = "#c98836";
          ctx.fill();

          // Đầu chó tựa cằm gần chân bạn nam
          ctx.beginPath();
          ctx.arc(15, -8 + cuddBreath * 0.4, 9, 0, Math.PI * 2);
          ctx.fillStyle = "#e09f4a";
          ctx.fill();

          // Tai cụp mềm mại
          ctx.beginPath();
          ctx.ellipse(9, -6, 3.8, 6, 0.25, 0, Math.PI * 2);
          ctx.fillStyle = "#b87528";
          ctx.fill();

          // Mõm
          ctx.beginPath();
          ctx.ellipse(20, -6.5, 5.2, 4, 0, 0, Math.PI * 2);
          ctx.fillStyle = "#faebd7";
          ctx.fill();

          // Mũi
          ctx.fillStyle = "#2d1a10";
          ctx.beginPath();
          ctx.arc(23, -8, 1.8, 0, Math.PI * 2);
          ctx.fill();

          // Mắt cười híp mí an tâm hạnh phúc (^ ‿ ^)
          ctx.beginPath();
          ctx.arc(16, -10, 2.5, 0.1, Math.PI * 0.9);
          ctx.lineWidth = 1.3;
          ctx.strokeStyle = "#4a2a10";
          ctx.stroke();

          ctx.restore();

          if (dogBubbleText) {
            drawSpeechBubble(currDogX - 6, currDogY - 26, dogBubbleText, {
              tailX: currDogX - 6,
              tailY: currDogY - 12,
              border: "#e09f4a",
              textColor: "#7a3e0c",
            });
          }
        }
      }

      // ----------------------------------------
      // 2. CHÚ MÈO MƯỚP (THE TABBY CAT - BÉO MÚP MÍP, RÕ NÉT)
      // ----------------------------------------
      if (isIndoors) {
        // --- MÈO MƯỚP TRÚ TRONG CHUỒNG HỘP CỦA MÌNH (SỢ ƯỚT / NGẮM MƯA) ---
        const catHeadX = catCondoX + 33;
        const catHeadY = catCondoY - 26;

        ctx.save();
        ctx.translate(catHeadX, catHeadY);
        ctx.scale(0.95, 0.95); // Phóng to 0.95x

        // Hai bàn chân trước lông trắng kem (tất trắng) tì lên ngưỡng cửa
        ctx.fillStyle = "#faf6ee";
        ctx.beginPath();
        ctx.ellipse(-6, 8, 4.2, 2.8, 0.08, 0, Math.PI * 2);
        ctx.ellipse(6, 8, 4.2, 2.8, -0.08, 0, Math.PI * 2);
        ctx.fill();

        // Kẽ ngón chân nhỏ xinh
        ctx.strokeStyle = "#c2b4a3";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-7.2, 9.2);
        ctx.lineTo(-7.2, 7.2);
        ctx.moveTo(-4.8, 9.2);
        ctx.lineTo(-4.8, 7.2);
        ctx.moveTo(4.8, 9.2);
        ctx.lineTo(4.8, 7.2);
        ctx.moveTo(7.2, 9.2);
        ctx.lineTo(7.2, 7.2);
        ctx.stroke();

        // Đầu mèo mướp (màu xám tro ấm pha nâu vàng)
        const catHeadGrad = ctx.createRadialGradient(-2, -3, 2, 0, 0, 12);
        catHeadGrad.addColorStop(0, "#c2b099");
        catHeadGrad.addColorStop(0.65, "#a69279");
        catHeadGrad.addColorStop(1, "#8a7761");
        ctx.fillStyle = catHeadGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();

        // Mảng lông trắng kem ở phần cằm và mõm
        ctx.fillStyle = "#faf6ee";
        ctx.beginPath();
        ctx.ellipse(0, 4, 6, 4.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tai mèo mướp
        ctx.fillStyle = "#9a866e";
        ctx.beginPath();
        ctx.moveTo(-8.5, -5);
        ctx.lineTo(-7.5, -15.5);
        ctx.lineTo(-2.2, -9);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#38281a";
        ctx.lineWidth = 1.1;
        ctx.stroke();

        ctx.fillStyle = "#e59a8c";
        ctx.beginPath();
        ctx.moveTo(-7.2, -6.5);
        ctx.lineTo(-6.5, -13);
        ctx.lineTo(-3.2, -8.5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#9a866e";
        ctx.beginPath();
        ctx.moveTo(2.2, -9);
        ctx.lineTo(7.5, -15.5);
        ctx.lineTo(8.5, -5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#38281a";
        ctx.lineWidth = 1.1;
        ctx.stroke();

        ctx.fillStyle = "#e59a8c";
        ctx.beginPath();
        ctx.moveTo(3.2, -8.5);
        ctx.lineTo(6.5, -13);
        ctx.lineTo(7.2, -6.5);
        ctx.closePath();
        ctx.fill();

        // Họa tiết vằn chữ M
        ctx.strokeStyle = "#38281a";
        ctx.fillStyle = "#38281a";
        ctx.lineWidth = 1.3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-5, -6.5);
        ctx.lineTo(-2.8, -2.8);
        ctx.lineTo(0, -6);
        ctx.lineTo(2.8, -2.8);
        ctx.lineTo(5, -6.5);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(0, -10.5);
        ctx.stroke();

        // Sọc vằn má
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(-5.5, 0.5);
        ctx.lineTo(-10, -0.2);
        ctx.moveTo(-5, 2.6);
        ctx.lineTo(-9, 3);
        ctx.moveTo(5.5, 0.5);
        ctx.lineTo(10, -0.2);
        ctx.moveTo(5, 2.6);
        ctx.lineTo(9, 3);
        ctx.stroke();

        // Mắt xanh ngọc
        ctx.fillStyle = "#2ec4b6";
        ctx.beginPath();
        ctx.arc(-3.8, -0.6, 2.4, 0, Math.PI * 2);
        ctx.arc(3.8, -0.6, 2.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#111d28";
        ctx.beginPath();
        ctx.ellipse(-3.8, -0.6, 1.2, 2.0, 0, 0, Math.PI * 2);
        ctx.ellipse(3.8, -0.6, 1.2, 2.0, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(-4.5, -1.4, 0.8, 0, Math.PI * 2);
        ctx.arc(3.1, -1.4, 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Mũi
        ctx.fillStyle = "#dc7364";
        ctx.beginPath();
        ctx.moveTo(-1.4, 1.8);
        ctx.lineTo(1.4, 1.8);
        ctx.lineTo(0, 3.1);
        ctx.closePath();
        ctx.fill();

        // Miệng
        ctx.strokeStyle = "#5a4533";
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(0, 3.1);
        ctx.lineTo(0, 4.1);
        ctx.moveTo(0, 4.1);
        ctx.quadraticCurveTo(-1.8, 5.3, -3.2, 4.4);
        ctx.moveTo(0, 4.1);
        ctx.quadraticCurveTo(1.8, 5.3, 3.2, 4.4);
        ctx.stroke();

        // Râu trắng
        ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(-3, 3.2);
        ctx.lineTo(-12.5, 1.8);
        ctx.moveTo(-3, 4.2);
        ctx.lineTo(-11.5, 4.8);
        ctx.moveTo(3, 3.2);
        ctx.lineTo(12.5, 1.8);
        ctx.moveTo(3, 4.2);
        ctx.lineTo(11.5, 4.8);
        ctx.stroke();

        ctx.restore();

        // Bong bóng meo khi trời mưa
        if (tCycle >= 10 && tCycle < 12.5) {
          drawSpeechBubble(
            catHeadX,
            catHeadY - 22,
            localeRef.current === "en" ? "Meow meow~ ☔" : "Meo meo~ ☔",
            {
              tailX: catHeadX,
              tailY: catHeadY - 12,
              border: "#2ec4b6",
              textColor: "#0f4c5c",
            },
          );
        }
      } else {
        // --- CHU TRÌNH MÈO DẠO CHƠI, ĐI TRÊN RÀO, CÀO CÂY, NGHỊCH LEN & VỀ NHÀ (CHÚ MÈO 84S) ---
        const catHomeX = catCondoX + 33;
        const catHomeY = catCondoY - 105;
        const catGroundY = height - 40;
        const fenceStartX = catCondoX - 35;
        const fenceEndX = cottageX - 15;
        const fenceH = 24;
        const fenceY = groundBaseY - 14;
        const fenceRailY = fenceY - fenceH * 0.82;
        const treeCatX = treeBaseX + 18;
        const yarnCatX = catCondoX - 12;
        const condoFrontX = catCondoX - 8;
        const dockCatX = targetCatX;
        const dockCatY = targetCatY;

        type CatActivityState =
          | "home"
          | "walking_on_fence"
          | "scratching_tree"
          | "playing_yarn"
          | "loaf_at_condo"
          | "being_petted"
          | "walking"
          | "watching_fish_dock";

        let catState: CatActivityState = "home";
        let currCatX = catHomeX;
        let currCatY = catHomeY;
        let catFacingLeft = false;
        let catBubbleText = "";

        const pCatEase = (p: number) => {
          const clamped = Math.max(0, Math.min(1, p));
          return clamped * clamped * (3 - 2 * clamped);
        };

        const isCatWatchingChase =
          thief.active &&
          (thief.state === "alerted" || thief.state === "bitten" || thief.state === "fleeing");

        if (!effectiveDay) {
          // BAN ĐÊM TRỜI QUANG: Mèo nằm loaf trên ban công cat condo ngắm sao / ngắm đom đóm
          catState = "home";
          currCatX = catHomeX;
          currCatY = catHomeY;
          if (tCycle >= 25 && tCycle < 28) {
            catBubbleText = localeRef.current === "en" ? "Meow meow~ 🌟" : "Meo meo~ 🌟";
          }
        } else {
          // BAN NGÀY: Chu trình 84s dạo rào hoa, cào vỏ cây, vờn cuộn len, được vuốt ve, ra bến ngắm cá
          if (tCycle < 10) {
            // 0 - 10s: Loaf trên ban công cat condo ngắm cảnh
            catState = "home";
            currCatX = catHomeX;
            currCatY = catHomeY;
            if (tCycle >= 5 && tCycle < 7.5) {
              catBubbleText = localeRef.current === "en" ? "Meow meow~ 🐱" : "Meo meo~ 🐱";
            }
          } else if (tCycle >= 10 && tCycle < 18) {
            // 10 - 18s: Nhảy xuống đi thăng bằng trên thanh rào gỗ ngập hoa
            catState = "walking_on_fence";
            const p = (tCycle - 10) / 8;
            currCatX = fenceStartX + 5 + (fenceEndX - 10 - (fenceStartX + 5)) * pCatEase(p);
            currCatY = p < 0.2 ? catHomeY + (fenceRailY - catHomeY) * (p / 0.2) : fenceRailY;
            catFacingLeft = false;
            if (tCycle >= 13 && tCycle < 15.5) {
              catBubbleText = localeRef.current === "en" ? "Meow meow~ 🌸" : "Meo meo~ 🌸";
            }
          } else if (tCycle >= 18 && tCycle < 26) {
            // 18 - 26s: Nhảy xuống gốc cây cổ thụ cào móng vào vỏ cây
            catState = "scratching_tree";
            currCatX = treeCatX;
            currCatY = catGroundY;
            catFacingLeft = false; // Mặt hướng vào thân cây
            if (tCycle >= 21 && tCycle < 24) {
              catBubbleText = "Scratch~ 🐾";
            }
          } else if (tCycle >= 26 && tCycle < 36) {
            // 26 - 36s: Vờn và nghịch cuộn len đỏ trước sân
            catState = "playing_yarn";
            const p = Math.min(1, (tCycle - 26) / 2.5);
            currCatX = treeCatX + (yarnCatX - treeCatX) * pCatEase(p);
            currCatY = catGroundY;
            catFacingLeft = true;
            if (tCycle >= 30 && tCycle < 33) {
              catBubbleText = localeRef.current === "en" ? "Meow meow~ 🧶" : "Meo meo~ 🧶";
            }
          } else if (tCycle >= 36 && tCycle < 46) {
            // 36 - 46s: Ngồi trước hiên condo liếm lông rửa mặt
            catState = "loaf_at_condo";
            currCatX = condoFrontX;
            currCatY = catGroundY;
            catFacingLeft = false;
            if (tCycle >= 37 && tCycle < 39.5) {
              catBubbleText = localeRef.current === "en" ? "Meow~ ✨" : "Meo~ ✨";
            }
          } else if (tCycle >= 46 && tCycle < 53) {
            // 46 - 53s: Được bạn Nam cúi xuống vuốt ve xoa cằm!
            catState = "being_petted";
            currCatX = condoFrontX;
            currCatY = catGroundY;
            catFacingLeft = false;
            if (tCycle >= 48 && tCycle < 51.5) {
              catBubbleText = localeRef.current === "en" ? "Purrr~ meoww 🥰" : "Purrr~ meooo 🥰";
            }
          } else if (tCycle >= 53 && tCycle < 62) {
            // 53 - 62s: Thong thả dạo bước ra mép bến ngắm cá
            catState = "walking";
            const p = (tCycle - 53) / 9;
            currCatX = condoFrontX + (dockCatX - condoFrontX) * pCatEase(p);
            currCatY =
              p > 0.8 ? catGroundY + (dockCatY - catGroundY) * ((p - 0.8) / 0.2) : catGroundY;
            catFacingLeft = true;
          } else if (tCycle >= 62 && tCycle < 79) {
            // 62 - 79s: Ngồi / nằm loaf bên mép bến ngắm đàn cá koi bơi lượn
            catState = "watching_fish_dock";
            currCatX = dockCatX;
            currCatY = dockCatY;
            catFacingLeft = false;
            if (tCycle >= 69 && tCycle < 72) {
              catBubbleText =
                localeRef.current === "en" ? "So many fish meow~ 🐟" : "Cá bơi nhiều ghê meoo~ 🐟";
            } else if (tCycle >= 76 && tCycle < 78.5) {
              catBubbleText = "Zzz... 🐱💤";
            }
          } else {
            // 79 - 84s: Đi dạo thong thả về chuồng condo
            catState = "walking";
            const p = (tCycle - 79) / 5;
            currCatX = dockCatX + (catHomeX - dockCatX) * pCatEase(p);
            currCatY =
              p < 0.2
                ? dockCatY + (catGroundY - dockCatY) * (p / 0.2)
                : p > 0.8
                  ? catGroundY + (catHomeY - catGroundY) * ((p - 0.8) / 0.2)
                  : catGroundY;
            catFacingLeft = false;
          }
        }

        if (catState === "home") {
          // --- MÈO NẰM TRÊN BAN CÔNG TẦNG TRÊN CAT CONDO ---
          const catBreath = Math.sin(time * 2.8) * 0.9;
          const catTail = Math.sin(time * 3 + 1) * 0.45;

          ctx.save();
          ctx.translate(currCatX, currCatY);
          ctx.scale(0.95, 0.95);

          // Đuôi vằn sọc
          ctx.save();
          ctx.translate(-11, 0);
          ctx.rotate(-0.15 + catTail);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-8, 10, -5, 20);
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#a69279";
          ctx.stroke();

          ctx.lineWidth = 4.2;
          ctx.strokeStyle = "#38281a";
          ctx.beginPath();
          ctx.moveTo(-2, 4);
          ctx.lineTo(-2.2, 5.5);
          ctx.moveTo(-4.5, 9.5);
          ctx.lineTo(-4.8, 11);
          ctx.moveTo(-5.5, 14.5);
          ctx.lineTo(-5.4, 16);
          ctx.moveTo(-5.2, 18.5);
          ctx.lineTo(-5, 20.2);
          ctx.stroke();
          ctx.restore();

          // Thân mèo nằm loaf
          const catBodyGrad = ctx.createRadialGradient(-3, -3, 3, 0, 0, 16);
          catBodyGrad.addColorStop(0, "#c4b29c");
          catBodyGrad.addColorStop(0.65, "#a69279");
          catBodyGrad.addColorStop(1, "#88755f");

          ctx.beginPath();
          ctx.ellipse(0, -3 + catBreath * 0.4, 14.5, 9 + catBreath * 0.4, 0, 0, Math.PI * 2);
          ctx.fillStyle = catBodyGrad;
          ctx.fill();

          ctx.fillStyle = "#faf6ee";
          ctx.beginPath();
          ctx.ellipse(3, 1 + catBreath * 0.3, 7.5, 4.5, -0.15, 0, Math.PI * 2);
          ctx.fill();

          // Sọc vằn lưng
          ctx.strokeStyle = "#38281a";
          ctx.lineWidth = 1.4;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(-8, -9 + catBreath * 0.4);
          ctx.lineTo(-1, -11 + catBreath * 0.4);
          ctx.moveTo(-10, -5 + catBreath * 0.3);
          ctx.quadraticCurveTo(-7, -4, -6, 2);
          ctx.moveTo(-5, -8 + catBreath * 0.4);
          ctx.quadraticCurveTo(-3, -4, -2, 1);
          ctx.moveTo(0, -9 + catBreath * 0.4);
          ctx.quadraticCurveTo(1, -5, 2, -1);
          ctx.stroke();

          // Tất trắng
          ctx.fillStyle = "#faf6ee";
          ctx.beginPath();
          ctx.ellipse(6.5, 3.5, 4.2, 2.5, 0.1, 0, Math.PI * 2);
          ctx.fill();

          // Đầu mèo
          const headX = 11;
          const headY = -8 + catBreath * 0.3;

          ctx.save();
          ctx.translate(headX, headY);

          const catHeadGradOut = ctx.createRadialGradient(-1, -2, 2, 0, 0, 9);
          catHeadGradOut.addColorStop(0, "#c2b099");
          catHeadGradOut.addColorStop(0.7, "#a69279");
          catHeadGradOut.addColorStop(1, "#8a7761");

          ctx.fillStyle = catHeadGradOut;
          ctx.beginPath();
          ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#faf6ee";
          ctx.beginPath();
          ctx.ellipse(1.5, 2.5, 4.5, 3.2, 0, 0, Math.PI * 2);
          ctx.fill();

          // Tai
          ctx.fillStyle = "#9a866e";
          ctx.beginPath();
          ctx.moveTo(-6, -4);
          ctx.lineTo(-4.5, -12);
          ctx.lineTo(-1, -7);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#38281a";
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = "#e59a8c";
          ctx.beginPath();
          ctx.moveTo(-5, -5);
          ctx.lineTo(-4.2, -10);
          ctx.lineTo(-2, -6.8);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = "#9a866e";
          ctx.beginPath();
          ctx.moveTo(1.5, -7);
          ctx.lineTo(6, -12);
          ctx.lineTo(6.8, -4);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#38281a";
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = "#e59a8c";
          ctx.beginPath();
          ctx.moveTo(2.4, -6.8);
          ctx.lineTo(5.2, -10);
          ctx.lineTo(5.8, -5);
          ctx.closePath();
          ctx.fill();

          // Chữ M trán
          ctx.strokeStyle = "#38281a";
          ctx.lineWidth = 1.1;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(-3.5, -5);
          ctx.lineTo(-1.8, -2.2);
          ctx.lineTo(0, -4.5);
          ctx.lineTo(1.8, -2.2);
          ctx.lineTo(3.5, -5);
          ctx.stroke();

          if (isCatWatchingChase) {
            ctx.fillStyle = "#2ec4b6";
            ctx.beginPath();
            ctx.arc(-1.8, -0.6, 1.8, 0, Math.PI * 2);
            ctx.arc(3.2, -0.6, 1.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#111d28";
            ctx.beginPath();
            ctx.arc(-1.8, -0.6, 0.9, 0, Math.PI * 2);
            ctx.arc(3.2, -0.6, 0.9, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(-2.2, -1.1, 0.5, 0, Math.PI * 2);
            ctx.arc(2.8, -1.1, 0.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(2.2, -0.5, 2.0, 0.15, Math.PI * 0.85);
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = "#38281a";
            ctx.stroke();
          }

          // Mũi
          ctx.fillStyle = "#dc7364";
          ctx.beginPath();
          ctx.moveTo(0.5, 1.6);
          ctx.lineTo(2.5, 1.6);
          ctx.lineTo(1.5, 2.6);
          ctx.closePath();
          ctx.fill();

          // Râu
          ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
          ctx.lineWidth = 0.65;
          ctx.beginPath();
          ctx.moveTo(2.5, 2.4);
          ctx.lineTo(9.5, 1.2);
          ctx.moveTo(2.5, 3.2);
          ctx.lineTo(8.5, 3.8);
          ctx.stroke();

          ctx.restore();
          ctx.restore();

          if (isCatWatchingChase) {
            drawSpeechBubble(
              currCatX + 12,
              currCatY - 26,
              localeRef.current === "en" ? "Meowww? 👀" : "Méooo? 👀",
              {
                tailX: currCatX + 10,
                tailY: currCatY - 14,
                border: "#2ec4b6",
                textColor: "#0f4c5c",
              },
            );
          } else if (catBubbleText) {
            drawSpeechBubble(currCatX + 12, currCatY - 26, catBubbleText, {
              tailX: currCatX + 10,
              tailY: currCatY - 14,
              border: "#2ec4b6",
              textColor: "#0f4c5c",
            });
          }
        } else if (catState === "walking" || catState === "walking_on_fence") {
          // --- MÈO ĐANG ĐI BỘ DUYÊN DÁNG (HOẶC THĂNG BẰNG TRÊN RÀO GỖ) ---
          ctx.save();
          ctx.translate(currCatX, currCatY);
          ctx.scale(catFacingLeft ? -0.92 : 0.92, 0.92);

          const catWalkCycle = Math.sin(time * 8) * 4;
          const catBounce = Math.abs(Math.sin(time * 8)) * 1.5;

          // Đuôi cong chữ S kiêu hãnh
          ctx.save();
          ctx.translate(-11, -7 - catBounce);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(-8, -10, -6, -18, -8 + Math.sin(time * 4) * 2, -22);
          ctx.lineWidth = 3.6;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#a69279";
          ctx.stroke();

          ctx.strokeStyle = "#38281a";
          ctx.lineWidth = 3.8;
          ctx.beginPath();
          ctx.moveTo(-4, -6);
          ctx.lineTo(-4.2, -7.5);
          ctx.moveTo(-6, -12);
          ctx.lineTo(-6.2, -13.5);
          ctx.moveTo(-7.5, -18);
          ctx.lineTo(-7.6, -19.5);
          ctx.stroke();
          ctx.restore();

          // Thân mèo múp míp
          const catBodyGrad = ctx.createRadialGradient(-2, -8, 2, 0, -8, 14);
          catBodyGrad.addColorStop(0, "#c4b29c");
          catBodyGrad.addColorStop(0.7, "#a69279");
          catBodyGrad.addColorStop(1, "#88755f");
          ctx.fillStyle = catBodyGrad;
          ctx.beginPath();
          ctx.ellipse(0, -8 - catBounce, 13.5, 8, 0, 0, Math.PI * 2);
          ctx.fill();

          // Sọc vằn lưng
          ctx.strokeStyle = "#38281a";
          ctx.lineWidth = 1.2;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(-6, -14 - catBounce);
          ctx.lineTo(-6, -6 - catBounce);
          ctx.moveTo(-2, -15 - catBounce);
          ctx.lineTo(-2, -5 - catBounce);
          ctx.moveTo(2, -15 - catBounce);
          ctx.lineTo(2, -6 - catBounce);
          ctx.stroke();

          // Bụng trắng
          ctx.fillStyle = "#faf6ee";
          ctx.beginPath();
          ctx.ellipse(1, -4 - catBounce, 6.5, 3.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // 4 chân bước điệu nghệ
          ctx.strokeStyle = "#88755f";
          ctx.lineWidth = 3.0;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(6, -3 - catBounce);
          ctx.lineTo(6 + catWalkCycle, 3);
          ctx.moveTo(8, -3 - catBounce);
          ctx.lineTo(8 - catWalkCycle, 3);
          ctx.moveTo(-6, -3 - catBounce);
          ctx.lineTo(-6 - catWalkCycle, 3);
          ctx.moveTo(-8, -3 - catBounce);
          ctx.lineTo(-8 + catWalkCycle, 3);
          ctx.stroke();

          // Tất trắng
          ctx.fillStyle = "#faf6ee";
          ctx.beginPath();
          ctx.ellipse(6 + catWalkCycle, 3, 2.5, 1.8, 0, 0, Math.PI * 2);
          ctx.ellipse(8 - catWalkCycle, 3, 2.5, 1.8, 0, 0, Math.PI * 2);
          ctx.ellipse(-6 - catWalkCycle, 3, 2.5, 1.8, 0, 0, Math.PI * 2);
          ctx.ellipse(-8 + catWalkCycle, 3, 2.5, 1.8, 0, 0, Math.PI * 2);
          ctx.fill();

          // Đầu mèo
          const headX = 11;
          const headY = -12 - catBounce;
          ctx.save();
          ctx.translate(headX, headY);
          ctx.fillStyle = "#a69279";
          ctx.beginPath();
          ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#faf6ee";
          ctx.beginPath();
          ctx.ellipse(1.5, 2.5, 4.5, 3.2, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#9a866e";
          ctx.beginPath();
          ctx.moveTo(-5, -4);
          ctx.lineTo(-4, -11);
          ctx.lineTo(-1, -7);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(1.5, -7);
          ctx.lineTo(5.5, -11);
          ctx.lineTo(6.5, -4);
          ctx.closePath();
          ctx.fill();

          // Chữ M
          ctx.strokeStyle = "#38281a";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(-3, -4);
          ctx.lineTo(-1.5, -1.8);
          ctx.lineTo(0, -3.8);
          ctx.lineTo(1.5, -1.8);
          ctx.lineTo(3, -4);
          ctx.stroke();

          // Mắt xanh ngọc
          ctx.fillStyle = "#2ec4b6";
          ctx.beginPath();
          ctx.arc(2.5, -1, 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#111d28";
          ctx.beginPath();
          ctx.ellipse(2.5, -1, 0.9, 1.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(2.1, -1.4, 0.5, 0, Math.PI * 2);
          ctx.fill();

          // Mũi
          ctx.fillStyle = "#dc7364";
          ctx.beginPath();
          ctx.arc(2.2, 1.5, 1.2, 0, Math.PI * 2);
          ctx.fill();

          // Râu
          ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
          ctx.lineWidth = 0.65;
          ctx.beginPath();
          ctx.moveTo(3, 1.8);
          ctx.lineTo(9, 0.8);
          ctx.moveTo(3, 2.8);
          ctx.lineTo(8.5, 3.8);
          ctx.stroke();

          ctx.restore();
          ctx.restore();

          if (catBubbleText) {
            drawSpeechBubble(currCatX, currCatY - 28, catBubbleText, {
              tailX: currCatX + (catFacingLeft ? -8 : 8),
              tailY: currCatY - 14,
              border: "#2ec4b6",
              textColor: "#0f4c5c",
            });
          }
        } else if (catState === "scratching_tree") {
          // --- MÈO ĐỨNG CÀO MÓNG VÀO VỎ CÂY CỔ THỤ ---
          ctx.save();
          ctx.translate(currCatX, currCatY);
          ctx.scale(catFacingLeft ? -0.95 : 0.95, 0.95);

          const scratchMotion = Math.sin(time * 14) * 2.5;

          // Đuôi ngoe nguẩy thích thú
          ctx.save();
          ctx.translate(-8, -4);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(-10, -6, -8, -16, -10 + Math.sin(time * 6) * 2, -20);
          ctx.lineWidth = 3.6;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#a69279";
          ctx.stroke();
          ctx.restore();

          // Chân sau đứng bám chắc đất
          ctx.strokeStyle = "#88755f";
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(-4, 0);
          ctx.lineTo(-4, 4);
          ctx.moveTo(2, 0);
          ctx.lineTo(2, 4);
          ctx.stroke();
          ctx.fillStyle = "#faf6ee";
          ctx.beginPath();
          ctx.ellipse(-4, 4, 2.5, 1.8, 0, 0, Math.PI * 2);
          ctx.ellipse(2, 4, 2.5, 1.8, 0, 0, Math.PI * 2);
          ctx.fill();

          // Thân mèo đứng dựng nghiêng về phía cây
          const catBodyGrad = ctx.createRadialGradient(0, -10, 2, 0, -10, 14);
          catBodyGrad.addColorStop(0, "#c4b29c");
          catBodyGrad.addColorStop(0.7, "#a69279");
          catBodyGrad.addColorStop(1, "#88755f");
          ctx.fillStyle = catBodyGrad;
          ctx.beginPath();
          ctx.ellipse(0, -10, 8.5, 14, 0.2, 0, Math.PI * 2);
          ctx.fill();

          // Sọc vằn lưng
          ctx.strokeStyle = "#38281a";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-5, -16);
          ctx.lineTo(-1, -17);
          ctx.moveTo(-6, -11);
          ctx.lineTo(-2, -12);
          ctx.moveTo(-6, -6);
          ctx.lineTo(-2, -7);
          ctx.stroke();

          // Hai chân trước vươn cao cào thân cây
          ctx.strokeStyle = "#88755f";
          ctx.lineWidth = 3.0;
          ctx.beginPath();
          ctx.moveTo(3, -15);
          ctx.lineTo(12, -22 + scratchMotion);
          ctx.moveTo(3, -13);
          ctx.lineTo(12, -19 - scratchMotion);
          ctx.stroke();

          // Bàn chân trước có tất trắng
          ctx.fillStyle = "#faf6ee";
          ctx.beginPath();
          ctx.arc(12, -22 + scratchMotion, 2.2, 0, Math.PI * 2);
          ctx.arc(12, -19 - scratchMotion, 2.2, 0, Math.PI * 2);
          ctx.fill();

          // Đầu mèo ngước lên
          const headX = 2;
          const headY = -24;
          ctx.save();
          ctx.translate(headX, headY);
          ctx.fillStyle = "#a69279";
          ctx.beginPath();
          ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
          ctx.fill();

          // Tai mèo
          ctx.fillStyle = "#9a866e";
          ctx.beginPath();
          ctx.moveTo(-5, -4);
          ctx.lineTo(-4, -11);
          ctx.lineTo(-1, -7);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(1.5, -7);
          ctx.lineTo(5.5, -11);
          ctx.lineTo(6.5, -4);
          ctx.closePath();
          ctx.fill();

          // Chữ M
          ctx.strokeStyle = "#38281a";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(-3, -4);
          ctx.lineTo(-1.5, -1.8);
          ctx.lineTo(0, -3.8);
          ctx.lineTo(1.5, -1.8);
          ctx.lineTo(3, -4);
          ctx.stroke();

          // Mắt
          ctx.fillStyle = "#2ec4b6";
          ctx.beginPath();
          ctx.arc(2.5, -1, 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#111d28";
          ctx.beginPath();
          ctx.ellipse(2.5, -1, 0.9, 1.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Mũi
          ctx.fillStyle = "#dc7364";
          ctx.beginPath();
          ctx.arc(2.2, 1.5, 1.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
          ctx.restore();

          if (catBubbleText) {
            drawSpeechBubble(currCatX, currCatY - 32, catBubbleText, {
              tailX: currCatX + 8,
              tailY: currCatY - 18,
              border: "#2ec4b6",
              textColor: "#0f4c5c",
            });
          }
        } else if (catState === "playing_yarn") {
          // --- MÈO NGHỊCH CUỘN LEN ĐỎ TRÊN SÂN ---
          ctx.save();
          ctx.translate(currCatX, currCatY);
          ctx.scale(catFacingLeft ? -0.95 : 0.95, 0.95);

          const tapMotion = Math.sin(time * 10) * 3.5;

          // Cuộn len đỏ xinh xắn lăn lăn
          ctx.beginPath();
          ctx.arc(15, 0, 5.5, 0, Math.PI * 2);
          ctx.fillStyle = "#e63946";
          ctx.fill();
          ctx.strokeStyle = "#c1121f";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.arc(15, 0, 3.5, 0.2, Math.PI * 1.5);
          ctx.stroke();

          // Sợi len uốn lượn mềm mại trên cỏ
          ctx.strokeStyle = "#e63946";
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(15, 2);
          ctx.quadraticCurveTo(22, -3, 26, 3);
          ctx.stroke();

          // Đuôi mèo ngoe nguẩy tập trung
          ctx.save();
          ctx.translate(-12, -5);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(-8, -8, -6, -16, -9 + Math.sin(time * 8) * 2, -18);
          ctx.lineWidth = 3.6;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#a69279";
          ctx.stroke();
          ctx.restore();

          // Thân mèo khom thấp rình mồi
          const catBodyGrad = ctx.createRadialGradient(-2, -6, 2, 0, -6, 14);
          catBodyGrad.addColorStop(0, "#c4b29c");
          catBodyGrad.addColorStop(0.7, "#a69279");
          catBodyGrad.addColorStop(1, "#88755f");
          ctx.fillStyle = catBodyGrad;
          ctx.beginPath();
          ctx.ellipse(0, -6, 13.5, 7.5, 0.05, 0, Math.PI * 2);
          ctx.fill();

          // Sọc vằn
          ctx.strokeStyle = "#38281a";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-5, -12);
          ctx.lineTo(-5, -5);
          ctx.moveTo(-1, -13);
          ctx.lineTo(-1, -4);
          ctx.moveTo(3, -12);
          ctx.lineTo(3, -5);
          ctx.stroke();

          // Chân sau khom
          ctx.strokeStyle = "#88755f";
          ctx.lineWidth = 3.0;
          ctx.beginPath();
          ctx.moveTo(-8, -2);
          ctx.lineTo(-8, 3);
          ctx.moveTo(-5, -2);
          ctx.lineTo(-5, 3);
          // 1 Chân trước chống đất, 1 chân trước giơ lên khều cuộn len
          ctx.moveTo(5, -2);
          ctx.lineTo(5, 3);
          ctx.moveTo(7, -3);
          ctx.lineTo(12, -2 + tapMotion);
          ctx.stroke();

          // Bàn chân trước khều len (tất trắng)
          ctx.fillStyle = "#faf6ee";
          ctx.beginPath();
          ctx.arc(12, -2 + tapMotion, 2.2, 0, Math.PI * 2);
          ctx.fill();

          // Đầu mèo chú ý cao độ
          const headX = 10;
          const headY = -10;
          ctx.save();
          ctx.translate(headX, headY);
          ctx.fillStyle = "#a69279";
          ctx.beginPath();
          ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
          ctx.fill();

          // Mõm trắng
          ctx.fillStyle = "#faf6ee";
          ctx.beginPath();
          ctx.ellipse(1.5, 2.5, 4.5, 3.2, 0, 0, Math.PI * 2);
          ctx.fill();

          // Tai
          ctx.fillStyle = "#9a866e";
          ctx.beginPath();
          ctx.moveTo(-5, -4);
          ctx.lineTo(-4, -11);
          ctx.lineTo(-1, -7);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(1.5, -7);
          ctx.lineTo(5.5, -11);
          ctx.lineTo(6.5, -4);
          ctx.closePath();
          ctx.fill();

          // Mắt to tròn mở rộng nhìn cuộn len
          ctx.fillStyle = "#2ec4b6";
          ctx.beginPath();
          ctx.arc(2.5, -1, 2.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#111d28";
          ctx.beginPath();
          ctx.arc(2.5, -1, 1.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(2.0, -1.5, 0.6, 0, Math.PI * 2);
          ctx.fill();

          // Mũi
          ctx.fillStyle = "#dc7364";
          ctx.beginPath();
          ctx.arc(2.2, 1.5, 1.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
          ctx.restore();

          if (catBubbleText) {
            drawSpeechBubble(currCatX, currCatY - 26, catBubbleText, {
              tailX: currCatX + (catFacingLeft ? -8 : 8),
              tailY: currCatY - 14,
              border: "#2ec4b6",
              textColor: "#0f4c5c",
            });
          }
        } else if (catState === "loaf_at_condo") {
          // --- MÈO NGỒI LIẾM LÔNG RỬA MẶT TRƯỚC CONDO ---
          ctx.save();
          ctx.translate(currCatX, currCatY);
          ctx.scale(catFacingLeft ? -0.92 : 0.92, 0.92);

          const groomPaw = Math.sin(time * 5) * 2.2;

          // Thân mèo ngồi tròn xinh
          const loafGrad = ctx.createRadialGradient(-2, -3, 2, 0, 0, 14);
          loafGrad.addColorStop(0, "#c4b29c");
          loafGrad.addColorStop(0.7, "#a69279");
          loafGrad.addColorStop(1, "#88755f");
          ctx.fillStyle = loafGrad;
          ctx.beginPath();
          ctx.ellipse(0, -3, 13.5, 8.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Đuôi cuộn quanh mình
          ctx.save();
          ctx.translate(-10, 1);
          ctx.rotate(0.2);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-6, 6, -3, 12);
          ctx.lineWidth = 3.5;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#a69279";
          ctx.stroke();
          ctx.restore();

          // Sọc vằn
          ctx.strokeStyle = "#38281a";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(-6, -8);
          ctx.lineTo(-6, -1);
          ctx.moveTo(-2, -9);
          ctx.lineTo(-2, 0);
          ctx.moveTo(2, -9);
          ctx.lineTo(2, 0);
          ctx.stroke();

          // Tất trắng
          ctx.fillStyle = "#faf6ee";
          ctx.beginPath();
          ctx.ellipse(4, 3, 4, 2.2, 0, 0, Math.PI * 2);
          ctx.fill();

          // Đầu mèo cúi nhẹ rửa mặt
          ctx.save();
          ctx.translate(9, -7);
          ctx.fillStyle = "#a69279";
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();

          // Chân trước giơ lên rửa mặt
          ctx.strokeStyle = "#88755f";
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.moveTo(-2, 4);
          ctx.lineTo(2, -2 + groomPaw);
          ctx.stroke();
          ctx.fillStyle = "#faf6ee";
          ctx.beginPath();
          ctx.arc(2, -2 + groomPaw, 2.2, 0, Math.PI * 2);
          ctx.fill();

          // Mắt híp lại thư thái
          ctx.beginPath();
          ctx.arc(2.2, -0.6, 2.0, 0.15, Math.PI * 0.85);
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = "#38281a";
          ctx.stroke();

          // Tai
          ctx.fillStyle = "#9a866e";
          ctx.beginPath();
          ctx.moveTo(-5, -3);
          ctx.lineTo(-3.8, -10);
          ctx.lineTo(-1, -6);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(1.5, -6);
          ctx.lineTo(5, -10);
          ctx.lineTo(6, -3);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
          ctx.restore();

          if (catBubbleText) {
            drawSpeechBubble(currCatX + 10, currCatY - 24, catBubbleText, {
              tailX: currCatX + 8,
              tailY: currCatY - 10,
              border: "#2ec4b6",
              textColor: "#0f4c5c",
            });
          }
        } else if (catState === "being_petted") {
          // --- MÈO ƯỠN LƯNG HƯỞNG THỤ BẠN NAM VUỐT VE ---
          ctx.save();
          ctx.translate(currCatX, currCatY);
          ctx.scale(catFacingLeft ? -0.92 : 0.92, 0.92);

          const archBack = Math.sin(time * 6) * 1.5;

          // Đuôi dựng đứng vểnh móc câu sung sướng
          ctx.save();
          ctx.translate(-11, -8 + archBack);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-4, -14, 0, -22);
          ctx.quadraticCurveTo(3, -25, 6, -21);
          ctx.lineWidth = 3.6;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#a69279";
          ctx.stroke();
          ctx.restore();

          // Thân mèo ưỡn cong lên
          const catBodyGrad = ctx.createRadialGradient(-2, -8 + archBack, 2, 0, -8 + archBack, 14);
          catBodyGrad.addColorStop(0, "#c4b29c");
          catBodyGrad.addColorStop(0.7, "#a69279");
          catBodyGrad.addColorStop(1, "#88755f");
          ctx.fillStyle = catBodyGrad;
          ctx.beginPath();
          ctx.ellipse(0, -8 + archBack, 13.5, 8.5, -0.15, 0, Math.PI * 2);
          ctx.fill();

          // Sọc vằn lưng
          ctx.strokeStyle = "#38281a";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(-6, -15 + archBack);
          ctx.lineTo(-6, -6 + archBack);
          ctx.moveTo(-2, -16 + archBack);
          ctx.lineTo(-2, -5 + archBack);
          ctx.moveTo(2, -15 + archBack);
          ctx.lineTo(2, -6 + archBack);
          ctx.stroke();

          // 4 chân đứng vững
          ctx.strokeStyle = "#88755f";
          ctx.lineWidth = 3.0;
          ctx.beginPath();
          ctx.moveTo(-7, -2);
          ctx.lineTo(-7, 3);
          ctx.moveTo(-4, -2);
          ctx.lineTo(-4, 3);
          ctx.moveTo(5, -2);
          ctx.lineTo(5, 3);
          ctx.moveTo(8, -2);
          ctx.lineTo(8, 3);
          ctx.stroke();

          // Đầu mèo ngửa lên dụi vào tay bạn Nam
          const headX = 11;
          const headY = -14 + archBack;
          ctx.save();
          ctx.translate(headX, headY);
          ctx.fillStyle = "#a69279";
          ctx.beginPath();
          ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
          ctx.fill();

          // Tai cụp sung sướng
          ctx.fillStyle = "#9a866e";
          ctx.beginPath();
          ctx.moveTo(-5, -3);
          ctx.lineTo(-3, -9);
          ctx.lineTo(0, -6);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(1.5, -6);
          ctx.lineTo(5, -9);
          ctx.lineTo(6, -2);
          ctx.closePath();
          ctx.fill();

          // Mắt nhắm tít cười tít (^ ‿ ^)
          ctx.beginPath();
          ctx.arc(2.2, -0.6, 2.2, 0.15, Math.PI * 0.85);
          ctx.lineWidth = 1.3;
          ctx.strokeStyle = "#38281a";
          ctx.stroke();

          // Má ửng hồng phớt
          ctx.fillStyle = "rgba(255, 120, 150, 0.35)";
          ctx.beginPath();
          ctx.ellipse(3.2, 1.2, 2.2, 1.4, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
          ctx.restore();

          if (catBubbleText) {
            drawSpeechBubble(currCatX + 16, currCatY - 30, catBubbleText, {
              tailX: currCatX + 10,
              tailY: currCatY - 16,
              border: "#2ec4b6",
              textColor: "#0f4c5c",
            });
          }
        } else {
          // --- MÈO NẰM / NGỒI LOAF BÊN MÉP BẾN GỖ NGẮM CÁ KOI ---
          ctx.save();
          ctx.translate(currCatX, currCatY);
          ctx.scale(0.92, 0.92); // Mặt quay sang phải nhìn xuống hồ cá

          const cuddCatBreath = Math.sin(time * 3.2) * 0.7;
          const cuddCatTail = Math.sin(time * 2.8) * 0.35;

          // Đuôi cuộn tròn thả nhẹ bên mép ván
          ctx.save();
          ctx.translate(-10, 1);
          ctx.rotate(0.3 + cuddCatTail);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-6, 6, -3, 12);
          ctx.lineWidth = 3.5;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#a69279";
          ctx.stroke();

          ctx.strokeStyle = "#38281a";
          ctx.lineWidth = 3.6;
          ctx.beginPath();
          ctx.moveTo(-3, 10);
          ctx.lineTo(-3, 12);
          ctx.stroke();
          ctx.restore();

          // Thân loaf
          const loafGrad = ctx.createRadialGradient(-2, -3, 2, 0, 0, 14);
          loafGrad.addColorStop(0, "#c4b29c");
          loafGrad.addColorStop(0.7, "#a69279");
          loafGrad.addColorStop(1, "#88755f");
          ctx.fillStyle = loafGrad;
          ctx.beginPath();
          ctx.ellipse(
            0,
            -2 + cuddCatBreath * 0.4,
            13.5,
            8.5 + cuddCatBreath * 0.4,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();

          // Sọc vằn lưng
          ctx.strokeStyle = "#38281a";
          ctx.lineWidth = 1.3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(-7, -7 + cuddCatBreath * 0.3);
          ctx.lineTo(-7, 0);
          ctx.moveTo(-3, -8 + cuddCatBreath * 0.3);
          ctx.lineTo(-3, 1);
          ctx.moveTo(1, -8 + cuddCatBreath * 0.3);
          ctx.lineTo(1, 0);
          ctx.stroke();

          // Tất trắng
          ctx.fillStyle = "#faf6ee";
          ctx.beginPath();
          ctx.ellipse(5, 3.5, 4, 2.2, 0, 0, Math.PI * 2);
          ctx.fill();

          // Đầu mèo ngước nhìn xuống nước ngắm cá
          ctx.save();
          ctx.translate(9, -6 + cuddCatBreath * 0.3);
          ctx.fillStyle = "#a69279";
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#faf6ee";
          ctx.beginPath();
          ctx.ellipse(1.5, 2.5, 4.2, 3, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#9a866e";
          ctx.beginPath();
          ctx.moveTo(-5, -3);
          ctx.lineTo(-3.8, -10);
          ctx.lineTo(-1, -6);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(1.5, -6);
          ctx.lineTo(5, -10);
          ctx.lineTo(6, -3);
          ctx.closePath();
          ctx.fill();

          // Chữ M
          ctx.strokeStyle = "#38281a";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(-3, -3.5);
          ctx.lineTo(-1.5, -1.5);
          ctx.lineTo(0, -3.2);
          ctx.lineTo(1.5, -1.5);
          ctx.lineTo(3, -3.5);
          ctx.stroke();

          // Mắt mở tròn tò mò ngắm cá bơi
          ctx.fillStyle = "#2ec4b6";
          ctx.beginPath();
          ctx.arc(2.2, -0.6, 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#111d28";
          ctx.beginPath();
          ctx.arc(2.2, -0.6, 1.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(1.8, -1.0, 0.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#dc7364";
          ctx.beginPath();
          ctx.arc(1.8, 1.5, 1.1, 0, Math.PI * 2);
          ctx.fill();

          // Râu
          ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(2.5, 1.8);
          ctx.lineTo(8.5, 0.8);
          ctx.moveTo(2.5, 2.8);
          ctx.lineTo(8, 3.8);
          ctx.stroke();

          ctx.restore();
          ctx.restore();

          if (catBubbleText) {
            drawSpeechBubble(currCatX + 10, currCatY - 22, catBubbleText, {
              tailX: currCatX + 8,
              tailY: currCatY - 10,
              border: "#2ec4b6",
              textColor: "#0f4c5c",
            });
          }
        }
      }

      // ==========================================
      // I. SƯƠNG MÙ TẦNG TRUNG (MID FOG)
      // ==========================================
      if (isFogMode) {
        for (let i = 0; i < fogPuffs.length; i++) {
          const puff = fogPuffs[i];
          if (puff.layer !== "mid") continue;

          puff.x += puff.speedX * (totalWind * 0.7);
          if (puff.x > width + puff.radiusX) {
            puff.x = -puff.radiusX;
            puff.y = height * 0.25 + Math.random() * (height * 0.55);
          }
          drawFogPuff(puff);
        }
      }

      // --- GIỌT NƯỚC MƯA NHỎ GIỌT TỪ TÁN CÂY (DRIPS) ---
      if (isRainMode) {
        for (let i = drips.length - 1; i >= 0; i--) {
          const d = drips[i];
          d.y += d.speedY;
          d.speedY += 0.16;
          d.alpha -= 0.012;

          ctx.beginPath();
          ctx.arc(d.x, d.y, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(190, 225, 255, ${Math.max(0, d.alpha)})`;
          ctx.fill();

          if (d.y > height - 10 || d.alpha <= 0) {
            drips.splice(i, 1);
          }
        }
      }

      // --- ĐOM ĐÓM BAY QUANH CÂY (BAN ĐÊM) ---
      if (effectiveNight && !isStormMode) {
        for (let i = 0; i < fireflies.length; i++) {
          const ff = fireflies[i];
          ff.x += ff.speedX + Math.sin(time + i) * 0.35;
          ff.y += ff.speedY + Math.cos(time + i) * 0.35;

          const glowAlpha = ff.baseAlpha * (0.4 + Math.sin(time * 3 + ff.phase) * 0.6);
          const fGrad = ctx.createRadialGradient(ff.x, ff.y, 0, ff.x, ff.y, ff.radius * 4.5);
          fGrad.addColorStop(0, `rgba(215, 255, 140, ${glowAlpha})`);
          fGrad.addColorStop(0.5, `rgba(160, 240, 90, ${glowAlpha * 0.4})`);
          fGrad.addColorStop(1, "rgba(160, 240, 90, 0)");

          ctx.fillStyle = fGrad;
          ctx.beginPath();
          ctx.arc(ff.x, ff.y, ff.radius * 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- LÁ RỤNG BAY THEO GIÓ ---
      for (let i = 0; i < leaves.length; i++) {
        const lf = leaves[i];
        ctx.save();
        ctx.translate(lf.x, lf.y);
        ctx.rotate(lf.rotation);

        // Hình dáng chiếc lá nhọn tự nhiên có cuống và gân lá
        ctx.fillStyle = lf.color;
        ctx.beginPath();
        ctx.moveTo(-lf.size * 1.5, 0);
        ctx.quadraticCurveTo(0, -lf.size * 0.85, lf.size * 1.5, 0);
        ctx.quadraticCurveTo(0, lf.size * 0.85, -lf.size * 1.5, 0);
        ctx.fill();

        // Gân lá mảnh
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(-lf.size * 1.4, 0);
        ctx.lineTo(lf.size * 1.3, 0);
        ctx.stroke();

        ctx.restore();

        lf.x += lf.speedX + totalWind * (isStormMode ? 3.0 : 1.6);
        lf.y += lf.speedY + Math.sin(time * 2 + i) * (isStormMode ? 1.5 : 0.6);
        lf.rotation += lf.rotSpeed * totalWind;

        if (lf.x > width + 80 || lf.y > height + 20) {
          lf.x = treeBaseX + (Math.random() - 0.3) * 160;
          lf.y = groundBaseY - 350 * treeScale + (Math.random() - 0.5) * 120;
        }
      }

      // --- MƯA RƠI & SPLASH THEO CƯỜNG ĐỘ ---
      if (isRainMode) {
        ctx.lineWidth = isStormMode
          ? 2.2
          : rainIntensity === "light"
            ? 1.0
            : rainIntensity === "medium"
              ? 1.4
              : 1.8;
        ctx.lineCap = "round";

        for (let i = 0; i < rainDrops.length; i++) {
          const drop = rainDrops[i];
          ctx.beginPath();
          ctx.strokeStyle = isStormMode
            ? `rgba(180, 215, 255, ${drop.opacity * 0.9})`
            : effectiveDay
              ? `rgba(110, 150, 195, ${drop.opacity})`
              : `rgba(195, 225, 255, ${drop.opacity})`;
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x + drop.length * windAngle, drop.y + drop.length);
          ctx.stroke();

          drop.x += drop.speed * windAngle;
          drop.y += drop.speed;

          if (drop.y > height - 12) {
            const maxSplashes = isStormMode ? 75 : 45;
            if (splashes.length < maxSplashes && Math.random() < (isStormMode ? 0.5 : 0.35)) {
              splashes.push({
                x: drop.x,
                y: height - 8 + Math.random() * 6,
                radius: 1,
                maxRadius: isStormMode
                  ? 7 + Math.random() * 8
                  : rainIntensity === "light"
                    ? 3 + Math.random() * 3
                    : 5 + Math.random() * 6,
                opacity: 0.7,
              });
            }
            drop.y = -drop.length - Math.random() * 50;
            drop.x = Math.random() * (width + 500) - 250;
          }
        }

        for (let i = splashes.length - 1; i >= 0; i--) {
          const s = splashes[i];
          s.radius += isStormMode ? 0.7 : 0.5;
          s.opacity -= 0.038;
          if (s.opacity <= 0) {
            splashes.splice(i, 1);
            continue;
          }
          ctx.beginPath();
          ctx.ellipse(s.x, s.y, s.radius * 2.2, s.radius * 0.75, 0, 0, Math.PI * 2);
          ctx.strokeStyle = isStormMode
            ? `rgba(190, 225, 255, ${s.opacity * 0.75})`
            : effectiveDay
              ? `rgba(125, 165, 205, ${s.opacity * 0.6})`
              : `rgba(205, 230, 255, ${s.opacity * 0.55})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // ==========================================
      // J. SƯƠNG LÀ LÀ MẶT ĐẤT & TIỀN CẢNH (GROUND & FOREGROUND FOG)
      // ==========================================
      if (isFogMode) {
        drawGroundMist(0, height - 170, 32, 0.35, 0.45);
        drawGroundMist(1, height - 120, 24, 0.55, 0.55);
        drawGroundMist(2, height - 60, 18, 0.75, 0.65);

        for (let i = 0; i < fogPuffs.length; i++) {
          const puff = fogPuffs[i];
          if (puff.layer !== "front") continue;

          puff.x += puff.speedX * (totalWind * 0.85);
          if (puff.x > width + puff.radiusX) {
            puff.x = -puff.radiusX;
            puff.y = height * 0.42 + Math.random() * (height * 0.55);
          }
          drawFogPuff(puff);
        }

        for (let i = 0; i < mistParticles.length; i++) {
          const mp = mistParticles[i];
          mp.x += mp.speedX * (totalWind * 0.7);
          mp.y += mp.speedY + Math.sin(time * 1.5 + mp.phase) * 0.35;

          if (mp.x > width + 40) {
            mp.x = -40;
            mp.y = Math.random() * height;
          }

          const pAlpha = mp.alpha * (0.8 + Math.sin(time * 2 + mp.phase) * 0.2);
          const colorPrefix = effectiveNight ? "190, 215, 245" : "240, 248, 255";
          ctx.beginPath();
          ctx.arc(mp.x, mp.y, mp.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${colorPrefix}, ${pAlpha})`;
          ctx.fill();
        }
      }

      // ==========================================
      // L. TIỀN CẢNH SIÊU GẦN TẠO HIỆU ỨNG CHIỀU SÂU ĐIỆN ẢNH (CINEMATIC DEPTH OF FIELD)
      // ==========================================
      ctx.save();
      const dofGrassColor = effectiveDay ? "rgba(35, 75, 45, 0.38)" : "rgba(12, 26, 16, 0.48)";
      ctx.fillStyle = dofGrassColor;

      // Góc trái dưới (Left foreground vignette blades)
      for (let g = 0; g < 7; g++) {
        const gx = -8 + g * 8;
        const gSway = Math.sin(time * 2.2 + g) * 3;
        const gH = 32 + Math.sin(g * 1.7) * 12;
        ctx.beginPath();
        ctx.moveTo(gx - 3, height);
        ctx.quadraticCurveTo(gx + gSway * 0.5, height - gH * 0.6, gx + gSway, height - gH);
        ctx.quadraticCurveTo(gx + 4 + gSway * 0.4, height - gH * 0.5, gx + 4, height);
        ctx.closePath();
        ctx.fill();
      }

      // Góc phải dưới (Right foreground vignette blades)
      for (let g = 0; g < 7; g++) {
        const gx = width - 48 + g * 8;
        const gSway = Math.sin(time * 2.2 + g * 1.3) * 3;
        const gH = 30 + Math.cos(g * 1.5) * 10;
        ctx.beginPath();
        ctx.moveTo(gx - 3, height);
        ctx.quadraticCurveTo(gx + gSway * 0.5, height - gH * 0.6, gx + gSway, height - gH);
        ctx.quadraticCurveTo(gx + 4 + gSway * 0.4, height - gH * 0.5, gx + 4, height);
        ctx.closePath();
        ctx.fill();
      }

      // Hạt bụi ánh sáng lung linh lơ lửng gần ống kính (Cinematic Bokeh Light Motes)
      for (let b = 0; b < 6; b++) {
        const bSpeed = 0.25 + b * 0.08;
        const bx = ((time * 20 * bSpeed + b * 180) % (width + 60)) - 30;
        const by = height * 0.4 + Math.sin(time * 1.8 + b * 1.7) * 45 + ((b * 80) % (height * 0.5));
        const bRadius = 2.2 + Math.sin(time * 2 + b) * 1.2;
        const bAlpha = 0.25 + Math.sin(time * 2.5 + b) * 0.15;

        ctx.beginPath();
        ctx.arc(bx, by, Math.max(1, bRadius), 0, Math.PI * 2);
        ctx.fillStyle = effectiveDay
          ? `rgba(255, 245, 210, ${bAlpha})`
          : `rgba(180, 225, 255, ${bAlpha})`;
        ctx.fill();
      }

      ctx.restore();
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("click", handleCanvasClick);
    };
  }, [
    activeEffect,
    temperature,
    isDay,
    windSpeed,
    rainIntensity,
    effectiveDay,
    effectiveNight,
    sunrise,
    sunset,
    moonPhase,
  ]);

  return { canvasRef };
}
