"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  HelpCircle,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
} from "lucide-react";

interface ResultItem {
  id: string;
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
  score: number;
  passed: boolean;
  attemptNumber: number;
  timeSpentSeconds: number;
  createdAt: string;
}

export default function InstructorQuizzesPage() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadResults() {
      try {
        const res = await fetch("/api/admin/results");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.results) {
            setResults(json.data.results);
            setErrorMessage(null);
          }
          return;
        }

        const json = await res.json().catch(() => null);
        const message = json?.error?.message || "تعذر تحميل النتائج";
        setErrorMessage(message === "Authentication required" ? "يجب تسجيل الدخول كمسؤول أو مدرس لرؤية النتائج." : message);
      } catch (err) {
        console.error("Failed to load results:", err);
        setErrorMessage("تعذرت قراءة نتائج الاختبارات. حاول تسجيل الدخول مرة أخرى.");
      } finally {
        setIsLoading(false);
      }
    }
    loadResults();
  }, []);

  const filtered = results.filter((r) =>
    r.student?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.quiz?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.quiz?.course?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-[#2563EB]" />
          <span>نتائج اختبارات الطلاب</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          متابعة درجات الاختبارات ومحاولات الطلاب في الكورسات التابعة لك.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <Input
          type="text"
          placeholder="ابحث باسم الطالب أو الاختبار..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 p-0 text-sm h-8"
        />
      </div>

      {/* Table */}
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
                  <th className="p-4">الاختبار والكورس</th>
                  <th className="p-4">المحاولة</th>
                  <th className="p-4">الدرجة</th>
                  <th className="p-4">النتيجة</th>
                  <th className="p-4">الوقت</th>
                  <th className="p-4">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 animate-pulse font-medium">
                      جاري تحميل النتائج...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      لا توجد محاولات اختبار مسجلة بعد.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{item.student?.fullName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{item.student?.email}</p>
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-slate-800">{item.quiz?.title}</p>
                        <p className="text-[11px] text-slate-400">{item.quiz?.course?.title}</p>
                      </td>

                      <td className="p-4">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          #{item.attemptNumber || 1}
                        </Badge>
                      </td>

                      <td className="p-4 font-black text-slate-900">
                        {item.score}%
                      </td>

                      <td className="p-4">
                        <Badge
                          variant={item.passed ? "success" : "destructive"}
                          className="text-[10px] font-bold"
                        >
                          {item.passed ? "ناجح" : "راسب"}
                        </Badge>
                      </td>

                      <td className="p-4 text-slate-600 font-mono text-xs">
                        {Math.floor((item.timeSpentSeconds || 0) / 60)} دقيقة
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
      )}
    </div>
  );
}
