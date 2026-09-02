"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ImageUploadProps {
  name: string;
  purpose?: string;
  label: string;
  value: string | null;
  onChange: (dataUri: string | null) => void;
  required?: boolean;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

const MAX_DIMENSION = 1400;
const COMPRESSION_THRESHOLD_BYTES = 250 * 1024;

/** Downscales + re-encodes a raster image (best effort) so large photos and
 *  covers stay within size limits when stored as data URIs.  */
async function compressImage(file: File): Promise<File> {
  if (file.size < COMPRESSION_THRESHOLD_BYTES) return file;

  const load = (): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = document.createElement("img");
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("decode-failed")); };
      img.src = url;
    });

  let img: HTMLImageElement;
  try {
    img = await load();
  } catch {
    return file;
  }

  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  if (longest <= MAX_DIMENSION && file.type !== "image/jpeg") return file;

  const scale = Math.min(1, MAX_DIMENSION / longest);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, w, h);

  const hasAlpha = file.type === "image/png" || file.type === "image/webp";
  const mime = hasAlpha && "image/webp" in window ? "image/webp" : "image/jpeg";

  const toBlob = (quality: number): Promise<Blob | null> =>
    new Promise((resolve) => canvas.toBlob(resolve, mime, quality));

  let blob = await toBlob(0.78);
  if (!blob) return file;
  if (blob.size > file.size && file.size <= 2 * 1024 * 1024) return file;
  if (blob.size > 650 * 1024) {
    const tighter = await toBlob(0.55);
    if (tighter && tighter.size < blob.size) blob = tighter;
  }

  const ext = mime === "image/webp" ? "webp" : "jpg";
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${base}.${ext}`, { type: mime });
}

export function ImageUpload({
  name,
  purpose = "general",
  label,
  value,
  onChange,
  required = false,
  accept = "image/*",
  maxSizeMB = 2,
  className = "",
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("نوع الملف غير مدعوم");
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`حجم الملف يتجاوز ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);

    try {
      const compressed = file.size > COMPRESSION_THRESHOLD_BYTES ? await compressImage(file) : file;

      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("purpose", purpose);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "تعذّر رفع الملف");
        return;
      }

      setPreview(data.url);
      onChange(data.url);
    } catch {
      setError("حدث خطأ أثناء الرفع");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={className}>
      <label className="mb-1.5 block font-body text-sm font-bold text-text-dim">
        {label} {required && <span className="text-live">*</span>}
      </label>

      {preview ? (
        <div className="relative group">
          <div className="relative h-32 w-32 overflow-hidden rounded-xl border border-line">
            <Image
              src={preview}
              alt={label}
              fill
              className="object-cover"
              sizes="128px"
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-sm bg-accent px-3 py-1.5 font-body text-xs font-bold text-[#0b1220] transition-colors hover:bg-accent-bright"
            >
              تغيير
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-sm bg-live/80 px-3 py-1.5 font-body text-xs font-bold text-white transition-colors hover:bg-live"
            >
              إزالة
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
            dragOver ? "border-accent bg-accent/5" : "border-line hover:border-accent/50 hover:bg-white/[0.02]"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <span className="font-body text-xs text-text-dim">جارِ الضغط والرفع...</span>
            </div>
          ) : (
            <>
              <svg className="mb-2 h-8 w-8 text-text-dimmer" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <span className="font-body text-xs text-text-dim">اضغط أو اسحب صورة هنا</span>
              <span className="font-utility text-[9px] tracking-wider text-text-dimmer">JPG, PNG, WebP · حد أقصى {maxSizeMB}MB · ضغط تلقائي</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <p className="mt-1 font-body text-xs text-live">{error}</p>
      )}
    </div>
  );
}
