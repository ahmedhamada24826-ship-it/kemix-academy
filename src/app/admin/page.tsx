"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  HardDrive,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  FileCheck,
  HelpCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

interface DashboardStats {
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  pendingPayments: number;
  pendingTasks: number;
  totalQuizzes: number;
  healthStatus: string;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    publishedCourses: 0,
    totalStudents: 0,
    pendingPayments: 0,
    pendingTasks: 0,
    totalQuizzes: 0,
    healthStatus: "HEALTHY",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [courseRes, studentsRes, paymentsRes, tasksRes, healthRes] = await Promise.all([
          fetch("/api/courses"),
          fetch("/api/admin/students"),
          fetch("/api/payments?status=PENDING"),
          fetch("/api/tasks"),
          fetch("/api/health"),
        ]);

        let cCount = 0;
        let pubCount = 0;
        if (courseRes.ok) {
          const cData = await courseRes.json();
          if (cData.success && cData.data?.courses) {
            cCount = cData.data.courses.length;
            pubCount = cData.data.courses.filter((c: { status: string }) => c.status === "PUBLISHED").length;
          }
        }

        let sCount = 0;
        if (studentsRes.ok) {
          const sData = await studentsRes.json();
          if (sData.success && sData.data?.students) {
            sCount = sData.data.students.length;
          }
        }

        let pCount = 0;
        if (paymentsRes.ok) {
          const pData = await paymentsRes.json();
          if (pData.success && pData.data?.requests) {
            pCount = pData.data.requests.length;
          }
        }

        let tCount = 0;
        if (tasksRes.ok) {
          const tData = await tasksRes.json();
          if (tData.success && tData.data?.tasks) {
            tCount = tData.data.tasks.length;
          }
        }

        let status = "HEALTHY";
        if (healthRes.ok) {
          const hData = await healthRes.json();
          status = hData.status || "HEALTHY";
        }

        setStats({
          totalCourses: cCount,
          publishedCourses: pubCount,
          totalStudents: sCount,
          pendingPayments: pCount,
          pendingTasks: tCount,
          totalQuizzes: 0,
          healthStatus: status,
        });
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              مركز الإدارة والتحكم
            </h1>
            <Badge className="bg-blue-100 text-blue-800 text-xs font-bold border-blue-200">
              KEMIX Control Center
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            إدارة المنصة التعليمية، دورات البيانات والذكاء الاصطناعي، الطلاب، والاشتراكات.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/courses">
            <Button className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold h-9 shadow-sm flex items-center gap-1.5">
              <PlusCircle className="h-4 w-4" />
              <span>إضافة كورس جديد</span>
            </Button>
          </Link>
          <Link href="/admin/payments">
            <Button variant="outline" className="text-xs font-semibold h-9 border-slate-300 relative">
              <CreditCard className="h-4 w-4 ml-1.5 text-blue-600" />
              <span>طلبات الاشتراك</span>
              {stats.pendingPayments > 0 && (
                <span className="mr-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {stats.pendingPayments}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Courses */}
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="p-5 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              إجمالي الكورسات
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-1">
            <div className="text-3xl font-black text-slate-900">{stats.totalCourses}</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <span className="font-semibold text-emerald-600">{stats.publishedCourses} منشور</span>
              <span>•</span>
              <span>{stats.totalCourses - stats.publishedCourses} مسودة</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Students */}
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="p-5 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              الطلاب المسجلين
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-1">
            <div className="text-3xl font-black text-slate-900">{stats.totalStudents}</div>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>مجتمع المتعلمين النشطين</span>
            </p>
          </CardContent>
        </Card>

        {/* Pending WhatsApp Inquiries */}
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="p-5 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              طلبات الاشتراك (واتساب)
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-1">
            <div className="text-3xl font-black text-slate-900">{stats.pendingPayments}</div>
            <p className="text-xs text-amber-600 font-semibold mt-1">
              {stats.pendingPayments > 0 ? "تتطلب المراجعة والموافقة" : "لا توجد طلبات معلقة"}
            </p>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="p-5 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              حالة النظام والخوادم
            </span>
            <div className="h-9 w-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-1">
            <div className="flex items-center gap-1.5 text-emerald-600 font-black text-2xl">
              <CheckCircle2 className="h-5 w-5" />
              <span>مستقر ونشط</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              قاعدة البيانات والتخزين السحابي متصلان
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Governance Links */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">الوحدات والوظائف السريعة</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="bg-white border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>استوديو الكورسات والمناهج</span>
                <BookOpen className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <p>
                بناء المناهج التعليمية، إنشاء الأسابيع والدروس، إعداد مصادر الفيديو (YouTube، Drive، تخزين مباشر)، وقواعد الفتح التتابعي.
              </p>
              <Link href="/admin/courses" className="block pt-1">
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
                <span>طلبات واشتراكات واتساب</span>
                <CreditCard className="h-5 w-5 text-emerald-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <p>
                مراجعة طلبات الالتحاق الواردة عبر واتساب وتأكيد الدفع البنكي / فودافون كاش وتفعيل وصول الطالب تلقائياً للكورس.
              </p>
              <Link href="/admin/payments" className="block pt-1">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold flex items-center justify-center gap-1">
                  <span>مراجعة الطلبات</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>التكليفات والاختبارات</span>
                <FileCheck className="h-5 w-5 text-indigo-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <p>
                إدارة المهام العملية وتصحيح ملفات الطلاب مع الدرجات والملاحظات، وضبط مؤقتات الاختبارات الصارمة server-side.
              </p>
              <Link href="/admin/tasks" className="block pt-1">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold flex items-center justify-center gap-1">
                  <span>التكليفات والتصحيح</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>سجل الطلاب والتقدم</span>
                <Users className="h-5 w-5 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <p>
                متابعة معدلات إنجاز الطلاب، تصدير قوائم الطلاب إلى Excel/CSV، وتتبع النتائج والشهادات المصدرة.
              </p>
              <Link href="/admin/students" className="block pt-1">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold flex items-center justify-center gap-1">
                  <span>قائمة الطلاب</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>التجاوز الإداري اليدوي</span>
                <ShieldCheck className="h-5 w-5 text-amber-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <p>
                فتح درس أو تكليف أو إعادة محاولة اختبار لطالب محدد يدوياً مع التوثيق الكامل في سجل التدقيق Audit Log.
              </p>
              <Link href="/admin/manual-override" className="block pt-1">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold flex items-center justify-center gap-1">
                  <span>التجاوز اليدوي</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>إعدادات المنصة وواتساب</span>
                <HardDrive className="h-5 w-5 text-cyan-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <p>
                تعديل رقم واتساب المعتمد للاشتراكات، قوالب الرسائل التلقائية، إعدادات الدفع والتخزين السحابي.
              </p>
              <Link href="/admin/whatsapp" className="block pt-1">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold flex items-center justify-center gap-1">
                  <span>إعدادات واتساب</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
