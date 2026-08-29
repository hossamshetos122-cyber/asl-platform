"use client";

import { useState } from "react";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`[الاتصال بالمنصة] ${topic || "استفسار عام"}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
    window.location.href = `mailto:contact@asl-eg.org?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-6">
      {sent && (
        <div className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 font-body text-sm text-emerald-400">
          شكراً لتواصلك! تم فتح تطبيق البريد لإرسال رسالتك إلى إدارة المنصة.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className="mb-1.5 block font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">الاسم</label>
            <input
              id="contact-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="اسمك الكامل"
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="mb-1.5 block font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">البريد الإلكتروني</label>
            <input
              id="contact-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="example@email.com"
              dir="ltr"
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact-topic" className="mb-1.5 block font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">موضوع الرسالة</label>
          <select
            id="contact-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="input-field"
          >
            <option value="">اختر الموضوع</option>
            <option value="استفسار عن التسجيل">استفسار عن التسجيل</option>
            <option value="استفسار عن البطولات">استفسار عن البطولات</option>
            <option value="مشكلة فنية">مشكلة فنية</option>
            <option value="رعاية وشراكات">رعاية وشراكات</option>
            <option value="أخرى">أخرى</option>
          </select>
        </div>

        <div>
          <label htmlFor="contact-message" className="mb-1.5 block font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">رسالتك</label>
          <textarea
            id="contact-message"
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input-field resize-none"
            placeholder="اكتب رسالتك هنا..."
          />
        </div>

        <button type="submit" className="btn-primary w-full">إرسال الرسالة</button>
        <p className="text-center font-body text-[11px] text-text-dimmer">
          سيُفتح تطبيق البريد الخاص بك لإكمال الإرسال إلى contact@asl-eg.org
        </p>
      </form>
    </div>
  );
}