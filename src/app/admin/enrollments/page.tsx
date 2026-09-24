"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  UserCheck,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  BookOpen,
  User,
  Trash2,
} from "lucide-react";

interface EnrollmentItem {
  id: string;
  studentId: string;
  courseId: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  enrolledAt: string;
  completedAt?: string | null;
  student: {
    id: string;
    fullName: string;
    email: string;
  };
  course: {
    id: string;
    title: string;
  };
  progressPercentage?: number;
}

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [students, setStudents] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Enroll modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [enrollRes, studRes, courseRes] = await Promise.all([
        fetch("/api/enrollments"),
        fetch("/api/admin/students"),
        fetch("/api/courses"),
      ]);

      if (!enrollRes.ok) {
        const eJson = await enrollRes.json().catch(() => null);
        const message = eJson?.error?.message || "تعذر تحميل التسجيلات";
        setErrorMessage(message === "Authentication required" ? "يجب تسجيل الدخول كمدير أو مدرس لرؤية بيانات التسجيلات." : message);
      } else {
        const eJson = await enrollRes.json();
        if (eJson.success && eJson.data?.enrollments) {
          setEnrollments(eJson.data.enrollments);
          setErrorMessage(null);
        }
      }

      if (studRes.ok) {
        const sJson = await studRes.json();
        if (sJson.success && sJson.data?.students) {
          setStudents(sJson.data.students);
          if (sJson.data.students.length > 0) setSelectedStudentId(sJson.data.students[0].id);
        }
      }

      if (courseRes.ok) {
        const cJson = await courseRes.json();
        if (cJson.success && cJson.data?.courses) {
          setCourses(cJson.data.courses);
          if (cJson.data.courses.length > 0) setSelectedCourseId(cJson.data.courses[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load enrollments:", err);
      setErrorMessage("تعذرت قراءة بيانات التسجيلات. حاول تسجيل الدخول مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedCourseId) return;

    setIsEnrolling(true);
    setEnrollError(null);

    try {
      const res = await fetch(`/api/courses/${selectedCourseId}/enrollment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudentId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setEnrollError(json.error?.message || "فشل في تسجيل الطالب.");
        return;
      }

      setModalOpen(false);
      await loadData();
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : "حدث خطأ.");
    } finally {
      setIsEnrolling(false);
    }
  };

  const filtered = enrollments.filter(
    (e) =>
      e.student?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.student?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.course?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-[#2563EB]" />
            <span>إدارة تسجيلات الطلاب في الكورسات</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            تسجيل الطلاب يدوياً، متابعة الاشتراكات النشطة، وحالة إتمام الكورسات.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold h-9 flex items-center gap-1.5 shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>تسجيل طالب يدوي</span>
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <Input
          type="text"
          placeholder="ابحث باسم الطالب، البريد، أو عنوان الكورس..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 p-0 text-sm h-8"
        />
      </div>

      {/* Enrollments Table */}
      {errorMessage ? (
        <Card className="bg-amber-50 border-amber-200 text-amber-800 p-4 text-sm font-medium">
          {errorMessage}
        </Card>
      ) : (
        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-4">الطالب</th>
                  <th className="p-4">الكورس المسجل</th>
                  <th className="p-4">حالة التسجيل</th>
                  <th className="p-4">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 animate-pulse font-medium">
                      جاري تحميل سجل التسجيلات...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      لا توجد تسجيلات مسجلة.
                    </td>
                  </tr>
                ) : (
                  filtered.map((enr) => (
                    <tr key={enr.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{enr.student?.fullName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{enr.student?.email}</p>
                      </td>

                      <td className="p-4 font-bold text-slate-800">
                        {enr.course?.title}
                      </td>

                      <td className="p-4">
                        <Badge
                          variant={enr.status === "COMPLETED" ? "success" : "default"}
                          className="text-[10px] font-bold"
                        >
                          {enr.status === "COMPLETED" ? "مكتمل" : "نشط"}
                        </Badge>
                      </td>

                      <td className="p-4 text-slate-500 text-xs font-mono">
                        {new Date(enr.enrolledAt).toLocaleDateString("ar-EG")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Manual Enrollment Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogHeader>
          <DialogTitle>تسجيل طالب في كورس يدوياً</DialogTitle>
          <DialogDescription>
            اختر الطالب والكورس لتفعيل الوصول المباشر فوراً.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleEnrollStudent} className="space-y-4 py-2 text-right">
          {enrollError && (
            <Alert variant="destructive">
              <AlertDescription>{enrollError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">اختر الطالب *</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
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
            <label className="text-xs font-bold text-slate-700">اختر الكورس *</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isEnrolling}
              className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold"
            >
              {isEnrolling ? "جاري التسجيل..." : "تسجيل الطالب"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
