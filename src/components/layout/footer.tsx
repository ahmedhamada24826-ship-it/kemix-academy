import React from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/config/site";
import { Database, Award, ShieldCheck } from "lucide-react";
import { platformSettingsService } from "@/server/application/settings/settings.service";
import { headers } from "next/headers";

export async function Footer() {
  await headers();
  const settings = await platformSettingsService.getSettings();
  if (!settings.cms.footer.enabled) return null;

  return (
    <footer className="border-t border-blue-900/40 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.16),transparent_42%),linear-gradient(180deg,#0B2444_0%,#07162C_38%,#07162C_100%)] text-slate-300">
      <div className="container mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:py-16">
        <div className="grid grid-cols-1 gap-9 md:grid-cols-4 lg:gap-12">
          <div className="space-y-4 md:col-span-1">
            <Logo variant="dark" size="lg" showTagline={true} imageUrl={settings.footerLogoUrl} />
            <p className="pt-2 text-[15px] leading-7 text-slate-300">
              {settings.footerText || "KEMIX Academy منصة تعليمية تهدف إلى تمكين المتعلمين بالمهارات الرقمية والتحليلية التي تساعدهم على بناء مستقبل أكثر طموحًا."}
            </p>
            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-800/60 bg-blue-950/60 px-3 py-1.5 text-sm font-medium text-blue-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                شهادات رقمية موثقة
              </span>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-base font-bold tracking-wide text-white">
              مسارات التعلم
            </h3>
            <ul className="space-y-3 text-[15px] leading-6 text-slate-300">
              <li>
                <Link href="/courses" className="transition-colors hover:text-[#38BDF8]">
                  تحليل البيانات بلغة Python
                </Link>
              </li>
              <li>
                <Link href="/courses" className="transition-colors hover:text-[#38BDF8]">
                  قواعد البيانات وSQL المتقدمة
                </Link>
              </li>
              <li>
                <Link href="/courses" className="transition-colors hover:text-[#38BDF8]">
                  لوحات التحكم التفاعلية وPower BI
                </Link>
              </li>
              <li>
                <Link href="/courses" className="transition-colors hover:text-[#38BDF8]">
                  التحليل المالي والنماذج المتقدمة بـ Excel
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-base font-bold tracking-wide text-white">
              المنصة والخدمات
            </h3>
            <ul className="space-y-3 text-[15px] leading-6 text-slate-300">
              <li>
                <Link href="/courses" className="transition-colors hover:text-[#38BDF8]">
                  دليل الكورسات
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="transition-colors hover:text-[#38BDF8]">
                  لوحة دراستي
                </Link>
              </li>
              <li>
                <Link href="/verify" className="flex items-center gap-1.5 transition-colors hover:text-[#38BDF8]">
                  <Award className="h-3.5 w-3.5 text-cyan-400" />
                  <span>التحقق من صحة الشهادة</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-[#38BDF8]">
                  عن الأكاديمية ورؤيتنا
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-[#38BDF8]">
                  تواصل معنا
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-base font-bold tracking-wide text-white">
              طريقة التعلم
            </h3>
            <p className="mb-4 text-sm leading-6 text-slate-300">
              تعلّم منظم يجمع بين الدروس والموارد التعليمية والاختبارات والتكليفات المتاحة ضمن المسارات.
            </p>
            <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Database className="h-3.5 w-3.5 text-blue-400" />
                <span dir="ltr">Learn → Build → Grow</span>
              </div>
              <p className="text-sm leading-6 text-slate-300">
                تعلّم الأدوات، طبّق المعرفة، وواصل تطوير مهاراتك.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-5 border-t border-slate-800 pt-8 text-sm text-slate-400 sm:flex-row sm:flex-wrap lg:flex-nowrap">
          <p>© {new Date().getFullYear()} {siteConfig.name}. جميع الحقوق محفوظة.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:justify-start">
            <Link href="/about" className="transition-colors hover:text-white">
              عن الأكاديمية
            </Link>
            <Link href="/courses" className="transition-colors hover:text-white">
              الكورسات
            </Link>
            <Link href="/verify" className="transition-colors hover:text-white">
              التحقق من الشهادات
            </Link>
            <Link href="/contact" className="transition-colors hover:text-white">
              تواصل معنا
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
