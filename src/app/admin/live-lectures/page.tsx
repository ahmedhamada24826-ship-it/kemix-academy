"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock3, MonitorPlay, PlusCircle, Video } from "lucide-react";

interface CourseOption {
  id: string;
  title: string;
  slug?: string;
  status?: string;
}

interface InstructorOption {
  id: string;
  fullName: string;
  email: string;
}

interface LiveLectureItem {
  id: string;
  title: string;
  courseId: string;
  instructorId: string;
  scheduledAt: string;
  durationMinutes: number;
  description?: string | null;
  status: "SCHEDULED" | "READY" | "LIVE" | "PROCESSING" | "RECORDED" | "FAILED";
  course?: CourseOption;
  instructor?: InstructorOption;
}

const statusMeta: Record<LiveLectureItem["status"], { label: string; className: string }> = {
  SCHEDULED: { label: "مجدول", className: "bg-slate-100 text-slate-700" },
  READY: { label: "جاهز", className: "bg-cyan-100 text-cyan-700" },
  LIVE: { label: "مباشر", className: "bg-red-100 text-red-700" },
  PROCESSING: { label: "قيد المعالجة", className: "bg-amber-100 text-amber-700" },
  RECORDED: { label: "مسجل", className: "bg-emerald-100 text-emerald-700" },
  FAILED: { label: "فشل", className: "bg-rose-100 text-rose-700" },
};

export default function AdminLiveLecturesPage() {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [lectures, setLectures] = useState<LiveLectureItem[]>([]);
  const [form, setForm] = useState({
    title: "",
    courseId: "",
    instructorId: "",
    scheduledAt: "",
    durationMinutes: "60",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [courseRes, instructorRes, lectureRes] = await Promise.all([
        fetch("/api/courses"),
        fetch("/api/admin/instructors"),
        fetch("/api/live-lectures"),
      ]);

      if (courseRes.ok) {
        const courseJson = await courseRes.json();
        if (courseJson.success) {
          setCourses(courseJson.data?.courses ?? []);
        }
      }

      if (instructorRes.ok) {
        const instructorJson = await instructorRes.json();
        if (instructorJson.success) {
          setInstructors(instructorJson.data?.instructors ?? []);
        }
      }

      if (lectureRes.ok) {
        const lectureJson = await lectureRes.json();
        if (lectureJson.success) {
          setLectures(lectureJson.data?.lectures ?? []);
        }
      }
    } catch (err) {
      console.error("Failed to load live lectures dashboard:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/live-lectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          courseId: form.courseId,
          instructorId: form.instructorId,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          durationMinutes: Number(form.durationMinutes),
          description: form.description.trim() || null,
          status: "SCHEDULED",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "تعذر إنشاء المحاضرة");
      }

      setForm({
        title: "",
        courseId: "",
        instructorId: "",
        scheduledAt: "",
        durationMinutes: "60",
        description: "",
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">محاضرات مباشرة</h1>
          <p className="text-sm text-slate-500">جدولة المحاضرات، إعطاء المحاضر، ومتابعة حالت البث.</p>
        </div>
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">Admin Live Desk</Badge>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-black text-slate-900">
            <PlusCircle className="h-5 w-5 text-blue-600" />
            إنشاء محاضرة مباشرة جديدة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-2">عنوان المحاضرة</label>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm"
                placeholder="مثال: Data Analysis — Live Lecture 01"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">الكورس</label>
              <select
                value={form.courseId}
                onChange={(e) => setForm((prev) => ({ ...prev, courseId: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm"
                required
              >
                <option value="">اختر الكورس</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">المحاضر</label>
              <select
                value={form.instructorId}
                onChange={(e) => setForm((prev) => ({ ...prev, instructorId: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm"
                required
              >
                <option value="">اختر المحاضر</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>{instructor.fullName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">تاريخ المحاضرة</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">المدة المتوقعة (دقيقة)</label>
              <input
                type="number"
                min={15}
                max={480}
                value={form.durationMinutes}
                onChange={(e) => setForm((prev) => ({ ...prev, durationMinutes: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-2">الوصف</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm min-h-[100px]"
                placeholder="وصف المحاضرة، أهدافها، والكورس المرتبط بها"
              />
            </div>

            {error && <div className="md:col-span-2 text-xs text-red-600">{error}</div>}

            <div className="md:col-span-2">
              <Button type="submit" disabled={isSubmitting} className="bg-[#2563EB] text-white hover:bg-blue-700 px-6">
                {isSubmitting ? "جاري الحفظ..." : "حفظ المحاضرة"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {lectures.map((lecture) => (
          <Card key={lecture.id} className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base font-bold text-slate-900 line-clamp-2">{lecture.title}</CardTitle>
                <Badge className={statusMeta[lecture.status]?.className || "bg-slate-100 text-slate-700"}>
                  {statusMeta[lecture.status]?.label || lecture.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-blue-600" />
                <span>{lecture.course?.title || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-emerald-600" />
                <span>{formatDate(lecture.scheduledAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-amber-600" />
                <span>{lecture.durationMinutes} دقيقة</span>
              </div>
              <div className="flex items-center gap-2">
                <MonitorPlay className="h-4 w-4 text-violet-600" />
                <span>{lecture.instructor?.fullName || "—"}</span>
              </div>
              <Link href={`/instructor/live-lectures/${lecture.id}/studio`} className="block pt-1">
                <Button variant="outline" size="sm" className="w-full text-xs font-bold">
                  تفاصيل المحاضرة
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
