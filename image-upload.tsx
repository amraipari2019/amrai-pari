"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { inputCls } from "./ui";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Upload one file to the public "media" bucket and return its public URL. */
export async function uploadToMedia(file: File, folder: string) {
  if (!TYPES.includes(file.type)) throw new Error("Use a JPG, PNG, WebP or GIF image.");
  if (file.size > MAX_BYTES) throw new Error("Images must be 5 MB or smaller. Resize it and try again.");
  const supabase = createClient();
  const ext =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${folder}/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { cacheControl: "31536000", upsert: false });
  if (error)
    throw new Error(
      error.message.includes("row-level security") ? "Your role can't upload images." : error.message,
    );
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

export function ImageField({
  name,
  defaultValue,
  folder,
}: {
  name: string;
  defaultValue?: string | null;
  folder: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      setUrl(await uploadToMedia(file, folder));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={url} />
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative flex aspect-[4/3] w-48 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="size-8 text-muted-foreground" aria-hidden />
          )}
          {busy ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
            </div>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-[#1e0d8a]">
            {url ? "Replace image" : "Upload image"}
            <input
              ref={fileRef}
              type="file"
              accept={TYPES.join(",")}
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
          {url ? (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="flex items-center gap-1 text-sm text-accent hover:underline"
            >
              <X className="size-4" aria-hidden /> Remove
            </button>
          ) : null}
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">Or paste an image link</summary>
            <input
              className={`${inputCls} mt-1 w-72`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
            />
          </details>
        </div>
      </div>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
    </div>
  );
}
