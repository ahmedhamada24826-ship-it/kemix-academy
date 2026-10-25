"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock3, PlayCircle, Video } from "lucide-react";

interface LectureItem {
  id: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  status: "SCHEDULED" | "READY" | "LIVE" | "PROCESSING" | "RECORDED" | "FAILED";
  course?: { id: string; title: string; slug?: string };
}

const statusMeta: Record<LectureItem["status"], { label: string; className: string }> = {
  SCHEDULED: { label: "مجدول", className: "bg-slate-100 text-slate-700" },
  READY: { label: "جاهز", className: "bg-cyan-100 text-cyan-700" },
  LIVE: { label: "مباشر", className: "bg-red-100 text-red-700" },
  PROCESSING: { label: "قيد المعالجة", className: "bg-amber-100 text-amber-700" },
  RECORDED: { label: "مسجل", className: "bg-emerald-100 text-emerald-700" },
  FAILED: { label: "فشل", className: "bg-rose-100 text-rose-700" },
};

export default function InstructorLiveLecturesPage() {
  const router = useRouter();
  const [lectures, setLectures] = useState<LectureItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLectures = async () => {
    try {
      const res = await fetch("/api/live-lectures");
      const json = await res.json();
      if (res.ok && json.success) {
        setLectures(json.data?.lectures ?? []);
      }
    } catch (error) {
      console.error("Failed to load instructor live lectures:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLectures();
  }, []);

  const startLecture = async (lectureId: string) => {
    try {
      const res = await fetch(`/api/live-lectures/${lectureId}/start`, { method: "POST" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || "تعذر بدء البث");
      }
      router.push(`/instructor/live-lectures/${lectureId}/studio`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر بدء البث");
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">محاضراتي المباشرة</h1>
          <p className="text-sm text-slate-500">عرض المحاضرات المسندة إليك والبدء مباشرة من داخل KEMIX.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          جاري تحميل المحاضرات...
        </div>
      ) : lectures.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          لا توجد محاضرات مسندة لك حالياً.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => startLecture(lecture.id)}
                    className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold"
                  >
                    <PlayCircle className="h-4 w-4 ml-1" />
                    <span>{lecture.status === "LIVE" ? "الدخول إلى الاستوديو" : "Start Live"}</span>
                  </Button>
                  <Link href={`/instructor/live-lectures/${lecture.id}/studio`} className="flex-1">
                    <Button variant="outline" className="w-full text-xs font-bold">
                      التفاصيل
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
