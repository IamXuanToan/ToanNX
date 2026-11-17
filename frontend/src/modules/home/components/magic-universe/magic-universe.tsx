"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Các bảng màu ánh sáng Studio nghệ thuật (Lighting Moods):
 * Tạo hiệu ứng khúc xạ và phản quang đa sắc trên bề mặt vật thể lỏng.
 */
export const LIGHT_THEMES = [
  {
    name: "Celestial Opal",
    colorA: "#00f5ff", // Vivid Cyan
    colorB: "#c084fc", // Lavender Violet
    colorC: "#ffffff", // Diamond Light
    accent: "#38bdf8",
  },
  {
    name: "Sunset Rose Gold",
    colorA: "#ff5252", // Sunset Coral
    colorB: "#f59e0b", // Golden Amber
    colorC: "#fed7aa", // Peach Silk
    accent: "#fb7185",
  },
  {
    name: "Emerald Twilight",
    colorA: "#10b981", // Emerald
    colorB: "#06b6d4", // Electric Teal
    colorC: "#a7f3d0", // Mint Sparkle
    accent: "#34d399",
  },
  {
    name: "Cyber Twilight",
    colorA: "#ec4899", // Hot Pink
    colorB: "#3b82f6", // Electric Blue
    colorC: "#fbcfe8", // Ice Magenta
    accent: "#a855f7",
  },
] as const;

export type MagicUniverseHandle = {
  cycleTheme: () => number;
  triggerRipple: () => void;
};

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  uniform float uTime;
  uniform float uRipple;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;

    // Sóng hữu cơ 3D nhiều tần số
    float d1 = sin(position.x * 1.4 + uTime * 1.1) * cos(position.y * 1.4 + uTime * 0.9);
    float d2 = sin(position.z * 1.4 + uTime * 1.2) * cos(position.x * 1.1 - uTime * 0.8);
    float d3 = sin(position.x * 2.8 + position.y * 2.8 + position.z * 2.8 + uTime * 1.8) * 0.12;
    float displacement = (d1 * d2 * 0.45 + d3) * (0.32 + uRipple);

    vec3 newPosition = position + normal * displacement;
    vWorldPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec3 uCameraPos;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(uCameraPos - vWorldPosition);

    // Hiệu ứng góc nhìn Fresnel
    float fresnel = clamp(1.0 - dot(normal, viewDir), 0.0, 1.0);
    float rim = pow(fresnel, 2.0);
    float softFresnel = pow(fresnel, 1.1);

    // Lõi obsidian đen tuyền sang trọng
    vec3 baseColor = vec3(0.045, 0.048, 0.075);
    
    // Pha trộn lớp ánh quang xà cừ óng ánh
    vec3 color = mix(baseColor, uColorA, softFresnel * 0.65);
    color = mix(color, uColorB, rim * 0.9);

    // Ánh phản chiếu Specular điểm sáng
    vec3 lightDir1 = normalize(vec3(0.6, 0.8, 1.0));
    vec3 halfDir1 = normalize(lightDir1 + viewDir);
    float spec1 = pow(max(dot(normal, halfDir1), 0.0), 36.0);

    vec3 lightDir2 = normalize(vec3(-0.7, -0.5, 0.8));
    vec3 halfDir2 = normalize(lightDir2 + viewDir);
    float spec2 = pow(max(dot(normal, halfDir2), 0.0), 24.0);

    color += uColorC * spec1 * 0.75;
    color += uColorA * spec2 * 0.45;

    // Chiều sâu lõi phát quang nhẹ
    color += uColorA * 0.06;

    gl_FragColor = vec4(color, 0.94);
  }
`;

/**
 * Hiệu ứng điêu khắc 3D chất lỏng óng ánh (Iridescent Liquid Opal Sculpture):
 * - Vật thể lỏng kim loại / xà cừ với hiệu ứng Fresnel phát sáng quang học.
 * - 2 vòng hào quang kim loại mỏng tinh tế quay quanh tâm.
 * - Bụi sáng Bokeh mềm mại trôi trong không gian tối obsidian.
 * - Tương tác di chuột thị sai mượt mà và chuyển đổi các mood ánh sáng điện ảnh khi nhấp chuột.
 */
export function MagicUniverse({
  onReady,
  onThemeChange,
}: {
  onReady?: (handle: MagicUniverseHandle) => void;
  onThemeChange?: (themeIndex: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  const onThemeChangeRef = useRef(onThemeChange);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    onThemeChangeRef.current = onThemeChange;
  }, [onThemeChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06070b);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.2);
    camera.lookAt(0, 0, 0);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const domElement = renderer.domElement;
    domElement.className = "pointer-events-none absolute inset-0 size-full";
    container.appendChild(domElement);

    // ==========================================
    // 1. Quản lý Màu sắc & Shader Uniforms
    // ==========================================
    let currentThemeIndex = 0;
    const currentColorA = new THREE.Color(LIGHT_THEMES[0].colorA);
    const currentColorB = new THREE.Color(LIGHT_THEMES[0].colorB);
    const currentColorC = new THREE.Color(LIGHT_THEMES[0].colorC);

    const targetColorA = new THREE.Color(LIGHT_THEMES[0].colorA);
    const targetColorB = new THREE.Color(LIGHT_THEMES[0].colorB);
    const targetColorC = new THREE.Color(LIGHT_THEMES[0].colorC);

    const shaderMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uRipple: { value: 0 },
        uColorA: { value: currentColorA },
        uColorB: { value: currentColorB },
        uColorC: { value: currentColorC },
        uCameraPos: { value: camera.position },
      },
      transparent: true,
    });

    // ==========================================
    // 2. Vật thể điêu khắc chất lỏng (Liquid Sculpture)
    // ==========================================
    const sculptureGroup = new THREE.Group();
    sculptureGroup.position.set(0, 0.2, 0);

    const getBaseScale = (w: number) => (w < 640 ? 0.72 : 1.0);
    let baseScale = getBaseScale(width);
    sculptureGroup.scale.setScalar(baseScale);

    // Khối cầu đa diện mịn cao cấp
    const baseGeo = new THREE.IcosahedronGeometry(1.68, 48);
    const sculptureMesh = new THREE.Mesh(baseGeo, shaderMaterial);
    sculptureGroup.add(sculptureMesh);

    // ==========================================
    // 3. Hai vòng hào quang kim loại bóng loáng (Polished Chrome Gyro Rings)
    // ==========================================
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: new THREE.Color(LIGHT_THEMES[0].accent),
      metalness: 0.95,
      roughness: 0.15,
      emissive: new THREE.Color(LIGHT_THEMES[0].accent),
      emissiveIntensity: 0.2,
    });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.015, 24, 160), ringMat1);
    ring1.rotation.x = Math.PI / 2.6;
    ring1.rotation.y = Math.PI / 5;
    sculptureGroup.add(ring1);

    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0xffffff,
      emissiveIntensity: 0.15,
    });
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.012, 24, 160), ringMat2);
    ring2.rotation.x = -Math.PI / 3;
    ring2.rotation.z = Math.PI / 4;
    sculptureGroup.add(ring2);

    const ringLight = new THREE.PointLight(0xffffff, 18, 12);
    ringLight.position.set(0, 3, 3);
    scene.add(ringLight);

    scene.add(sculptureGroup);

    // ==========================================
    // 4. Bụi sáng Bokeh mềm mại trôi lơ lửng (Floating Bokeh Motes)
    // ==========================================
    const dustCount = 40;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    const dustSeeds = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      const i3 = i * 3;
      dustPos[i3] = (Math.random() - 0.5) * 14;
      dustPos[i3 + 1] = (Math.random() - 0.5) * 10;
      dustPos[i3 + 2] = (Math.random() - 0.5) * 6;

      dustSeeds[i3] = Math.random() * Math.PI * 2;
      dustSeeds[i3 + 1] = 0.3 + Math.random() * 0.7;
      dustSeeds[i3 + 2] = 0.5 + Math.random() * 1.0;
    }

    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));

    const dustCanvas = document.createElement("canvas");
    dustCanvas.width = 32;
    dustCanvas.height = 32;
    const ctx = dustCanvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      grad.addColorStop(0.3, "rgba(224, 231, 255, 0.5)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    const dustTexture = new THREE.CanvasTexture(dustCanvas);

    const dustMat = new THREE.PointsMaterial({
      size: 0.3,
      map: dustTexture,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // ==========================================
    // 5. Tương tác & Kích hoạt chuyển đổi Theme
    // ==========================================
    let rippleIntensity = 0;

    const triggerRipple = () => {
      rippleIntensity = 0.75;
      sculptureGroup.scale.setScalar(baseScale * 1.15);
    };

    const cycleTheme = (): number => {
      currentThemeIndex = (currentThemeIndex + 1) % LIGHT_THEMES.length;
      const theme = LIGHT_THEMES[currentThemeIndex];
      targetColorA.set(theme.colorA);
      targetColorB.set(theme.colorB);
      targetColorC.set(theme.colorC);
      ringMat1.color.set(theme.accent);
      triggerRipple();
      if (onThemeChangeRef.current) {
        onThemeChangeRef.current(currentThemeIndex);
      }
      return currentThemeIndex;
    };

    if (onReadyRef.current) {
      onReadyRef.current({ cycleTheme, triggerRipple });
    }

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      targetX = (e.clientX - halfW) / halfW;
      targetY = (e.clientY - halfH) / halfH;
    };

    const handleClick = () => {
      cycleTheme();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handleClick, { passive: true });

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      baseScale = getBaseScale(width);
    };

    window.addEventListener("resize", handleResize);

    // ==========================================
    // 6. Vòng lặp hoạt họa (Animation Loop)
    // ==========================================
    let animationFrameId = 0;
    let lastTime = performance.now() * 0.001;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (document.hidden) return;

      const currentTime = performance.now() * 0.001;
      const delta = Math.min(currentTime - lastTime, 0.1);
      lastTime = currentTime;

      // Quán tính chuột mượt mà
      mouseX += (targetX - mouseX) * 0.04;
      mouseY += (targetY - mouseY) * 0.04;

      // Di chuyển camera theo thị sai
      camera.position.x = mouseX * 0.8;
      camera.position.y = -mouseY * 0.6;
      camera.lookAt(0, 0.2, 0);

      // Cập nhật shader uniforms
      if (rippleIntensity > 0) {
        rippleIntensity = Math.max(0, rippleIntensity - delta * 1.1);
      }

      shaderMaterial.uniforms.uTime.value = currentTime;
      shaderMaterial.uniforms.uRipple.value = rippleIntensity;

      // Chuyển màu mượt mà
      currentColorA.lerp(targetColorA, 0.06);
      currentColorB.lerp(targetColorB, 0.06);
      currentColorC.lerp(targetColorC, 0.06);

      shaderMaterial.uniforms.uColorA.value = currentColorA;
      shaderMaterial.uniforms.uColorB.value = currentColorB;
      shaderMaterial.uniforms.uColorC.value = currentColorC;
      shaderMaterial.uniforms.uCameraPos.value = camera.position;

      // Xoay nhẹ vật thể điêu khắc
      sculptureMesh.rotation.x = currentTime * 0.15 + mouseY * 0.2;
      sculptureMesh.rotation.y = currentTime * 0.2 + mouseX * 0.25;

      // Xoay 2 vòng hào quang
      ring1.rotation.z += 0.006;
      ring1.rotation.x = Math.PI / 2.6 + Math.sin(currentTime * 0.4) * 0.06;

      ring2.rotation.z -= 0.008;
      ring2.rotation.y = Math.PI / 4 + Math.cos(currentTime * 0.5) * 0.06;

      // Thu nhỏ dần vật thể về tỉ lệ ban đầu sau kích nổ
      if (sculptureGroup.scale.x > baseScale) {
        const nextScale = THREE.MathUtils.lerp(sculptureGroup.scale.x, baseScale, 0.05);
        sculptureGroup.scale.setScalar(nextScale);
      }

      // Hoạt họa bụi sáng Bokeh
      const dPos = dustGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < dustCount; i++) {
        const i3 = i * 3;
        const seedX = dustSeeds[i3];
        const speed = dustSeeds[i3 + 1];
        const ampD = dustSeeds[i3 + 2];
        dPos[i3 + 1] += Math.sin(currentTime * speed + seedX) * 0.006 * ampD;
        dPos[i3] += Math.cos(currentTime * speed * 0.7 + seedX) * 0.004 * ampD;
      }
      dustGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handleClick);
      window.removeEventListener("resize", handleResize);

      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }

      baseGeo.dispose();
      shaderMaterial.dispose();
      ring1.geometry.dispose();
      ringMat1.dispose();
      ring2.geometry.dispose();
      ringMat2.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      dustTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 z-0 size-full overflow-hidden" />;
}
