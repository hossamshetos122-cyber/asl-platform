import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SectionHeader } from "@/components/ui/section-header";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "تواصل معنا — دوري نجوم الإسكندرية",
  description:
    "تواصل مع إدارة دوري نجوم الإسكندرية: استفسارات التسجيل، التنظيم، الرعاية، أو أي استفسار آخر — يسعدنا سماعك.",
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <SectionHeader title="تواصل معنا" tag="CONTACT" bordered={false} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 max-w-4xl">
          {/* Contact details */}
          <div className="lg:col-span-1 space-y-3">
            {[
              {
                label: "البريد الإلكتروني",
                value: "contact@asl-eg.org",
                href: "mailto:contact@asl-eg.org",
              },
              {
                label: "المدينة",
                value: "الإسكندرية، مصر",
              },
              {
                label: "بطولات الدوري والكأس",
                value: "استفسارات تسجيل الفرق وأسئلة البطولات",
              },
              {
                label: "الرعاية والشراكات",
                value: "عروض رعاية ودعم البطولات",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-line bg-surface p-4">
                <div className="mb-1 font-utility text-[9px] tracking-[0.15em] text-accent uppercase">{item.label}</div>
                {item.href ? (
                  <a href={item.href} className="inline-block py-2.5 font-body text-sm font-bold text-text transition-colors hover:text-accent accent-underline">
                    {item.value}
                  </a>
                ) : (
                  <p className="font-body text-sm text-text-dim">{item.value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Contact form */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}