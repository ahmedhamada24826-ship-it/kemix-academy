"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sliders,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Unlock,
  Award,
  HelpCircle,
  FileCheck,
  UserCheck,
} from "lucide-react";

export default function AdminManualOverridePage() {
  const [students, setStudents] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [lessons, setLessons] = useState<{ id: string; title: string }[]>([]);

  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [targetType, setTargetType] = useState<"LESSON_UNLOCK" | "QUIZ_PASS" | "TASK_PASS" | "COURSE_ENROLL">("LESSON_UNLOCK");
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [sRes, cRes] = await Promise.all([
          fetch("/api/admin/students"),
          fetch("/api/courses"),
        ]);

        if (sRes.ok) {
          const sJson = await sRes.json();
          if (sJson.success && sJson.data?.students) {
            setStudents(sJson.data.students);
            if (sJson.data.students.length > 0) setStudentId(sJson.data.students[0].id);
          }
        }

        if (cRes.ok) {
          const cJson = await cRes.json();
          if (cJson.success && cJson.data?.courses) {
            setCourses(cJson.data.courses);
            if (cJson.data.courses.length > 0) setCourseId(cJson.data.courses[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load override data:", err);
      }
    }
    loadData();
  }, []);

  const handleExecuteOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !reason.trim()) {
      setErrorMsg("يرجى اختيار الطالب وكتابة سبب التجاوز الإداري.");
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/manual-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          targetType,
          targetId: targetId.trim() || lessonId || courseId,
          reason: reason.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg("تم تنفيذ التجاوز الإداري وتوثيقه في سجل التدقيق بنجاح.");
        setReason("");
        setTargetId("");
      } else {
        setErrorMsg(json.error?.message || "فشل في تنفيذ التجاوز الإداري.");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "حدث خطأ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Sliders className="h-6 w-6 text-amber-600" />
          <span>التجاوز الإداري اليدوي (Manual Override)</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          إلغاء قفل درس، إعفاء طالب من متطلب، أو تفعيل نجاح يدوي مع تسجيل إلزامي لسبب التجاوز في سجل التدقيق.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                <span>نموذج التجاوز والتحكم الاستثنائي</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                جميع العمليات المنفذة هنا تسجل برقم المشرف والوقت وسبب الإجراء للرقابة والحوكمة.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleExecuteOverride} className="space-y-4">
                {successMsg && (
                  <Alert variant="success">
                    <AlertDescription>{successMsg}</AlertDescription>
                  </Alert>
                )}

                {errorMsg && (
                  <Alert variant="destructive">
                    <AlertDescription>{errorMsg}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">اختر الطالب المستهدف *</label>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نوع الإجراء الاستثنائي *</label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as "LESSON_UNLOCK" | "QUIZ_PASS" | "TASK_PASS" | "COURSE_ENROLL")}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    <option value="LESSON_UNLOCK">فتح درس مغلق يدوياً (Unlock Lesson)</option>
                    <option value="QUIZ_PASS">اعتماد اجتياز اختبار استثنائياً (Pass Quiz)</option>
                    <option value="TASK_PASS">اعتماد تسليم تكليف (Pass Task)</option>
                    <option value="COURSE_ENROLL">تسجيل مباشر في كورس (Direct Enrollment)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">الكورس المرتبط</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">معرف العنصر المستهدف (Target ID / Lesson ID)</label>
                  <Input
                    placeholder="معرف الدرس أو الاختبار أو اتركه فارغاً لاستخدام الكورس"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="font-mono text-xs dir-ltr text-left"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">سبب التجاوز الإداري (إلزامي للتوثيق) *</label>
                  <Textarea
                    rows={3}
                    placeholder="مثال: تم فتح الدرس بناءً على طلب الطالب بعد مراجعة حالته الخاصة أو عطل فني..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Unlock className="h-4 w-4 ml-1" />
                  <span>{isSubmitting ? "جاري التنفيذ..." : "تنفيذ التجاوز وتوثيقه"}</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <div className="space-y-4">
          <Card className="bg-amber-50/50 border-amber-200 p-5 text-xs text-amber-900 space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-1.5 text-amber-950">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <span>ميثاق الحوكمة والأمان</span>
            </h3>
            <p className="leading-relaxed">
              تضمن خاصية التجاوز اليدوي عدم توقف أي طالب بسبب قيود تقنية غير متوقعة، مع الحفاظ على شفافية السجلات.
            </p>
            <div className="p-3 bg-white rounded-lg border border-amber-200/80 space-y-1 text-[11px]">
              <p className="font-bold text-amber-950">ماذا يحدث عند التنفيذ؟</p>
              <ul className="list-disc list-inside text-amber-800 space-y-0.5">
                <li>فتح فوري للدرس أو التكليف في حساب الطالب.</li>
                <li>إنشاء سجل تدقيق Audit Log غير قابل للحذف.</li>
                <li>تحديث نسبة إنجاز الطالب في لوحة التحكم.</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
