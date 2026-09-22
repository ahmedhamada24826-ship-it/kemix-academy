"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  BookOpen,
  Search,
  Edit,
  Eye,
  Layers,
  Users,
  Clock,
} from "lucide-react";

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
  price?: number;
  currency?: string;
  durationSeconds: number;
}

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await fetch("/api/courses");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.courses) {
            setCourses(json.data.courses);
          }
        }
      } catch (err) {
        console.error("Failed to load instructor courses:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCourses();
  }, []);

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-[#2563EB]" />
          <span>كورساتي ومناهجي التعليمية</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          استعراض المناهج الدراسية، إضافة الدروس والوحدات، وتحديث المحتوى التدريبي.
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <Input
          type="text"
          placeholder="ابحث عن كورس بالعنوان أو الرابط..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 p-0 text-sm h-8"
        />
      </div>

      {/* Course Cards Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-slate-500 animate-pulse font-medium">
          جاري تحميل الكورسات...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center bg-white border-slate-200">
          <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">لا توجد كورسات مسندة إليك حالياً</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => (
            <Card
              key={course.id}
              className="bg-white border-slate-200 hover:border-blue-300 transition-all shadow-sm flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">
                    {course.level === "BEGINNER"
                      ? "مبتدئ"
                      : course.level === "INTERMEDIATE"
                      ? "متوسط"
                      : course.level === "ADVANCED"
                      ? "متقدم"
                      : "جميع المستويات"}
                  </Badge>
                  <Badge
                    variant={course.status === "PUBLISHED" ? "success" : "warning"}
                    className="text-[10px] font-bold"
                  >
                    {course.status === "PUBLISHED" ? "منشور" : "مسودة"}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{course.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {course.shortDescription || "منهج تدريبي متقدم يغطي التطبيقات العملية في مجالات علوم البيانات والذكاء الاصطناعي."}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <Link href={`/courses/${course.id}`} target="_blank">
                  <Button variant="ghost" size="sm" className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    <span>معاينة</span>
                  </Button>
                </Link>

                <Link href={`/admin/courses/${course.id}`}>
                  <Button size="sm" className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold h-8 flex items-center gap-1">
                    <Edit className="h-3.5 w-3.5 ml-1" />
                    <span>تعديل المنهج</span>
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
