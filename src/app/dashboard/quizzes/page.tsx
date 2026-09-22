"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpCircle, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

interface AttemptItem {
  id: string;
  quizId: string;
  score: number | null;
  passed: boolean;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  quiz?: {
    id: string;
    title: string;
    passingScore: number;
    courseId?: string;
  };
}

export default function StudentQuizzesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuizAttempts() {
      try {
        const res = await fetch("/api/admin/results");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.attempts) {
            setAttempts(data.data.attempts);
          }
        }
      } catch (err) {
        console.error("Failed to load quiz attempts:", err);
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      loadQuizAttempts();
    }
  }, [isAuthenticated]);

  if (isLoading || loading) {
    return (
      <div className="container mx-auto max-w-5xl py-10 px-4 space-y-4 animate-pulse" dir="rtl">
        <div className="h-8 w-1/4 bg-slate-200 rounded" />
        <div className="h-32 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="container mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#0B2D5B]">سجل الاختبارات والنتائج</h1>
            <p className="text-xs text-slate-500 mt-1">
              تابع نتائج اختباراتك التقييمية ونسب النجاح المحققة في كل محاولة.
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="text-xs font-bold">
              العودة للوحة دراستي
            </Button>
          </Link>
        </div>

        {attempts.length === 0 ? (
          <Card className="bg-white border-slate-200 p-8 text-center space-y-3">
            <HelpCircle className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">لم تقم بأداء أي اختبارات بعد</h3>
            <p className="text-xs text-slate-500">
              ادخل إلى محاضرات الكورسات المسجل بها لأداء الاختبارات التقييمية.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {attempts.map((att) => (
              <Card key={att.id} className="bg-white border-slate-200/90 shadow-sm overflow-hidden">
                <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className={att.passed ? "p-2.5 rounded-xl bg-emerald-100 text-emerald-600" : "p-2.5 rounded-xl bg-red-100 text-red-600"}>
                      {att.passed ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{att.quiz?.title || "اختبار تقييمي"}</h3>
                      <p className="text-[11px] text-slate-500">
                        التاريخ: {new Date(att.startedAt).toLocaleDateString("ar-EG")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <span className="text-lg font-black font-mono text-[#0B2D5B]">
                        {att.score ?? 0}%
                      </span>
                      <Badge variant={att.passed ? "success" : "destructive"} className="text-[10px] font-bold block mt-0.5">
                        {att.passed ? "ناجح" : "غير مجتاز"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
