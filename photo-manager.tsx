"use client";

import { useState, useTransition } from "react";
import { Loader2, Star, Trash2, Upload } from "lucide-react";
import { addPhotos, deletePhoto, setAlbumCover, updatePhoto } from "@/lib/admin/actions";
import { uploadToMedia } from "./image-upload";
import { inputCls, SubmitButton } from "./ui";

type Photo = {
  id: string;
  image_url: string;
  caption_en: string | null;
  caption_bn: string | null;
  sort_order: number;
};

export function PhotoManager({
  albumId,
  photos,
  cover,
}: {
  albumId: string;
  photos: Photo[];
  cover: string | null;
}) {
  const [progress, setProgress] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, start] = useTransition();

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    const urls: string[] = [];
    const errs: string[] = [];
    for (let i = 0; i < list.length; i++) {
      setProgress(`Uploading ${i + 1} of ${list.length}…`);
      try {
        urls.push(await uploadToMedia(list[i], `gallery/${albumId}`));
      } catch (e) {
        errs.push(`${list[i].name}: ${(e as Error).message}`);
      }
    }
    setErrors(errs);
    setProgress("");
    if (urls.length) start(async () => void (await addPhotos(albumId, urls)));
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-white hover:bg-[#00592a]">
          <Upload className="size-4" aria-hidden /> Add photos
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => onFiles(e.target.files)}
          />
        </label>
        {progress || pending ? (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden /> {progress || "Saving…"}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">
            Up to 5 MB each. Only publish photos of people who agreed to it.
          </span>
        )}
      </div>
      {errors.length ? (
        <ul className="rounded-md bg-red-50 p-3 text-sm text-accent">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
      {photos.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p) => (
            <li key={p.id} className="overflow-hidden rounded-md border border-border bg-white">
              <div className="relative aspect-[4/3] bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                {cover === p.image_url ? (
                  <span className="absolute left-2 top-2 rounded bg-highlight px-2 py-0.5 text-xs font-semibold text-primary">
                    Cover
                  </span>
                ) : null}
              </div>
              <form action={updatePhoto.bind(null, albumId, p.id)} className="space-y-2 p-3">
                <input
                  name="caption_en"
                  defaultValue={p.caption_en ?? ""}
                  placeholder="Caption (English)"
                  className={inputCls}
                />
                <input
                  name="caption_bn"
                  lang="bn"
                  defaultValue={p.caption_bn ?? ""}
                  placeholder="ক্যাপশন (বাংলা)"
                  className={inputCls}
                />
                <div className="flex items-center gap-2">
                  <input
                    name="sort_order"
                    type="number"
                    defaultValue={p.sort_order}
                    aria-label="Order"
                    className={`${inputCls} w-20`}
                  />
                  <SubmitButton variant="outline">Save</SubmitButton>
                </div>
              </form>
              <div className="flex justify-between border-t border-border px-3 py-2">
                <form action={setAlbumCover.bind(null, albumId, p.image_url)}>
                  <button
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    disabled={cover === p.image_url}
                  >
                    <Star className="size-3.5" aria-hidden /> Use as cover
                  </button>
                </form>
                <form
                  action={deletePhoto.bind(null, albumId, p.id)}
                  onSubmit={(e) => {
                    if (!confirm("Delete this photo?")) e.preventDefault();
                  }}
                >
                  <button className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                    <Trash2 className="size-3.5" aria-hidden /> Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No photos yet.
        </p>
      )}
    </section>
  );
}
