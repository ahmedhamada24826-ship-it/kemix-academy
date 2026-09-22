"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  FileCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  Award,
  BookOpen,
} from "lucide-react";

interface TaskItem {
  id: string;
  courseId: string;
  title: string;
  description: string;
  maxScore: number;
  passingScore: number;
  deadline?: string | null;
  course?: {
    title: string;
  };
}

interface SubmissionItem {
  id: string;
  taskId: string;
  studentId: string;
  content?: string | null;
  fileUrl?: string | null;
  status: "SUBMITTED" | "GRADED" | "RETURNED" | "RESUBMITTED";
  score?: number | null;
  feedback?: string | null;
  submittedAt: string;
  student?: {
    fullName: string;
    email: string;
  };
}

export default function InstructorTasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Grade modal
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<SubmissionItem | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(100);
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [isGrading, setIsGrading] = useState(false);

  useEffect(() => {
    async function loadTasks() {
      try {
        const res = await fetch("/api/tasks");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.tasks) {
            setTasks(data.data.tasks);
          }
        }
      } catch (err) {
        console.error("Failed to load tasks:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTasks();
  }, []);

  const loadSubmissions = async (task: TaskItem) => {
    setSelectedTask(task);
    setIsLoadingSubmissions(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/submissions`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.submissions) {
          setSubmissions(data.data.submissions);
        }
      }
    } catch (err) {
      console.error("Failed to load submissions:", err);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const handleOpenGrade = (sub: SubmissionItem) => {
    setActiveSubmission(sub);
    setGradeScore(sub.score !== null && sub.score !== undefined ? sub.score : 100);
    setGradeFeedback(sub.feedback || "");
    setGradeModalOpen(true);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;

    setIsGrading(true);
    try {
      const res = await fetch(`/api/tasks/submissions/${activeSubmission.id}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: Number(gradeScore),
          feedback: gradeFeedback.trim() || undefined,
        }),
      });

      if (res.ok) {
        setGradeModalOpen(false);
        if (selectedTask) await loadSubmissions(selectedTask);
      }
    } catch (err) {
      console.error("Failed to grade submission:", err);
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <FileCheck className="h-6 w-6 text-[#2563EB]" />
          <span>مراجعة وتصحيح التكليفات والواجبات</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          استعراض تسليمات الطلاب، تقييم الأكواد والمشاريع، وإرسال الملاحظات التوجيهية.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks list */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <span>التكليفات ({tasks.length})</span>
          </h2>

          {isLoading ? (
            <p className="text-xs text-slate-400 animate-pulse">جاري التحميل...</p>
          ) : (
            tasks.map((task) => {
              const isSelected = selectedTask?.id === task.id;
              return (
                <div
                  key={task.id}
                  onClick={() => loadSubmissions(task)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-blue-50/80 border-[#2563EB] shadow-sm"
                      : "bg-white border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <p className="font-bold text-slate-900 text-sm">{task.title}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{task.description}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                    <span>{task.course?.title}</span>
                    <span className="font-bold text-slate-700">{task.passingScore}/{task.maxScore} درجة</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Submissions Panel */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="h-4 w-4 text-emerald-600" />
            <span>
              {selectedTask ? `تسليمات: ${selectedTask.title}` : "اختر تكليفاً لعرض تسليمات الطلاب"}
            </span>
          </h2>

          {!selectedTask ? (
            <Card className="p-12 text-center bg-white border-slate-200">
              <FileCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">لم يتم اختيار تكليف</p>
              <p className="text-xs text-slate-400 mt-1">انقر على أحد التكليفات في القائمة الجانبية لبدء التصحيح.</p>
            </Card>
          ) : isLoadingSubmissions ? (
            <p className="text-xs text-slate-400 animate-pulse">جاري تحميل التسليمات...</p>
          ) : submissions.length === 0 ? (
            <Card className="p-8 text-center bg-white border-slate-200">
              <p className="text-xs text-slate-500">لا توجد تسليمات لهذا التكليف حتى الآن.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <Card key={sub.id} className="bg-white border-slate-200 p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 text-sm">{sub.student?.fullName}</p>
                        <Badge
                          variant={sub.status === "GRADED" ? "success" : "warning"}
                          className="text-[10px]"
                        >
                          {sub.status === "GRADED" ? "تم التقييم" : "قيد المراجعة"}
                        </Badge>
                      </div>
                      <p className="text-xs font-mono text-slate-400">{sub.student?.email}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {sub.score !== null && sub.score !== undefined && (
                        <div className="text-left pl-3 border-l border-slate-200">
                          <p className="text-lg font-black text-emerald-600">
                            {sub.score} / {selectedTask.maxScore}
                          </p>
                        </div>
                      )}

                      <Button
                        size="sm"
                        onClick={() => handleOpenGrade(sub)}
                        className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold h-8"
                      >
                        {sub.status === "GRADED" ? "تعديل الدرجة" : "تصحيح الواجب"}
                      </Button>
                    </div>
                  </div>

                  {(sub.content || sub.fileUrl) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                      {sub.content && <p className="text-slate-700 whitespace-pre-wrap font-mono">{sub.content}</p>}
                      {sub.fileUrl && (
                        <a
                          href={sub.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-600 font-bold hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>فتح الملف المرفق</span>
                        </a>
                      )}
                    </div>
                  )}

                  {sub.feedback && (
                    <div className="mt-2 text-xs bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-200 flex items-start gap-2">
                      <MessageSquare className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-bold">ملاحظاتك: </span>
                        <span>{sub.feedback}</span>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grade Modal */}
      <Dialog open={gradeModalOpen} onOpenChange={setGradeModalOpen}>
        <DialogHeader>
          <DialogTitle>تقييم تسليم الطالب</DialogTitle>
          <DialogDescription>
            الطالب: {activeSubmission?.student?.fullName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSaveGrade} className="space-y-4 py-2 text-right">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              الدرجة (من {selectedTask?.maxScore || 100}) *
            </label>
            <Input
              type="number"
              min={0}
              max={selectedTask?.maxScore || 100}
              value={gradeScore}
              onChange={(e) => setGradeScore(Number(e.target.value))}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">ملاحظات وتوجيهات للمعلم</label>
            <Textarea
              rows={3}
              placeholder="اكتب التقييم والنصائح التطويرية للطالب..."
              value={gradeFeedback}
              onChange={(e) => setGradeFeedback(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setGradeModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isGrading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isGrading ? "جاري الحفظ..." : "حفظ الدرجة"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
