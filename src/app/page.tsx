"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Database,
  Terminal,
  Cpu,
  BarChart3,
  Award,
  Clock,
  Sparkles,
  BookOpen,
  FileSpreadsheet,
  Layers,
  Users,
  TrendingUp,
  MessageCircle,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  coverImageUrl?: string | null;
  level: string;
  price?: number;
  currency?: string;
  isFree?: boolean;
  durationSeconds: number;
  instructor?: {
    fullName: string;
  };
  _count?: {
    sections: number;
    enrollments: number;
  };
}

interface SettingsData {
  siteName: string;
  siteDescription: string | null;
  footerText: string | null;
  cms: {
    hero: {
      enabled: boolean;
      badge: string;
      heading: string;
      subheading: string;
      description: string;
      ctaPrimary: string;
      ctaSecondary: string;
    };
    stats: {
      enabled: boolean;
      items: { value: string; label: string }[];
    };
    featuredCourses: {
      enabled: boolean;
      heading: string;
      description: string;
    };
    features: {
      enabled: boolean;
      heading: string;
      description: string;
      items: { title: string; description: string }[];
    };
    testimonials: {
      enabled: boolean;
      heading: string;
      items: { quote: string; author: string; role: string; badge: string }[];
    };
    cta: {
      enabled: boolean;
      heading: string;
      description: string;
      buttonText: string;
    };
  };
}

const DEFAULT_CMS = {
  hero: {
    badge: "الأكاديمية العربية الرائدة في علوم البيانات والذكاء الاصطناعي",
    heading: "مهاراتك اليوم .. تبني مستقبلك المهني الغد",
    subheading: "تعلم • ابنِ • تميّز",
    description: "احترف تحليل البيانات، بايثون، استعلامات SQL، ولوحات تحكم Power BI مع مشاريع عملية وتطبيقات حقيقية تؤهلك للعمل المباشر.",
    ctaPrimary: "ابدأ رحلة التعلم",
    ctaSecondary: "استعرض دليل الكورسات",
  },
  stats: { enabled: true, items: [] },
  featuredCourses: { enabled: true, heading: "استكشف أقوى الكورسات الموجهة لسوق العمل", description: "مسارات تدريبية مصممة خطوة بخطوة لبناء المهارات التحليلية والبرمجية." },
  features: { enabled: true, heading: "المنهجية التعليمية", description: "", items: [] },
  testimonials: { enabled: true, heading: "تجارب خريجينا في سوق العمل", items: [] },
  cta: { enabled: true, heading: "ابدأ رحلتك في احتراف علوم البيانات اليوم", description: "انضم إلى آلاف الطلاب والمحللين الذين يبنون مشاريع حقيقية مع أكاديمية كيميكس.", buttonText: "إنشاء حساب مجاني" },
};

const featuresDefault = [
  {
    title: "بيانات ومشاريع واقعية",
    description: "تطبيق عملي على مجموعات بيانات حقيقية ضخمة بصيغ CSV و Parquet و SQL تناسب متطلبات سوق العمل الفعلية.",
    icon: <FileSpreadsheet className="h-6 w-6 text-blue-500" />,
  },
  {
    title: "مشغل تعليمي متكامل",
    description: "مشاهدة الدروس بدقة عالية، مصادر متعددة للفيديو (YouTube، Drive، تخزين سحابي)، وتنزيل ملفات الأكواد والدفاتر.",
    icon: <Terminal className="h-6 w-6 text-cyan-500" />,
  },
  {
    title: "اختبارات وتقييمات بمؤقت",
    description: "تقييم مستوى الفهم واستيعاب المفاهيم البرمجية والإحصائية مع تصحيح فوري وشرح تفصيلي للإجابات الصحيحة.",
    icon: <Layers className="h-6 w-6 text-indigo-500" />,
  },
  {
    title: "شهادات معتمدة برمز موثق",
    description: "شهادات إتمام رقمية معتمدة لكل مسار تدريبي تحتوي على رمز تحقق رسمي QR يمكن إضافته لحساب LinkedIn وسيرتك الذاتية.",
    icon: <Award className="h-6 w-6 text-emerald-500" />,
  },
];

const testimonialsDefault = [
  {
    quote: "المناهج العملية في تحليل البيانات وبايثون بأكاديمية كيميكس ساعدتني على بناء معرض أعمال قوي ساهم بشكل مباشر في توظيفي كمهندس بيانات.",
    author: "أحمد عبد الله",
    role: "مهندس تحليل بيانات",
    badge: "خريج مسار Python & SQL",
  },
  {
    quote: "التطبيقات العملية والشرح المباشر بدون إطالة نظرية غير مفيدة جعلتني أتقن كتابة استعلامات SQL المعقدة وبناء لوحات تحكم احترافية.",
    author: "سارة محمود",
    role: "أخصائية ذكاء أعمال BI",
    badge: "حاصلة على شهادة Power BI",
  },
  {
    quote: "الشهادات الموثقة ونظام المتابعة المستمر للواجبات والتكليفات يعطيك التزاماً حقيقياً يختلف عن الدورات المسجلة التقليدية.",
    author: "محمد إبراهيم",
    role: "محلل بيانات أعمال",
    badge: "خريج المسار الشامل",
  },
];

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cms, setCms] = useState<SettingsData["cms"] | null>(null);

  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await fetch("/api/courses?status=PUBLISHED&pageSize=3");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.courses) {
            setCourses(data.data.courses);
          }
        }
      } catch (err) {
        console.error("Failed to load featured courses", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCourses();
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.settings) {
            const s = data.data.settings;
            if (s.cms) {
              setCms({
                hero: s.cms.hero || DEFAULT_CMS.hero,
                stats: s.cms.stats || DEFAULT_CMS.stats,
                featuredCourses: s.cms.featuredCourses || DEFAULT_CMS.featuredCourses,
                features: s.cms.features || DEFAULT_CMS.features,
                testimonials: s.cms.testimonials || DEFAULT_CMS.testimonials,
                cta: s.cms.cta || DEFAULT_CMS.cta,
              });
            }
          }
        }
      } catch {
        /* settings are optional — CMS defaults are used */
      }
    }
    loadSettings();
  }, []);

  const hero = cms?.hero ?? DEFAULT_CMS.hero;
  const stats = cms?.stats ?? DEFAULT_CMS.stats;
  const featuredCourses = cms?.featuredCourses ?? DEFAULT_CMS.featuredCourses;
  const features = cms?.features ?? DEFAULT_CMS.features;
  const testimonials = cms?.testimonials ?? DEFAULT_CMS.testimonials;
  const cta = cms?.cta ?? DEFAULT_CMS.cta;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} ساعة ${mins > 0 ? `و ${mins} دقيقة` : ""}`;
    }
    return `${mins} دقيقة`;
  };

  const categories = [
    { name: "تحليل البيانات (Data Analysis)", icon: <BarChart3 className="h-4 w-4" />, query: "Data" },
    { name: "البرمجة بـ Python", icon: <Terminal className="h-4 w-4" />, query: "Python" },
    { name: "قواعد البيانات و SQL", icon: <Database className="h-4 w-4" />, query: "SQL" },
    { name: "ذكاء الأعمال و Power BI", icon: <Cpu className="h-4 w-4" />, query: "Power BI" },
  ];

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#07162C] via-[#0B2D5B] to-[#0F172A] text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8">
        {/* Ambient background glow accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 right-10 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="container relative mx-auto max-w-6xl text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-cyan-300 text-xs font-bold tracking-wide shadow-inner">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <span>{hero.badge}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.15] max-w-4xl mx-auto">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-sky-200 bg-clip-text text-transparent">
              {hero.heading}
            </span>
          </h1>

          {/* Tagline / Subheading */}
          <p className="text-xl sm:text-2xl text-slate-300 font-bold max-w-2xl mx-auto leading-relaxed">
            {hero.subheading}
          </p>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {hero.description}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/courses">
              <Button size="lg" className="bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-base px-8 h-12 shadow-lg shadow-blue-500/25 flex items-center gap-2">
                <span>{hero.ctaPrimary}</span>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/courses">
              <Button
                variant="outline"
                size="lg"
                className="border-slate-600 bg-slate-900/50 hover:bg-slate-800 text-white text-base px-6 h-12"
              >
                {hero.ctaSecondary}
              </Button>
            </Link>
          </div>

          {/* Category Chips Bar */}
          <div className="pt-10 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {categories.map((cat, idx) => (
              <Link
                key={idx}
                href={`/courses?category=${encodeURIComponent(cat.query)}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-xs sm:text-sm font-medium text-slate-200 hover:text-white transition-all backdrop-blur-sm"
              >
                <span className="text-cyan-400">{cat.icon}</span>
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      {stats.enabled && stats.items.length > 0 && (
        <section className="border-y border-slate-200 bg-white py-8 px-4 sm:px-6">
          <div className="container mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.items.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-2xl sm:text-3xl font-black text-[#0B2D5B]">{item.value}</p>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold">{item.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Courses Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="container mx-auto max-w-6xl space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <Badge variant="cyan" className="font-bold">
                المناهج المميزة
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {featuredCourses.heading}
              </h2>
              <p className="text-sm sm:text-base text-slate-500 max-w-xl">
                {featuredCourses.description}
              </p>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2563EB] hover:text-blue-700"
            >
              <span>عرض جميع الكورسات</span>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              [1, 2, 3].map((n) => (
                <Card key={n} className="overflow-hidden border-slate-200 animate-pulse">
                  <div className="h-48 bg-slate-200" />
                  <CardHeader className="space-y-2">
                    <div className="h-4 w-20 bg-slate-200 rounded" />
                    <div className="h-6 w-3/4 bg-slate-200 rounded" />
                    <div className="h-4 w-full bg-slate-200 rounded" />
                  </CardHeader>
                </Card>
              ))
            ) : courses.length > 0 ? (
              courses.map((course) => (
                <Card
                  key={course.id}
                  className="flex flex-col overflow-hidden border-slate-200/80 hover:border-blue-300 hover:shadow-lg transition-all duration-200 group bg-white"
                >
                  <div className="relative h-48 w-full bg-gradient-to-tr from-[#0B2D5B] to-[#2563EB] overflow-hidden">
                    {course.coverImageUrl ? (
                      <div
                        style={{ backgroundImage: `url(${course.coverImageUrl})` }}
                        className="h-full w-full bg-contain bg-center bg-no-repeat"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-6 text-white text-center">
                        <Database className="h-12 w-12 opacity-40 mb-2" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge variant="navy" className="bg-slate-900/80 backdrop-blur-sm text-xs font-semibold">
                        {course.level === "BEGINNER"
                          ? "مبتدئ"
                          : course.level === "INTERMEDIATE"
                          ? "متوسط"
                          : course.level === "ADVANCED"
                          ? "متقدم"
                          : "جميع المستويات"}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="flex-1 pb-2">
                    <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors line-clamp-2">
                      <Link href={`/courses/${course.id}`}>{course.title}</Link>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {course.shortDescription || "تعلم الأدوات التحليلية خطوة بخطوة مع تدريبات عملية وتكليفات تطبيقية."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-1 font-mono">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDuration(course.durationSeconds || 7200)}</span>
                      </div>
                      <div className="font-bold text-slate-800">
                        {course.isFree || !course.price ? (
                          <span className="text-emerald-600">مجاني بالكامل</span>
                        ) : (
                          <span>{course.price} {course.currency || "EGP"}</span>
                        )}
                      </div>
                    </div>

                    <Link href={`/courses/${course.id}`} className="block">
                      <Button className="w-full bg-[#0B2D5B] hover:bg-[#2563EB] text-white text-xs font-bold h-9 transition-colors">
                        تفاصيل الكورس والاشتراك
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            ) : (
              [
                {
                  id: "1",
                  title: "تحليل البيانات المتقدم باستخدام Python",
                  desc: "إتقان مكتبات Pandas و NumPy والنماذج الإحصائية مع بناء خطوط معالجة البيانات ETL على بيانات حقيقية.",
                  level: "مبتدئ",
                  duration: "4 ساعات",
                },
                {
                  id: "2",
                  title: "احتراف قواعد البيانات و استعلامات SQL",
                  desc: "كتابة استعلامات سريعة، دوال النوافذ Window Functions، وتهيئات الفهارس Indexing على PostgreSQL.",
                  level: "متوسط",
                  duration: "5 ساعات",
                },
                {
                  id: "3",
                  title: "لوحات التحكم التفاعلية بـ Power BI",
                  desc: "بناء لوحات معلومات تنفيذية متقدمة، صيغ DAX، والنمذجة البُعدية لبيانات الشركات.",
                  level: "جميع المستويات",
                  duration: "3 ساعات",
                },
              ].map((item, idx) => (
                <Card
                  key={idx}
                  className="flex flex-col overflow-hidden border-slate-200/80 hover:border-blue-300 hover:shadow-lg transition-all group bg-white"
                >
                  <div className="relative h-44 w-full bg-gradient-to-br from-[#07162C] to-[#2563EB] flex items-center justify-center text-white">
                    <Database className="h-10 w-10 opacity-60" />
                    <div className="absolute top-3 right-3">
                      <Badge variant="navy" className="bg-slate-900/80 backdrop-blur-sm text-xs">
                        {item.level}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="flex-1 pb-2">
                    <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors">
                      <Link href="/courses">{item.title}</Link>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      {item.desc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3 font-mono">
                      <span>{item.duration}</span>
                      <span className="text-emerald-600 font-bold font-sans">اشتراك مباشر</span>
                    </div>
                    <Link href="/courses" className="block">
                      <Button className="w-full bg-[#0B2D5B] hover:bg-[#2563EB] text-white text-xs font-bold h-9">
                        استعراض المنهج
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Why Learn With KEMIX Academy */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200">
        <div className="container mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="secondary" className="text-blue-700 bg-blue-50 border-blue-200 font-bold">
              {features.heading || "المنهجية التعليمية"}
            </Badge>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              {features.heading}
            </h2>
            {features.description && (
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {features.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.items.length > 0 ? (
              features.items.map((feat, idx) => (
                <Card key={idx} className="border-slate-200 hover:border-blue-300 transition-all shadow-sm">
                  <CardHeader className="space-y-3">
                    <div className="p-3 rounded-xl bg-blue-50 w-fit">
                      <BookOpen className="h-6 w-6 text-blue-500" />
                    </div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      {feat.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600 text-xs leading-relaxed">
                      {feat.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))
            ) : (
              featuresDefault.map((feat, idx) => (
                <Card key={idx} className="border-slate-200 hover:border-blue-300 transition-all shadow-sm">
                  <CardHeader className="space-y-3">
                    <div className="p-3 rounded-xl bg-blue-50 w-fit">
                      {feat.icon}
                    </div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      {feat.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600 text-xs leading-relaxed">
                      {feat.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#0F172A] text-white">
        <div className="container mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="cyan" className="bg-cyan-950/60 border-cyan-800 text-cyan-300 font-bold">
              قصص نجاح الطلاب
            </Badge>
            <h2 className="text-3xl font-black tracking-tight text-white">
              {testimonials.heading}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.items.length > 0 ? (
              testimonials.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4"
                >
                  <p className="text-sm text-slate-300 leading-relaxed italic">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <div className="border-t border-slate-700/60 pt-4 space-y-1">
                    <p className="font-bold text-white text-sm">{item.author}</p>
                    <p className="text-xs text-slate-400">{item.role}</p>
                    <span className="inline-block text-[10px] text-cyan-400 font-bold mt-1">
                      {item.badge}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              testimonialsDefault.map((testi, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4"
                >
                  <p className="text-sm text-slate-300 leading-relaxed italic">
                    &ldquo;{testi.quote}&rdquo;
                  </p>
                  <div className="border-t border-slate-700/60 pt-4 space-y-1">
                    <p className="font-bold text-white text-sm">{testi.author}</p>
                    <p className="text-xs text-slate-400">{testi.role}</p>
                    <span className="inline-block text-[10px] text-cyan-400 font-bold mt-1">
                      {testi.badge}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      {cta.enabled && (
        <section className="bg-gradient-to-l from-[#0B2D5B] via-[#1D4ED8] to-[#0284C7] text-white py-16 px-4 sm:px-6">
          <div className="container mx-auto max-w-4xl text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              {cta.heading}
            </h2>
            <p className="text-base sm:text-lg text-blue-100 max-w-xl mx-auto leading-relaxed">
              {cta.description}
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-white text-[#0B2D5B] hover:bg-slate-100 font-black px-8 h-12 shadow-lg">
                  {cta.buttonText || "إنشاء حساب مجاني"}
                </Button>
              </Link>
              <Link href="/courses">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/40 text-white hover:bg-white/10 px-6 h-12 font-bold"
                >
                  استعرض جميع الكورسات
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
