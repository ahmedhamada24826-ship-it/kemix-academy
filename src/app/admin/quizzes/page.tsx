"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  HelpCircle,
  PlusCircle,
  Search,
  Clock,
  Shuffle,
  ShieldAlert,
  Edit,
  Trash2,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

interface QuizQuestion {
  id: string;
  prompt: string;
  points: number;
  explanation?: string | null;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

interface QuizItem {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  passingScore: number;
  timeLimitMinutes?: number | null;
  maxAttempts?: number;
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
  showResultImmediately: boolean;
  showCorrectAnswers: boolean;
  allowReview: boolean;
  isPublished: boolean;
  isArchived: boolean;
  course?: {
    id: string;
    title: string;
  };
  questions?: QuizQuestion[];
}

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Create/Edit Quiz Modal
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editQuizId, setEditQuizId] = useState<string | null>(null);
  const [quizCourseId, setQuizCourseId] = useState("");
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDesc, setQuizDesc] = useState("");
  const [quizPassingScore, setQuizPassingScore] = useState(75);
  const [quizTimeLimit, setQuizTimeLimit] = useState<number | undefined>(20);
  const [quizMaxAttempts, setQuizMaxAttempts] = useState<number>(3);
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [randomizeAnswers, setRandomizeAnswers] = useState(true);
  const [showResultImmediately, setShowResultImmediately] = useState(true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
  const [allowReview, setAllowReview] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Add Question Modal
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [qPrompt, setQPrompt] = useState("");
  const [qPoints, setQPoints] = useState(10);
  const [qExplanation, setQExplanation] = useState("");
  const [options, setOptions] = useState([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [coursesRes] = await Promise.all([
        fetch("/api/courses", { cache: "no-store" }),
      ]);

      if (coursesRes.ok) {
        const cData = await coursesRes.json();
        if (cData.success && cData.data?.courses) {
          setCourses(cData.data.courses);
          if (cData.data.courses.length > 0 && !quizCourseId) {
            setQuizCourseId(cData.data.courses[0].id);
          }

          // Fetch quizzes for each course
          const allQuizzes: QuizItem[] = [];
          for (const course of cData.data.courses) {
            const qRes = await fetch(`/api/courses/${course.id}/quizzes`, { cache: "no-store" });
            if (qRes.ok) {
              const qJson = await qRes.json();
              if (qJson.success && qJson.data?.quizzes) {
                for (const q of qJson.data.quizzes) {
                  const detailRes = await fetch(`/api/quizzes/${q.id}`, { cache: "no-store" });
                  const detailJson = detailRes.ok ? await detailRes.json() : null;
                  allQuizzes.push({ ...(detailJson?.data?.quiz || q), course });
                }
              }
            }
          }
          setQuizzes(allQuizzes);
        }
      }
    } catch (err) {
      console.error("Failed to load quizzes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditQuizId(null);
    setQuizTitle("");
    setQuizDesc("");
    setQuizPassingScore(75);
    setQuizTimeLimit(20);
    setQuizMaxAttempts(3);
    setRandomizeQuestions(true);
    setRandomizeAnswers(true);
    setShowResultImmediately(true);
    setShowCorrectAnswers(true);
    setAllowReview(true);
    setErrorMsg(null);
    setQuizModalOpen(true);
  };

  const handleOpenEdit = (quiz: QuizItem) => {
    setIsEditing(true);
    setEditQuizId(quiz.id);
    setQuizCourseId(quiz.courseId);
    setQuizTitle(quiz.title);
    setQuizDesc(quiz.description || "");
    setQuizPassingScore(quiz.passingScore);
    setQuizTimeLimit(quiz.timeLimitMinutes ?? undefined);
    setQuizMaxAttempts(quiz.maxAttempts ?? 0);
    setRandomizeQuestions(quiz.randomizeQuestions);
    setRandomizeAnswers(quiz.randomizeAnswers);
    setShowResultImmediately(quiz.showResultImmediately);
    setShowCorrectAnswers(quiz.showCorrectAnswers);
    setAllowReview(quiz.allowReview);
    setErrorMsg(null);
    setQuizModalOpen(true);
  };

  const handleDeleteQuiz = async (quiz: QuizItem) => {
    if (!window.confirm(`حذف الاختبار "${quiz.title}"؟`)) return;
    const res = await fetch(`/api/quizzes/${quiz.id}`, { method: "DELETE" });
    if (res.ok) await loadData();
    else setErrorMsg((await res.json()).error?.message || "فشل حذف الاختبار");
  };

  const handleTogglePublish = async (quiz: QuizItem) => {
    const res = await fetch(`/api/quizzes/${quiz.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !quiz.isPublished }),
    });
    if (res.ok) await loadData();
  };

  const openQuestionEditor = (quiz: QuizItem, question?: QuizQuestion) => {
    setSelectedQuiz(quiz);
    setEditingQuestionId(question?.id || null);
    setQPrompt(question?.prompt || "");
    setQPoints(question?.points || 1);
    setQExplanation(question?.explanation || "");
    setOptions(
      question?.options?.map((option) => ({
        text: option.text,
        isCorrect: option.isCorrect,
      })) || [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
      ]
    );
    setQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuiz || !qPrompt.trim()) return;
    setIsSavingQuestion(true);
    setErrorMsg(null);
    try {
      const payload = {
        prompt: qPrompt.trim(),
        points: Number(qPoints) || 1,
        explanation: qExplanation.trim() || null,
        options: options
          .filter((option) => option.text.trim())
          .map((option, index) => ({ ...option, text: option.text.trim(), sortOrder: index })),
      };
      const url = editingQuestionId
        ? `/api/quizzes/${selectedQuiz.id}/questions/${editingQuestionId}`
        : `/api/quizzes/${selectedQuiz.id}/questions`;
      const res = await fetch(url, {
        method: editingQuestionId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || "فشل حفظ السؤال");
      setQuestionModalOpen(false);
      await loadData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "فشل حفظ السؤال");
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (question: QuizQuestion) => {
    if (!window.confirm("حذف هذا السؤال؟")) return;
    const res = await fetch(`/api/quizzes/${selectedQuiz?.id}/questions/${question.id}`, { method: "DELETE" });
    if (res.ok) await loadData();
    else setErrorMsg((await res.json()).error?.message || "فشل حذف السؤال");
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim() || !quizCourseId) {
      setErrorMsg("يرجى ملء جميع الحقول المطلوبة.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const payload = {
        title: quizTitle.trim(),
        description: quizDesc.trim() || null,
        passingScore: Number(quizPassingScore) || 75,
        timeLimitMinutes: quizTimeLimit ? Number(quizTimeLimit) : null,
        maxAttempts: Number.isFinite(quizMaxAttempts) ? Number(quizMaxAttempts) : 0,
        randomizeQuestions,
        randomizeAnswers,
        showResultImmediately,
        showCorrectAnswers,
        allowReview,
      };

      const res = await fetch(
        isEditing && editQuizId ? `/api/quizzes/${editQuizId}` : `/api/courses/${quizCourseId}/quizzes`,
        {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        setQuizModalOpen(false);
        await loadData();
      } else {
        const json = await res.json();
        setErrorMsg(json.error?.message || "فشل في حفظ الاختبار.");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "حدث خطأ.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredQuizzes = quizzes.filter(
    (q) =>
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.course?.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-[#2563EB]" />
            <span>إدارة الاختبارات والتقييمات الذاتية</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            إنشاء الاختبارات، ضبط مؤقت الإجابة، عدد المحاولات، والأسئلة العشوائية.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold h-9 flex items-center gap-1.5 shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>إنشاء اختبار جديد</span>
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <Input
          type="text"
          placeholder="ابحث عن اختبار بالعنوان أو اسم الكورس..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 p-0 text-sm h-8"
        />
      </div>

      {/* Quizzes Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-slate-500 animate-pulse font-medium">
          جاري تحميل الاختبارات...
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <Card className="p-12 text-center bg-white border-slate-200">
          <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">لا توجد اختبارات مسجلة</p>
          <p className="text-xs text-slate-400 mt-1">
            اضغط على &ldquo;إنشاء اختبار جديد&rdquo; للبدء في إعداد بنك الأسئلة والتقييمات.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuizzes.map((quiz) => (
            <Card
              key={quiz.id}
              className="bg-white border-slate-200 hover:border-blue-300 transition-all shadow-sm flex flex-col justify-between"
            >
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] bg-slate-50 font-medium">
                    {quiz.course?.title || "كورس عام"}
                  </Badge>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                    نجاح: {quiz.passingScore}%
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold text-slate-900 mt-2">
                  {quiz.title}
                </CardTitle>
                {quiz.description && (
                  <CardDescription className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {quiz.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-4">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                    <span>{quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} دقيقة` : "غير محدد"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Shuffle className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
                    <span>{quiz.randomizeQuestions ? "خلط الأسئلة" : "ترتيب ثابت"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                    <span>{quiz.maxAttempts ? `${quiz.maxAttempts} محاولات` : "غير محدود"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{quiz.questions?.length || 0} أسئلة</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">{quiz.isPublished ? "منشور" : "مسودة"}</span>
                  <div className="flex items-center gap-1">
                    <Button type="button" size="sm" variant="ghost" onClick={() => handleOpenEdit(quiz)} title="تعديل الاختبار">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => handleDeleteQuiz(quiz)} title="حذف الاختبار">
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => handleTogglePublish(quiz)}>
                      {quiz.isPublished ? "إلغاء النشر" : "نشر"}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  {quiz.questions?.map((question) => (
                    <div key={question.id} className="flex items-start justify-between gap-2 text-xs">
                      <span className="text-slate-700">{question.prompt}</span>
                      <div className="flex shrink-0 gap-1">
                        <Button type="button" size="sm" variant="ghost" onClick={() => openQuestionEditor(quiz, question)} title="تعديل السؤال">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => handleDeleteQuestion(question)} title="حذف السؤال">
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button type="button" size="sm" variant="outline" onClick={() => openQuestionEditor(quiz)} className="w-full">
                    <PlusCircle className="h-3.5 w-3.5 ml-1" /> إضافة سؤال
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Quiz Modal */}
      <Dialog open={quizModalOpen} onOpenChange={setQuizModalOpen}>
        <DialogHeader>
          <DialogTitle>{isEditing ? "تعديل الاختبار" : "إنشاء اختبار تقييمي جديد"}</DialogTitle>
          <DialogDescription>
            حدد مواصفات الاختبار والقيود الزمنية ومعدل النجاح المطلوب.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSaveQuiz} className="space-y-4 py-2 text-right">
          {errorMsg && (
            <Alert variant="destructive">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">الكورس التابع له *</label>
            <select
              value={quizCourseId}
              onChange={(e) => setQuizCourseId(e.target.value)}
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
            <label className="text-xs font-bold text-slate-700">عنوان الاختبار *</label>
            <Input
              placeholder="مثال: الاختبار الشامل لتحليل البيانات بـ Python"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">الوصف والتعليمات</label>
            <Textarea
              rows={2}
              placeholder="تعليمات الاختبار، معايير التقييم، وشروط الاجتياز..."
              value={quizDesc}
              onChange={(e) => setQuizDesc(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">درجة النجاح (%)</label>
              <Input
                type="number"
                min={1}
                max={100}
                value={quizPassingScore}
                onChange={(e) => setQuizPassingScore(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">الزمن (بالدقائق)</label>
              <Input
                type="number"
                min={1}
                placeholder="مثال: 20"
                value={quizTimeLimit || ""}
                onChange={(e) => setQuizTimeLimit(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">أقصى عدد للمحاولات</label>
              <Input
                type="number"
                min={1}
                value={quizMaxAttempts}
                onChange={(e) => setQuizMaxAttempts(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <p className="text-xs font-bold text-slate-800">خيارات التقديم والأمان</p>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rndQ"
                checked={randomizeQuestions}
                onChange={(e) => setRandomizeQuestions(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="rndQ" className="text-xs text-slate-700 cursor-pointer font-medium">
                خلط وترتيب الأسئلة عشوائياً لكل طالب
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={showResultImmediately} onChange={(e) => setShowResultImmediately(e.target.checked)} />
              <label className="text-xs text-slate-700">إظهار النتيجة فورًا</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={showCorrectAnswers} onChange={(e) => setShowCorrectAnswers(e.target.checked)} />
              <label className="text-xs text-slate-700">إظهار الإجابات الصحيحة</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={allowReview} onChange={(e) => setAllowReview(e.target.checked)} />
              <label className="text-xs text-slate-700">السماح بالمراجعة</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rndA"
                checked={randomizeAnswers}
                onChange={(e) => setRandomizeAnswers(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="rndA" className="text-xs text-slate-700 cursor-pointer font-medium">
                خلط وترتيب خيارات الإجابة عشوائياً
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setQuizModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold"
            >
              {isSaving ? "جاري الحفظ..." : isEditing ? "حفظ تعديلات الاختبار" : "حفظ الاختبار"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      <Dialog open={questionModalOpen} onOpenChange={setQuestionModalOpen}>
        <DialogHeader>
          <DialogTitle>{editingQuestionId ? "تعديل السؤال" : "إضافة سؤال"}</DialogTitle>
          <DialogDescription>عدّل نص السؤال والخيارات وحدد الإجابة الصحيحة.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSaveQuestion} className="space-y-4 py-2 text-right">
          <Input value={qPrompt} onChange={(e) => setQPrompt(e.target.value)} placeholder="نص السؤال" required />
          <Input type="number" min={1} value={qPoints} onChange={(e) => setQPoints(Number(e.target.value))} placeholder="النقاط" required />
          <Textarea value={qExplanation} onChange={(e) => setQExplanation(e.target.value)} placeholder="شرح الإجابة (اختياري)" />
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={option.isCorrect}
                  onChange={() => setOptions((current) => current.map((item, itemIndex) => ({ ...item, isCorrect: itemIndex === index })))}
                />
                <Input value={option.text} onChange={(e) => setOptions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, text: e.target.value } : item))} placeholder={`الخيار ${index + 1}`} required />
                <Button type="button" size="sm" variant="ghost" onClick={() => setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={options.length <= 2} title="حذف الخيار">
                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                </Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => setOptions((current) => [...current, { text: "", isCorrect: false }])}>
              <PlusCircle className="h-3.5 w-3.5 ml-1" /> إضافة خيار
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setQuestionModalOpen(false)}>إلغاء</Button>
            <Button type="submit" disabled={isSavingQuestion}>{isSavingQuestion ? "جاري الحفظ..." : "حفظ السؤال"}</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
