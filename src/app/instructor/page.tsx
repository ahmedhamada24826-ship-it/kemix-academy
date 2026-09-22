"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  BookOpen,
  Users,
  FileCheck,
  HelpCircle,
  BarChart3,
  ArrowUpRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

export default function InstructorDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    coursesCount: 0,
    studentsCount: 0,
    pendingTasksCount: 0,
    totalQuizzesCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInstructorStats() {
      try {
        const [coursesRes, tasksRes] = await Promise.all([
          fetch("/api/courses"),
          fetch("/api/tasks"),
        ]);

        let cCount = 0;
        if (coursesRes.ok) {
          const cData = await coursesRes.json();
          if (cData.success && cData.data?.courses) {
            cCount = cData.data.courses.length;
          }
        }

        let tCount = 0;
        if (tasksRes.ok) {
          const tData = await tasksRes.json();
          if (tData.success && tData.data?.tasks) {
            tCount = tData.data.tasks.length;
          }
        }

        setStats({
          coursesCount: cCount,
          studentsCount: 14,
          pendingTasksCount: tCount,
          totalQuizzesCount: 5,
        });
      } catch (err) {
        console.error("Failed to load instructor stats:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInstructorStats();
  }, []);

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
            <span>مرحباً، {user?.fullName}</span>
            <span className="text-2xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            لوحة قيادة المدرب والمعلم • متابعة تقدم الطلاب وتصحيح التكليفات والاختبارات.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/instructor/tasks">
            <Button className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold h-9 shadow-sm flex items-center gap-1.5">
              <FileCheck className="h-4 w-4" />
              <span>مراجعة تسليمات الواجبات</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="p-5 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              الكورسات المسندة
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-1">
            <div className="text-3xl font-black text-slate-900">{stats.coursesCount}</div>
            <p className="text-xs text-blue-600 font-medium mt-1">مناهج تدريبية نشطة</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="p-5 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              الطلاب في كورساتك
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-1">
            <div className="text-3xl font-black text-slate-900">{stats.studentsCount}</div>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>متعلمون مسجلون</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="p-5 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              تسليمات بانتظار التصحيح
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-1">
            <div className="text-3xl font-black text-slate-900">{stats.pendingTasksCount}</div>
            <p className="text-xs text-amber-600 font-semibold mt-1">واجبات وتطبيقات عملية</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="p-5 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              الاختبارات الذاتية
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <HelpCircle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-1">
            <div className="text-3xl font-black text-slate-900">{stats.totalQuizzesCount}</div>
            <p className="text-xs text-purple-600 font-medium mt-1">تقييمات مجهزة بمؤقت</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-white border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>كورساتي ومناهجي</span>
              <BookOpen className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600">
            <p>
              استعراض المناهج الدراسية، إضافة الدروس، وتحديث مصادر الفيديو والمواد الإثرائية.
            </p>
            <Link href="/instructor/courses" className="block pt-1">
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold flex items-center justify-center gap-1">
                <span>إدارة الكورسات</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>تصحيح التكليفات والواجبات</span>
              <FileCheck className="h-5 w-5 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600">
            <p>
              مراجعة أكواد وملفات الطلاب المرفوعة، رصد الدرجات وإرسال الملاحظات التوجيهية.
            </p>
            <Link href="/instructor/tasks" className="block pt-1">
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold flex items-center justify-center gap-1">
                <span>استعراض التسليمات</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>تقارير تقدم الطلاب</span>
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600">
            <p>
              متابعة معدلات إتمام الدروس ونسب النجاح في الاختبارات لكل متدرب.
            </p>
            <Link href="/instructor/performance" className="block pt-1">
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold flex items-center justify-center gap-1">
                <span>تقرير الأداء</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
