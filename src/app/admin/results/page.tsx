"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  BarChart3,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  HelpCircle,
  FileCheck,
  Download,
} from "lucide-react";

interface AttemptResult {
  id: string;
  quizId: string;
  studentId: string;
  score: number;
  passed: boolean;
  attemptNumber: number;
  timeSpentSeconds: number;
  createdAt: string;
  student: {
    fullName: string;
    email: string;
  };
  quiz: {
    title: string;
    passingScore: number;
    course: {
      title: string;
    };
  };
}

export default function AdminResultsPage() {
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      try {
        const res = await fetch("/api/admin/results");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.results) {
            setResults(json.data.results);
          }
        }
      } catch (err) {
        console.error("Failed to load results:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadResults();
  }, []);

  const filteredResults = results.filter((r) =>
    r.student?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.student?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.quiz?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.quiz?.course?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[#2563EB]" />
            <span>سجل النتائج ودفتر الدرجات المركزي</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            متابعة نتائج محاولات الاختبارات والدرجات المحققة من قبل جميع الطلاب.
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <Input
          type="text"
          placeholder="ابحث باسم الطالب، البريد، عنوان الاختبار، أو الكورس..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 p-0 text-sm h-8"
        />
      </div>

      {/* Results Table */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-4">الطالب</th>
                <th className="p-4">الكورس والاختبار</th>
                <th className="p-4">المحاولة</th>
                <th className="p-4">الدرجة</th>
                <th className="p-4">النتيجة</th>
                <th className="p-4">الوقت المستغرق</th>
                <th className="p-4">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 animate-pulse font-medium">
                    جاري تحميل سجل النتائج...
                  </td>
                </tr>
              ) : filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    لا توجد محاولات اختبار مسجلة بعد.
                  </td>
                </tr>
              ) : (
                filteredResults.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{item.student?.fullName || "طالب"}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{item.student?.email}</p>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-800">{item.quiz?.title}</p>
                      <p className="text-[11px] text-slate-400">{item.quiz?.course?.title}</p>
                    </td>

                    <td className="p-4">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        المحاولة #{item.attemptNumber || 1}
                      </Badge>
                    </td>

                    <td className="p-4 font-black text-slate-900 text-sm">
                      {item.score}%
                      <span className="text-[10px] text-slate-400 font-normal mr-1">
                        (الحد: {item.quiz?.passingScore}%)
                      </span>
                    </td>

                    <td className="p-4">
                      <Badge
                        variant={item.passed ? "success" : "destructive"}
                        className="text-[10px] font-bold"
                      >
                        {item.passed ? "اجتياز ناجح" : "لم يجتز"}
                      </Badge>
                    </td>

                    <td className="p-4 text-slate-600 font-mono text-xs">
                      {Math.floor((item.timeSpentSeconds || 0) / 60)} دقيقة{" "}
                      {(item.timeSpentSeconds || 0) % 60} ثانية
                    </td>

                    <td className="p-4 text-slate-500 text-xs font-mono">
                      {new Date(item.createdAt).toLocaleDateString("ar-EG")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
