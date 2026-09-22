"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileCheck,
  PlusCircle,
  Search,
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
    id: string;
    title: string;
  };
  submissionsCount?: number;
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
  task?: {
    title: string;
    maxScore: number;
  };
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Create task modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [taskCourseId, setTaskCourseId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskMaxScore, setTaskMaxScore] = useState(100);
  const [taskPassingScore, setTaskPassingScore] = useState(60);
  const [taskDeadline, setTaskDeadline] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Grade modal
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<SubmissionItem | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(100);
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [isGrading, setIsGrading] = useState(false);

  const loadInitialData = async () => {
    try {
      const [tasksRes, coursesRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/courses"),
      ]);

      if (tasksRes.ok) {
        const tData = await tasksRes.json();
        if (tData.success && tData.data?.tasks) {
          setTasks(tData.data.tasks);
        }
      }

      if (coursesRes.ok) {
        const cData = await coursesRes.json();
        if (cData.success && cData.data?.courses) {
          setCourses(cData.data.courses);
          if (cData.data.courses.length > 0 && !taskCourseId) {
            setTaskCourseId(cData.data.courses[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load tasks data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadSubmissionsForTask = async (task: TaskItem) => {
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskCourseId || !taskTitle.trim() || !taskDesc.trim()) {
      setCreateError("يرجى ملء جميع الحقول المطلوبة.");
      return;
    }

    setIsCreatingTask(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: taskCourseId,
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          maxScore: Number(taskMaxScore) || 100,
          passingScore: Number(taskPassingScore) || 60,
          deadline: taskDeadline ? new Date(taskDeadline).toISOString() : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setCreateError(json.error?.message || "فشل في إنشاء التكليف.");
        return;
      }

      setCreateModalOpen(false);
      setTaskTitle("");
      setTaskDesc("");
      setTaskDeadline("");
      await loadInitialData();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "حدث خطأ.");
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleOpenGradeModal = (sub: SubmissionItem) => {
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
        if (selectedTask) {
          await loadSubmissionsForTask(selectedTask);
        }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-[#2563EB]" />
            <span>إدارة التكليفات والواجبات وتصحيح المهام</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            إنشاء الواجبات والمشاريع التطبيقية، مراجعة ملفات وأكواد الطلاب، وإرسال التقييمات.
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold h-9 flex items-center gap-1.5 shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>إنشاء تكليف جديد</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tasks List */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <span>قائمة التكليفات ({tasks.length})</span>
          </h2>

          {isLoading ? (
            <p className="text-xs text-slate-400 animate-pulse">جاري تحميل التكليفات...</p>
          ) : tasks.length === 0 ? (
            <Card className="p-6 text-center bg-white border-slate-200">
              <p className="text-xs text-slate-500">لا توجد تكليفات منشأة حالياً.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const isSelected = selectedTask?.id === task.id;
                return (
                  <div
                    key={task.id}
                    onClick={() => loadSubmissionsForTask(task)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/80 border-[#2563EB] shadow-sm"
                        : "bg-white border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{task.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {task.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {task.passingScore}/{task.maxScore} درجة
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <span>{task.course?.title || "كورس عام"}</span>
                      {task.deadline && (
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(task.deadline).toLocaleDateString("ar-EG")}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 2 Columns: Submissions & Grading Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-600" />
              <span>
                {selectedTask
                  ? `تسليمات الطلاب: ${selectedTask.title}`
                  : "اختر تكليفاً لعرض تسليمات الطلاب وتصحيحها"}
              </span>
            </h2>
          </div>

          {!selectedTask ? (
            <Card className="p-12 text-center bg-white border-slate-200">
              <FileCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">لم يتم تحديد تكليف</p>
              <p className="text-xs text-slate-400 mt-1">
                اضغط على أحد التكليفات في القائمة الجانبية لمعاينة إجابات وملفات الطلاب وتصحيحها.
              </p>
            </Card>
          ) : isLoadingSubmissions ? (
            <p className="text-xs text-slate-400 animate-pulse">جاري تحميل التسليمات...</p>
          ) : submissions.length === 0 ? (
            <Card className="p-8 text-center bg-white border-slate-200">
              <p className="text-xs text-slate-500">لم يقم أي طالب بتسليم هذا التكليف بعد.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <Card key={sub.id} className="bg-white border-slate-200 p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 text-sm">
                          {sub.student?.fullName || "طالب"}
                        </p>
                        <Badge
                          variant={sub.status === "GRADED" ? "success" : "warning"}
                          className="text-[10px]"
                        >
                          {sub.status === "GRADED" ? "تم التصحيح" : "قيد المراجعة"}
                        </Badge>
                      </div>
                      <p className="text-xs font-mono text-slate-400">{sub.student?.email}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        تاريخ التسليم: {new Date(sub.submittedAt).toLocaleString("ar-EG")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {sub.score !== null && sub.score !== undefined && (
                        <div className="text-left pl-3 border-l border-slate-200">
                          <p className="text-[10px] text-slate-400">الدرجة</p>
                          <p className="text-lg font-black text-emerald-600">
                            {sub.score} / {selectedTask.maxScore}
                          </p>
                        </div>
                      )}

                      <Button
                        size="sm"
                        onClick={() => handleOpenGradeModal(sub)}
                        className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold h-8"
                      >
                        {sub.status === "GRADED" ? "تعديل التقييم" : "تصحيح ورصد الدرجة"}
                      </Button>
                    </div>
                  </div>

                  {/* Submission Content / Links */}
                  {(sub.content || sub.fileUrl) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50 p-3 rounded-lg text-xs space-y-1.5">
                      {sub.content && (
                        <p className="text-slate-700 whitespace-pre-wrap font-mono text-[11px]">
                          {sub.content}
                        </p>
                      )}
                      {sub.fileUrl && (
                        <a
                          href={sub.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-600 font-bold hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>معاينة / تنزيل ملف الإجابة المرفق</span>
                        </a>
                      )}
                    </div>
                  )}

                  {sub.feedback && (
                    <div className="mt-2 text-xs bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-200 flex items-start gap-2">
                      <MessageSquare className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-bold">ملاحظات المدرب: </span>
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

      {/* Create Task Dialog */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogHeader>
          <DialogTitle>إنشاء تكليف / واجب تدريبي</DialogTitle>
          <DialogDescription>
            حدد تفاصيل التكليف، الدرجة العظمى، ومعايير النجاح والمهلة المحددة.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateTask} className="space-y-4 py-2 text-right">
          {createError && (
            <Alert variant="destructive">
              <AlertDescription>{createError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">الكورس المرتبط *</label>
            <select
              value={taskCourseId}
              onChange={(e) => setTaskCourseId(e.target.value)}
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

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">عنوان التكليف *</label>
            <Input
              placeholder="مثال: تحليل بيانات المبيعات وبناء لوحة تحكم PowerBI"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">وصف ومتطلبات التكليف *</label>
            <Textarea
              rows={4}
              placeholder="اكتب تعليمات المشروع، الروابط المساعدة، وصيغة الملفات المطلوبة..."
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">الدرجة العظمى (Max)</label>
              <Input
                type="number"
                value={taskMaxScore}
                onChange={(e) => setTaskMaxScore(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">درجة الاجتياز (Passing)</label>
              <Input
                type="number"
                value={taskPassingScore}
                onChange={(e) => setTaskPassingScore(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">الموعد النهائي للتسليم (اختياري)</label>
            <Input
              type="datetime-local"
              value={taskDeadline}
              onChange={(e) => setTaskDeadline(e.target.value)}
              className="text-xs"
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
              disabled={isCreatingTask}
              className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold"
            >
              {isCreatingTask ? "جاري الإنشاء..." : "إنشاء التكليف"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Grade Submission Dialog */}
      <Dialog open={gradeModalOpen} onOpenChange={setGradeModalOpen}>
        <DialogHeader>
          <DialogTitle>تصحيح التكليف ورصد الدرجة</DialogTitle>
          <DialogDescription>
            طالب: {activeSubmission?.student?.fullName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSaveGrade} className="space-y-4 py-2 text-right">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              الدرجة المستحقة (من {selectedTask?.maxScore || 100}) *
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
            <label className="text-xs font-bold text-slate-700">الملاحظات والتوجيهات للطالب</label>
            <Textarea
              rows={3}
              placeholder="اكتب تعليقك على أداء الطالب ونقاط القوة والتحسين..."
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
              {isGrading ? "جاري الحفظ..." : "اعتماد الدرجة"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
