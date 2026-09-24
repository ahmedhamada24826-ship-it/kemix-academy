"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Users,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  Mail,
  UserCheck,
} from "lucide-react";

interface StudentData {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: string;
  createdAt: string;
  enrollmentsCount: number;
  completedCoursesCount: number;
  averageProgress: number;
  enrollments?: {
    courseId: string;
    courseTitle: string;
    status: string;
    progressPercentage: number;
    enrolledAt: string;
  }[];
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [studentsRes, coursesRes] = await Promise.all([
        fetch("/api/admin/students"),
        fetch("/api/courses"),
      ]);

      if (studentsRes.ok) {
        const sData = await studentsRes.json();
        if (sData.success && sData.data?.students) {
          setStudents(sData.data.students);
        }
      }

      if (coursesRes.ok) {
        const cData = await coursesRes.json();
        if (cData.success && cData.data?.courses) {
          setCourses(cData.data.courses);
        }
      }
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCSV = () => {
    if (students.length === 0) return;

    const headers = ["الاسم الكامل", "البريد الإلكتروني", "الهاتف", "تاريخ التسجيل", "الكورسات المسجلة", "متوسط التقدم (%)"];
    const rows = students.map((s) => [
      `"${s.fullName}"`,
      `"${s.email}"`,
      `"${s.phone || "-"}"`,
      `"${new Date(s.createdAt).toLocaleDateString("ar-EG")}"`,
      s.enrollmentsCount,
      `${Math.round(s.averageProgress || 0)}%`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `طلاب_اكاديمية_كيميكس_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter((s) => {
    const fullName = s.fullName || "";
    const email = s.email || "";
    const phone = s.phone || "";

    const matchesSearch =
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCourseFilter !== "ALL") {
      return s.enrollments?.some((e) => e.courseId === selectedCourseFilter) ?? false;
    }

    return true;
  });

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-[#2563EB]" />
            <span>سجل وبيانات الطلاب</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            متابعة تقدم الطلاب التعليمي، التسجيلات، وتصدير التقارير الإحصائية.
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="text-xs font-semibold h-9 flex items-center gap-1.5 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          <Download className="h-4 w-4 text-blue-600 ml-1" />
          <span>تصدير إلى CSV / Excel</span>
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="sm:col-span-2 flex items-center gap-3">
          <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <Input
            type="text"
            placeholder="ابحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 p-0 text-sm h-8"
          />
        </div>

        <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-r border-slate-200 pt-2 sm:pt-0 sm:pr-3">
          <Filter className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">جميع الكورسات ({courses.length})</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-4">الطالب</th>
                <th className="p-4">البريد الإلكتروني</th>
                <th className="p-4">الكورسات المسجلة</th>
                <th className="p-4">متوسط الإنجاز</th>
                <th className="p-4">تاريخ الانضمام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 animate-pulse font-medium">
                    جاري تحميل سجلات الطلاب...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    لا يوجد طلاب مطابقون لمعايير البحث.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const fullName = student.fullName || "طالب غير مسجل";
                  const email = student.email || "";
                  const avatarLetter = fullName.charAt(0).toUpperCase();

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#0B2D5B] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {avatarLetter}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{fullName}</p>
                            {student.phone && (
                              <p className="text-[11px] text-slate-400 font-mono">{student.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-xs text-slate-600">
                        {email}
                      </td>

                      <td className="p-4">
                        <Badge variant="outline" className="text-xs font-semibold">
                          {student.enrollmentsCount} كورس
                        </Badge>
                      </td>

                      <td className="p-4">
                        <div className="w-32 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                            <span>{Math.round(student.averageProgress || 0)}%</span>
                            {student.averageProgress >= 100 && (
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            )}
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${Math.min(100, Math.round(student.averageProgress || 0))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-slate-500 text-xs font-mono">
                        {new Date(student.createdAt).toLocaleDateString("ar-EG")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
