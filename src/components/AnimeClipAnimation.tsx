import { useEffect, useRef, useState } from "react";
import { TYPE_COLORS, type PokemonType } from "../data/typeChart";
import { getOfficialArtwork, formatName } from "../services/pokeapi";

interface Props {
  clipId: string;
  attackerId: number;
  attackerName: string;
  defenderId: number;
  defenderName: string;
  moveType: PokemonType;
  moveName: string;
  effectiveness: number;
  onClose: () => void;
}

interface Spark {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number; color: string;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function hexRgb(h: string): [number, number, number] {
  const s = h.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

function lighten(hex: string, a = 0.5): string {
  const [r, g, b] = hexRgb(hex);
  return `rgb(${Math.min(255, r + (255 - r) * a | 0)},${Math.min(255, g + (255 - g) * a | 0)},${Math.min(255, b + (255 - b) * a | 0)})`;
}

const ease = (x: number) => 1 - (1 - x) ** 3;
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

type Phase = "cinematic_in" | "callout" | "charge" | "attack" | "impact" | "result";

function getPhase(t: number): [Phase, number] {
  if (t < 1500) return ["cinematic_in", t / 1500];
  if (t < 3000) return ["callout", (t - 1500) / 1500];
  if (t < 4000) return ["charge", (t - 3000) / 1000];
  if (t < 5500) return ["attack", (t - 4000) / 1500];
  if (t < 6500) return ["impact", (t - 5500) / 1000];
  return ["result", (t - 6500) / 1500];
}

// Branching lightning bolt (recursive)
function drawBolt(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  width: number, depth: number, color: string, glow: string,
) {
  const segs = 8 + (depth * 2);
  const dx = (x2 - x1) / segs, dy = (y2 - y1) / segs;
  const jitter = Math.hypot(x2 - x1, y2 - y1) * 0.12;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.shadowColor = glow;
  ctx.shadowBlur = width * 5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  let px = x1, py = y1;
  for (let i = 1; i <= segs; i++) {
    const nx = x1 + dx * i + (i < segs ? (Math.random() - 0.5) * jitter : 0);
    const ny = y1 + dy * i + (i < segs ? (Math.random() - 0.5) * jitter : 0);
    ctx.lineTo(nx, ny);
    if (depth > 0 && Math.random() < 0.3) {
      drawBolt(ctx, px, py,
        px + (Math.random() - 0.5) * jitter * 3,
        py + Math.abs(dy) * 3 + Math.random() * jitter * 2,
        width * 0.4, depth - 1, color, glow);
    }
    px = nx; py = ny;
  }
  ctx.stroke();
  ctx.restore();
}

// Fire stream: arc of flame from source toward target
function drawFireArc(
  ctx: CanvasRenderingContext2D, sparks: Spark[],
  sx: number, sy: number, tx: number, ty: number,
  progress: number, c1: string, c2: string,
) {
  const count = Math.min(progress * 80, 60) | 0;
  for (let i = 0; i < count; i++) {
    const p = i / count;
    const cp = Math.min(p * (0.3 + progress * 0.7), 1);
    const mx = (sx + tx) / 2, my = Math.min(sy, ty) - 80;
    const x = (1 - cp) ** 2 * sx + 2 * (1 - cp) * cp * mx + cp ** 2 * tx;
    const y = (1 - cp) ** 2 * sy + 2 * (1 - cp) * cp * my + cp ** 2 * ty;
    const jx = (Math.random() - 0.5) * 30;
    const jy = (Math.random() - 0.5) * 20;
    const sz = 4 + Math.random() * 8;
    ctx.globalAlpha = (1 - cp) * 0.7 + 0.15;
    ctx.fillStyle = Math.random() > 0.4 ? c1 : c2;
    ctx.beginPath();
    ctx.arc(x + jx, y + jy, sz, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (progress > 0.4 && sparks.length < 300) {
    for (let i = 0; i < 2; i++) {
      const a = Math.random() * Math.PI * 2;
      sparks.push({
        x: tx + (Math.random() - 0.5) * 40,
        y: ty + (Math.random() - 0.5) * 30,
        vx: Math.cos(a) * (1 + Math.random() * 2),
        vy: Math.sin(a) * (1 + Math.random() * 2) - 1.5,
        life: 0, maxLife: 15 + Math.random() * 15,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.3 ? c1 : "#FFD54F",
      });
    }
  }
}

export default function AnimeClipAnimation({
  clipId, attackerId, attackerName, defenderId, defenderName,
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
    const [cr, cg, cb] = hexRgb(c1);

    const sprSz = Math.min(H * 0.55, 320);
    const atkHomeX = W * 0.08;
    const atkHomeY = H * 0.5 - sprSz * 0.4;
    const defHomeX = W * 0.92 - sprSz;
    const defHomeY = H * 0.5 - sprSz * 0.45;

    const letterH = H * 0.12;
    const sparks: Spark[] = [];
    let impactBurstDone = false;
    let freezeUntil = 0;
    const calloutText = `${formatName(attackerName)} used ${formatName(moveName)}!`;
    const isThunderbolt = clipId === "pikachu-thunderbolt";

    (async () => {
      let aImg: HTMLImageElement, dImg: HTMLImageElement;
      try {
        [aImg, dImg] = await Promise.all([
          loadImg(getOfficialArtwork(attackerId)),
          loadImg(getOfficialArtwork(defenderId)),
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
        if (t > 8000) { onCloseRef.current(); return; }

        if (freezeUntil > t) {
          raf = requestAnimationFrame(frame);
          return;
        }

        const [ph, f] = getPhase(t);
        ctx.clearRect(0, 0, W, H);

        // ---- Background ----
        const bgA = ph === "cinematic_in" ? ease(clamp(f * 1.5))
          : ph === "result" ? clamp(1 - (f - 0.3) * 2) : 1;

        ctx.fillStyle = `rgba(8,8,18,${bgA * 0.96})`;
        ctx.fillRect(0, 0, W, H);

        // Subtle type-colored vignette
        const vg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
        vg.addColorStop(0, `rgba(${cr},${cg},${cb},${0.06 * bgA})`);
        vg.addColorStop(1, "transparent");
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);

        // ---- Camera ----
        let camX = 0, camY = 0, camZ = 1;
        if (ph === "charge") {
          const zf = ease(f);
          camZ = 1 + zf * 0.45;
          camX = -(atkHomeX + sprSz / 2 - W / 2) * zf * 0.4;
          camY = -(atkHomeY + sprSz / 2 - H / 2) * zf * 0.25;
        } else if (ph === "attack") {
          const zoomOut = ease(clamp(f * 2));
          camZ = 1.45 - zoomOut * 0.45;
          camX = -(atkHomeX + sprSz / 2 - W / 2) * 0.4 * (1 - zoomOut);
          camY = -(atkHomeY + sprSz / 2 - H / 2) * 0.25 * (1 - zoomOut);
        }

        // Screen shake during impact
        let shx = 0, shy = 0;
        if (ph === "impact" && f < 0.5) {
          const intensity = (1 - f * 2) * 18;
          shx = (Math.random() - 0.5) * intensity;
          shy = (Math.random() - 0.5) * intensity;
        }

        ctx.save();
        ctx.translate(W / 2 + shx, H / 2 + shy);
        ctx.scale(camZ, camZ);
        ctx.translate(-W / 2 + camX, -H / 2 + camY);

        // ---- Speed lines (during attack) ----
        if (ph === "attack" && f > 0.05) {
          const slA = clamp((f - 0.05) * 5) * 0.18;
          ctx.globalAlpha = slA;
          const cx = defHomeX + sprSz * 0.4, cy = defHomeY + sprSz * 0.5;
          const lineCount = 40;
          const rotOff = t * 0.0003;
          for (let i = 0; i < lineCount; i++) {
            const a = (i / lineCount) * Math.PI * 2 + rotOff;
            const r1 = 60 + Math.random() * 30;
            const r2 = r1 + 200 + Math.random() * 300;
            ctx.strokeStyle = i % 3 === 0 ? c2 : `rgba(255,255,255,0.5)`;
            ctx.lineWidth = 1 + Math.random();
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
            ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }

        // ---- Sprite positions ----
        let atkX = atkHomeX;
        const atkY = atkHomeY;
        let defX = defHomeX;
        const defY = defHomeY;
        let atkAlpha = 1, defAlpha = 1;
        let atkGlow = false;

        if (ph === "cinematic_in") {
          const ef = ease(f);
          atkX = atkHomeX - 250 * (1 - ef);
          defX = defHomeX + 250 * (1 - ef);
          atkAlpha = clamp(f * 2.5);
          defAlpha = clamp(f * 2.5);
        }

        if (ph === "charge") {
          atkGlow = true;
          // Energy gather sparks
          if (sparks.length < 300) {
            for (let i = 0; i < 3; i++) {
              const ang = Math.random() * Math.PI * 2;
              const r = 50 + Math.random() * 60;
              sparks.push({
                x: atkX + sprSz / 2 + Math.cos(ang) * r,
                y: atkY + sprSz / 2 + Math.sin(ang) * r,
                vx: -Math.cos(ang) * 2, vy: -Math.sin(ang) * 2,
                life: 0, maxLife: 18, size: 2 + Math.random() * 3,
                color: Math.random() > 0.4 ? c1 : c2,
              });
            }
          }
        }

        if (ph === "attack") {
          atkGlow = true;
          const lunge = f < 0.1 ? f / 0.1 : f > 0.9 ? (1 - f) / 0.1 : 1;
          atkX += lunge * W * 0.06;
        }

        let defFlash = false;
        if (ph === "impact") {
          defFlash = f < 0.15;
          defX += Math.sin(f * Math.PI * 9) * (1 - f) * 20;

          // Hit-stop: freeze for ~100ms on the first frame of impact
          if (!impactBurstDone) {
            impactBurstDone = true;
            freezeUntil = t + 100;
            for (let i = 0; i < 35; i++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 3 + Math.random() * 7;
              sparks.push({
                x: defHomeX + sprSz / 2, y: defHomeY + sprSz / 2,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                life: 0, maxLife: 25 + Math.random() * 20,
                size: 3 + Math.random() * 6,
                color: Math.random() > 0.25 ? c1 : "#fff",
              });
            }
          }
        }

        if (ph === "result") {
          atkAlpha = clamp(1 - (f - 0.2) * 2);
          defAlpha = clamp(1 - (f - 0.2) * 2);
        }

        // ---- Draw attacker ----
        ctx.globalAlpha = atkAlpha;
        if (atkGlow) { ctx.shadowColor = c1; ctx.shadowBlur = 30; }
        ctx.drawImage(aImg, atkX, atkY, sprSz, sprSz);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // ---- Draw defender ----
        ctx.globalAlpha = defAlpha * (defFlash ? 0.2 : 1);
        if (defFlash) { ctx.shadowColor = "#fff"; ctx.shadowBlur = 40; }
        ctx.drawImage(dImg, defX, defY, sprSz, sprSz);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // ---- Move-specific FX ----
        if (ph === "attack") {
          if (isThunderbolt) {
            // Sky darkens further
            ctx.fillStyle = `rgba(0,0,30,${0.25 * clamp(f * 4)})`;
            ctx.fillRect(0, 0, W, H);
            // Multiple lightning bolts rain down
            const boltCount = 3 + (f > 0.3 ? 2 : 0);
            for (let i = 0; i < boltCount; i++) {
              const bx = defHomeX + sprSz * (0.2 + Math.random() * 0.6);
              const by = defHomeY + sprSz * 0.5;
              drawBolt(ctx,
                bx + (Math.random() - 0.5) * 120, -20,
                bx, by,
                2.5 + Math.random() * 2, 2, "#FFE082", "#F8D030",
              );
            }
            // Electric sparks at target
            if (sparks.length < 300) {
              for (let i = 0; i < 3; i++) {
                sparks.push({
                  x: defHomeX + sprSz * 0.5 + (Math.random() - 0.5) * 50,
                  y: defHomeY + sprSz * 0.5 + (Math.random() - 0.5) * 40,
                  vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
                  life: 0, maxLife: 10 + Math.random() * 10,
                  size: 2 + Math.random() * 3,
                  color: Math.random() > 0.3 ? "#F8D030" : "#FFF9C4",
                });
              }
            }
          } else {
            // Ember / fire
            const sx = atkX + sprSz * 0.75;
            const sy = atkY + sprSz * 0.35;
            const tx = defHomeX + sprSz * 0.4;
            const ty = defHomeY + sprSz * 0.5;
            drawFireArc(ctx, sparks, sx, sy, tx, ty, f, c1, c2);
          }
        }

        // ---- Sparks (particles) ----
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.x += s.vx; s.y += s.vy;
          if (isThunderbolt) s.vx += (Math.random() - 0.5) * 0.4;
          else s.vy -= 0.06;
          s.life++;
          if (s.life >= s.maxLife) { sparks.splice(i, 1); continue; }
          const lr = 1 - s.life / s.maxLife;
          ctx.globalAlpha = lr * 0.8;
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * Math.max(lr, 0.3), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // ---- Full-screen flash (impact) ----
        if (ph === "impact" && f < 0.12) {
          // White flash then type-color flash
          const ff = f / 0.12;
          if (ff < 0.5) {
            ctx.fillStyle = `rgba(255,255,255,${(1 - ff * 2) * 0.7})`;
          } else {
            ctx.fillStyle = `rgba(${cr},${cg},${cb},${(1 - (ff - 0.5) * 2) * 0.5})`;
          }
          ctx.fillRect(-40, -40, W + 80, H + 80);
        }

        // ---- Pokemon names (under sprites) ----
        const nameA = ph === "cinematic_in" ? clamp((f - 0.4) * 2.5)
          : ph === "result" ? clamp(1 - f * 2) : 1;
        if (nameA > 0.01) {
          ctx.globalAlpha = nameA;
          ctx.font = `bold ${Math.max(13, W * 0.015)}px Inter,sans-serif`;
          ctx.fillStyle = "#fff";
          ctx.textAlign = "center";
          ctx.textBaseline = "alphabetic";
          ctx.fillText(formatName(attackerName), atkX + sprSz / 2, atkY + sprSz + 24);
          ctx.fillText(formatName(defenderName), defX + sprSz / 2, defY + sprSz + 24);
          ctx.globalAlpha = 1;
        }

        ctx.restore(); // end camera transform

        // ---- Letterbox bars (drawn outside camera) ----
        const lbH = ph === "cinematic_in" ? ease(clamp(f * 2)) * letterH
          : ph === "result" ? clamp(1 - (f - 0.4) * 3) * letterH
          : letterH;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, lbH);
        ctx.fillRect(0, H - lbH, W, lbH);

        // ---- Callout text box ----
        if (ph === "callout" || (ph === "charge" && f < 0.3)) {
          const tbA = ph === "callout"
            ? (f < 0.08 ? f * 12 : f > 0.85 ? (1 - f) * 6.7 : 1)
            : 1 - f * 3.3;
          ctx.globalAlpha = tbA;

          const tbH = 54;
          const tbY = H - lbH - tbH - 8;
          ctx.fillStyle = "rgba(0,0,0,0.75)";
          const tbR = 10;
          ctx.beginPath();
          ctx.moveTo(W * 0.08 + tbR, tbY);
          ctx.lineTo(W * 0.92 - tbR, tbY);
          ctx.arcTo(W * 0.92, tbY, W * 0.92, tbY + tbR, tbR);
          ctx.lineTo(W * 0.92, tbY + tbH - tbR);
          ctx.arcTo(W * 0.92, tbY + tbH, W * 0.92 - tbR, tbY + tbH, tbR);
          ctx.lineTo(W * 0.08 + tbR, tbY + tbH);
          ctx.arcTo(W * 0.08, tbY + tbH, W * 0.08, tbY + tbH - tbR, tbR);
          ctx.lineTo(W * 0.08, tbY + tbR);
          ctx.arcTo(W * 0.08, tbY, W * 0.08 + tbR, tbY, tbR);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.5)`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Typewriter text
          const charsToShow = ph === "callout"
            ? Math.min(Math.floor(f * calloutText.length * 1.6), calloutText.length)
            : calloutText.length;
          const shown = calloutText.slice(0, charsToShow);
          ctx.font = `bold ${Math.max(15, W * 0.018)}px "Press Start 2P",monospace`;
          ctx.fillStyle = "#fff";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(shown, W * 0.12, tbY + tbH / 2);
          ctx.globalAlpha = 1;
        }

        // ---- Move name banner (during attack) ----
        if (ph === "attack") {
          const mA = f < 0.08 ? f * 12 : f > 0.92 ? (1 - f) * 12 : 0.9;
          ctx.globalAlpha = mA;
          ctx.font = `bold ${Math.max(20, W * 0.028)}px "Press Start 2P",monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "alphabetic";
          const mt = formatName(moveName);
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 4;
          ctx.strokeText(mt, W / 2, lbH + 40);
          ctx.fillStyle = c2;
          ctx.fillText(mt, W / 2, lbH + 40);
          ctx.globalAlpha = 1;
        }

        // ---- Effectiveness text (result) ----
        if (ph === "result") {
          const rp = clamp(f * 3);
          const sc = 0.6 + rp * 0.4;
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

          ctx.font = `bold ${Math.max(24, W * 0.035)}px "Press Start 2P",monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 5;
          ctx.strokeText(txt, 0, 0);
          ctx.fillStyle = col;
          ctx.fillText(txt, 0, 0);
          ctx.restore();
          ctx.globalAlpha = 1;
        }

        raf = requestAnimationFrame(frame);
      }

      raf = requestAnimationFrame(frame);
    })();

    return () => { dead = true; cancelAnimationFrame(raf); };
  }, [clipId, attackerId, attackerName, defenderId, defenderName, moveType, moveName, effectiveness]);

  const handleClose = () => { closedRef.current = true; onCloseRef.current(); };

  return (
    <div className="fixed inset-0 z-50">
      {loading && (
        <div className="absolute inset-0 bg-black/95 flex items-center justify-center">
          <p className="text-white font-retro text-sm animate-pulse">Preparing clip...</p>
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
