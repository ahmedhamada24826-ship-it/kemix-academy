"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Users,
  Search,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

interface StudentItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  enrollmentsCount: number;
  averageProgress: number;
  createdAt: string;
}

export default function InstructorStudentsPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStudents() {
      try {
        const res = await fetch("/api/admin/students");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.students) {
            setStudents(json.data.students);
          }
        }
      } catch (err) {
        console.error("Failed to load students:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStudents();
  }, []);

  const filtered = students.filter((s) => {
    const fullName = s.fullName || "";
    const email = s.email || "";

    return (
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-[#2563EB]" />
          <span>الطلاب المسجلون في كورساتك</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          متابعة معدلات الإنجاز ومستوى التفاعل والتقدم الدراسي لكل طالب.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <Input
          type="text"
          placeholder="ابحث باسم الطالب أو البريد الإلكتروني..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 p-0 text-sm h-8"
        />
      </div>

      {/* Table */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-4">الطالب</th>
                <th className="p-4">البريد الإلكتروني</th>
                <th className="p-4">الكورسات</th>
                <th className="p-4">نسبة الإنجاز</th>
                <th className="p-4">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 animate-pulse font-medium">
                    جاري تحميل بيانات الطلاب...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    لا يوجد طلاب مطابقون لمعايير البحث.
                  </td>
                </tr>
              ) : (
                filtered.map((student) => {
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
