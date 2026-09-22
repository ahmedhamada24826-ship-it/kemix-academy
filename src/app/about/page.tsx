import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Database,
  Cpu,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

export default function AboutPage() {
  const pillars = [
    {
      title: "بيانات واقعية وتطبيقات حية",
      desc: "نرفض الأمثلة المصطنعة المبسطة. يتدرب طلابنا على بيانات فعلية بملايين السجلات تعالج مشكلات واقعية في السوق.",
      icon: <Database className="h-6 w-6 text-[#2563EB]" />,
    },
    {
      title: "تقييم تحليلي دقيق",
      desc: "تقيس اختباراتنا كفاءة استعلامات SQL، التفكير الإحصائي والبرمجي، والقدرة على حل المشكلات التقنية باحترافية.",
      icon: <Cpu className="h-6 w-6 text-cyan-600" />,
    },
    {
      title: "اعتماد وشهادات موثقة",
      desc: "كل شهادة تصدرها أكاديمية كيميكس تحمل كود تحقق رقمي فريد يتيح لأصحاب الأعمال ومسؤولي التوظيف التحقق منها مباشرة.",
      icon: <Award className="h-6 w-6 text-emerald-600" />,
    },
    {
      title: "متابعة وإشراف مباشر",
      desc: "منظومة تعليمية متكاملة تتضمن مراجعة الواجبات والمشاريع والتفاعل المباشر عبر واتساب لتذليل أي عقبات.",
      icon: <ShieldCheck className="h-6 w-6 text-indigo-600" />,
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8 space-y-16" dir="rtl">
      <div className="container mx-auto max-w-5xl space-y-16">
        {/* Header Hero */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="cyan" className="font-bold">
            رؤيتنا ورسالتنا التعليمية
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            نبني جيلاً من محترفي علوم البيانات والذكاء الاصطناعي
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            تأسست أكاديمية كيميكس KEMIX Academy بهدف تمكين الكفاءات العربية وتزويدهم بالمهارات التطبيقية الحقيقية المطلوبة في الشركات العالمية.
          </p>
        </section>

        {/* Mission Card */}
        <Card className="bg-gradient-to-tr from-[#07162C] to-[#0B2D5B] text-white border-0 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <CardHeader className="space-y-3 relative z-10">
            <Badge variant="cyan" className="w-fit bg-cyan-950/80 border-cyan-800 text-cyan-300 font-bold">
              مهمتنا الأكاديمية
            </Badge>
            <CardTitle className="text-2xl sm:text-3xl font-black text-white">
              سد الفجوة بين التعليم الأكاديمي النظري ومتطلبات سوق العمل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed relative z-10">
            <p>
              التعليم التقليدي غالباً ما يقتصر على حفظ القواعد السطحية. بينما يتطلب العمل الفعلي في الشركات فهم هندسة البيانات، تحسين الاستعلامات، استخراج الرؤى التحليلية، وبناء لوحات معلومات ذكية تدعم اتخاذ القرار.
            </p>
            <p>
              في أكاديمية كيميكس، يشرف نخبة من الخبراء الممارسين على تصميم المناهج ومراجعة المشاريع، ليتخرج الطالب وهو يمتلك محفظة أعمال (Portfolio) تثبت جدارته.
            </p>
          </CardContent>
        </Card>

        {/* Pillars Grid */}
        <section className="space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              ركائزنا التعليمية الأساسية
            </h2>
            <p className="text-sm text-slate-500">
              المبادئ الأربعة التي يقوم عليها كل كورس في أكاديمية كيميكس.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {pillars.map((pillar, idx) => (
              <Card key={idx} className="bg-white border-slate-200 hover:border-blue-300 transition-all shadow-sm">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-3">
                  <div className="p-3 rounded-xl bg-blue-50 flex-shrink-0">{pillar.icon}</div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    {pillar.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {pillar.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-8 space-y-4 shadow-sm">
          <h3 className="text-2xl font-black text-slate-900">جاهز لتطوير مسارك المهني في البيانات؟</h3>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            استكشف دليل الكورسات المتاحة أو تحقق من صحة شهادة خريج عبر الرابط الموثق.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link href="/courses">
              <Button size="lg" className="bg-[#0B2D5B] hover:bg-[#2563EB] text-white font-bold">
                استعراض الكورسات
              </Button>
            </Link>
            <Link href="/verify">
              <Button variant="outline" size="lg" className="font-semibold">
                التحقق من صحة شهادة
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
