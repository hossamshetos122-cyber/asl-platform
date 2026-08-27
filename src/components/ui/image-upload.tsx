"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ImageUploadProps {
  name: string;
  label: string;
  value: string | null;
  onChange: (dataUri: string | null) => void;
  required?: boolean;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export function ImageUpload({
  name,
  label,
  value,
  onChange,
  required = false,
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
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", name);

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
              className="rounded-sm bg-gold px-3 py-1.5 font-body text-xs font-bold text-bg transition-colors hover:bg-gold-bright"
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
            accept="image/*"
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
            dragOver ? "border-gold bg-gold/5" : "border-line hover:border-gold/50 hover:bg-white/[0.02]"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              <span className="font-body text-xs text-text-dim">جارِ الرفع...</span>
            </div>
          ) : (
            <>
              <svg className="mb-2 h-8 w-8 text-text-dimmer" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <span className="font-body text-xs text-text-dim">اضغط أو اسحب صورة هنا</span>
              <span className="font-utility text-[9px] tracking-wider text-text-dimmer">JPG, PNG, WebP · حد أقصى {maxSizeMB}MB</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            name={name}
            accept="image/*"
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
