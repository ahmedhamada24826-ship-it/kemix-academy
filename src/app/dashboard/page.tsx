"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BookOpen,
  Award,
  PlayCircle,
  CheckCircle2,
  GraduationCap,
  ExternalLink,
  FileCheck,
  HelpCircle,
  Clock,
  User,
} from "lucide-react";

interface EnrollmentItem {
  id: string;
  courseId: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  enrolledAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
    shortDescription?: string | null;
    coverImageUrl?: string | null;
    level: string;
    durationSeconds: number;
    _count?: {
      sections: number;
    };
  };
  progress?: {
    progressPercent: number;
    completedLessons: number;
    totalLessons: number;
    lastAccessedLessonId?: string | null;
  };
}

interface CertificateItem {
  id: string;
  certificateCode: string;
  issuedAt: string;
  course: {
    id: string;
    title: string;
  };
}

export default function StudentDashboardPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login?returnUrl=/dashboard");
      return;
    }

    async function loadDashboardData() {
      try {
        const [enrollRes, certRes] = await Promise.all([
          fetch("/api/enrollments"),
          fetch("/api/certificates"),
        ]);

        if (enrollRes.ok) {
          const enrollData = await enrollRes.json();
          if (enrollData.success && enrollData.data?.enrollments) {
            const rawEnrollments: EnrollmentItem[] = enrollData.data.enrollments;

            const enriched = await Promise.all(
              rawEnrollments.map(async (item) => {
                try {
                  const pRes = await fetch(`/api/courses/${item.courseId}/progress`);
                  if (pRes.ok) {
                    const pData = await pRes.json();
                    if (pData.success && pData.data?.progress) {
                      return {
                        ...item,
                        progress: pData.data.progress,
                      };
                    }
                  }
                } catch {
                  // Ignore per-course progress fetch error
                }
                return item;
              })
            );

            setEnrollments(enriched);
          }
        }

        if (certRes.ok) {
          const certData = await certRes.json();
          if (certData.success && certData.data?.certificates) {
            setCertificates(certData.data.certificates);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthLoading, isAuthenticated, router]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="container mx-auto max-w-7xl py-12 px-4 space-y-8 animate-pulse" dir="rtl">
        <div className="h-8 w-1/4 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-48 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  const activeEnrollments = enrollments.filter((e) => e.status === "ACTIVE");
  const completedEnrollments = enrollments.filter((e) => e.status === "COMPLETED");
  const continueCourse = activeEnrollments[0];

  const totalLessonsDone = enrollments.reduce(
    (acc, e) => acc + (e.progress?.completedLessons || 0),
    0
  );

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B2D5B] tracking-tight">
              أهلاً بك مجددًا، {user?.fullName}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              تابع تقدمك الدراسي في الكورسات، أكمل المحاضرات والتكليفات، واستعرض شهاداتك المعتمدة.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/courses">
              <Button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold shadow-sm">
                تصفح الكورسات المتاحة
              </Button>
            </Link>
          </div>
        </div>

        {/* Learning Stats Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="p-4 pb-1">
              <span className="text-xs font-semibold text-slate-500">الكورسات المسجلة</span>
            </CardHeader>
            <CardContent className="p-4 pt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-[#0B2D5B]">{enrollments.length}</span>
              <BookOpen className="h-5 w-5 text-blue-600" />
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="p-4 pb-1">
              <span className="text-xs font-semibold text-slate-500">المحاضرات المكتملة</span>
            </CardHeader>
            <CardContent className="p-4 pt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-600">{totalLessonsDone}</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="p-4 pb-1">
              <span className="text-xs font-semibold text-slate-500">الكورسات المنجزة</span>
            </CardHeader>
            <CardContent className="p-4 pt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-[#2563EB]">{completedEnrollments.length}</span>
              <GraduationCap className="h-5 w-5 text-indigo-600" />
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="p-4 pb-1">
              <span className="text-xs font-semibold text-slate-500">الشهادات المعتمدة</span>
            </CardHeader>
            <CardContent className="p-4 pt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-cyan-600">{certificates.length}</span>
              <Award className="h-5 w-5 text-cyan-600" />
            </CardContent>
          </Card>
        </div>

        {/* Continue Learning Featured Banner */}
        {continueCourse && (
          <Card className="bg-gradient-to-l from-[#07162C] via-[#0B2D5B] to-[#1E3A8A] text-white border-0 shadow-lg overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-xl text-right">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500 text-slate-950">
                      متابعة التعلم
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      {continueCourse.progress?.progressPercent || 0}% مكتمل
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {continueCourse.course.title}
                  </h2>

                  <div className="w-full max-w-md space-y-1.5 pt-1">
                    <Progress
                      value={continueCourse.progress?.progressPercent || 0}
                      className="bg-slate-800/80 h-2.5 border border-slate-700"
                      indicatorClassName="bg-cyan-400"
                    />
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>
                        {continueCourse.progress?.completedLessons || 0} من{" "}
                        {continueCourse.progress?.totalLessons || 0} محاضرة مكتملة
                      </span>
                      <span className="font-bold">{continueCourse.progress?.progressPercent || 0}%</span>
                    </div>
                  </div>
                </div>

                <Link href={`/learn/${continueCourse.courseId}`}>
                  <Button size="lg" className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black px-6 shadow-md flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" />
                    <span>متابعة المحاضرة</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Enrolled Courses Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#0B2D5B]">كورساتي التعليمية</h2>
          </div>

          <Tabs defaultValue="all">
            <TabsList className="bg-slate-200/80">
              <TabsTrigger value="all">الكل ({enrollments.length})</TabsTrigger>
              <TabsTrigger value="active">قيد التقدم ({activeEnrollments.length})</TabsTrigger>
              <TabsTrigger value="completed">المكتملة ({completedEnrollments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="pt-4">
              <EnrollmentGrid list={enrollments} />
            </TabsContent>
            <TabsContent value="active" className="pt-4">
              <EnrollmentGrid list={activeEnrollments} />
            </TabsContent>
            <TabsContent value="completed" className="pt-4">
              <EnrollmentGrid list={completedEnrollments} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Certificates & Achievements Section */}
        {certificates.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-slate-200">
            <h2 className="text-xl font-bold text-[#0B2D5B] flex items-center gap-2">
              <Award className="h-5 w-5 text-[#2563EB]" />
              <span>الشهادات المعتمدة المحصلة</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((cert) => (
                <Card key={cert.id} className="bg-white border-emerald-200/80 shadow-sm hover:border-emerald-400 transition-all">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between text-xs text-emerald-700 font-bold mb-1">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> شهادة معتمدة موثقة
                      </span>
                      <span className="font-mono text-slate-500">{cert.certificateCode}</span>
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900">
                      {cert.course.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 space-y-3">
                    <p className="text-xs text-slate-500">
                      تاريخ الإصدار: {new Date(cert.issuedAt).toLocaleDateString("ar-EG")}
                    </p>
                    <Link
                      href={`/verify/${encodeURIComponent(cert.certificateCode)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8]"
                    >
                      <span>رابط التحقق الرسمي من الشهادة</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EnrollmentGrid({ list }: { list: EnrollmentItem[] }) {
  if (list.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-4 max-w-md mx-auto">
        <BookOpen className="h-10 w-10 text-slate-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">لا توجد كورسات في هذا القسم</h3>
        <p className="text-xs text-slate-500">
          استكشف دليل الكورسات المتاح على المنصة وابدأ رحلتك التعليمية الآن.
        </p>
        <Link href="/courses">
          <Button variant="outline" size="sm" className="font-semibold">
            تصفح الكورسات
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {list.map((item) => {
        const percent = item.progress?.progressPercent || 0;
        return (
          <Card key={item.id} className="flex flex-col bg-white border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden">
            {item.course.coverImageUrl && (
              <div className="aspect-video w-full overflow-hidden bg-slate-100">
                <img
                  src={item.course.coverImageUrl}
                  alt={item.course.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader className="pb-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={item.status === "COMPLETED" ? "success" : "navy"} className="text-[10px] font-bold">
                  {item.status === "COMPLETED" ? "مكتمل" : "قيد التعلم"}
                </Badge>
                <span className="text-xs text-slate-500 font-medium">
                  {item.course.level === "BEGINNER"
                    ? "مبتدئ"
                    : item.course.level === "INTERMEDIATE"
                    ? "متوسط"
                    : item.course.level === "ADVANCED"
                    ? "متقدم"
                    : "جميع المستويات"}
                </span>
              </div>
              <CardTitle className="text-base font-bold text-[#0B2D5B] line-clamp-2">
                <Link href={`/learn/${item.courseId}`}>{item.course.title}</Link>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-between space-y-4 pt-0">
              <div className="space-y-1.5">
                <Progress value={percent} className="h-2" />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>
                    {item.progress?.completedLessons || 0} من {item.progress?.totalLessons || 0} محاضرة
                  </span>
                  <span className="font-bold text-[#2563EB]">{percent}%</span>
                </div>
              </div>

              <Link href={`/learn/${item.courseId}`} className="block w-full">
                <Button className="w-full bg-[#0B2D5B] hover:bg-[#2563EB] text-white text-xs font-bold h-9 transition-colors">
                  {item.status === "COMPLETED" ? "مراجعة محتوى الكورس" : "الدخول إلى قاعة التعلم"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
