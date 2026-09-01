"use client";

import type { ReactNode } from "react";

export function Modal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-3 sm:p-6">
      <div className="mx-auto flex min-h-full w-full max-w-2xl items-start justify-center sm:items-center">
        <div className="w-full rounded-2xl border border-line bg-surface shadow-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
            <span className="font-display text-[15px] font-black text-text">{title}</span>
            <button type="button" onClick={onClose} aria-label="إغلاق" className="btn-icon font-body text-lg text-text-dim transition-colors hover:bg-surface-elevated hover:text-text">×</button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
