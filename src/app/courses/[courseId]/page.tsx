"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { normalizeCourseList } from "./course-normalization";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Clock,
  BookOpen,
  Award,
  CheckCircle2,
  PlayCircle,
  FileSpreadsheet,
  ChevronDown,
  ChevronLeft,
  ArrowLeft,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  Wrench,
  CheckSquare,
  ListOrdered,
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  slug: string;
  lessonType: string;
  durationSeconds: number;
  isFreePreview: boolean;
}

interface Section {
  id: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  lessons: Lesson[];
}

interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  description: string;
  coverImageUrl?: string | null;
  level: string;
  durationSeconds: number;
  price?: number;
  currency?: string;
  isFree?: boolean;
  tools?: string[] | string | null;
  requirements?: string[] | string | null;
  whatYouWillLearn?: string[] | string | null;
  isEnrolled?: boolean;
  instructor?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    bio?: string | null;
  };
}

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [courseRes, sectionsRes] = await Promise.all([
          fetch(`/api/courses/${courseId}`),
          fetch(`/api/courses/${courseId}/sections`),
        ]);

        if (courseRes.ok) {
          const courseData = await courseRes.json();
          if (courseData.success && courseData.data?.course) {
            setCourse(courseData.data.course);
          }
        }

        if (sectionsRes.ok) {
          const sectionsData = await sectionsRes.json();
          if (sectionsData.success && sectionsData.data?.sections) {
            const list: Section[] = sectionsData.data.sections;
            setSections(list);
            if (list.length > 0) {
              setExpandedSections({ [list[0].id]: true });
            }
          }
        }
      } catch (err) {
        console.error("Failed to load course details:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [courseId]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Direct Free Enrollment
  const handleFreeEnroll = async () => {
    if (!isAuthenticated) {
      router.push(`/login?returnUrl=/courses/${courseId}`);
      return;
    }

    setIsEnrolling(true);
    setEnrollError(null);

    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.error?.message?.includes("already enrolled")) {
          router.push(`/learn/${courseId}`);
          return;
        }
        setEnrollError(json.error?.message || "فشل في تسجيل الالتحاق.");
        return;
      }

      router.push(`/learn/${courseId}`);
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : "حدث خطأ أثناء التسجيل");
    } finally {
      setIsEnrolling(false);
    }
  };

  // WhatsApp Enrollment Request
  const handleWhatsAppEnroll = async () => {
    if (!isAuthenticated) {
      router.push(`/login?returnUrl=/courses/${courseId}`);
      return;
    }

    try {
      // 1. Submit payment request to server
      const pRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          amount: course?.price || 0,
          currency: course?.currency || "EGP",
          paymentMethod: "WHATSAPP",
        }),
      });

      // 2. Load whatsapp settings
      const setRes = await fetch("/api/settings");
      let waNumber = "+201000000000";
      let waTemplate =
        "مرحبًا KEMIX Academy، أرغب في الاشتراك في كورس {course_name}.\nالسعر: {price} {currency}\nاسم الطالب: {student_name}\nالبريد الإلكتروني: {student_email}";

      if (setRes.ok) {
        const setJson = await setRes.json();
        if (setJson.success && setJson.data?.settings) {
          if (setJson.data.settings.whatsappNumber) waNumber = setJson.data.settings.whatsappNumber;
          if (setJson.data.settings.whatsappTemplate) waTemplate = setJson.data.settings.whatsappTemplate;
        }
      }

      const finalMsg = waTemplate
        .replace(/{course_name}/g, course?.title || "")
        .replace(/{price}/g, String(course?.price ?? 0))
        .replace(/{currency}/g, course?.currency || "EGP")
        .replace(/{student_name}/g, user?.fullName || "")
        .replace(/{student_email}/g, user?.email || "");

      const cleanPhone = waNumber.replace(/[^0-9]/g, "");
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMsg)}`;

      window.open(waUrl, "_blank");
    } catch (err) {
      console.error("Failed to initiate WhatsApp enrollment:", err);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} ساعة ${mins > 0 ? `و ${mins} دقيقة` : ""}`;
    }
    return `${mins} دقيقة`;
  };

  const totalLessons = sections.reduce((acc, sec) => acc + (sec.lessons?.length || 0), 0);
  const courseRequirements = normalizeCourseList(course?.requirements);
  const courseLearnItems = normalizeCourseList(course?.whatYouWillLearn);
  const courseTools = normalizeCourseList(course?.tools);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl py-16 px-4 space-y-6 animate-pulse" dir="rtl">
        <div className="h-8 w-1/3 bg-slate-200 rounded" />
        <div className="h-4 w-2/3 bg-slate-200 rounded" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto max-w-md py-20 px-4 text-center space-y-4" dir="rtl">
        <h2 className="text-2xl font-bold text-slate-900">الكورس غير موجود</h2>
        <p className="text-slate-500 text-sm">
          الكورس المطلوب غير متاح حالياً أو لم يتم نشره بعد.
        </p>
        <Link href="/courses">
          <Button variant="outline">العودة لدليل الكورسات</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20" dir="rtl">
      {/* Course Hero Banner */}
      <section className="bg-gradient-to-b from-[#07162C] via-[#0B2D5B] to-[#0F172A] text-white py-14 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Left 2 Cols: Course Overview */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="cyan" className="bg-cyan-950/80 border-cyan-800 text-cyan-300 font-bold">
                  {course.level === "BEGINNER"
                    ? "مستوى مبتدئ"
                    : course.level === "INTERMEDIATE"
                    ? "مستوى متوسط"
                    : course.level === "ADVANCED"
                    ? "مستوى متقدم"
                    : "جميع المستويات"}
                </Badge>
                <span className="text-xs text-slate-400">• مسار مهني احترافي</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                {course.title}
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                {course.shortDescription || "اكتسب خبرة عملية في تحليل البيانات مع مشاريع واقعية وشهادة معتمدة موثقة."}
              </p>

              {/* Metadata strip */}
              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs sm:text-sm text-slate-300 border-t border-slate-700/60 font-medium">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  <span>{formatDuration(course.durationSeconds || 7200)} محتوى تدريبي</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-cyan-400" />
                  <span>{sections.length} فصول ({totalLessons} درس)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-emerald-400" />
                  <span>شهادة معتمدة برمز موثق</span>
                </div>
              </div>

              {/* Instructor snippet */}
              {course.instructor && (
                <div className="flex items-center gap-3 pt-2">
                  <div className="h-10 w-10 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                    {course.instructor.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">المدرب والمشرف الأكاديمي</p>
                    <p className="text-sm font-bold text-white">
                      {course.instructor.fullName}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Action & Enrollment Box */}
            <div className="lg:col-span-1">
              <Card className="border-slate-700/80 bg-slate-900/90 text-white shadow-2xl backdrop-blur-md overflow-hidden">
                <div className="relative h-44 w-full bg-slate-800">
                  {course.coverImageUrl ? (
                    <div
                      style={{ backgroundImage: `url(${course.coverImageUrl})` }}
                      className="h-full w-full bg-contain bg-center bg-no-repeat"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-blue-900/40">
                      <PlayCircle className="h-14 w-14 text-cyan-400 opacity-80" />
                    </div>
                  )}
                </div>

                <CardContent className="p-6 space-y-4">
                  {enrollError && (
                    <Alert variant="destructive">
                      <AlertDescription>{enrollError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black text-white">
                        {course.isFree || !course.price ? (
                          <span className="text-emerald-400">مجاني بالكامل</span>
                        ) : (
                          <span>{course.price} {course.currency || "EGP"}</span>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      وصول كامل ومباشر لجميع المحاضرات ومجموعات البيانات والاختبارات.
                    </p>
                  </div>

                  {course.isEnrolled ? (
                    <Link href={`/learn/${course.id}`} className="block">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 text-base shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
                        <span>الدخول إلى قاعة التعلم</span>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : course.isFree || !course.price ? (
                    <Button
                      onClick={handleFreeEnroll}
                      disabled={isEnrolling}
                      className="w-full bg-[#2563EB] hover:bg-blue-600 text-white font-bold h-11 text-base shadow-lg shadow-blue-500/25"
                    >
                      {isEnrolling ? "جاري التسجيل..." : "التحق بالكورس مجاناً"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleWhatsAppEnroll}
                      className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-black h-11 text-base shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span>الاشتراك عبر واتساب</span>
                    </Button>
                  )}

                  <div className="text-xs text-slate-400 space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                      <span>وصول غير محدود لجميع مواد الكورس</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                      <span>تنزيل ملفات البيانات والـ Notebooks المرفقة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                      <span>شهادة إتمام معتمدة برمز تحقق QR</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content & Syllabus Breakdown */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-10">
            {/* What You Will Learn */}
            {courseLearnItems.length > 0 && (
              <Card className="bg-white border-blue-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <span>ماذا ستتعلم في هذا الكورس؟</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700">
                    {courseLearnItems.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900">
                  نظرة عامة على المنهج التدريبي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {course.description}
              </CardContent>
            </Card>

            {/* Syllabus Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">منهج ومحتوى الكورس</h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {sections.length} فصول • {totalLessons} درس
                  </p>
                </div>
              </div>

              {/* Sections Accordion */}
              <div className="space-y-3">
                {sections.length === 0 ? (
                  <p className="text-sm text-slate-500 bg-white p-6 rounded-xl border border-slate-200">
                    جاري تجهيز محتوى الدروس لهذا الكورس.
                  </p>
                ) : (
                  sections.map((section, sIdx) => {
                    const isOpen = !!expandedSections[section.id];
                    return (
                      <div
                        key={section.id}
                        className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSection(section.id)}
                          className="w-full flex items-center justify-between p-4 sm:p-5 text-right bg-slate-50 hover:bg-slate-100/80 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400">
                              {isOpen ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronLeft className="h-5 w-5" />
                              )}
                            </span>
                            <div>
                              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                                الوحدة {sIdx + 1}: {section.title}
                              </h3>
                              {section.description && (
                                <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-slate-500 font-medium">
                            {section.lessons?.length || 0} درس
                          </span>
                        </button>

                        {isOpen && (
                          <div className="divide-y divide-slate-100">
                            {section.lessons?.map((lesson, lIdx) => (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between p-3.5 sm:px-6 hover:bg-blue-50/40 transition-colors text-xs sm:text-sm"
                              >
                                <div className="flex items-center gap-3">
                                  <PlayCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                  <span className="font-semibold text-slate-800">
                                    {lIdx + 1}. {lesson.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  {lesson.isFreePreview && (
                                    <Badge variant="cyan" className="text-[10px] px-2 py-0.5">
                                      معاينة مجانية
                                    </Badge>
                                  )}
                                  <span className="text-slate-400 text-xs font-mono">
                                    {formatDuration(lesson.durationSeconds || 600)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Instructor Bio Box */}
            {course.instructor && (
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">
                    عن المدرب
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-black text-xl flex-shrink-0">
                      {course.instructor.fullName.charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-slate-900">
                        {course.instructor.fullName}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        كبير مدربي علوم البيانات والذكاء الاصطناعي
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                        {course.instructor.bio || "خبير متخصص في تحليل البيانات وهندسة استعلامات قواعد البيانات ونظم ذكاء الأعمال."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Tools Used */}
            {courseTools.length > 0 && (
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-blue-600" />
                    <span>الأدوات والتقنيات المغطاة</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {courseTools.map((t, idx) => (
                      <Badge key={idx} variant="outline" className="bg-slate-50 text-slate-800 text-xs font-mono font-bold py-1 px-2.5">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prerequisites */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-indigo-600" />
                  <span>المتطلبات المسبقة</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-slate-600 leading-relaxed">
                {courseRequirements.length > 0 ? (
                  courseRequirements.map((req, idx) => (
                    <p key={idx}>• {req}</p>
                  ))
                ) : (
                  <>
                    <p>• إلمام أساسي باستخدام الحاسوب وجداول البيانات.</p>
                    <p>• متصفح إنترنت حديث؛ يتم توفير جميع الأدوات والملفات عبر المنصة.</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-blue-50/70 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-blue-950 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span>معايير الجودة في أكاديمية كيميكس</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-blue-900/80 leading-relaxed space-y-1.5">
                <p>
                  يخضع كل كورس لمراجعة دقيقة لضمان احتواء المنهج على تدريبات عملية تماثل بيئات العمل الاحترافية.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
