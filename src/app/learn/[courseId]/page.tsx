"use client";

import React, { useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/brand/logo";
import { parseVideoSource } from "@/lib/video-helper";
import {
  Play,
  Pause,
  CheckCircle2,
  Circle,
  Download,
  FileSpreadsheet,
  FileCode2,
  FileText,
  FileArchive,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Award,
  ChevronDown,
  ChevronLeft,
  BookOpen,
  X,
  Lock,
  FileCheck,
  Clock,
  AlertTriangle,
  Upload,
  Send,
  ExternalLink,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileAsset {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  category: string;
  storageKey: string;
}

interface TaskSubmission {
  id: string;
  attemptNumber: number;
  status: "SUBMITTED" | "LATE" | "REVIEWED" | "REJECTED";
  fileUrl?: string | null;
  fileName?: string | null;
  textResponse?: string | null;
  score?: number | null;
  feedback?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
}

interface Task {
  id: string;
  courseId: string;
  lessonId: string;
  title: string;
  description: string;
  deadline?: string | null;
  maxFileSizeMb: number;
  allowedFileTypes: string;
  maxAttempts: number;
  isPublished: boolean;
  userSubmission?: TaskSubmission | null;
}

interface Lesson {
  id: string;
  sectionId: string;
  title: string;
  slug: string;
  description?: string | null;
  lessonType: "VIDEO" | "TEXT" | "FILE" | "QUIZ";
  videoSource: "UPLOAD" | "YOUTUBE" | "GOOGLE_DRIVE" | "ONEDRIVE" | "SHAREPOINT" | "EXTERNAL_URL";
  videoProvider?: string | null;
  videoUrl?: string | null;
  unlockRule: "IMMEDIATE" | "PREVIOUS_LESSON" | "TASK_SUBMISSION" | "QUIZ_PASS";
  content?: string | null;
  storageKey?: string | null;
  durationSeconds: number;
  isFreePreview: boolean;
  files?: FileAsset[];
  tasks?: Task[];
  quizzes?: Quiz[];
  isUnlocked?: boolean;
  lockReason?: string;
}

interface Section {
  id: string;
  title: string;
  sortOrder: number;
  lessons: Lesson[];
}

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  prompt: string;
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE";
  points: number;
  options: QuizOption[];
  explanation?: string | null;
}

interface Quiz {
  id: string;
  courseId: string;
  lessonId?: string | null;
  title: string;
  description?: string | null;
  passingScore: number;
  timeLimitMinutes?: number | null;
  maxAttempts: number;
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
  showResultImmediately: boolean;
  showCorrectAnswers: boolean;
  allowReview: boolean;
  questions: QuizQuestion[];
}

interface QuizAttemptResult {
  score: number;
  passed: boolean;
  status: string;
  timeSpentSeconds?: number;
  answers: {
    questionId: string;
    selectedOptionId?: string | null;
    isCorrect: boolean;
    pointsAwarded: number;
  }[];
}

interface ProgressData {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  lastAccessedLessonId?: string | null;
  lessonProgresses: {
    lessonId: string;
    completed: boolean;
    progressPercent: number;
    lastPositionSeconds: number;
  }[];
}

export default function CoursePlayerPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Course state
  const [courseTitle, setCourseTitle] = useState("");
  const [courseCertificatesEnabled, setCourseCertificatesEnabled] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [courseQuizzes, setCourseQuizzes] = useState<Quiz[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);

  // Active item state
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<string>("video");

  // Quiz state in active lesson
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [attemptExpiresAt, setAttemptExpiresAt] = useState<Date | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<QuizAttemptResult | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  // Attempt history summary per quiz: used attempts / best score / passed flag
  const [quizAttemptInfo, setQuizAttemptInfo] = useState<
    Record<string, { used: number; bestScore: number | null; passed: boolean }>
  >({});

  // Task submission state
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [taskTextResponse, setTaskTextResponse] = useState("");
  const [taskFileUrl, setTaskFileUrl] = useState("");
  const [taskFileName, setTaskFileName] = useState("");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [taskSuccessMsg, setTaskSuccessMsg] = useState<string | null>(null);

  // Certificate claim state
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [claimedCertCode, setClaimedCertCode] = useState<string | null>(null);
  const [isClaimingCert, setIsClaimingCert] = useState(false);

  // UI layout & drawer state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Initial Data Fetch
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push(`/login?returnUrl=/learn/${courseId}`);
      return;
    }

    async function loadPlayerData() {
      try {
        const [cRes, sRes, pRes, qRes] = await Promise.all([
          fetch(`/api/courses/${courseId}`),
          fetch(`/api/courses/${courseId}/sections`),
          fetch(`/api/courses/${courseId}/progress`),
          fetch(`/api/courses/${courseId}/quizzes`, { cache: "no-store" }),
        ]);

        if (cRes.ok) {
          const cData = await cRes.json();
          if (cData.success && cData.data?.course) {
            setCourseTitle(cData.data.course.title);
            setCourseCertificatesEnabled(cData.data.course.certificatesEnabled === true);
          }
        }

        if (qRes.ok) {
          const qData = await qRes.json();
          if (qData.success && Array.isArray(qData.data?.quizzes)) {
            const details = await Promise.all(
              qData.data.quizzes.map(async (quiz: Quiz) => {
                const detailRes = await fetch(`/api/quizzes/${quiz.id}`, { cache: "no-store" });
                if (!detailRes.ok) return quiz;
                const detailJson = await detailRes.json();
                return detailJson?.data?.quiz || quiz;
              })
            );
            setCourseQuizzes(details);
            await Promise.all(details.map((quiz) => loadQuizAttemptInfo(quiz.id)));
          }
        }

        let firstLessonId: string | null = null;
        let loadedSections: Section[] = [];

        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData.success && sData.data?.sections) {
            loadedSections = sData.data.sections;
            setSections(loadedSections);
            if (loadedSections.length > 0 && loadedSections[0].lessons?.length > 0) {
              firstLessonId = loadedSections[0].lessons[0].id;
              setExpandedSections({ [loadedSections[0].id]: true });
            }
          }
        }

        let resumeLessonId = firstLessonId;
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.success && pData.data?.progress) {
            setProgress(pData.data.progress);
            if (pData.data.progress.lastAccessedLessonId) {
              resumeLessonId = pData.data.progress.lastAccessedLessonId;
            }
          }
        }

        const targetLesson = searchParams.get("lesson") || resumeLessonId;
        if (targetLesson) {
          selectLesson(targetLesson);
        }
      } catch (err) {
        console.error("Failed to load player:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (isAuthenticated) {
      loadPlayerData();
    }
  }, [courseId, isAuthenticated, isAuthLoading, router, searchParams]);

  // 2. Load quiz attempt history summary (available attempts / best score)
  const loadQuizAttemptInfo = async (quizId: string) => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}/attempts`, { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      const attempts = json?.data?.attempts;
      if (!Array.isArray(attempts)) return;

      const finished = attempts.filter(
        (a: { status?: string }) => a.status === "SUBMITTED" || a.status === "EXPIRED"
      );
      const scores = finished
        .map((a: { score?: number | null }) => (typeof a.score === "number" ? a.score : 0))
        .filter((s: number) => Number.isFinite(s));

      setQuizAttemptInfo((prev) => ({
        ...prev,
        [quizId]: {
          used: finished.length,
          bestScore: scores.length ? Math.max(...scores) : null,
          passed: finished.some((a: { passed?: boolean }) => a.passed === true),
        },
      }));
    } catch {
      // Attempt summary is supplementary UI — never block the lesson on failure.
    }
  };

  // 3. Select Lesson
  const selectLesson = async (lessonId: string) => {
    setActiveLessonId(lessonId);
    setQuizResult(null);
    setQuizError(null);
    setTaskSuccessMsg(null);
    setSidebarOpen(false);

    try {
      const [res, tasksRes, progressRes] = await Promise.all([
        fetch(`/api/lessons/${lessonId}`),
        fetch(`/api/tasks?lessonId=${lessonId}`),
        fetch(`/api/lessons/${lessonId}/progress`),
      ]);

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.lesson) {
          const lessonData: Lesson = json.data.lesson;

          if (progressRes.ok) {
            const pJson = await progressRes.json();
            if (pJson.success && pJson.data?.unlockStatus) {
              lessonData.isUnlocked = pJson.data.unlockStatus.isUnlocked;
              lessonData.lockReason = pJson.data.unlockStatus.lockReason;
            }
          }

          if (tasksRes.ok) {
            const tJson = await tasksRes.json();
            if (tJson.success && tJson.data?.tasks) {
              lessonData.tasks = tJson.data.tasks;
              if (tJson.data.tasks.length > 0) {
                setActiveTask(tJson.data.tasks[0]);
              }
            }
          }

          const mergedQuizzes = [
            ...(lessonData.quizzes ?? []),
            ...courseQuizzes.filter((quiz) =>
              (quiz.lessonId === null || quiz.lessonId === lessonId) &&
              !(lessonData.quizzes ?? []).some((existing) => existing.id === quiz.id)
            ),
          ];

          lessonData.quizzes = mergedQuizzes;
          setActiveLesson(lessonData);
          if (mergedQuizzes.length > 0) {
            setActiveQuiz(mergedQuizzes[0]);
            loadQuizAttemptInfo(mergedQuizzes[0].id);
          } else {
            setActiveQuiz(null);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load lesson details:", err);
    }
  };

  // 3. Mark Lesson Completed
  const handleMarkComplete = async (completed = true) => {
    if (!activeLessonId || !activeLesson) return;

    if (completed) {
      const requiredTasks = activeLesson.tasks ?? [];
      const missingTask = requiredTasks.length > 0 && requiredTasks.some((task) => !task.userSubmission);

      const requiredQuizzes = activeLesson.quizzes ?? [];
      const missingQuiz =
        requiredQuizzes.length > 0 &&
        requiredQuizzes.some((quiz) => quizAttemptInfo[quiz.id]?.passed !== true);

      if (missingTask) {
        alert("يجب تسليم التكليف المطلوب قبل إكمال هذه المحاضرة.");
        return;
      }

      if (missingQuiz) {
        alert("يجب اجتياز الاختبار المطلوب قبل إكمال هذه المحاضرة.");
        return;
      }
    }

    try {
      const res = await fetch(`/api/lessons/${activeLessonId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed,
          progressPercent: completed ? 100 : 0,
        }),
      });

      if (res.ok) {
        const pRes = await fetch(`/api/courses/${courseId}/progress`);
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.success && pData.data?.progress) {
            setProgress(pData.data.progress);
            if (pData.data.progress.progressPercent === 100) {
              setCertificateModalOpen(true);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to update progress:", err);
    }
  };

  // 4. Start Quiz Attempt with Server Authoritative Timer
  const handleStartQuiz = async (quizId: string) => {
    setQuizAnswers({});
    setQuizResult(null);
    setQuizError(null);

    try {
      const res = await fetch(`/api/quizzes/${quizId}/attempts`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setQuizError(json.error?.message || "تعذر بدء محاولة الاختبار");
        return;
      }

      const attempt = json.data.attempt;
      setCurrentAttemptId(attempt.id);
      loadQuizAttemptInfo(quizId);

      if (attempt.expiresAt) {
        const exp = new Date(attempt.expiresAt);
        setAttemptExpiresAt(exp);
        const remaining = Math.max(0, Math.floor((exp.getTime() - Date.now()) / 1000));
        setTimeLeftSeconds(remaining);
      } else {
        setAttemptExpiresAt(null);
        setTimeLeftSeconds(null);
      }
    } catch (err: unknown) {
      setQuizError(err instanceof Error ? err.message : "خطأ في بدء الاختبار");
    }
  };

  // Server Timer Countdown Hook
  useEffect(() => {
    if (timeLeftSeconds === null || timeLeftSeconds <= 0 || !currentAttemptId) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Trigger automatic submit upon timer expiry
          handleAutoSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSeconds, currentAttemptId]);

  // 5. Submit Quiz Attempt
  const handleSubmitQuiz = async () => {
    if (!currentAttemptId || !activeQuiz) return;

    setIsSubmittingQuiz(true);
    setQuizError(null);

    try {
      const answers = Object.entries(quizAnswers).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      }));

      const res = await fetch(`/api/quizzes/attempts/${currentAttemptId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setQuizError(json.error?.message || "تعذر إرسال إجابات الاختبار");
        return;
      }

      setQuizResult(json.data.attempt);
      setCurrentAttemptId(null);
      setTimeLeftSeconds(null);

      if (activeQuiz) {
        loadQuizAttemptInfo(activeQuiz.id);
      }

      const pRes = await fetch(`/api/courses/${courseId}/progress`);
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData.success && pData.data?.progress) {
          setProgress(pData.data.progress);
          if (pData.data.progress.progressPercent === 100) {
            setCertificateModalOpen(true);
          }
        }
      }
    } catch (err: unknown) {
      setQuizError(err instanceof Error ? err.message : "خطأ أثناء تسليم الاختبار");
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleAutoSubmitQuiz = () => {
    if (!quizResult && currentAttemptId) {
      handleSubmitQuiz();
    }
  };

  // 6. Submit Task
  const handleSubmitTask = async (taskId: string) => {
    if (!taskTextResponse && !taskFileUrl) {
      alert("يرجى إدخال إجابة نصية أو إرفاق ملف");
      return;
    }

    setIsSubmittingTask(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textResponse: taskTextResponse,
          fileUrl: taskFileUrl,
          fileName: taskFileName || "task_submission",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error?.message || "فشل تسليم التكليف");
        return;
      }

      setTaskSuccessMsg("تم تسليم التكليف بنجاح! بانتظار مراجعة المدرب.");
      setTaskTextResponse("");
      setTaskFileUrl("");

      // Refresh task status
      if (activeLessonId) {
        const tRes = await fetch(`/api/tasks?lessonId=${activeLessonId}`);
        if (tRes.ok) {
          const tJson = await tRes.json();
          if (tJson.success && tJson.data?.tasks) {
            setActiveTask(tJson.data.tasks[0]);
          }
        }
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "حدث خطأ أثناء تسليم التكليف");
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // 7. Claim Certificate
  const handleClaimCertificate = async () => {
    const hasUnpassedCourseQuiz =
      courseQuizzes.length > 0 &&
      courseQuizzes.some((quiz) => quizAttemptInfo[quiz.id]?.passed !== true);

    if (hasUnpassedCourseQuiz) {
      alert("لا يمكنك استلام الشهادة إلا بعد اجتياز جميع الاختبارات المطلوبة في الكورس.");
      return;
    }

    setIsClaimingCert(true);
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data?.certificate) {
        setClaimedCertCode(json.data.certificate.certificateCode);
      } else if (!res.ok) {
        alert(json?.error?.message || "لا يمكنك استلام الشهادة حالياً.");
      }
    } catch (err) {
      console.error("Failed to claim certificate:", err);
      alert("فشل استلام الشهادة. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsClaimingCert(false);
    }
  };

  const allLessons = sections.flatMap((s) => s.lessons || []);
  const currentIndex = allLessons.findIndex((l) => l.id === activeLessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const isLessonCompleted = (id: string) => {
    return progress?.lessonProgresses?.some((lp) => lp.lessonId === id && lp.completed);
  };

  const videoInfo = activeLesson
    ? parseVideoSource(activeLesson.videoSource, activeLesson.videoUrl, activeLesson.storageKey)
    : null;

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#07162C] text-white" dir="rtl">
        <div className="space-y-3 text-center animate-pulse">
          <Logo variant="app-icon" size="md" className="mx-auto" />
          <p className="text-sm font-medium text-slate-300">جاري تحميل قاعة التعلم في KEMIX Academy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#0B1329] text-slate-100 overflow-hidden" dir="rtl">
      {/* Player Top Navigation Bar */}
      <div className="h-14 border-b border-slate-800 bg-[#07162C] px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            <span className="hidden sm:inline">العودة للوحة التحكم</span>
          </Link>
          <span className="text-slate-600">|</span>
          <span className="text-xs sm:text-sm font-bold text-white truncate max-w-md">
            {courseTitle}
          </span>
        </div>

        {/* Progress Pill & Sidebar Mobile Trigger */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-slate-400">إنجاز الكورس:</span>
            <span className="text-xs font-bold text-cyan-400">
              {progress?.progressPercent || 0}%
            </span>
            <div className="w-24">
              <Progress
                value={progress?.progressPercent || 0}
                className="h-1.5 bg-slate-800"
                indicatorClassName="bg-cyan-400"
              />
            </div>
          </div>

          {progress?.progressPercent === 100 &&
            courseCertificatesEnabled &&
            (courseQuizzes.length === 0 || courseQuizzes.every((quiz) => quizAttemptInfo[quiz.id]?.passed === true)) && (
              <Button
                size="sm"
                onClick={() => setCertificateModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold h-8 shadow-sm flex items-center gap-1.5"
              >
                <Award className="h-3.5 w-3.5" />
                <span>استلام الشهادة</span>
              </Button>
            )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            aria-label="قائمة المحاضرات"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Right Sidebar + Left Learning Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-[#0A1024]">
          {activeLesson ? (
            activeLesson.isUnlocked === false ? (
              /* Locked Lesson Screen */
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="max-w-md w-full p-8 rounded-2xl bg-[#07162C] border border-amber-500/40 text-center space-y-4 shadow-xl">
                  <div className="h-14 w-14 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                    <Lock className="h-7 w-7" />
                  </div>
                  <h2 className="text-xl font-bold text-white">المحاضرة مقفلة حاليًا 🔒</h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {activeLesson.lockReason || "يجب إنهاء المحاضرة السابقة واجتياز متطلباتها لفتح هذا المحتوى."}
                  </p>
                  {prevLesson && (
                    <Button
                      onClick={() => selectLesson(prevLesson.id)}
                      className="bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs"
                    >
                      الانتقال إلى المحاضرة السابقة
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              /* Active Lesson Workspace */
              <div className="flex-1 flex flex-col">
                {/* 1. Header Bar for Active Lesson */}
                <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#07162C] flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                      <span>{activeLesson.title}</span>
                      {activeLesson.isFreePreview && (
                        <Badge variant="cyan" className="text-[10px] py-0.5">معاينة مجانية</Badge>
                      )}
                    </h1>
                    <p className="text-xs text-slate-400">
                      المدة المقدرة: {Math.floor(activeLesson.durationSeconds / 60)} دقيقة
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Button
                      onClick={() => handleMarkComplete(!isLessonCompleted(activeLesson.id))}
                      className={cn(
                        "text-xs font-bold h-9 transition-all",
                        isLessonCompleted(activeLesson.id)
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      )}
                    >
                      <CheckCircle2 className="h-4 w-4 ml-1.5" />
                      <span>{isLessonCompleted(activeLesson.id) ? "تم الإكمال ✓" : "تحديد كمكتملة"}</span>
                    </Button>

                    {prevLesson && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectLesson(prevLesson.id)}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800 h-9 text-xs"
                      >
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        <span>السابقة</span>
                      </Button>
                    )}

                    {nextLesson && (
                      <Button
                        size="sm"
                        onClick={() => selectLesson(nextLesson.id)}
                        className="bg-[#2563EB] hover:bg-blue-500 text-white font-bold h-9 text-xs"
                      >
                        <span>التالية</span>
                        <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* 2. Main Tabs Component */}
                <div className="p-4 sm:p-6 flex-1 space-y-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-[#07162C] border border-slate-800 text-slate-400">
                      <TabsTrigger value="video" className="text-xs font-bold">
                        فيديو المحاضرة والشرح
                      </TabsTrigger>
                      <TabsTrigger value="files" className="text-xs font-bold">
                        الملفات والمرفقات ({activeLesson.files?.length || 0})
                      </TabsTrigger>
                      <TabsTrigger value="task" className="text-xs font-bold">
                        التكليف والواجب ({activeLesson.tasks?.length || 0})
                      </TabsTrigger>
                      <TabsTrigger value="quiz" className="text-xs font-bold">
                        الاختبار ({activeLesson.quizzes?.length || 0})
                      </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Video & Lecture Notes */}
                    <TabsContent value="video" className="pt-4 space-y-6">
                      <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
                        {videoInfo?.embedUrl ? (
                          <iframe
                            src={videoInfo.embedUrl}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={activeLesson.title}
                          />
                        ) : activeLesson.storageKey ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center space-y-3">
                            <div className="h-16 w-16 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-lg">
                              <Play className="h-8 w-8 mr-1" />
                            </div>
                            <p className="text-sm font-bold text-white">{activeLesson.title}</p>
                            <p className="text-xs text-slate-400">فيديو مسجل ومحمي عبر KEMIX Cloud Storage</p>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-400 text-sm">
                            لم يتم إرفاق فيديو لهذه المحاضرة
                          </div>
                        )}
                      </div>

                      {videoInfo?.warning && (
                        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                          <span>{videoInfo.warning}</span>
                        </div>
                      )}

                      {/* Description & Lesson Content */}
                      <div className="p-6 rounded-2xl bg-[#07162C] border border-slate-800 space-y-4">
                        <h3 className="text-base font-bold text-white">محتوى وملاحظات المحاضرة</h3>
                        <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                          {activeLesson.content || activeLesson.description || (
                            <p className="text-slate-500 italic">لا توجد ملاحظات إضافية لهذه المحاضرة.</p>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    {/* Tab 2: Files & Datasets */}
                    <TabsContent value="files" className="pt-4 space-y-4">
                      {activeLesson.files && activeLesson.files.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {activeLesson.files.map((file) => (
                            <div
                              key={file.id}
                              className="p-4 rounded-xl bg-[#07162C] border border-slate-800 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-2">
                                <div className="p-2.5 rounded-lg bg-blue-950/80 text-cyan-400 flex-shrink-0">
                                  {file.mimeType?.includes("pdf") ? (
                                    <FileText className="h-5 w-5" />
                                  ) : file.mimeType?.includes("csv") || file.mimeType?.includes("excel") || file.mimeType?.includes("spreadsheet") ? (
                                    <FileSpreadsheet className="h-5 w-5" />
                                  ) : file.mimeType?.includes("zip") ? (
                                    <FileArchive className="h-5 w-5" />
                                  ) : (
                                    <FileCode2 className="h-5 w-5" />
                                  )}
                                </div>
                                <div className="truncate">
                                  <p className="text-sm font-bold text-white truncate">{file.originalName}</p>
                                  <p className="text-[11px] text-slate-400 font-mono">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>

                              <a
                                href={`/api/files/${file.id}/access?redirect=1`}
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-500 text-xs font-bold text-white transition-colors flex-shrink-0 shadow-sm"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>تحميل</span>
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-[#07162C] rounded-2xl border border-slate-800 text-slate-400 text-xs">
                          لا توجد ملفات مرفقة بهذه المحاضرة.
                        </div>
                      )}
                    </TabsContent>

                    {/* Tab 3: Task & Assignment */}
                    <TabsContent value="task" className="pt-4 space-y-6">
                      {activeLesson.tasks && activeLesson.tasks.length > 0 ? (
                        activeLesson.tasks.map((task) => (
                          <div key={task.id} className="p-6 rounded-2xl bg-[#07162C] border border-slate-800 space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                              <div className="space-y-1">
                                <Badge variant="navy" className="text-[10px] bg-blue-950 border-blue-800 text-cyan-300">
                                  تكليف تطبيقي
                                </Badge>
                                <h3 className="text-lg font-bold text-white">{task.title}</h3>
                              </div>

                              {task.deadline && (
                                <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/40 px-3 py-1 rounded-lg border border-amber-800/40 font-mono">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>الموعد النهائي: {new Date(task.deadline).toLocaleDateString("ar-EG")}</span>
                                </div>
                              )}
                            </div>

                            {/* Task Description */}
                            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                              {task.description}
                            </div>

                            {/* Past Submission Status */}
                            {task.userSubmission ? (
                              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-700 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle2 className="h-4 w-4" /> تم إرسال التكليف بنجاح
                                  </span>
                                  <Badge variant={task.userSubmission.status === "REVIEWED" ? "success" : "navy"}>
                                    {task.userSubmission.status === "REVIEWED" ? "تم التصحيح" : "بانتظار المراجعة"}
                                  </Badge>
                                </div>

                                {task.userSubmission.score !== null && task.userSubmission.score !== undefined && (
                                  <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-xs text-emerald-300 font-bold">
                                    الدرجة المحصلة: {task.userSubmission.score} / 100
                                  </div>
                                )}

                                {task.userSubmission.feedback && (
                                  <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
                                    <span className="font-bold text-cyan-400 block mb-1">ملاحظات المدرب:</span>
                                    <p>{task.userSubmission.feedback}</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Submission Form */
                              <div className="space-y-4 pt-2">
                                <h4 className="text-sm font-bold text-white">تسليم إجابة التكليف:</h4>

                                {taskSuccessMsg && (
                                  <Alert variant="default" className="bg-emerald-950/60 border-emerald-700 text-emerald-300">
                                    <AlertDescription>{taskSuccessMsg}</AlertDescription>
                                  </Alert>
                                )}

                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-slate-300">رابط الملف المرفق (Google Drive / GitHub / S3):</label>
                                  <input
                                    type="url"
                                    placeholder="https://..."
                                    value={taskFileUrl}
                                    onChange={(e) => setTaskFileUrl(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-slate-300">الإجابة النصية / ملاحظات الطالب:</label>
                                  <textarea
                                    rows={4}
                                    placeholder="اكتب إجابتك أو شرح خطوات الحل هنا..."
                                    value={taskTextResponse}
                                    onChange={(e) => setTaskTextResponse(e.target.value)}
                                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                                  />
                                </div>

                                <Button
                                  onClick={() => handleSubmitTask(task.id)}
                                  disabled={isSubmittingTask}
                                  className="bg-[#2563EB] hover:bg-blue-600 text-white font-bold px-6 text-xs h-10"
                                >
                                  <Send className="h-3.5 w-3.5 ml-1.5" />
                                  <span>{isSubmittingTask ? "جاري التسليم..." : "إرسال التكليف للمراجعة"}</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center bg-[#07162C] rounded-2xl border border-slate-800 text-slate-400 text-xs">
                          لا يوجد تكليف مطلوب في هذه المحاضرة.
                        </div>
                      )}
                    </TabsContent>

                    {/* Tab 4: Quiz & Server Timer */}
                    <TabsContent value="quiz" className="pt-4 space-y-6">
                      {activeLesson.quizzes && activeLesson.quizzes.length > 0 ? (
                        activeLesson.quizzes.map((quiz) => (
                          <div key={quiz.id} className="p-6 rounded-2xl bg-[#07162C] border border-slate-800 space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                              <div className="space-y-1">
                                <Badge variant="cyan" className="text-[10px] bg-cyan-950 border-cyan-800 text-cyan-300">
                                  اختبار تقييمي
                                </Badge>
                                <h3 className="text-lg font-bold text-white">{quiz.title}</h3>
                              </div>

                              <div className="flex items-center gap-4 text-xs text-slate-400">
                                <span>درجة النجاح: {quiz.passingScore}%</span>
                                {quiz.timeLimitMinutes && (
                                  <span className="flex items-center gap-1 text-cyan-400 font-bold">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>المدة: {quiz.timeLimitMinutes} دقيقة</span>
                                  </span>
                                )}
                                <span className="font-mono">
                                  المحاولات:{" "}
                                  <span className="font-bold text-slate-200">
                                    {quizAttemptInfo[quiz.id]?.used ?? 0}
                                    {quiz.maxAttempts > 0 ? ` / ${quiz.maxAttempts}` : " (غير محدودة)"}
                                  </span>
                                </span>
                                {quizAttemptInfo[quiz.id]?.bestScore !== null &&
                                  quizAttemptInfo[quiz.id]?.bestScore !== undefined && (
                                    <span className="font-mono">
                                      أفضل نتيجة:{" "}
                                      <span className="font-bold text-emerald-400">
                                        {quizAttemptInfo[quiz.id]?.bestScore}%
                                      </span>
                                    </span>
                                  )}
                              </div>
                            </div>

                            {quizError && (
                              <Alert variant="destructive">
                                <AlertDescription>{quizError}</AlertDescription>
                              </Alert>
                            )}

                            {/* Active Attempt / Runner */}
                            {currentAttemptId && timeLeftSeconds !== null && (
                              <div className="p-4 rounded-xl bg-blue-950/60 border border-blue-800 flex items-center justify-between">
                                <span className="text-xs font-bold text-white flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-cyan-400 animate-pulse" />
                                  <span>الوقت المتبقي لانتهاء الاختبار:</span>
                                </span>
                                <span className={cn(
                                  "text-base font-mono font-black px-3 py-1 rounded-lg border",
                                  timeLeftSeconds < 60
                                    ? "bg-red-950 text-red-400 border-red-800 animate-bounce"
                                    : "bg-slate-900 text-cyan-300 border-cyan-700"
                                )}>
                                  {formatTimer(timeLeftSeconds)}
                                </span>
                              </div>
                            )}

                            {quizResult ? (
                              /* Graded Result View */
                              <div className="space-y-6">
                                <div
                                  className={cn(
                                    "p-6 rounded-2xl border text-center space-y-2",
                                    quizResult.passed
                                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                                      : "bg-red-950/40 border-red-500/50 text-red-300"
                                  )}
                                >
                                  <div className="inline-flex p-3 rounded-full bg-slate-900/60 mb-1">
                                    {quizResult.passed ? (
                                      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                                    ) : (
                                      <X className="h-8 w-8 text-red-400" />
                                    )}
                                  </div>
                                  <h2 className="text-2xl font-black text-white">
                                    {quizResult.passed ? "تهانينا! لقد اجتزت الاختبار بنجاح" : "لم يتم اجتياز الاختبار"}
                                  </h2>
                                  <p className="text-sm font-bold">
                                    الدرجة المحصلة: {quizResult.score}% (نسبة النجاح المطلوبة: {quiz.passingScore}%)
                                  </p>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                  <Button
                                    onClick={() => handleStartQuiz(quiz.id)}
                                    className="bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5 ml-1.5" />
                                    <span>إعادة المحاولة</span>
                                  </Button>
                                </div>
                              </div>
                            ) : currentAttemptId ? (
                              /* Live Quiz Question Form */
                              <div className="space-y-6">
                                {quiz.questions.map((q, qIdx) => (
                                  <div key={q.id} className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                                      <span>السؤال {qIdx + 1} من {quiz.questions.length}</span>
                                      <span>{q.points} نقطة</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-white">{q.prompt}</h4>

                                    <div className="space-y-2 pt-2">
                                      {q.options.map((opt) => {
                                        const isSelected = quizAnswers[q.id] === opt.id;
                                        return (
                                          <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() =>
                                              setQuizAnswers((prev) => ({
                                                ...prev,
                                                [q.id]: opt.id,
                                              }))
                                            }
                                            className={cn(
                                              "w-full flex items-center gap-3 p-3 rounded-xl border text-right text-xs transition-all",
                                              isSelected
                                                ? "bg-blue-950/90 border-blue-500 text-cyan-300 font-bold"
                                                : "bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900"
                                            )}
                                          >
                                            <div
                                              className={cn(
                                                "h-4 w-4 rounded-full border flex items-center justify-center flex-shrink-0",
                                                isSelected
                                                  ? "border-cyan-400 bg-cyan-400 text-slate-950"
                                                  : "border-slate-600"
                                              )}
                                            >
                                              {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-slate-950" />}
                                            </div>
                                            <span>{opt.text}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}

                                <Button
                                  onClick={handleSubmitQuiz}
                                  disabled={isSubmittingQuiz || Object.keys(quizAnswers).length === 0}
                                  className="w-full bg-[#2563EB] hover:bg-blue-600 text-white font-bold h-11 text-sm shadow-lg"
                                >
                                  {isSubmittingQuiz ? "جاري تصحيح الإجابات..." : "تسليم إجابات الاختبار"}
                                </Button>
                              </div>
                            ) : (
                              /* Start Quiz CTA */
                              <div className="text-center py-6 space-y-4">
                                <HelpCircle className="h-12 w-12 text-[#2563EB] mx-auto opacity-80" />
                                <div className="space-y-1">
                                  <h4 className="text-base font-bold text-white">جاهز لبدء الاختبار؟</h4>
                                  <p className="text-xs text-slate-400">
                                    تأكد من مراجعة محتوى المحاضرة جيدًا قبل بدء المحاولة.
                                  </p>
                                </div>

                                {quizAttemptInfo[quiz.id]?.passed && (
                                  <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>لقد اجتزت هذا الاختبار بالفعل</span>
                                  </p>
                                )}

                                {quiz.questions.length === 0 ? (
                                  <p className="text-xs text-amber-400">
                                    لم تتم إضافة أسئلة لهذا الاختبار بعد.
                                  </p>
                                ) : quiz.maxAttempts > 0 &&
                                  (quizAttemptInfo[quiz.id]?.used ?? 0) >= quiz.maxAttempts &&
                                  !quizAttemptInfo[quiz.id]?.passed ? (
                                  <p className="text-xs text-red-400 font-bold">
                                    استنفدت عدد المحاولات المسموح بها ({quiz.maxAttempts}) ولم تجتز الاختبار.
                                  </p>
                                ) : (
                                  <Button
                                    onClick={() => handleStartQuiz(quiz.id)}
                                    className="bg-[#2563EB] hover:bg-blue-600 text-white font-bold px-8 text-xs h-10 shadow-md"
                                  >
                                    {quizAttemptInfo[quiz.id]?.used
                                      ? "بدء محاولة جديدة"
                                      : "بدء محاولة الاختبار الآن"}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center bg-[#07162C] rounded-2xl border border-slate-800 text-slate-400 text-xs">
                          لا يوجد اختبار في هذه المحاضرة.
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-500">
              <p>اختر محاضرة من القائمة على اليمين لبدء التعلم.</p>
            </div>
          )}
        </div>

        {/* Right Sidebar: Curriculum Outline & Navigation */}
        <aside
          className={cn(
            "w-full lg:w-96 border-t lg:border-t-0 lg:border-r border-slate-800 bg-[#07162C] flex flex-col h-auto lg:h-full overflow-hidden flex-shrink-0 z-20 transition-all duration-200",
            sidebarOpen ? "fixed inset-0 z-50 bg-[#07162C] flex" : "hidden lg:flex"
          )}
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#07162C]">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-cyan-400" />
              <span>فهرس ومحتوى الكورس</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">
                {progress?.completedLessons || 0} / {progress?.totalLessons || 0} مكتمل
              </span>
              {sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
            {sections.map((section, sIdx) => {
              const isExpanded = expandedSections[section.id] !== false;
              return (
                <div key={section.id} className="bg-slate-950/40">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSections((prev) => ({
                        ...prev,
                        [section.id]: !isExpanded,
                      }))
                    }
                    className="w-full flex items-center justify-between p-3.5 text-right hover:bg-slate-900 transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-200 truncate pl-2">
                      الأسبوع {sIdx + 1}: {section.title}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    ) : (
                      <ChevronLeft className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="divide-y divide-slate-900/60 pb-1">
                      {section.lessons?.map((lesson) => {
                        const isActive = activeLessonId === lesson.id;
                        const completed = isLessonCompleted(lesson.id);
                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() => selectLesson(lesson.id)}
                            className={cn(
                              "w-full flex items-center justify-between p-3 text-right text-xs transition-colors",
                              isActive
                                ? "bg-blue-950/90 border-r-4 border-[#2563EB] text-white font-bold"
                                : "hover:bg-slate-900/80 text-slate-300"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pl-2">
                              {completed ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                              ) : lesson.isUnlocked === false ? (
                                <Lock className="h-4 w-4 text-amber-500/80 flex-shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 text-slate-600 flex-shrink-0" />
                              )}
                              <span className="truncate">{lesson.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                              {Math.floor(lesson.durationSeconds / 60)}د
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* Certificate Claim Dialog */}
      <Dialog open={certificateModalOpen} onOpenChange={setCertificateModalOpen}>
        <DialogHeader>
          <div className="mx-auto p-3 rounded-full bg-emerald-100 text-emerald-600 mb-2">
            <Award className="h-8 w-8" />
          </div>
          <DialogTitle className="text-center text-xl font-black text-slate-900">
            مبارك! لقد أكملت الكورس بنجاح 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-slate-500">
            لقد أنهيت جميع المحاضرات والتكليفات والاختبارات المطلوبة بنجاح 100%.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3 text-right">
          {claimedCertCode ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <Badge variant="success" className="text-xs">
                تم إصدار الشهادة الرقمية المعتمدة
              </Badge>
              <p className="text-sm font-bold font-mono text-emerald-900">
                {claimedCertCode}
              </p>
              <p className="text-xs text-emerald-700">
                تم تسجيل شهادتك بشكل دائم في سجل التحقق الرسمي للأكاديمية.
              </p>
              <div className="pt-2">
                <Link href={`/verify/${encodeURIComponent(claimedCertCode)}`}>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
                    عرض الشهادة الموثقة
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <p className="text-xs text-slate-600 leading-relaxed">
                اضغط على الزر أدناه لإصدار شهادة إتمام الكورس الموثقة رسميًا باسم:{" "}
                <span className="font-bold text-slate-900">{user?.fullName}</span>.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {!claimedCertCode ? (
            <Button
              onClick={handleClaimCertificate}
              disabled={isClaimingCert}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isClaimingCert ? "جاري إصدار الشهادة..." : "إصدار الشهادة الرسمية الآن"}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setCertificateModalOpen(false)}
              className="w-full font-semibold"
            >
              إغلاق
            </Button>
          )}
        </DialogFooter>
      </Dialog>
    </div>
  );
}
