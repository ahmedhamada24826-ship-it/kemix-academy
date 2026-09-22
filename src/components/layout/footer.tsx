import React from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/config/site";
import { Database, Award, ShieldCheck, PhoneCall, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#07162C] text-slate-300">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Logo variant="dark" size="lg" showTagline={true} />
            <p className="text-sm text-slate-400 leading-relaxed pt-2">
              منصة تعليمية متخصصة في إعداد محللي ومهندسي البيانات من خلال مشاريع وتطبيقات عملية واقعية واختبارات معتمدة.
            </p>
            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <span className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-medium bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-800/60">
                <ShieldCheck className="h-3.5 w-3.5" />
                شهادات رقمية موثقة
              </span>
            </div>
          </div>

          {/* Col 2: Curricula Topics */}
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider mb-4">
              مسارات التعلم
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="/courses" className="hover:text-[#38BDF8] transition-colors">
                  تحليل البيانات بلغة Python
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-[#38BDF8] transition-colors">
                  قواعد البيانات وSQL المتقدمة
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-[#38BDF8] transition-colors">
                  لوحات التحكم التفاعلية وPower BI
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-[#38BDF8] transition-colors">
                  التحليل المالي والنماذج المتقدمة بـ Excel
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Learning & Platform */}
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider mb-4">
              المنصة والخدمات
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="/courses" className="hover:text-[#38BDF8] transition-colors">
                  دليل الكورسات
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#38BDF8] transition-colors">
                  لوحة دراستي
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-[#38BDF8] transition-colors flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-cyan-400" />
                  <span>التحقق من صحة الشهادة</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#38BDF8] transition-colors">
                  عن الأكاديمية ورؤيتنا
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#38BDF8] transition-colors">
                  تواصل معنا
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Guarantee */}
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider mb-4">
              طريقة التعلم
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              كل كورس يتضمن ملفات تدريبية واقعية، مهام وتكليفات تطبيقية، واختبارات مؤقتة لتقييم الاستيعاب وضمان الجودة التعليمية.
            </p>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-blue-400" />
                <span>تعلم • ابنِ • انمُ</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                تطبيق عملي خطوة بخطوة حتى الاحتراف وبناء معرض أعمال حقيقي.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {siteConfig.name}. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-slate-400 transition-colors">
              عن الأكاديمية
            </Link>
            <Link href="/courses" className="hover:text-slate-400 transition-colors">
              الكورسات
            </Link>
            <Link href="/verify" className="hover:text-slate-400 transition-colors">
              التحقق من الشهادات
            </Link>
            <Link href="/contact" className="hover:text-slate-400 transition-colors">
              تواصل معنا
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
