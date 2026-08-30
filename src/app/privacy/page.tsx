import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SectionHeader } from "@/components/ui/section-header";
import { getCurrentCopyrightYear } from "@/lib/season";
import { getDisplaySeasonLabel } from "@/lib/season";

export const metadata: Metadata = {
  title: "سياسة الخصوصية وشروط الاستخدام — دوري نجوم الإسكندرية",
  description:
    "سياسة الخصوصية وشروط استخدام منصة دوري نجوم الإسكندرية — كيف نجمع بياناتك ونستخدمها ونحميها.",
};

export default async function PrivacyPage() {
  const year = getCurrentCopyrightYear();
  const season = await getDisplaySeasonLabel();

  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <SectionHeader title="سياسة الخصوصية وشروط الاستخدام" tag="LEGAL" bordered={false} />

        <div className="max-w-3xl space-y-6">
          <section className="rounded-xl border border-line bg-surface p-6">
            <h2 className="mb-3 font-display text-base font-black text-text">1. سياسة الخصوصية</h2>
            <p className="font-body text-sm leading-relaxed text-text-dim">
              تحترم منصة دوري نجوم الإسكندرية خصوصيتك. نرسل بياناتك الشخصية (الاسم، البريد الإلكتروني، بيانات الفريق) فقط لغرض إدارة حسابك، وتسجيل فريقك، وتنظيم المشاركة في البطولات. لا نبيع بياناتك ولا نشاركها مع أي طرف ثالث لأغراض تسويقية.
            </p>
            <ul className="mt-3 space-y-2">
              {[
                "البيانات تُخزّن بشكل مشفّر عند إرسالها (HTTPS)، وكلمات المرور تُخزّن مشفّرة بالكامل.",
                "جلسات الدخول تنتهي تلقائياً بعد 7 أيام، ويمكنك تسجيل الخروج في أي وقت.",
                "يمكنك طلب حذف حسابك وبياناته بالتواصل معنا عبر صفحة «تواصل معنا».",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 font-body text-sm text-text-dim">
                  <svg className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-accent" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 8.5l3.5 3.5 7-8" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-line bg-surface p-6">
            <h2 className="mb-3 font-display text-base font-black text-text">2. الحسابات والأدوار</h2>
            <p className="font-body text-sm leading-relaxed text-text-dim">
              تملك المنصة ثلاثة أنواع من الحسابات: <span className="font-bold text-text">مشجع</span> للمتابعة، <span className="font-bold text-text">لاعب</span> للمشاركة، و<span className="font-bold text-text">مدير</span> لإدارة البطولات، المنتمية إلى حدث.
            </p>
            <p className="mt-3 font-body text-sm leading-relaxed text-text-dim">
              المسؤولية عن دقة بيانات الحساب والفريق تقع على صاحب الحساب. يُسمح لكل مستخدم بإنشاء فريق واحد ويدير تشكيلته ولائته من لوحة التحكم الشخصية، بينما يدير المديرون البطولات والمباريات والمواسم الرئيسية.
            </p>
          </section>

          <section className="rounded-xl border border-line bg-surface p-6">
            <h2 className="mb-3 font-display text-base font-black text-text">3. مشاركة البيانات</h2>
            <p className="font-body text-sm leading-relaxed text-text-dim">
              بعض بياناتك <span className="font-bold text-text">علنية</span> بحكم طبيعة المنصة: اسم الفريق، شعاره، النتائج، وجداول الترتيب، والهدافون — تُعرض لجميع الزوار لتحقيق الشفافية الرياضية. لا ننشر بريدك الإلكتروني أو رقم هاتفك علناً إطلاقاً.
            </p>
          </section>

          <section className="rounded-xl border border-line bg-surface p-6">
            <h2 className="mb-3 font-display text-base font-black text-text">4. الملكية الفكرية</h2>
            <p className="font-body text-sm leading-relaxed text-text-dim">
              منصة دوري نجوم الإسكندرية، شعارها، وكل المحتوى المنشور (باستثناء شعارات الفرق التي يرفعها مالكوها) ملك للمنصة. يُمنع نسخ المحتوى لأغراض تجارية دون إذن خطي مسبق. الصور المرفوعة من الفرق تبقى ملكاً لأصحابها مع إذن استخدام غير حصري لعرضها على المنصة.
            </p>
          </section>

          <section className="rounded-xl border border-line bg-surface p-6">
            <h2 className="mb-3 font-display text-base font-black text-text">5. شروط المشاركة</h2>
            <p className="font-body text-sm leading-relaxed text-text-dim">
              بالتسجيل في بطولاتنا أنت تقرّ بأنك لاعب هاوٍ، وتلتزم بقوانين اللعبة ولوائح البطولة، وباحترام المنافسين والحكام والجمهور. تحتفظ الإدارة بحق استبعاد أي فريق أو لاعب يخل بالنظام الرياضي أو السلامة العامة. تُعلن لوائح موسم {season} قبل انطلاقه.
            </p>
          </section>

          <section className="rounded-xl border border-line bg-surface p-6">
            <h2 className="mb-3 font-display text-base font-black text-text">6. تعديلات وتواصل</h2>
            <p className="font-body text-sm leading-relaxed text-text-dim">
              يجوز تعديل هذه السياسة والشروط من حين لآخر؛ تُنشر التعديلات على هذه الصفحة وتصبح سارية فور نشرها. لأي استفسار بخصوص خصوصيتك أو بياناتك، راسلنا عبر صفحة «تواصل معنا».
            </p>
            <p className="mt-4 border-t border-line pt-4 font-body text-xs text-text-dimmer">
              آخر تحديث: {year} · موسم {season} © منصة دوري نجوم الإسكندرية للهواة.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}