"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  BookOpen,
  Clock,
  Filter,
  Database,
  Terminal,
  Cpu,
  BarChart3,
  MessageCircle,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  coverImageUrl?: string | null;
  level: string;
  status: string;
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

export default function CoursesCatalogPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const categories = [
    { label: "جميع المسارات", value: "ALL" },
    { label: "بايثون وعلم البيانات", value: "Python" },
    { label: "قواعد البيانات و SQL", value: "SQL" },
    { label: "لوحات تحكم Power BI", value: "Power" },
    { label: "إكسل المتقدم والتحليل", value: "Excel" },
  ];

  const levels = [
    { label: "جميع المستويات", value: "ALL" },
    { label: "مبتدئ", value: "BEGINNER" },
    { label: "متوسط", value: "INTERMEDIATE" },
    { label: "متقدم", value: "ADVANCED" },
  ];

  useEffect(() => {
    async function fetchCourses() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("status", "PUBLISHED");
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        if (selectedLevel !== "ALL") params.set("level", selectedLevel);

        const res = await fetch(`/api/courses?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.courses) {
            let list: Course[] = json.data.courses;
            if (selectedCategory !== "ALL") {
              list = list.filter((c) =>
                c.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
                (c.shortDescription && c.shortDescription.toLowerCase().includes(selectedCategory.toLowerCase()))
              );
            }
            setCourses(list);
          }
        }
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        setIsLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchCourses();
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedLevel, selectedCategory]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} ساعة ${mins > 0 ? `و ${mins} دقيقة` : ""}`;
    }
    return `${mins} دقيقة`;
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header Title */}
        <div className="space-y-3">
          <Badge variant="cyan" className="font-bold">
            دليل الكورسات والمناهج التدريبية
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            استكشف برامج تحليل البيانات والذكاء الاصطناعي
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
            اكتسب مهارات تقنية احترافية مع مشاريع عملية وتطبيقات تطبيقية حقيقية وشهادات موثقة.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative md:col-span-1">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="ابحث عن كورس أو مهارة أو تقنية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-sm"
              />
            </div>

            {/* Category selection */}
            <div className="flex flex-wrap items-center gap-2 md:col-span-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedCategory === cat.value
                      ? "bg-[#0B2D5B] text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Level Filters */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-bold flex items-center gap-1">
              <Filter className="h-3 w-3" /> المستوى:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {levels.map((lvl) => (
                <button
                  key={lvl.value}
                  onClick={() => setSelectedLevel(lvl.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    selectedLevel === lvl.value
                      ? "bg-blue-100 text-blue-800"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Course Grid Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Card key={n} className="overflow-hidden border-slate-200 animate-pulse">
                <div className="h-48 bg-slate-200" />
                <CardHeader className="space-y-2">
                  <div className="h-4 w-20 bg-slate-200 rounded" />
                  <div className="h-6 w-3/4 bg-slate-200 rounded" />
                  <div className="h-4 w-full bg-slate-200 rounded" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="flex flex-col overflow-hidden border-slate-200/90 hover:border-blue-300 hover:shadow-lg transition-all duration-200 group bg-white"
              >
                <div className="relative aspect-video w-full bg-gradient-to-tr from-[#0B2D5B] to-[#2563EB] overflow-hidden">
                  {course.coverImageUrl ? (
                    <div
                      style={{ backgroundImage: `url(${course.coverImageUrl})` }}
                      className="h-full w-full bg-cover bg-center bg-no-repeat"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-6 text-white text-center">
                      <Database className="h-12 w-12 opacity-40 mb-2" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge variant="navy" className="bg-slate-900/85 backdrop-blur-sm text-xs font-semibold">
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
                    {course.shortDescription || "تعليم تقني تطبيقي مع مشاريع واقعية واختبارات تقييمية."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1 font-mono">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{formatDuration(course.durationSeconds || 7200)}</span>
                    </div>
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
                      عرض المنهج والتسجيل
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-4 max-w-md mx-auto">
            <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">لا توجد نتائج مطابقة لبحثك</h3>
            <p className="text-xs text-slate-500">
              جرّب تغيير كلمات البحث أو إعادة ضبط خيارات التصفية لعرض جميع الكورسات.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="font-semibold"
              onClick={() => {
                setSearchQuery("");
                setSelectedLevel("ALL");
                setSelectedCategory("ALL");
              }}
            >
              إعادة ضبط الفلاتر
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
