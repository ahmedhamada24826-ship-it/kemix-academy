"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck, Clock, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

interface TaskItem {
  id: string;
  title: string;
  description: string;
  deadline?: string | null;
  lessonId: string;
  courseId: string;
  courseTitle?: string;
  userSubmission?: {
    id: string;
    status: string;
    score?: number | null;
    feedback?: string | null;
    submittedAt: string;
  } | null;
}

export default function StudentTasksPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      try {
        const enrollRes = await fetch("/api/enrollments");
        if (enrollRes.ok) {
          const enrollData = await enrollRes.json();
          if (enrollData.success && enrollData.data?.enrollments) {
            const enrollments = enrollData.data.enrollments;
            const allTasks: TaskItem[] = [];

            for (const enr of enrollments) {
              const secRes = await fetch(`/api/courses/${enr.courseId}/sections`);
              if (secRes.ok) {
                const secData = await secRes.json();
                if (secData.success && secData.data?.sections) {
                  for (const sec of secData.data.sections) {
                    for (const les of sec.lessons || []) {
                      const tRes = await fetch(`/api/tasks?lessonId=${les.id}`);
                      if (tRes.ok) {
                        const tData = await tRes.json();
                        if (tData.success && tData.data?.tasks) {
                          for (const t of tData.data.tasks) {
                            allTasks.push({
                              ...t,
                              courseTitle: enr.course.title,
                            });
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            setTasks(allTasks);
          }
        }
      } catch (err) {
        console.error("Failed to load tasks:", err);
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      loadTasks();
    }
  }, [isAuthenticated]);

  if (isLoading || loading) {
    return (
      <div className="container mx-auto max-w-5xl py-10 px-4 space-y-4 animate-pulse" dir="rtl">
        <div className="h-8 w-1/4 bg-slate-200 rounded" />
        <div className="h-32 bg-slate-200 rounded-xl" />
        <div className="h-32 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="container mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#0B2D5B]">التكليفات والواجبات التطبيقية</h1>
            <p className="text-xs text-slate-500 mt-1">
              استعرض كافة التكليفات المطلوبة في مساراتك التعليمية وتابع نتائج التقييم والتصحيح.
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="text-xs font-bold">
              العودة للوحة دراستي
            </Button>
          </Link>
        </div>

        {tasks.length === 0 ? (
          <Card className="bg-white border-slate-200 p-8 text-center space-y-3">
            <FileCheck className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">لا توجد تكليفات مطلوبة حاليًا</h3>
            <p className="text-xs text-slate-500">
              عندما يضيف المدرب تكليفات في الكورسات المسجل بها ستظهر هنا فورًا.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const isSubmitted = !!task.userSubmission;
              const isReviewed = task.userSubmission?.status === "REVIEWED";

              return (
                <Card key={task.id} className="bg-white border-slate-200/90 shadow-sm overflow-hidden">
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-2">
                        <Badge variant={isReviewed ? "success" : isSubmitted ? "navy" : "secondary"} className="text-[10px] font-bold">
                          {isReviewed ? "تم التصحيح" : isSubmitted ? "تم التسليم" : "غير مسلّم"}
                        </Badge>
                        {task.courseTitle && (
                          <span className="text-xs font-semibold text-[#2563EB]">
                            {task.courseTitle}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{task.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2">{task.description}</p>

                      {task.deadline && (
                        <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>الموعد النهائي: {new Date(task.deadline).toLocaleDateString("ar-EG")}</span>
                        </p>
                      )}

                      {task.userSubmission?.score !== null && task.userSubmission?.score !== undefined && (
                        <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md inline-block">
                          درجة التكليف: {task.userSubmission.score} / 100
                        </div>
                      )}
                    </div>

                    <Link href={`/learn/${task.courseId}?lesson=${task.lessonId}`}>
                      <Button className="bg-[#0B2D5B] hover:bg-[#2563EB] text-white text-xs font-bold h-9 w-full sm:w-auto">
                        {isSubmitted ? "عرض التسليم والملاحظات" : "تسليم التكليف الآن"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
