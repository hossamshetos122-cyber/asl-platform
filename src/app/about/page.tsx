import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SectionHeader } from "@/components/ui/section-header";
import { getDisplaySeasonLabel } from "@/lib/season";

export const metadata: Metadata = {
  title: "عن المنصة — دوري نجوم الإسكندرية",
  description:
    "تعرف على منصة دوري نجوم الإسكندرية: دوري كرة قدم للهواة ينظم بطولاته في الإسكندرية ويقدّم أدوات إدارة الفرق وتتبع النتائج.",
};

export default async function AboutPage() {
  const season = await getDisplaySeasonLabel();

  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <SectionHeader title="عن المنصة" tag="ABOUT" bordered={false} />

        <div className="max-w-3xl space-y-6">
          <section className="rounded-xl border border-line bg-surface p-6">
            <h2 className="mb-3 font-display text-base font-black text-text">من نحن؟</h2>
            <p className="font-body text-sm leading-relaxed text-text-dim">
              منصة دوري نجوم الإسكندرية هي المساحة الرسمية لتنظيم بطولات كرة القدم للهواة في مدينة الإسكندرية. نؤمن أن كرة القدم للجميع، وأن الهواة يستحقون بطولات منظَّمة تليق بشغفهم — بنتائج دقيقة، وجداول ترتيب واضحة، وتجربة متابعة ممتعة.
            </p>
          </section>

          <section className="rounded-xl border border-line bg-surface p-6">
            <h2 className="mb-3 font-display text-base font-black text-text">ماذا نقدّم؟</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: "إدارة الفرق", body: "سجّل فريقك، ورفع شعاره، وتابع بياناته من لوحة تحكم سهلة." },
                { title: "المباريات والنتائج", body: "جدول مباريات كامل، نتائج لحظية بعد نهاية كل شوط، وترتيب محدّث تلقائياً." },
                { title: "الهدافون", body: "ترتيب الهدافين والصناع لكل بطولة بناءً على أحداث المباريات الموثّقة." },
                { title: "البطولات", body: "دوريات وكؤوس منظمة، بنظام النقاط ومراحل خروج المغلوب." },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border border-line/40 bg-surface-elevated p-4">
                  <h3 className="mb-1.5 font-body text-sm font-bold text-accent">{item.title}</h3>
                  <p className="font-body text-xs leading-relaxed text-text-dim">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-surface p-6">
            <h2 className="mb-3 font-display text-base font-black text-text">موسم {season}</h2>
            <p className="font-body text-sm leading-relaxed text-text-dim">
              تنطلق بطولاتنا كل عام بنظام الموسم الكروي المصري (من أغسطس/سبتمبر حتى يونيو). تُفتح فرق مرحلة التسجيل قبل انطلاق كل موسم، ويعلن عن جداول المباريات وشروط المشاركة عبر المنصة.
            </p>
          </section>

          <section className="rounded-xl border border-line bg-surface p-6">
            <h2 className="mb-3 font-display text-base font-black text-text">رؤيتنا</h2>
            <p className="font-body text-sm leading-relaxed text-text-dim">
              أن تكون الإسكندرية عاصمة كرة القدم للهواة في مصر؛ عبر منصة موثوقة تجمع الفرق تحت نظام واحد، وتمنح اللاعبين والجماهير متابعة شفافة لكل تفاصيل المنافسة.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}