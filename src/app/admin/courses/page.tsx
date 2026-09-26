"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  BookOpen,
  DollarSign,
  Layers,
  Sparkles,
  Eye,
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
  isFree?: boolean;
  durationSeconds: number;
  instructor?: {
    fullName: string;
  };
  coInstructors?: { instructor: { fullName: string } }[];
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Create course modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newShortDesc, setNewShortDesc] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newLevel, setNewLevel] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS">("BEGINNER");
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newCurrency, setNewCurrency] = useState("EGP");
  const [newIsFree, setNewIsFree] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadCourses = async () => {
    try {
      const res = await fetch("/api/courses");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.courses) {
          setCourses(json.data.courses);
        }
      }
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      setCreateError("عنوان الكورس والوصف مطلوبان.");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          slug: newSlug.trim() || undefined,
          shortDescription: newShortDesc.trim() || undefined,
          description: newDesc.trim(),
          level: newLevel,
          price: newIsFree ? 0 : Number(newPrice) || 0,
          currency: newCurrency,
          isFree: newIsFree,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setCreateError(json.error?.message || "فشل في إنشاء الكورس.");
        return;
      }

      setCreateModalOpen(false);
      setNewTitle("");
      setNewSlug("");
      setNewShortDesc("");
      setNewDesc("");
      setNewPrice(0);
      setNewIsFree(false);
      await loadCourses();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "حدث خطأ أثناء إنشاء الكورس.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleTogglePublish = async (courseId: string, currentStatus: string) => {
    const isPublished = currentStatus === "PUBLISHED";
    try {
      const res = await fetch(`/api/courses/${courseId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: !isPublished }),
      });
      if (res.ok) {
        await loadCourses();
      }
    } catch (err) {
      console.error("Failed to toggle publish status:", err);
    }
  };

  const handleDeleteCourse = async (courseId: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف كورس "${title}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadCourses();
      }
    } catch (err) {
      console.error("Failed to delete course:", err);
    }
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-[#2563EB]" />
            <span>إدارة الكورسات والمناهج التعليمية</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            إنشاء البرامج التدريبية، تنظيم الوحدات والدروس، تحديد الأسعار والاشتراكات.
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold h-9 flex items-center gap-1.5 shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>إضافة كورس جديد</span>
        </Button>
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

      {/* Course List Table */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-4">الكورس والرابط</th>
                <th className="p-4">المستوى</th>
                <th className="p-4">السعر</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">المدرب</th>
                <th className="p-4 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 animate-pulse font-medium">
                    جاري تحميل الكورسات...
                  </td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    لا توجد كورسات مطابقة. اضغط على &ldquo;إضافة كورس جديد&rdquo; للبدء.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{course.title}</p>
                      <p className="text-[11px] font-mono text-slate-400 dir-ltr text-right">{course.slug}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {course.level === "BEGINNER"
                          ? "مبتدئ"
                          : course.level === "INTERMEDIATE"
                          ? "متوسط"
                          : course.level === "ADVANCED"
                          ? "متقدم"
                          : "جميع المستويات"}
                      </Badge>
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {course.isFree || !course.price ? (
                        <span className="text-emerald-600">مجاني</span>
                      ) : (
                        <span>{course.price} {course.currency || "EGP"}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={course.status === "PUBLISHED" ? "success" : "warning"}
                        className="text-[10px] font-bold"
                      >
                        {course.status === "PUBLISHED" ? "منشور" : "مسودة"}
                      </Badge>
                    </td>
                    <td className="p-4 text-slate-600">
                      {[course.instructor?.fullName, ...(course.coInstructors ?? []).map(({ instructor }) => instructor.fullName)]
                        .filter(Boolean)
                        .join("، ") || "فريق كيميكس"}
                    </td>
                    <td className="p-4 text-left">
                      <div className="flex items-center justify-end gap-2">
                        {/* Preview Public Page */}
                        <Link href={`/courses/${course.id}`} target="_blank">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-slate-500 hover:text-slate-900"
                            title="معاينة الصفحة العامة"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>

                        {/* Publish / Unpublish Toggle */}
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(course.id, course.status)}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                            course.status === "PUBLISHED"
                              ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {course.status === "PUBLISHED" ? "إلغاء النشر" : "نشر الكورس"}
                        </button>

                        {/* Edit Curriculum */}
                        <Link href={`/admin/courses/${course.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-xs font-semibold flex items-center gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-3 w-3 ml-1" />
                            <span>المنهج والدروس</span>
                          </Button>
                        </Link>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(course.id, course.title)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="حذف الكورس"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Course Dialog */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogHeader>
          <DialogTitle>إضافة كورس تدريبي جديد</DialogTitle>
          <DialogDescription>
            أدخل البيانات الأساسية للكورس لإنشاء المنهج وتحديد محتواه التدريبي.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateCourse} className="space-y-4 py-2 text-right">
          {createError && (
            <Alert variant="destructive">
              <AlertDescription>{createError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">عنوان الكورس *</label>
            <Input
              type="text"
              placeholder="مثال: تحليل البيانات المتقدم باستخدام Python و SQL"
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (!newSlug) {
                  setNewSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9\u0621-\u064A]+/g, "-")
                      .replace(/^-|-$/g, "")
                  );
                }
              }}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">رابط الكورس (Slug)</label>
            <Input
              type="text"
              placeholder="python-data-analysis"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              className="font-mono text-xs dir-ltr text-left"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">المستوى المستهدف</label>
              <select
                value={newLevel}
                onChange={(e) => setNewLevel(e.target.value as CourseItem["level"])}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BEGINNER">مبتدئ (Beginner)</option>
                <option value="INTERMEDIATE">متوسط (Intermediate)</option>
                <option value="ADVANCED">متقدم (Advanced)</option>
                <option value="ALL_LEVELS">جميع المستويات (All Levels)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">العملة</label>
              <select
                value={newCurrency}
                onChange={(e) => setNewCurrency(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EGP">جنيه مصري (EGP)</option>
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="USD">دولار أمريكي (USD)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">سعر الاشتراك</label>
              <Input
                type="number"
                min={0}
                placeholder="مثال: 500"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                disabled={newIsFree}
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="isFreeCheckbox"
                checked={newIsFree}
                onChange={(e) => setNewIsFree(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <label htmlFor="isFreeCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                كورس مجاني بالكامل
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">نبذة مختصرة</label>
            <Input
              type="text"
              placeholder="وصف سريع يظهر في بطاقة الكورس..."
              value={newShortDesc}
              onChange={(e) => setNewShortDesc(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">الوصف التفصيلي *</label>
            <Textarea
              rows={4}
              placeholder="نظرة شاملة عن محتويات الكورس، المهارات المكتسبة، والمشاريع العملية..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold"
            >
              {isCreating ? "جاري الإنشاء..." : "إنشاء الكورس"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
