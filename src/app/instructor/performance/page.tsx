"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

export default function InstructorPerformancePage() {
  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-[#2563EB]" />
          <span>تحليلات الأداء ومعدلات إتمام المناهج</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          مؤشرات تفاعل الطلاب، نسب اجتياز التكليفات والاختبارات، ومعدل إكمال الكورسات.
        </p>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="bg-white border-slate-200 shadow-sm p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">متوسط نسبة الإنجاز</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">76.4%</div>
          <p className="text-[11px] text-emerald-600 font-semibold">+8.2% عن الشهر الماضي</p>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">معدل النجاح في الاختبارات</span>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">88.5%</div>
          <p className="text-[11px] text-blue-600 font-semibold">من المحاولة الأولى أو الثانية</p>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">الشهادات الممنوحة</span>
            <Award className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">32</div>
          <p className="text-[11px] text-purple-600 font-semibold">خريج أكمل المسار بنجاح</p>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card className="bg-white border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">ملاحظات تحسين المحتوى</h2>
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900">
            <p className="font-bold mb-0.5">💡 أعلى الدروس تفاعلاً:</p>
            <p>دروس تحليل البيانات العملية والتطبيق على مجموعات البيانات الواقعية تحظى بأعلى معدل إكمال وتسليم للواجبات.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900">
            <p className="font-bold mb-0.5">⚠️ توصية للاختبارات:</p>
            <p>بعض الطلاب يستغرقون وقتاً إضافياً في مسائل استعلامات SQL المعقدة. يفضل إضافة أمثلة توضيحية إضافية في الدروس السابقة للاختبار.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
