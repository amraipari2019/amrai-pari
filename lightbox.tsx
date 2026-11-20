"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RemoteImage } from "@/components/ui/remote-image";

type P = { id: string; src: string; caption: string };

export function Lightbox({
  photos,
  labels,
}: {
  photos: P[];
  labels: { close: string; next: string; prev: string };
}) {
  const [index, setIndex] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const go = useCallback(
    (d: number) => setIndex((i) => (i === null ? i : (i + d + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (index === null) return;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [index, go]);

  const current = index === null ? null : photos[index];

  return (
    <>
      <ul className="columns-2 gap-3 md:columns-3 [&>li]:mb-3">
        {photos.map((p, i) => (
          <li key={p.id} className="break-inside-avoid">
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="block w-full overflow-hidden rounded-lg bg-muted"
            >
              <RemoteImage
                src={p.src}
                alt={p.caption}
                width={800}
                height={600}
                sizes="(min-width: 768px) 33vw, 50vw"
                className="h-auto w-full"
              />
            </button>
          </li>
        ))}
      </ul>
      {current ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.caption || undefined}
          className="fixed inset-0 z-50 flex flex-col bg-[#0a0533]/95 text-white"
        >
          <div className="flex justify-end p-3">
            <button
              ref={closeRef}
              type="button"
              onClick={() => setIndex(null)}
              aria-label={labels.close}
              className="rounded p-2 hover:bg-white/10"
            >
              <X className="size-7" aria-hidden />
            </button>
          </div>
          <div className="relative flex-1">
            <RemoteImage
              src={current.src}
              alt={current.caption}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          <div className="flex items-center justify-between gap-4 p-4">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={labels.prev}
              className="rounded p-2 hover:bg-white/10"
            >
              <ChevronLeft className="size-8" aria-hidden />
            </button>
            <p className="text-center text-sm text-white/85">{current.caption}</p>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={labels.next}
              className="rounded p-2 hover:bg-white/10"
            >
              <ChevronRight className="size-8" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
