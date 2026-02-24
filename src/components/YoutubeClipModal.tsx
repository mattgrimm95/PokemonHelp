import { useEffect, useMemo } from "react";

const MAX_CLIP_SECONDS = 40;

interface Props {
  videoId: string;
  onClose: () => void;
  /** Start time in seconds; clip is shortened to ≤40s */
  startSeconds?: number;
  /** End time in seconds; ignored if start + 40 is smaller */
  endSeconds?: number;
}

export default function YoutubeClipModal({
  videoId,
  onClose,
  startSeconds = 0,
  endSeconds,
}: Props) {
  const embedSrc = useMemo(() => {
    const start = Math.max(0, startSeconds);
    const end = endSeconds != null
      ? Math.min(endSeconds, start + MAX_CLIP_SECONDS)
      : start + MAX_CLIP_SECONDS;
    const params = new URLSearchParams({
      autoplay: "1",
      rel: "0",
      start: String(Math.floor(start)),
      end: String(Math.floor(end)),
    });
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }, [videoId, startSeconds, endSeconds]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/60 hover:text-white text-sm bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm transition-colors"
        >
          Close ✕
        </button>
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            className="absolute inset-0 w-full h-full rounded-xl shadow-2xl"
            src={embedSrc}
            title="Pokemon Anime Clip"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
