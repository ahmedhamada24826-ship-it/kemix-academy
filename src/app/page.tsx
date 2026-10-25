"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { homepageContent, legacyHomepageDefaults } from "@/config/homepage-content";
import {
  ArrowLeft,
  Database,
  BarChart3,
  Clock,
  Sparkles,
  BookOpen,
  Laptop,
  Lightbulb,
  Code2,
  LayoutDashboard,
  ImageOff,
} from "lucide-react";

type EditorialPhotoProps = {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
};

function keepEditedCopy(value: string, legacyDefault: string, refreshedDefault: string) {
  return value === legacyDefault ? refreshedDefault : value;
}

function matchesDefaultItems<T>(items: T[], defaults: T[]) {
  return items.length === defaults.length &&
    items.every((item, index) => JSON.stringify(item) === JSON.stringify(defaults[index]));
}

function isLegacyStatSet(items: SettingsData["cms"]["stats"]["items"]) {
  return items.length === legacyHomepageDefaults.stats.length &&
    items.every((item, index) =>
      item.label === legacyHomepageDefaults.stats[index].label &&
      (
        item.value === legacyHomepageDefaults.stats[index].value ||
        (index === 0 && item.value === "+500")
      )
    );
}

function EditorialPhoto({
  src,
  alt,
  className = "",
  sizes,
  priority = false,
}: EditorialPhotoProps) {
  const [hasFailed, setHasFailed] = useState(false);

  return (
    <div className={`editorial-photo ${className}`}>
      {hasFailed ? (
        <div className="editorial-photo-fallback" role="img" aria-label={alt}>
          <ImageOff className="h-8 w-8" aria-hidden="true" />
          <span>الصورة غير متاحة حاليًا</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          onError={() => setHasFailed(true)}
        />
      )}
    </div>
  );
}

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
      sortOrder: number;
      badge: string;
      heading: string;
      subheading: string;
      description: string;
      ctaPrimary: string;
      ctaSecondary: string;
    };
    stats: {
      enabled: boolean;
      sortOrder: number;
      items: { value: string; label: string }[];
    };
    impact: { enabled: boolean; sortOrder: number; items: string[] };
    skills: {
      enabled: boolean;
      sortOrder: number;
      eyebrow: string;
      heading: string;
      description: string;
      items: { title: string; englishTitle: string; description: string; query: string; icon: string }[];
    };
    featuredCourses: {
      enabled: boolean;
      sortOrder: number;
      heading: string;
      description: string;
    };
    dataStory: {
      enabled: boolean;
      sortOrder: number;
      eyebrow: string;
      heading: string;
      description: string;
      imageAlt: string;
      note: string;
    };
    build: {
      enabled: boolean;
      sortOrder: number;
      eyebrow: string;
      heading: string;
      description: string;
      imageAlt: string;
      steps: string[];
    };
    about: {
      enabled: boolean;
      sortOrder: number;
      heading: string;
      description: string;
      imageUrl: string;
    };
    features: {
      enabled: boolean;
      sortOrder: number;
      heading: string;
      description: string;
      items: { title: string; description: string }[];
    };
    testimonials: {
      enabled: boolean;
      sortOrder: number;
      heading: string;
      items: { quote: string; author: string; role: string; badge: string }[];
    };
    cta: {
      enabled: boolean;
      sortOrder: number;
      heading: string;
      description: string;
      buttonText: string;
    };
    visuals: {
      heroImageUrl: string;
      dataStoryImageUrl: string;
      buildImageUrl: string;
      innovationImageUrl: string;
    };
  };
}

const DEFAULT_CMS = {
  hero: {
    enabled: true,
    sortOrder: 0,
    badge: "من مصر إلى العالم",
    heading: "مستقبلك أكبر من مجرد شهادة.",
    subheading: "ابنِ مهاراتك. اصنع فرصتك. وكن جزءًا من المستقبل.",
    description: "في KEMIX Academy، تتعلّم التكنولوجيا بعقلية عملية، وتحوّل المعرفة إلى مهارات ومشاريع تفتح أمامك آفاقًا جديدة في عالم البيانات والابتكار وريادة الأعمال.",
    ctaPrimary: "ابدأ رحلتك الآن",
    ctaSecondary: "اكتشف مسارات التعلّم",
  },
  stats: { enabled: true, sortOrder: 2, items: [] },
  impact: { enabled: true, sortOrder: 1, items: homepageContent.impact.map((item) => item.label) },
  skills: {
    enabled: true,
    sortOrder: 3,
    eyebrow: homepageContent.skills.eyebrow,
    heading: homepageContent.skills.heading,
    description: homepageContent.skills.description,
    items: homepageContent.skills.items,
  },
  featuredCourses: { enabled: true, sortOrder: 4, heading: "استكشف المسارات التعليمية المتاحة", description: "تعرّف على الدورات المتوفرة حاليًا واختر ما يناسب خطوتك التالية." },
  dataStory: { enabled: true, sortOrder: 5, ...homepageContent.dataStory },
  build: { enabled: true, sortOrder: 6, ...homepageContent.build },
  about: { enabled: true, sortOrder: 7, heading: homepageContent.innovation.heading, description: homepageContent.innovation.description, imageUrl: "" },
  features: {
    enabled: true,
    sortOrder: 8,
    heading: "المنهجية التعليمية",
    description: "",
    items: [
      { title: "تعلّم بالتطبيق", description: "حوّل المفاهيم إلى ممارسة من خلال التكليفات والأنشطة التعليمية المتاحة ضمن المسارات." },
      { title: "أدوات تقنية متنوعة", description: "تعرّف على أدوات تحليل البيانات والبرمجة وقواعد البيانات ضمن تجربة تعلّم متدرجة." },
      { title: "تقدّم خطوة بخطوة", description: "نظّم رحلة التعلّم وتابع الدروس والاختبارات والتكليفات من لوحة دراستك." },
      { title: "مساحة للتطور", description: "ابنِ أساسًا معرفيًا يمكنك تطويره مع كل مهارة جديدة وتجربة تطبيقية." },
    ],
  },
  testimonials: { enabled: true, sortOrder: 10, heading: "تجارب خريجينا في سوق العمل", items: [] },
  cta: { enabled: true, sortOrder: 11, heading: homepageContent.finalCta.heading, description: homepageContent.finalCta.description, buttonText: homepageContent.finalCta.button },
  visuals: {
    heroImageUrl: "/images/homepage/hero-team.webp",
    dataStoryImageUrl: "/images/homepage/data-analytics.webp",
    buildImageUrl: "/images/homepage/learning-team.webp",
    innovationImageUrl: "/images/homepage/strategy-team.webp",
  },
};

export default function HomePage() {
  const { locale, dir } = useLanguage();
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
              const storedHero = s.cms.hero || DEFAULT_CMS.hero;
              const storedStats = s.cms.stats || DEFAULT_CMS.stats;
              const storedImpact = s.cms.impact || DEFAULT_CMS.impact;
              const storedSkills = s.cms.skills || DEFAULT_CMS.skills;
              const storedCourses = s.cms.featuredCourses || DEFAULT_CMS.featuredCourses;
              const storedDataStory = s.cms.dataStory || DEFAULT_CMS.dataStory;
              const storedBuild = s.cms.build || DEFAULT_CMS.build;
              const storedAbout = s.cms.about || DEFAULT_CMS.about;
              const storedFeatures = s.cms.features || DEFAULT_CMS.features;
              const storedTestimonials = s.cms.testimonials || DEFAULT_CMS.testimonials;
              const storedCta = s.cms.cta || DEFAULT_CMS.cta;
              const storedVisuals = s.cms.visuals || DEFAULT_CMS.visuals;

              setCms({
                hero: {
                  ...storedHero,
                  badge: keepEditedCopy(storedHero.badge, legacyHomepageDefaults.hero.badge, DEFAULT_CMS.hero.badge),
                  heading: keepEditedCopy(storedHero.heading, legacyHomepageDefaults.hero.heading, DEFAULT_CMS.hero.heading),
                  subheading: keepEditedCopy(storedHero.subheading, legacyHomepageDefaults.hero.subheading, DEFAULT_CMS.hero.subheading),
                  description: keepEditedCopy(storedHero.description, legacyHomepageDefaults.hero.description, DEFAULT_CMS.hero.description),
                  ctaPrimary: keepEditedCopy(storedHero.ctaPrimary, legacyHomepageDefaults.hero.ctaPrimary, DEFAULT_CMS.hero.ctaPrimary),
                  ctaSecondary: keepEditedCopy(storedHero.ctaSecondary, legacyHomepageDefaults.hero.ctaSecondary, DEFAULT_CMS.hero.ctaSecondary),
                },
                stats: {
                  ...storedStats,
                  items: isLegacyStatSet(storedStats.items) ? [] : storedStats.items,
                },
                impact: { ...DEFAULT_CMS.impact, ...storedImpact },
                skills: { ...DEFAULT_CMS.skills, ...storedSkills },
                featuredCourses: {
                  ...storedCourses,
                  heading: keepEditedCopy(storedCourses.heading, "استكشف أقوى الكورسات الموجهة لسوق العمل", "استكشف المسارات التعليمية المتاحة"),
                  description: keepEditedCopy(storedCourses.description, "مسارات تدريبية مصممة خطوة بخطوة لبناء المهارات التحليلية والبرمجية.", DEFAULT_CMS.featuredCourses.description),
                },
                dataStory: { ...DEFAULT_CMS.dataStory, ...storedDataStory },
                build: { ...DEFAULT_CMS.build, ...storedBuild },
                about: { ...DEFAULT_CMS.about, ...storedAbout },
                features: {
                  ...storedFeatures,
                  items:
                    matchesDefaultItems(storedFeatures.items, legacyHomepageDefaults.features) ||
                    matchesDefaultItems(storedFeatures.items, legacyHomepageDefaults.pageFeatures)
                      ? DEFAULT_CMS.features.items
                      : storedFeatures.items,
                },
                testimonials: {
                  ...storedTestimonials,
                  items: matchesDefaultItems(storedTestimonials.items, legacyHomepageDefaults.testimonials) ? [] : storedTestimonials.items,
                },
                cta: {
                  ...storedCta,
                  heading: keepEditedCopy(storedCta.heading, legacyHomepageDefaults.cta.heading, homepageContent.finalCta.heading),
                  description: keepEditedCopy(storedCta.description, legacyHomepageDefaults.cta.description, homepageContent.finalCta.description),
                  buttonText: keepEditedCopy(storedCta.buttonText, "إنشاء حساب مجاني", homepageContent.finalCta.button),
                },
                visuals: { ...DEFAULT_CMS.visuals, ...storedVisuals },
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to load homepage settings; using CMS defaults", error);
      }
    }
    loadSettings();
  }, []);

  const hero = cms?.hero ?? DEFAULT_CMS.hero;
  const displayHero = locale === "en"
    ? {
        ...hero,
        badge: "From Egypt to the world",
        heading: "Your future is bigger than a certificate.",
        subheading: "Learn • Build • Grow",
        description: "At KEMIX Academy, you learn practical technology and transform ideas into skills that unlock real opportunities in data, AI, and innovation.",
        ctaPrimary: "Start your journey",
        ctaSecondary: "Explore learning paths",
      }
    : hero;
  const stats = cms?.stats ?? DEFAULT_CMS.stats;
  const featuredCourses = cms?.featuredCourses ?? DEFAULT_CMS.featuredCourses;
  const features = cms?.features ?? DEFAULT_CMS.features;
  const testimonials = cms?.testimonials ?? DEFAULT_CMS.testimonials;
  const cta = cms?.cta ?? DEFAULT_CMS.cta;
  const visuals = cms?.visuals ?? DEFAULT_CMS.visuals;
  const ctaHref = cta.buttonText === homepageContent.finalCta.button ? "/courses" : "/register";

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} ساعة ${mins > 0 ? `و ${mins} دقيقة` : ""}`;
    }
    return `${mins} دقيقة`;
  };

  const impactIcons = {
    sparkles: <Sparkles className="h-4 w-4" aria-hidden="true" />,
    laptop: <Laptop className="h-4 w-4" aria-hidden="true" />,
    chart: <BarChart3 className="h-4 w-4" aria-hidden="true" />,
    lightbulb: <Lightbulb className="h-4 w-4" aria-hidden="true" />,
  };

  const skillIcons = {
    chart: <BarChart3 className="h-5 w-5" aria-hidden="true" />,
    code: <Code2 className="h-5 w-5" aria-hidden="true" />,
    database: <Database className="h-5 w-5" aria-hidden="true" />,
    dashboard: <LayoutDashboard className="h-5 w-5" aria-hidden="true" />,
  };

  return (
    <div className="flex flex-col min-h-screen" dir={dir}>
      {/* Hero Section */}
      {hero.enabled && <section className="home-hero relative overflow-hidden px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24" dir={dir} style={{ order: hero.sortOrder }}>
        <div className="home-hero-grid absolute inset-0" aria-hidden="true" />
        <div className="home-hero-glow home-hero-glow-one" aria-hidden="true" />
        <div className="home-hero-glow home-hero-glow-two" aria-hidden="true" />
        <div className={`container relative mx-auto grid max-w-7xl items-center gap-12 ${visuals.heroImageUrl ? "lg:grid-cols-[1.02fr_0.98fr] lg:gap-16" : ""}`}>
          <div className="home-hero-copy space-y-6">
            <div className="hero-badge inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>{displayHero.badge}</span>
            </div>
            <h1 className="hero-title max-w-2xl text-4xl font-black leading-[1.35] tracking-tight sm:text-5xl lg:text-[3.65rem]">
              {displayHero.heading}
            </h1>
            <p className="max-w-xl text-lg font-bold leading-relaxed text-[#2563EB] sm:text-xl">
              {displayHero.subheading}
            </p>
            <p className="max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              {displayHero.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/register">
                <Button size="lg" className="h-12 gap-2 rounded-xl bg-[#0B2D5B] px-6 font-bold text-white shadow-lg shadow-blue-950/15 transition hover:-translate-y-0.5 hover:bg-[#2563EB]">
                  <span>{displayHero.ctaPrimary}</span>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/courses">
                <Button variant="outline" size="lg" className="h-12 rounded-xl border-slate-300 bg-white/80 px-6 font-bold text-[#0B2D5B] hover:border-blue-300 hover:bg-blue-50">
                  {displayHero.ctaSecondary}
                </Button>
              </Link>
            </div>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-xs font-semibold text-slate-500">
              <span>تعلّم عملي</span><span className="text-blue-400" aria-hidden="true">•</span>
              <span>مهارات المستقبل</span><span className="text-blue-400" aria-hidden="true">•</span>
              <span>طموح بلا حدود</span>
            </p>
          </div>

          {visuals.heroImageUrl && (
            <div className="home-visual relative mx-auto w-full max-w-[610px]">
              <div className="home-visual-frame relative aspect-[4/3] overflow-hidden rounded-[1.75rem] sm:aspect-[1.2/1]">
                <EditorialPhoto
                  src={visuals.heroImageUrl}
                  alt="مختصّان يعملان على الحاسوب في مساحة عمل تقنية حديثة"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className="absolute inset-0"
                />
                <div className="home-hero-photo-overlay absolute inset-0" aria-hidden="true" />
                <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-white/25 bg-[#07162c]/55 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm sm:right-6 sm:top-6">
                  <span className="h-2 w-2 rounded-full bg-cyan-300" aria-hidden="true" />
                  معرفة تتحول إلى ممارسة
                </div>
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 sm:inset-x-6 sm:bottom-6">
                  <div className="max-w-[18rem] text-white">
                    <p className="text-xs font-semibold text-blue-100">من مصر إلى العالم</p>
                    <p className="mt-1 text-lg font-black leading-snug sm:text-2xl">ابدأ بخطوة. وابنِ ما بعدها.</p>
                  </div>
                  <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-sm sm:flex">
                    <BarChart3 className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>}

      {(cms?.impact.enabled ?? DEFAULT_CMS.impact.enabled) && <section className="home-impact-strip border-b border-slate-200 bg-white px-4 py-5 sm:px-6" aria-label="محاور التعلّم" style={{ order: (cms?.impact ?? DEFAULT_CMS.impact).sortOrder }}>
        <div className="container mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:justify-between">
          {(cms?.impact ?? DEFAULT_CMS.impact).items.map((label, index) => (
            <div key={`${label}-${index}`} className="flex items-center gap-2.5 text-sm font-semibold text-slate-600">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                {impactIcons[["sparkles", "laptop", "chart", "lightbulb"][index % 4] as keyof typeof impactIcons]}
              </span>
              {label}
            </div>
          ))}
        </div>
      </section>}

      {/* Stats Bar */}
      {stats.enabled && stats.items.length > 0 && (
        <section className="border-y border-slate-200 bg-white py-8 px-4 sm:px-6" style={{ order: stats.sortOrder }}>
          <div className="container mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.items.map((item, idx) => (
              <div key={idx} className="home-stat-card space-y-1 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-[0_10px_25px_rgba(15,23,42,0.04)]">
                <p className="text-2xl sm:text-3xl font-black text-[#0B2D5B]">{item.value}</p>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold">{item.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(cms?.skills.enabled ?? DEFAULT_CMS.skills.enabled) && <section className="home-skills-section px-4 py-16 sm:px-6 sm:py-20 lg:px-8" id="skills" style={{ order: (cms?.skills ?? DEFAULT_CMS.skills).sortOrder }}>
        <div className="container mx-auto max-w-6xl">
          <div className="mb-9 flex flex-col justify-between gap-5 sm:mb-11 sm:flex-row sm:items-end">
            <div className="max-w-2xl space-y-3">
              <p className="section-eyebrow">{(cms?.skills ?? DEFAULT_CMS.skills).eyebrow}</p>
              <h2 className="text-3xl font-black tracking-tight text-[#0B2D5B] sm:text-4xl">{(cms?.skills ?? DEFAULT_CMS.skills).heading}</h2>
              <p className="text-sm leading-7 text-slate-600 sm:text-base">{(cms?.skills ?? DEFAULT_CMS.skills).description}</p>
            </div>
            <Link href="/courses" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900">
              تصفّح الكورسات <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(cms?.skills ?? DEFAULT_CMS.skills).items.map((skill, index) => (
              <Link
                key={skill.query}
                href={`/courses?category=${encodeURIComponent(skill.query)}`}
                className={`home-skill-link home-skill-link-${index + 1} group flex min-h-[190px] flex-col justify-between border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-950/5 sm:p-6`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-[#0B2D5B] group-hover:text-white">
                    {skillIcons[skill.icon as keyof typeof skillIcons]}
                  </span>
                  <span className="font-mono text-xs font-medium tracking-wide text-slate-400">{skill.englishTitle}</span>
                </div>
                <div className="mt-7">
                  <h3 className="text-lg font-bold text-slate-900">{skill.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{skill.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>}

      {/* Featured Courses Section */}
      {featuredCourses.enabled && <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50" style={{ order: featuredCourses.sortOrder }}>
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
                  className="home-course-card flex flex-col overflow-hidden border-slate-200/80 hover:border-blue-300 hover:shadow-[0_22px_45px_rgba(37,99,235,0.08)] transition-all duration-200 group bg-white rounded-2xl"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-tr from-[#0B2D5B] to-[#2563EB]">
                    <div className="absolute inset-0 flex items-center justify-center text-white/50" aria-hidden="true">
                      <Database className="h-10 w-10" />
                    </div>
                    {course.coverImageUrl && (
                      <Image
                        src={course.coverImageUrl}
                        alt={`غلاف دورة ${course.title}`}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        onError={(event) => event.currentTarget.classList.add("hidden")}
                      />
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
                      {course.shortDescription || "اطّلع على تفاصيل محتوى الدورة وما تتضمنه من موضوعات تعليمية."}
                    </CardDescription>
                    {course.instructor?.fullName && (
                      <p className="mt-3 text-xs font-semibold text-slate-500">مع {course.instructor.fullName}</p>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0 space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-1 font-mono">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDuration(course.durationSeconds || 7200)}</span>
                      </div>
                      {course._count?.sections !== undefined && (
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                          <span>{course._count.sections} وحدات</span>
                        </div>
                      )}
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
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <Database className="mx-auto h-9 w-9 text-blue-500" />
                <p className="mt-4 text-lg font-bold text-slate-800">المسارات تتشكل باستمرار</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">تصفّح دليل التعلم للاطلاع على الكورسات المتاحة حاليًا.</p>
                <Link href="/courses" className="mt-5 inline-flex items-center gap-2 font-bold text-blue-700 hover:text-blue-800">
                  استكشف جميع الكورسات <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>}

      {(cms?.dataStory.enabled ?? DEFAULT_CMS.dataStory.enabled) && <section className="home-data-story px-4 py-16 sm:px-6 sm:py-20 lg:px-8" style={{ order: (cms?.dataStory ?? DEFAULT_CMS.dataStory).sortOrder }}>
        <div className={`container mx-auto grid max-w-6xl items-center gap-10 ${visuals.dataStoryImageUrl ? "lg:grid-cols-[1fr_0.9fr] lg:gap-16" : ""}`}>
          {visuals.dataStoryImageUrl && (
            <div className="home-data-photo-wrap relative">
            <EditorialPhoto
              src={visuals.dataStoryImageUrl}
              alt={(cms?.dataStory ?? DEFAULT_CMS.dataStory).imageAlt}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="aspect-[4/3] overflow-hidden rounded-2xl"
            />
            <div className="absolute bottom-4 right-4 rounded-lg border border-white/30 bg-slate-950/65 px-3 py-2 text-[10px] font-medium text-white backdrop-blur-sm">
                {(cms?.dataStory ?? DEFAULT_CMS.dataStory).note}
              </div>
            <span className="home-photo-index absolute -left-3 -top-3 hidden font-mono text-sm font-semibold text-blue-700 sm:block">01 / INSIGHT</span>
            </div>
          )}
          <div className="space-y-5">
            <p className="section-eyebrow">{(cms?.dataStory ?? DEFAULT_CMS.dataStory).eyebrow}</p>
            <h2 className="max-w-xl text-3xl font-black leading-tight tracking-tight text-[#0B2D5B] sm:text-4xl">{(cms?.dataStory ?? DEFAULT_CMS.dataStory).heading}</h2>
            <p className="max-w-xl text-base leading-8 text-slate-600">{(cms?.dataStory ?? DEFAULT_CMS.dataStory).description}</p>
            <div className="home-analysis-flow" aria-label="مراحل مبسطة لتحليل البيانات">
              <div><Database className="h-4 w-4" aria-hidden="true" /><span>بيانات</span></div>
              <span className="home-analysis-connector" aria-hidden="true" />
              <div><BarChart3 className="h-4 w-4" aria-hidden="true" /><span>تحليل</span></div>
              <span className="home-analysis-connector" aria-hidden="true" />
              <div><Lightbulb className="h-4 w-4" aria-hidden="true" /><span>رؤية</span></div>
            </div>
            <div className="home-insight-chart" role="img" aria-label="رسم تعليمي توضيحي لكيفية عرض اتجاهات البيانات، لا يمثل بيانات فعلية">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-slate-700">قراءة الاتجاهات</p>
                <span className="text-[10px] font-medium text-slate-400">رسم تعليمي توضيحي</span>
              </div>
              <div className="home-insight-plot" aria-hidden="true">
                <div className="home-insight-gridlines"><i /><i /><i /></div>
                <div className="home-insight-bars">
                  {[32, 48, 41, 65, 56, 78, 70, 92].map((height, index) => (
                    <span key={index} style={{ height: `${height}%` }} />
                  ))}
                </div>
                <svg className="home-insight-line" viewBox="0 0 320 100" preserveAspectRatio="none">
                  <path d="M0 76 C28 72 32 55 58 62 S94 68 118 49 S155 58 180 38 S220 45 245 27 S282 34 320 12" />
                </svg>
              </div>
            </div>
            <Link href="/courses?category=Data" className="inline-flex items-center gap-2 pt-2 text-sm font-bold text-blue-700 hover:text-blue-900">
              استكشف تحليل البيانات <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>}

      {(cms?.build.enabled ?? DEFAULT_CMS.build.enabled) && <section className="home-practice-section px-4 py-16 sm:px-6 sm:py-20 lg:px-8" style={{ order: (cms?.build ?? DEFAULT_CMS.build).sortOrder }}>
        <div className={`container mx-auto grid max-w-6xl items-center gap-8 ${visuals.buildImageUrl ? "lg:grid-cols-[0.9fr_1.1fr] lg:gap-14" : ""}`}>
          <div className="order-2 space-y-5 lg:order-1">
            <p className="section-eyebrow">{(cms?.build ?? DEFAULT_CMS.build).eyebrow}</p>
            <h2 className="max-w-xl text-3xl font-black leading-tight tracking-tight text-[#0B2D5B] sm:text-4xl">{(cms?.build ?? DEFAULT_CMS.build).heading}</h2>
            <p className="max-w-xl text-base leading-8 text-slate-600">{(cms?.build ?? DEFAULT_CMS.build).description}</p>
            <ol className="home-build-steps">
              {(cms?.build ?? DEFAULT_CMS.build).steps.map((step, index) => (
                <li key={step}><span>0{index + 1}</span>{step}</li>
              ))}
            </ol>
            <Link href="/courses" className="inline-flex items-center gap-2 pt-2 text-sm font-bold text-blue-700 hover:text-blue-900">
              اختر ما تريد تعلّمه <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          {visuals.buildImageUrl && <div className="home-practice-photo order-1 lg:order-2">
            <EditorialPhoto
              src={visuals.buildImageUrl}
              alt={(cms?.build ?? DEFAULT_CMS.build).imageAlt}
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="aspect-[4/3] overflow-hidden rounded-2xl"
            />
            <div className="home-photo-caption"><BookOpen className="h-4 w-4" aria-hidden="true" /><span>من التعلّم إلى التطبيق</span></div>
          </div>}
        </div>
      </section>}

      {(cms?.about.enabled ?? DEFAULT_CMS.about.enabled) && <section className="home-innovation-section px-4 py-16 sm:px-6 sm:py-20 lg:px-8" style={{ order: (cms?.about ?? DEFAULT_CMS.about).sortOrder }}>
        <div className={`container mx-auto grid max-w-6xl items-center gap-10 ${(cms?.about.imageUrl || visuals.innovationImageUrl) ? "lg:grid-cols-[1fr_0.95fr] lg:gap-16" : ""}`}>
          {(cms?.about.imageUrl || visuals.innovationImageUrl) && <div className="home-innovation-photo">
            <EditorialPhoto
              src={cms?.about.imageUrl || visuals.innovationImageUrl}
              alt={homepageContent.innovation.imageAlt}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="aspect-[16/10] overflow-hidden rounded-2xl"
            />
          </div>}
          <div className="home-innovation-copy space-y-5">
            <p className="section-eyebrow">{locale === "ar" ? "تفكير يفتح آفاقًا" : "Ideas that open new horizons"}</p>
            <h2 className="max-w-lg text-3xl font-black leading-tight tracking-tight text-[#0B2D5B] sm:text-4xl">{(cms?.about ?? DEFAULT_CMS.about).heading}</h2>
            <p className="max-w-xl text-base leading-8 text-slate-600">{(cms?.about ?? DEFAULT_CMS.about).description}</p>
            <Link href="/about" className="inline-flex items-center gap-2 pt-2 text-sm font-bold text-blue-700 hover:text-blue-900">
              تعرّف على رؤيتنا <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>}

      {/* Why Learn With KEMIX Academy */}
      {features.enabled && <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200" style={{ order: features.sortOrder }}>
        <div className="container mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="secondary" className="text-blue-700 bg-blue-50 border-blue-200 font-bold">
              {locale === "ar" ? "منهجية التعلّم" : "Learning approach"}
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

          {features.items.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.items.map((feat, idx) => (
                <Card key={idx} className="home-feature-card border-slate-200 hover:border-blue-300 transition-all shadow-sm rounded-2xl">
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
              ))}
          </div>}
        </div>
      </section>}

      {testimonials.enabled && testimonials.items.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ order: testimonials.sortOrder }}>
          <div className="container mx-auto max-w-6xl space-y-10">
            <div className="max-w-2xl space-y-3">
              <Badge variant="cyan" className="font-bold">من مجتمع كيميكس</Badge>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">{testimonials.heading}</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {testimonials.items.map((item, idx) => (
                <div key={idx} className="home-testimonial-card flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm leading-relaxed text-slate-600">&ldquo;{item.quote}&rdquo;</p>
                  <div className="space-y-1 border-t border-slate-100 pt-4">
                    <p className="text-sm font-bold text-[#0B2D5B]">{item.author}</p>
                    <p className="text-xs text-slate-500">{item.role}</p>
                    <span className="mt-1 inline-block text-[10px] font-bold text-blue-600">{item.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Bottom Banner */}
      {cta.enabled && (
        <section className="home-cta-card bg-gradient-to-l from-[#0B2D5B] via-[#1D4ED8] to-[#0284C7] text-white py-16 px-4 sm:px-6" style={{ order: cta.sortOrder }}>
          <div className="container mx-auto max-w-4xl text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {cta.heading}
            </h2>
            <p className="text-base sm:text-lg text-slate-100 max-w-xl mx-auto leading-relaxed font-medium">
              {cta.description}
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-4">
              <Link href={ctaHref}>
                <Button size="lg" className="bg-white text-[#0B2D5B] hover:bg-slate-100 font-black px-8 h-12 shadow-lg">
                  {cta.buttonText || "إنشاء حساب مجاني"}
                </Button>
              </Link>
              <Link href={ctaHref === "/courses" ? "/register" : "/courses"}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/40 text-white hover:bg-white/10 px-6 h-12 font-bold"
                >
                  {ctaHref === "/courses" ? "أنشئ حسابك الآن" : "استعرض جميع الكورسات"}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
