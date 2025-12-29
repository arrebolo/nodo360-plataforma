"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

type Props = {
  videoUrl?: string | null;
  posterUrl?: string | null; // opcional por lección
  defaultPosterUrl?: string; // por defecto para toda Nodo360
  onWatchTime?: (seconds: number) => void; // acumular
  onActivity?: () => void; // last_activity ping
};

export default function VideoPlayer({
  videoUrl,
  posterUrl,
  defaultPosterUrl = "/images/lesson-cover-default.jpg",
  onWatchTime,
  onActivity,
}: Props) {
  const watchSecondsRef = useRef(0);

  // Ping de actividad mínimo (cada 30s si el usuario está en la lección)
  useEffect(() => {
    if (!onActivity) return;
    onActivity();
    const id = setInterval(() => onActivity(), 30_000);
    return () => clearInterval(id);
  }, [onActivity]);

  // Tracking simple para HTML5 video (si usas YouTube/Vimeo, lo integramos después)
  const onTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    // aproximación: acumulamos segundos enteros
    const current = Math.floor(v.currentTime);
    if (current > watchSecondsRef.current) {
      watchSecondsRef.current = current;
      onWatchTime?.(current);
    }
  };

  if (!videoUrl) {
    return (
      <div className="w-full">
        <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] aspect-video">
          <Image
            src={posterUrl || defaultPosterUrl}
            alt="Portada de la lección"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <div className="inline-flex items-center gap-2 rounded-xl bg-black/50 px-3 py-2 text-xs text-white/80 border border-white/10">
              Sin vídeo en esta lección · Continúa con los recursos y el contenido
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Caso base HTML5 (si videoUrl es mp4/webm). YouTube/Vimeo lo resolvemos en el siguiente paso.
  const isHtml5 =
    videoUrl.endsWith(".mp4") ||
    videoUrl.endsWith(".webm") ||
    videoUrl.endsWith(".ogg");

  if (isHtml5) {
    return (
      <div className="w-full">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black aspect-video">
          <video
            className="h-full w-full"
            controls
            playsInline
            preload="metadata"
            onTimeUpdate={onTimeUpdate}
            onPlay={() => onActivity?.()}
            onPause={() => onActivity?.()}
          >
            <source src={videoUrl} />
          </video>
        </div>
      </div>
    );
  }

  // Placeholder para YouTube/Vimeo/externos (mantiene estética y no rompe)
  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black aspect-video">
        <iframe
          src={videoUrl}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
