import { useEffect, useRef, useState } from "react";
import { TYPE_COLORS, type PokemonType } from "../data/typeChart";
import { getOfficialArtwork, formatName } from "../services/pokeapi";

interface Props {
  attackerId: number;
  attackerName: string;
  defenderId: number;
  defenderName: string;
  moveType: PokemonType;
  moveName: string;
  effectiveness: number;
  onClose: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

type FxStyle = "stream" | "beam" | "bolt" | "eruption";

const FX_STYLE: Partial<Record<string, FxStyle>> = {
  electric: "bolt",
  dragon: "beam",
  psychic: "beam",
  ice: "beam",
  steel: "beam",
  ground: "eruption",
  rock: "eruption",
};

const FIRE_DRIFT = new Set(["fire"]);
const GRAVITY_FX = new Set(["water", "poison"]);
const SWIRL_FX = new Set(["grass", "fairy", "bug"]);
const WAVE_FX = new Set(["ghost", "dark", "psychic"]);

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function lighten(hex: string, amount = 0.45): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.min(255, (r + (255 - r) * amount) | 0)},${Math.min(255, (g + (255 - g) * amount) | 0)},${Math.min(255, (b + (255 - b) * amount) | 0)})`;
}

function getPhase(t: number): [string, number] {
  if (t < 1200) return ["intro", t / 1200];
  if (t < 1800) return ["charge", (t - 1200) / 600];
  if (t < 3800) return ["attack", (t - 1800) / 2000];
  if (t < 5000) return ["impact", (t - 3800) / 1200];
  return ["result", (t - 5000) / 1000];
}

const easeOut = (x: number) => 1 - (1 - x) ** 3;

export default function BattleAnimation({
  attackerId, attackerName, defenderId, defenderName,
  moveType, moveName, effectiveness, onClose,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const closedRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    let dead = false;
    let raf = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    const c1 = TYPE_COLORS[moveType] || "#888";
    const c2 = lighten(c1);
    const [cr, cg, cb] = hexToRgb(c1);
    const fx: FxStyle = FX_STYLE[moveType] ?? "stream";

    const sprSz = Math.min(H * 0.42, 260);
    const atkX = W * 0.15;
    const atkY = H * 0.5 - sprSz / 2;
    const defX = W * 0.85 - sprSz;
    const defY = H * 0.5 - sprSz / 2;
    const groundY = Math.max(atkY, defY) + sprSz + 8;

    const pts: Particle[] = [];
    let impactDone = false;

    function spawn(x: number, y: number, vx: number, vy: number, size: number, maxLife: number, color: string) {
      if (pts.length < 300) pts.push({ x, y, vx, vy, life: 0, maxLife, size, color });
    }

    (async () => {
      let aImg: HTMLImageElement, dImg: HTMLImageElement;
      try {
        [aImg, dImg] = await Promise.all([
          loadImage(getOfficialArtwork(attackerId)),
          loadImage(getOfficialArtwork(defenderId)),
        ]);
      } catch {
        if (!dead) onCloseRef.current();
        return;
      }
      if (dead) return;
      setLoading(false);

      const t0 = performance.now();

      function frame(now: number) {
        if (dead || closedRef.current) return;
        const t = now - t0;
        if (t > 6000) { onCloseRef.current(); return; }

        const [ph, f] = getPhase(t);
        ctx.clearRect(0, 0, W, H);

        // Background
        const bgA = ph === "intro" ? Math.min(f * 1.8, 1) : ph === "result" ? Math.max(1 - f * 1.5, 0) : 1;
        ctx.fillStyle = `rgba(12,12,22,${bgA * 0.93})`;
        ctx.fillRect(0, 0, W, H);
        const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.55);
        g.addColorStop(0, `rgba(${cr},${cg},${cb},${0.08 * bgA})`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        // Ground plane
        if (bgA > 0.4) {
          ctx.globalAlpha = bgA * 0.25;
          const gg = ctx.createLinearGradient(0, groundY, 0, groundY + 24);
          gg.addColorStop(0, `rgba(${cr},${cg},${cb},0.35)`);
          gg.addColorStop(1, "transparent");
          ctx.fillStyle = gg;
          ctx.fillRect(W * 0.05, groundY, W * 0.9, 24);
          ctx.globalAlpha = 1;
        }

        // Screen shake
        let shx = 0, shy = 0;
        if (ph === "impact" && f < 0.4) {
          const i = (1 - f * 2.5) * 10;
          shx = (Math.random() - 0.5) * i;
          shy = (Math.random() - 0.5) * i;
        }
        ctx.save();
        ctx.translate(shx, shy);

        // Sprite offsets
        let aoX = 0, doX = 0, aGlow = false, dFlash = false;

        if (ph === "intro") {
          aoX = -180 * (1 - easeOut(f));
          doX = 180 * (1 - easeOut(f));
        }

        if (ph === "charge") {
          aGlow = true;
          for (let i = 0; i < 2; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 40 + Math.random() * 50;
            spawn(
              atkX + sprSz / 2 + Math.cos(a) * r, atkY + sprSz / 2 + Math.sin(a) * r,
              -Math.cos(a) * 1.5, -Math.sin(a) * 1.5,
              2 + Math.random() * 3, 20, c1,
            );
          }
        }

        if (ph === "attack") {
          const lunge = f < 0.12 ? f / 0.12 : f > 0.88 ? (1 - f) / 0.12 : 1;
          aoX = lunge * W * 0.07;
          aGlow = true;

          if (fx === "eruption") {
            for (let i = 0; i < 3; i++) {
              spawn(
                defX + sprSz * (0.2 + Math.random() * 0.6), defY + sprSz,
                (Math.random() - 0.5) * 3, -(3 + Math.random() * 5),
                4 + Math.random() * 6, 30 + Math.random() * 20,
                Math.random() > 0.4 ? c1 : c2,
              );
            }
          } else {
            for (let i = 0; i < 4; i++) {
              const sx = atkX + sprSz * 0.8 + aoX;
              const sy = atkY + sprSz * 0.4 + (Math.random() - 0.5) * sprSz * 0.5;
              const tx = defX + sprSz * 0.3;
              const ty = defY + sprSz * 0.5 + (Math.random() - 0.5) * sprSz * 0.3;
              const ddx = tx - sx, ddy = ty - sy;
              const dist = Math.hypot(ddx, ddy);
              const spd = 5 + Math.random() * 3;
              spawn(
                sx, sy,
                (ddx / dist) * spd + (Math.random() - 0.5) * 1.2,
                (ddy / dist) * spd + (Math.random() - 0.5) * 1.2,
                3 + Math.random() * 6, dist / spd + Math.random() * 10,
                Math.random() > 0.35 ? c1 : c2,
              );
            }
          }
        }

        if (ph === "impact") {
          dFlash = f < 0.12;
          doX = Math.sin(f * Math.PI * 7) * (1 - f) * 14;
          if (!impactDone) {
            impactDone = true;
            for (let i = 0; i < 25; i++) {
              const a = Math.random() * Math.PI * 2;
              const spd = 2 + Math.random() * 6;
              spawn(
                defX + sprSz / 2, defY + sprSz / 2,
                Math.cos(a) * spd, Math.sin(a) * spd,
                2 + Math.random() * 5, 25 + Math.random() * 15,
                Math.random() > 0.3 ? c1 : "#ffffff",
              );
            }
          }
        }

        // Sprites
        const aA = ph === "intro" ? Math.min(f * 2, 1) : ph === "result" ? Math.max(1 - f * 1.8, 0) : 1;
        ctx.globalAlpha = aA;
        if (aGlow) { ctx.shadowColor = c1; ctx.shadowBlur = 25; }
        ctx.drawImage(aImg, atkX + aoX, atkY, sprSz, sprSz);
        ctx.shadowBlur = 0;

        const dA = (ph === "intro" ? Math.min(f * 2, 1) : ph === "result" ? Math.max(1 - f * 1.8, 0) : 1) * (dFlash ? 0.3 : 1);
        ctx.globalAlpha = dA;
        if (dFlash) { ctx.shadowColor = "#fff"; ctx.shadowBlur = 35; }
        ctx.drawImage(dImg, defX + doX, defY, sprSz, sprSz);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // Beam / bolt overlay
        if (ph === "attack" && (fx === "beam" || fx === "bolt")) {
          const bA = f < 0.1 ? f * 10 : f > 0.9 ? (1 - f) * 10 : 0.7;
          ctx.globalAlpha = bA;
          const bx1 = atkX + sprSz * 0.8 + aoX, by1 = atkY + sprSz * 0.45;
          const bx2 = defX + sprSz * 0.2, by2 = defY + sprSz * 0.5;

          if (fx === "beam") {
            const bg = ctx.createLinearGradient(bx1, by1, bx2, by2);
            bg.addColorStop(0, c1);
            bg.addColorStop(0.5, c2);
            bg.addColorStop(1, c1);
            ctx.strokeStyle = bg;
            ctx.lineWidth = 8 + Math.sin(f * Math.PI * 6) * 3;
            ctx.lineCap = "round";
            ctx.shadowColor = c1;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.moveTo(bx1, by1);
            ctx.lineTo(bx2, by2);
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else {
            ctx.strokeStyle = c2;
            ctx.lineWidth = 3;
            ctx.shadowColor = c1;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.moveTo(bx1, by1);
            const segs = 12;
            for (let i = 1; i <= segs; i++) {
              const pct = i / segs;
              ctx.lineTo(
                bx1 + (bx2 - bx1) * pct,
                by1 + (by2 - by1) * pct + (i < segs ? (Math.random() - 0.5) * 40 : 0),
              );
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
          ctx.globalAlpha = 1;
        }

        // Particles (with type-specific physics)
        for (let i = pts.length - 1; i >= 0; i--) {
          const p = pts[i];
          p.x += p.vx;
          p.y += p.vy;
          if (FIRE_DRIFT.has(moveType)) p.vy -= 0.08;
          if (GRAVITY_FX.has(moveType)) p.vy += 0.05;
          if (SWIRL_FX.has(moveType)) p.vx += Math.sin(p.life * 0.3) * 0.2;
          if (WAVE_FX.has(moveType)) p.x += Math.sin(p.life * 0.15) * 0.8;
          p.life++;
          if (p.life >= p.maxLife) { pts.splice(i, 1); continue; }
          const lr = 1 - p.life / p.maxLife;
          ctx.globalAlpha = lr * 0.85;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * Math.max(lr, 0.3), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Full-screen flash
        if (ph === "impact" && f < 0.08) {
          ctx.fillStyle = `rgba(255,255,255,${(1 - f * 12.5) * 0.55})`;
          ctx.fillRect(-20, -20, W + 40, H + 40);
        }

        // VS text (intro → charge transition)
        let vsA = 0;
        if (ph === "intro" && f > 0.5) vsA = Math.min((f - 0.5) * 4, 1);
        if (ph === "charge" && f < 0.3) vsA = 1 - f * 3.3;
        if (vsA > 0.01) {
          ctx.globalAlpha = vsA;
          ctx.font = `bold ${Math.max(36, W * 0.05)}px "Press Start 2P",monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 5;
          ctx.strokeText("VS", W / 2, H / 2);
          ctx.fillStyle = "#ff4444";
          ctx.fillText("VS", W / 2, H / 2);
        }

        // Pokemon names
        const nA = ph === "intro" ? Math.max((f - 0.4) * 1.7, 0) : ph === "result" ? Math.max(1 - f * 2, 0) : 1;
        if (nA > 0.01) {
          ctx.globalAlpha = nA;
          ctx.fillStyle = "#fff";
          ctx.font = `bold ${Math.max(13, W * 0.016)}px Inter,sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "alphabetic";
          ctx.fillText(formatName(attackerName), atkX + sprSz / 2, atkY + sprSz + 26);
          ctx.fillText(formatName(defenderName), defX + sprSz / 2, defY + sprSz + 26);
        }

        // Move name
        if (ph === "attack" || (ph === "impact" && f < 0.3)) {
          const mA = ph === "attack"
            ? (f < 0.08 ? f * 12.5 : f > 0.92 ? (1 - f) * 12.5 : 1)
            : 1 - f * 3.3;
          ctx.globalAlpha = mA;
          ctx.font = `bold ${Math.max(18, W * 0.025)}px "Press Start 2P",monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "alphabetic";
          const mt = formatName(moveName);
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 3;
          ctx.strokeText(mt, W / 2, H * 0.12);
          ctx.fillStyle = c2;
          ctx.fillText(mt, W / 2, H * 0.12);
        }

        // Effectiveness text
        if (ph === "result") {
          const rp = Math.min(f * 2.5, 1);
          const sc = 0.7 + rp * 0.3;
          ctx.globalAlpha = rp;
          ctx.save();
          ctx.translate(W / 2, H / 2);
          ctx.scale(sc, sc);

          let txt: string, col: string;
          if (effectiveness === 0) { txt = "No Effect..."; col = "#999"; }
          else if (effectiveness < 1) { txt = "Not Very Effective..."; col = "#ff6b6b"; }
          else if (effectiveness >= 4) { txt = "SUPER EFFECTIVE!!"; col = "#ffd43b"; }
          else if (effectiveness >= 2) { txt = "Super Effective!"; col = "#51cf66"; }
          else { txt = "Normal Damage"; col = "#fff"; }

          ctx.font = `bold ${Math.max(22, W * 0.03)}px "Press Start 2P",monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 4;
          ctx.strokeText(txt, 0, 0);
          ctx.fillStyle = col;
          ctx.fillText(txt, 0, 0);
          ctx.restore();
        }

        ctx.globalAlpha = 1;
        ctx.restore();
        raf = requestAnimationFrame(frame);
      }

      raf = requestAnimationFrame(frame);
    })();

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
    };
  }, [attackerId, attackerName, defenderId, defenderName, moveType, moveName, effectiveness]);

  const handleClose = () => {
    closedRef.current = true;
    onCloseRef.current();
  };

  return (
    <div className="fixed inset-0 z-50">
      {loading && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
          <p className="text-white font-retro text-sm animate-pulse">Loading battle...</p>
        </div>
      )}
      <canvas ref={canvasRef} className="block" />
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-white/60 hover:text-white text-sm bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm transition-colors z-10"
      >
        Skip ✕
      </button>
    </div>
  );
}
