"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUploader } from "@/components/upload/use-uploader";
import {
  ArrowRight,
  PlusCircle,
  PlayCircle,
  HelpCircle,
  Trash2,
  Save,
  Layers,
  Eye,
  Video,
  Lock,
  FileCode,
  CheckCircle2,
  ListPlus,
  DollarSign,
  Edit,
} from "lucide-react";

interface Lesson {
  id: string;
  sectionId: string;
  title: string;
  slug: string;
  lessonType: "VIDEO" | "TEXT" | "FILE" | "QUIZ";
  videoSource?: "UPLOAD" | "YOUTUBE" | "GOOGLE_DRIVE" | "ONEDRIVE" | "SHAREPOINT";
  videoUrl?: string | null;
  unlockRule?: "IMMEDIATE" | "PREVIOUS_LESSON" | "TASK_SUBMISSION" | "QUIZ_PASS";
  durationSeconds: number;
  isPublished: boolean;
  isFreePreview: boolean;
  content?: string | null;
  storageKey?: string | null;
  files?: { id: string; originalName: string; category: string }[];
}

interface Section {
  id: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  lessons: Lesson[];
}

interface Quiz {
  id: string;
  lessonId?: string | null;
  title: string;
  description?: string | null;
  passingScore: number;
  timeLimitMinutes?: number | null;
  maxAttempts?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isPublished?: boolean;
  questions?: {
    id: string;
    prompt: string;
    points?: number;
    options?: { id?: string; text: string; isCorrect: boolean }[];
  }[];
}

function toDateTimeLocalValue(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatSchedule(value?: string | null): string {
  if (!value) return "غير محدد";
  return new Date(value).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" });
}

interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  description: string;
  coverImageUrl?: string | null;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  price?: number;
  currency?: string;
  isFree?: boolean;
  certificatesEnabled?: boolean;
  tools?: string[];
  requirements?: string | null;
  whatYouWillLearn?: string[];
  durationSeconds: number;
}

export default function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);

  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Edit metadata form state
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [desc, setDesc] = useState("");
  const [level, setLevel] = useState<CourseDetail["level"]>("BEGINNER");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [coverTouched, setCoverTouched] = useState(false);
  const [price, setPrice] = useState<number>(0);
  const [currency, setCurrency] = useState("EGP");
  const [isFree, setIsFree] = useState(false);
  const [certificatesEnabled, setCertificatesEnabled] = useState(false);
  const [toolsStr, setToolsStr] = useState("");
  const [requirementsStr, setRequirementsStr] = useState("");
  const [learnOutcomesStr, setLearnOutcomesStr] = useState("");
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Add section modal
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionDesc, setSectionDesc] = useState("");
  const [isAddingSection, setIsAddingSection] = useState(false);

  // Add lesson modal
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonSlug, setLessonSlug] = useState("");
  const [lessonType, setLessonType] = useState<"VIDEO" | "TEXT">("VIDEO");
  const [videoSource, setVideoSource] = useState<"YOUTUBE" | "GOOGLE_DRIVE" | "ONEDRIVE" | "SHAREPOINT" | "UPLOAD">("YOUTUBE");
  const [videoUrl, setVideoUrl] = useState("");
  const [unlockRule, setUnlockRule] = useState<"IMMEDIATE" | "PREVIOUS_LESSON" | "TASK_SUBMISSION" | "QUIZ_PASS">("PREVIOUS_LESSON");
  const [lessonDuration, setLessonDuration] = useState(600);
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [lessonContent, setLessonContent] = useState("");
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [lessonEditOpen, setLessonEditOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [lessonUploadError, setLessonUploadError] = useState<string | null>(null);
  const [lessonFileAsset, setLessonFileAsset] = useState<{ id: string; originalName: string } | null>(null);
  const [lessonDriveUrl, setLessonDriveUrl] = useState("");
  const [lessonDriveName, setLessonDriveName] = useState("");

  // Add quiz modal
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizLessonId, setQuizLessonId] = useState<string>("");
  const [quizPassingScore, setQuizPassingScore] = useState(75);
  const [quizTimeLimit, setQuizTimeLimit] = useState<number | undefined>(20);
  const [quizStartsAt, setQuizStartsAt] = useState("");
  const [quizEndsAt, setQuizEndsAt] = useState("");
  const [isAddingQuiz, setIsAddingQuiz] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionQuizId, setQuestionQuizId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [questionPoints, setQuestionPoints] = useState(10);
  const [questionOptions, setQuestionOptions] = useState([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  const uploader = useUploader();

  const openLessonEditor = async (lesson: Lesson) => {
    const response = await fetch(`/api/lessons/${lesson.id}`);
    const lessonData = response.ok ? (await response.json()).data?.lesson : lesson;
    const selectedLesson = lessonData || lesson;
    setEditingLesson(selectedLesson);
    setLessonTitle(selectedLesson.title);
    setLessonSlug(selectedLesson.slug);
    setLessonType(selectedLesson.lessonType === "TEXT" ? "TEXT" : "VIDEO");
    setVideoSource(selectedLesson.videoSource || "UPLOAD");
    setVideoUrl(selectedLesson.videoUrl || "");
    setUnlockRule(selectedLesson.unlockRule || "IMMEDIATE");
    setLessonDuration(selectedLesson.durationSeconds || 0);
    setIsFreePreview(selectedLesson.isFreePreview);
    setLessonContent(selectedLesson.content || "");
    setLessonFileAsset(null);
    setLessonDriveUrl("");
    setLessonDriveName("");
    setLessonUploadError(null);
    setLessonEditOpen(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !lessonTitle.trim()) return;
    setIsSavingLesson(true);
    try {
      const res = await fetch(`/api/lessons/${editingLesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lessonTitle.trim(),
          slug: lessonSlug.trim() || undefined,
          lessonType,
          videoSource: lessonType === "VIDEO" ? videoSource : undefined,
          videoUrl: lessonType === "VIDEO" && videoUrl.trim() ? videoUrl.trim() : null,
          unlockRule,
          durationSeconds: Number(lessonDuration) || 0,
          isFreePreview,
          content: lessonContent.trim() || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message || "فشل حفظ الدرس");
      setLessonEditOpen(false);
      await refreshData();
    } catch (err) {
      setLessonUploadError(err instanceof Error ? err.message : "فشل حفظ الدرس");
    } finally {
      setIsSavingLesson(false);
    }
  };

  const handleToggleLessonPublish = async (lesson: Lesson) => {
    const res = await fetch(`/api/lessons/${lesson.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !lesson.isPublished }),
    });
    if (res.ok) await refreshData();
  };

  const handleLessonUpload = async (file: File, category: "VIDEO" | "PDF" | "DOCUMENT") => {
    if (!editingLesson) return;
    setLessonUploadError(null);
    const asset = await uploader.upload(file, {
      category,
      visibility: "PROTECTED",
      courseId,
      lessonId: editingLesson.id,
      maxSizeMb: category === "VIDEO" ? 500 : 50,
      accept: category === "VIDEO" ? ["video/*"] : undefined,
    }).catch((err: unknown) => {
      setLessonUploadError(err instanceof Error ? err.message : "فشل رفع الملف");
      return null;
    });
    if (!asset) {
      return;
    }
    if (category === "VIDEO") {
      const response = await fetch(`/api/lessons/${editingLesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoSource: "UPLOAD", storageKey: asset.storageKey }),
      });
      if (!response.ok) {
        setLessonUploadError("تم رفع الفيديو لكن فشل ربطه بالدرس");
        return;
      }
    } else {
      setLessonFileAsset({ id: asset.id, originalName: asset.originalName });
    }
    await refreshData();
  };

  const handleAddLessonDriveLink = async () => {
    if (!editingLesson) return;
    const url = lessonDriveUrl.trim();
    if (!url) {
      setLessonUploadError("يرجى إدخال رابط ملف Drive أو رابط خارجي");
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      setLessonUploadError("الرابط يجب أن يبدأ بـ http:// أو https://");
      return;
    }

    try {
      setLessonUploadError(null);
      const res = await fetch("/api/files/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storageKey: url,
          originalName: lessonDriveName.trim() || "Drive Link",
          mimeType: "application/octet-stream",
          size: 1,
          category: "DOCUMENT",
          visibility: "PUBLIC",
          courseId,
          lessonId: editingLesson.id,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "فشل ربط رابط الملف");
      }

      setLessonFileAsset({
        id: json.data.fileAsset.id,
        originalName: json.data.fileAsset.originalName,
      });
      setLessonDriveUrl("");
      setLessonDriveName("");
      await refreshData();
    } catch (err) {
      setLessonUploadError(err instanceof Error ? err.message : "فشل ربط رابط الملف");
    }
  };

  const openQuestionEditor = (quizId: string, question?: NonNullable<Quiz["questions"]>[number]) => {
    setQuestionQuizId(quizId);
    setEditingQuestionId(question?.id || null);
    setQuestionPrompt(question?.prompt || "");
    setQuestionPoints(question?.points || 10);
    setQuestionOptions(question?.options?.map(({ text, isCorrect }) => ({ text, isCorrect })) || [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ]);
    setQuestionModalOpen(true);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionQuizId || !questionPrompt.trim()) return;
    setIsAddingQuestion(true);
    try {
      const res = await fetch(
        editingQuestionId
          ? `/api/quizzes/${questionQuizId}/questions/${editingQuestionId}`
          : `/api/quizzes/${questionQuizId}/questions`,
        {
        method: editingQuestionId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: questionPrompt.trim(),
          points: Number(questionPoints) || 1,
          options: questionOptions
            .filter((option) => option.text.trim())
            .map((option, index) => ({ ...option, text: option.text.trim(), sortOrder: index })),
        }),
        }
      );
      if (!res.ok) throw new Error((await res.json()).error?.message || "فشل إضافة السؤال");
      setQuestionModalOpen(false);
      setEditingQuestionId(null);
      await refreshData();
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const handleCoverFileSelect = async (file: File) => {
    setCoverUploadError(null);
    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/)) {
      setCoverUploadError("نوع الملف غير مدعوم. يُرجى اختيار صورة PNG أو JPG أو WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverUploadError("حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت).");
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));

    setCoverUploading(true);
    try {
      const asset = await uploader.upload(file, {
        category: "COURSE_COVER",
        visibility: "PUBLIC",
        courseId,
        maxSizeMb: 5,
        accept: ["image/png", "image/jpeg", "image/webp"],
      });
      const uploadedCoverUrl =
        asset.publicUrl ||
        (/^https?:\/\//i.test(asset.storageKey) ? asset.storageKey : null) ||
        `/api/files/${asset.id}/access?redirect=1`;

      if (uploadedCoverUrl) {
        setCoverUrl(uploadedCoverUrl);
        setCoverFile(null);
        setCoverPreview(null);
        setCoverTouched(true);
      } else {
        setCoverUploadError("تم الرفع لكن لم يتم استرجاع رابط الصورة.");
      }
    } catch (err) {
      setCoverUploadError(err instanceof Error ? err.message : "فشل رفع الصورة. حاول مرة أخرى.");
    } finally {
      setCoverUploading(false);
    }
  };

  const handleRemoveCover = () => {
    setCoverUrl("");
    setCoverFile(null);
    setCoverPreview(null);
    setCoverUploadError(null);
    setCoverTouched(true);
  };

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  const refreshData = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [cRes, sRes, qRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/courses/${courseId}/sections`),
        fetch(`/api/courses/${courseId}/quizzes`),
      ]);

      if (!cRes.ok) {
        if (cRes.status === 404) {
          setCourse(null);
          setLoadError("هذا الكورس غير موجود أو تم حذفه.");
          return;
        }

        throw new Error(`Failed to load course (${cRes.status})`);
      }

      const cData = await cRes.json();
      if (cData.success && cData.data?.course) {
        const c: CourseDetail = cData.data.course;
        setCourse(c);
        setTitle(c.title);
        setShortDesc(c.shortDescription || "");
        setDesc(c.description || "");
        setLevel(c.level);
        setCoverUrl(c.coverImageUrl || "");
        setPrice(c.price || 0);
        setCurrency(c.currency || "EGP");
        setIsFree(c.isFree || false);
        setCertificatesEnabled(c.certificatesEnabled || false);
        setToolsStr(Array.isArray(c.tools) ? c.tools.join(", ") : "");
        setRequirementsStr(c.requirements || "");
        setLearnOutcomesStr(Array.isArray(c.whatYouWillLearn) ? c.whatYouWillLearn.join("\n") : "");
      }

      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.success && sData.data?.sections) {
          setSections(sData.data.sections);
        }
      }

      if (qRes.ok) {
        const qData = await qRes.json();
        if (qData.success && qData.data?.quizzes) {
          const detailedQuizzes = await Promise.all(
            qData.data.quizzes.map(async (quiz: Quiz) => {
              const detailResponse = await fetch(`/api/quizzes/${quiz.id}`);
              if (!detailResponse.ok) return quiz;
              const detail = await detailResponse.json();
              return detail.data?.quiz || quiz;
            })
          );
          setQuizzes(detailedQuizzes);
        }
      }
    } catch (err) {
      console.error("Failed to load course details:", err);
      setLoadError("تعذّر تحميل بيانات الكورس. حاول مرة أخرى لاحقاً.");
      setCourse(null);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMeta(true);
    setSaveSuccess(false);

    try {
      const tools = toolsStr.split(",").map((t) => t.trim()).filter(Boolean);
      const requirements = requirementsStr.split("\n").map((r) => r.trim()).filter(Boolean);
      const whatYouWillLearn = learnOutcomesStr.split("\n").map((l) => l.trim()).filter(Boolean);

      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          shortDescription: shortDesc.trim() || undefined,
          description: desc.trim(),
          level,
          coverImageUrl: coverTouched ? (coverUrl || null) : undefined,
          price: isFree ? 0 : Number(price) || 0,
          currency,
          isFree,
          certificatesEnabled,
          tools,
          requirements: requirementsStr.trim() || undefined,
          whatYouWillLearn,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        await refreshData();
      }
    } catch (err) {
      console.error("Failed to save metadata:", err);
    } finally {
      setIsSavingMeta(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!course) return;
    const isPub = course.status === "PUBLISHED";
    try {
      const res = await fetch(`/api/courses/${courseId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: !isPub }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error("Failed to toggle publish status:", err);
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionTitle.trim()) return;

    setIsAddingSection(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sectionTitle.trim(),
          description: sectionDesc.trim() || undefined,
          sortOrder: sections.length + 1,
        }),
      });

      if (res.ok) {
        setSectionModalOpen(false);
        setSectionTitle("");
        setSectionDesc("");
        await refreshData();
      }
    } catch (err) {
      console.error("Failed to add section:", err);
    } finally {
      setIsAddingSection(false);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
  e.preventDefault();

  const trimmedLessonTitle = lessonTitle.trim();
  if (!targetSectionId || !trimmedLessonTitle) return;

  if (trimmedLessonTitle.length < 2) {
    alert("عنوان المحاضرة يجب أن يكون حرفين على الأقل.");
    return;
  }

  setIsAddingLesson(true);

  try {
    const generatedSlug =
      lessonSlug.trim() ||
      trimmedLessonTitle
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "");
    const validSlug = generatedSlug.length >= 2 ? generatedSlug : undefined;

    const payload = {
      title: trimmedLessonTitle,
      ...(validSlug ? { slug: validSlug } : {}),
      lessonType,
      ...(lessonType === "VIDEO"
        ? {
            videoSource,
            ...(videoUrl.trim() ? { videoUrl: videoUrl.trim() } : {}),
          }
        : {}),
      unlockRule,
      durationSeconds: Number(lessonDuration) || 600,
      isFreePreview,
      content: lessonContent.trim() || undefined,
      sortOrder: 10,
    };

    const res = await fetch(
      `/api/sections/${targetSectionId}/lessons`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data: {
      message?: string;
      error?: { message?: string; details?: unknown };
    } | null = await res.json().catch(() => null);

    if (!res.ok) {
      console.error("ADD LESSON ERROR:", data);

      const errorDetails = data?.error?.details;
      const detailsMessage = errorDetails
        ? `\n${typeof errorDetails === "string" ? errorDetails : JSON.stringify(errorDetails)}`
        : "";
      alert(
        `${data?.error?.message || data?.message || "فشل إنشاء المحاضرة."}${detailsMessage}`
      );

      return;
    }

    setLessonModalOpen(false);
    setLessonTitle("");
    setLessonSlug("");
    setLessonContent("");
    setVideoUrl("");

    await refreshData();
  } catch (err) {
    console.error("Failed to add lesson:", err);
    alert("حدث خطأ أثناء إضافة المحاضرة.");
  } finally {
    setIsAddingLesson(false);
  }
};
  const handleDeleteLesson = async (lessonId: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف الدرس "${title}"؟`)) return;
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error("Failed to delete lesson:", err);
    }
  };

  const allLessons = sections.flatMap((section) =>
    section.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      sectionTitle: section.title,
    }))
  );

  const handleAddQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) return;

    setIsAddingQuiz(true);
    try {
      const res = await fetch(
        editingQuizId ? `/api/quizzes/${editingQuizId}` : `/api/courses/${courseId}/quizzes`,
        {
          method: editingQuizId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: quizTitle.trim(),
            lessonId: quizLessonId || null,
            isPublished: true,
            passingScore: Number(quizPassingScore) || 75,
            timeLimitMinutes: quizTimeLimit ? Number(quizTimeLimit) : null,
            startsAt: quizStartsAt ? new Date(quizStartsAt).toISOString() : null,
            endsAt: quizEndsAt ? new Date(quizEndsAt).toISOString() : null,
          }),
        }
      );

      if (res.ok) {
        setQuizModalOpen(false);
        setEditingQuizId(null);
        setQuizTitle("");
        setQuizLessonId(allLessons[0]?.id || "");
        await refreshData();
      }
    } catch (err) {
      console.error("Failed to add quiz:", err);
    } finally {
      setIsAddingQuiz(false);
    }
  };

  const openQuizCreate = () => {
    setEditingQuizId(null);
    setQuizTitle("");
    setQuizLessonId(allLessons[0]?.id || "");
    setQuizPassingScore(75);
    setQuizTimeLimit(20);
    setQuizStartsAt("");
    setQuizEndsAt("");
    setQuizModalOpen(true);
  };

  const openQuizEdit = (quiz: Quiz) => {
    setEditingQuizId(quiz.id);
    setQuizTitle(quiz.title);
    setQuizLessonId(quiz.lessonId || allLessons[0]?.id || "");
    setQuizPassingScore(quiz.passingScore);
    setQuizTimeLimit(quiz.timeLimitMinutes ?? undefined);
    setQuizStartsAt(toDateTimeLocalValue(quiz.startsAt));
    setQuizEndsAt(toDateTimeLocalValue(quiz.endsAt));
    setQuizModalOpen(true);
  };

  const handleToggleQuizPublish = async (quiz: Quiz) => {
    const response = await fetch(`/api/quizzes/${quiz.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !quiz.isPublished }),
    });
    if (response.ok) await refreshData();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" dir="rtl">
        <div className="h-6 w-1/4 bg-slate-200 rounded" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4" dir="rtl">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600">
            !
          </div>
          <h1 className="text-2xl font-black text-slate-900">الكورس غير موجود</h1>
          <p className="mt-3 text-sm text-slate-600">
            {loadError || "قد يكون الرابط غير صحيح أو تم حذف هذا الكورس."}
          </p>
          <Button
            onClick={() => router.push("/admin/courses")}
            className="mt-6 bg-[#0B2D5B] hover:bg-blue-700 text-white font-bold"
          >
            العودة إلى قائمة الكورسات
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/courses"
            className="p-2 rounded-lg border border-slate-300 hover:bg-slate-200 transition-colors bg-white shadow-sm"
            title="العودة للكورسات"
          >
            <ArrowRight className="h-4 w-4 text-slate-700" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 truncate max-w-xl">
                {course.title}
              </h1>
              <Badge variant={course.status === "PUBLISHED" ? "success" : "warning"}>
                {course.status === "PUBLISHED" ? "منشور" : "مسودة"}
              </Badge>
            </div>
            <p className="text-xs font-mono text-slate-500 dir-ltr text-right">{course.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/courses/${course.id}`} target="_blank">
            <Button variant="outline" size="sm" className="text-xs flex items-center gap-1 bg-white">
              <Eye className="h-3.5 w-3.5 ml-1 text-slate-500" />
              <span>معاينة صفحة الكورس</span>
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={handleTogglePublish}
            className={`text-xs font-bold ${
              course.status === "PUBLISHED"
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {course.status === "PUBLISHED" ? "إلغاء النشر" : "نشر الكورس للعامة"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Curriculum Modules & Lessons */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              <span>الوحدات التدريبية والدروس</span>
            </h2>
            <Button
              size="sm"
              onClick={() => setSectionModalOpen(true)}
              className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold h-8 flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>إضافة وحدة جديدة</span>
            </Button>
          </div>

          {sections.length === 0 ? (
            <Card className="p-8 text-center bg-white border-slate-200 space-y-3 shadow-sm">
              <p className="text-sm text-slate-500">لم يتم إضافة وحدات لهذا المنهج بعد.</p>
              <Button size="sm" variant="outline" onClick={() => setSectionModalOpen(true)}>
                إنشاء أول وحدة
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {sections.map((section, sIdx) => (
                <Card key={section.id} className="bg-white border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        الوحدة {sIdx + 1}: {section.title}
                      </h3>
                      {section.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTargetSectionId(section.id);
                        setLessonTitle("");
                        setLessonSlug("");
                        setLessonContent("");
                        setVideoUrl("");
                        setLessonType("VIDEO");
                        setVideoSource("YOUTUBE");
                        setUnlockRule("PREVIOUS_LESSON");
                        setLessonDuration(600);
                        setIsFreePreview(false);
                        setLessonModalOpen(true);
                      }}
                      className="h-7 text-xs flex items-center gap-1 bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <PlusCircle className="h-3 w-3 ml-1" />
                      <span>إضافة درس</span>
                    </Button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {section.lessons?.length === 0 ? (
                      <p className="p-4 text-xs text-slate-400 italic">
                        لا توجد دروس في هذه الوحدة حتى الآن. اضغط على &ldquo;إضافة درس&rdquo;.
                      </p>
                    ) : (
                      section.lessons?.map((lesson, lIdx) => (
                        <div
                          key={lesson.id}
                          className="p-3.5 px-4 flex items-center justify-between hover:bg-slate-50/60 text-xs sm:text-sm transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                              {lesson.lessonType === "VIDEO" ? (
                                <PlayCircle className="h-4 w-4" />
                              ) : (
                                <FileCode className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {lIdx + 1}. {lesson.title}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                <span>{Math.floor(lesson.durationSeconds / 60)} دقيقة</span>
                                {lesson.videoSource && (
                                  <>
                                    <span>•</span>
                                    <span className="text-blue-600 font-bold">{lesson.videoSource}</span>
                                  </>
                                )}
                                {lesson.unlockRule && (
                                  <>
                                    <span>•</span>
                                    <span className="text-indigo-600 font-semibold">{lesson.unlockRule}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {lesson.isFreePreview && (
                              <Badge variant="cyan" className="text-[9px] px-2 py-0.5">
                                معاينة مجانية
                              </Badge>
                            )}
                            <button
                              type="button"
                              onClick={() => openLessonEditor(lesson)}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              title="تعديل الدرس"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleLessonPublish(lesson)}
                              className={`px-2 py-1 rounded text-[10px] font-bold ${lesson.isPublished ? "text-amber-700 bg-amber-50" : "text-emerald-700 bg-emerald-50"}`}
                            >
                              {lesson.isPublished ? "إلغاء النشر" : "نشر"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="حذف الدرس"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Section Assessments / Quizzes */}
          <div className="quiz-manager-panel space-y-4 pt-4 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-indigo-600" />
                <span>اختبارات التقييم والتحقق من المعرفة</span>
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={openQuizCreate}
                className="text-xs h-8 flex items-center gap-1.5 bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl"
              >
                <PlusCircle className="h-3.5 w-3.5 ml-1" />
                <span>إضافة اختبار</span>
              </Button>
            </div>

            <div className="space-y-2">
              {quizzes.length === 0 ? (
                <p className="text-xs text-slate-400 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  لا توجد اختبارات تقييمية مرتبطة بهذا الكورس بعد.
                </p>
              ) : (
                quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="quiz-manager-item p-3.5 rounded-2xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{quiz.title}</p>
                      <p className="text-slate-500 text-[11px]">
                        المحاضرة: {(() => {
                          const selectedLesson = allLessons.find((lesson) => lesson.id === quiz.lessonId);
                          return selectedLesson ? `${selectedLesson.sectionTitle} / ${selectedLesson.title}` : "غير مرتبط بمحاضرة";
                        })()}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        نسبة النجاح: {quiz.passingScore}% • زمن الاختبار: {quiz.timeLimitMinutes || "غير محدد"} دقيقة
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        الفترة: {formatSchedule(quiz.startsAt)} - {formatSchedule(quiz.endsAt)}
                      </p>
                      {quiz.questions?.map((question) => (
                        <p key={question.id} className="text-[11px] text-slate-600 mt-1">
                          <span>سؤال: {question.prompt} ({question.options?.filter((option) => option.isCorrect).length || 0} إجابة صحيحة)</span>
                          <button
                            type="button"
                            onClick={() => openQuestionEditor(quiz.id, question)}
                            className="mr-2 inline-flex items-center gap-1 rounded border border-blue-200 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 hover:bg-blue-50"
                            aria-label={`تعديل السؤال ${question.prompt}`}
                          >
                            <Edit className="h-2.5 w-2.5" />
                            تعديل
                          </button>
                        </p>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openQuizEdit(quiz)}
                        title="تعديل الاختبار"
                        aria-label={`تعديل الاختبار ${quiz.title}`}
                        className="h-7 gap-1 border-blue-200 text-[10px] text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-3 w-3" />
                        <span>تعديل</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openQuestionEditor(quiz.id)}
                        className="h-7 text-[10px] border-blue-200 text-blue-700"
                      >
                        إضافة سؤال
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleQuizPublish(quiz)}
                        className="h-7 text-[10px] border-emerald-200 text-emerald-700"
                      >
                        {quiz.isPublished ? "إلغاء نشر الاختبار" : "نشر الاختبار"}
                      </Button>
                      <Badge variant="cyan" className="text-[10px]">
                        مضبوط وجاهز
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Course Metadata & Settings Editor */}
        <div className="space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                بيانات وإعدادات الكورس
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                تعديل السعر، الأدوات، المتطلبات المسبقة، ومخرجات التعلم.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSaveMetadata} className="space-y-4">
                {saveSuccess && (
                  <Alert variant="success">
                    <AlertDescription>تم حفظ وتحديث بيانات الكورس بنجاح!</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">عنوان الكورس</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">المستوى التدريبي</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as CourseDetail["level"])}
                    className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BEGINNER">مبتدئ (Beginner)</option>
                    <option value="INTERMEDIATE">متوسط (Intermediate)</option>
                    <option value="ADVANCED">متقدم (Advanced)</option>
                    <option value="ALL_LEVELS">جميع المستويات (All Levels)</option>
                  </select>
                </div>

                {/* Price & Currency */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">السعر</label>
                    <Input
                      type="number"
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      disabled={isFree}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">العملة</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="EGP">EGP</option>
                      <option value="SAR">SAR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFreeDetail"
                    checked={isFree}
                    onChange={(e) => setIsFree(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isFreeDetail" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    كورس مجاني بالكامل
                  </label>
                </div>

                <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
                  <input
                    type="checkbox"
                    id="certificatesEnabled"
                    checked={certificatesEnabled}
                    onChange={(e) => setCertificatesEnabled(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="certificatesEnabled" className="text-xs font-semibold text-emerald-900 cursor-pointer">
                    تفعيل إصدار الشهادات لهذا الكورس
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">اختر صورة الكورس</label>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCoverFileSelect(file);
                        }}
                        disabled={coverUploading}
                        className="block w-full text-xs text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WebP — max 5MB</p>
                    </div>
                    {coverUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveCover}
                        className="px-3 py-2 text-xs font-bold text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                  {coverUploading && (
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <span className="inline-block w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                      جارٍ رفع الصورة...
                    </div>
                  )}
                  {coverUploadError && (
                    <div className="text-xs text-red-600">{coverUploadError}</div>
                  )}
                  {(coverPreview || (coverUrl && !coverPreview)) && (
                    <div className="mt-2">
                      {coverPreview ? (
                        <img
                          src={coverPreview}
                          alt="Cover preview"
                          className="aspect-video w-full max-w-sm object-cover rounded-lg border border-slate-200 bg-slate-50"
                        />
                      ) : coverUrl ? (
                        <img
                          src={coverUrl}
                          alt="Current cover"
                          className="aspect-video w-full max-w-sm object-cover rounded-lg border border-slate-200 bg-slate-50"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">الأدوات المستخدمة (مفصولة بفاصلة)</label>
                  <Input
                    placeholder="Python, Pandas, SQL, Tableau, Git"
                    value={toolsStr}
                    onChange={(e) => setToolsStr(e.target.value)}
                    className="text-xs font-mono dir-ltr text-right"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">المتطلبات المسبقة (كل متطلب في سطر)</label>
                  <Textarea
                    rows={2}
                    placeholder="أساسيات الرياضيات والإحصاء&#10;معرفة مبسطة بالحاسوب"
                    value={requirementsStr}
                    onChange={(e) => setRequirementsStr(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">ماذا سيتعلم الطالب (كل نقطة في سطر)</label>
                  <Textarea
                    rows={3}
                    placeholder="تحليل وتنظيف البيانات المعقدة&#10;بناء نماذج إحصائية وتنبؤية&#10;إنشاء لوحات تحكم تفاعلية"
                    value={learnOutcomesStr}
                    onChange={(e) => setLearnOutcomesStr(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نبذة مختصرة</label>
                  <Input
                    value={shortDesc}
                    onChange={(e) => setShortDesc(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">الوصف التفصيلي للمنهج</label>
                  <Textarea
                    rows={4}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSavingMeta}
                  className="w-full bg-[#0B2D5B] hover:bg-blue-700 text-white font-bold text-xs h-9 flex items-center justify-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5 ml-1" />
                  <span>{isSavingMeta ? "جاري الحفظ..." : "حفظ التعديلات"}</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Section Dialog */}
      <Dialog open={sectionModalOpen} onOpenChange={setSectionModalOpen}>
        <DialogHeader>
          <DialogTitle>إضافة وحدة تعليمية جديدة</DialogTitle>
          <DialogDescription>
            أنشئ قسماً أو فصلاً جديداً لتنظيم الدروس والواجبات المرتبطة به.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddSection} className="space-y-4 py-2 text-right">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">عنوان الوحدة / الأسبوع</label>
            <Input
              placeholder="مثال: الوحدة الأولى: مقدمة في لغة بايثون وتحليل البيانات"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">الوصف (اختياري)</label>
            <Textarea
              rows={2}
              placeholder="نظرة موجزة عن المهارات المغطاة في هذه الوحدة..."
              value={sectionDesc}
              onChange={(e) => setSectionDesc(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSectionModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isAddingSection}
              className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold"
            >
              {isAddingSection ? "جاري الإضافة..." : "إضافة الوحدة"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Add Lesson Dialog */}
      <Dialog open={lessonModalOpen} onOpenChange={setLessonModalOpen}>
        <DialogHeader>
          <DialogTitle>إضافة درس تعليمي</DialogTitle>
          <DialogDescription>
            حدد نوع المحتوى، مصدر الفيديو، وقاعدة الفتح التتابعي للدرس.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddLesson} className="space-y-4 py-2 text-right">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">عنوان الدرس</label>
            <Input
              placeholder="مثال: تنظيف وتجهيز البيانات باستخدام Pandas"
              value={lessonTitle}
              onChange={(e) => {
                setLessonTitle(e.target.value);
                if (!lessonSlug) {
                  setLessonSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^\p{L}\p{N}]+/gu, "-")
                      .replace(/^-+|-+$/g, "")
                  );
                }
              }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">نوع الدرس</label>
              <select
                value={lessonType}
                onChange={(e) => setLessonType(e.target.value as "VIDEO" | "TEXT")}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="VIDEO">درس فيديو (Video)</option>
                <option value="TEXT">مقال / شرح نصي (Text)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">المدة التقديرية (بالثواني)</label>
              <Input
                type="number"
                value={lessonDuration}
                onChange={(e) => setLessonDuration(Number(e.target.value))}
              />
            </div>
          </div>

          {lessonType === "VIDEO" && (
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">مصدر استضافة الفيديو</label>
                <select
                  value={videoSource}
                  onChange={(e) => setVideoSource(e.target.value as "YOUTUBE" | "GOOGLE_DRIVE" | "ONEDRIVE" | "SHAREPOINT" | "UPLOAD")}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="YOUTUBE">YouTube (Unlisted / Public)</option>
                  <option value="GOOGLE_DRIVE">Google Drive (Shared Preview)</option>
                  <option value="ONEDRIVE">Microsoft OneDrive</option>
                  <option value="SHAREPOINT">SharePoint Stream</option>
                  <option value="UPLOAD">Direct Cloud Upload (S3 / Presigned)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">رابط الفيديو أو المعرف (URL / ID)</label>
                <Input
                  placeholder="https://www.youtube.com/watch?v=... أو معرف Drive"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="font-mono text-xs dir-ltr text-left"
                />
              </div>
            </div>
          )}

          {/* Sequential Unlock Rule */}
          <div className="space-y-1 bg-blue-50/60 p-3 rounded-xl border border-blue-200">
            <label className="text-xs font-bold text-[#0B2D5B] flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              <span>قاعدة الفتح التتابعي (Unlock Rule)</span>
            </label>
            <select
              value={unlockRule}
              onChange={(e) => setUnlockRule(e.target.value as "IMMEDIATE" | "PREVIOUS_LESSON" | "TASK_SUBMISSION" | "QUIZ_PASS")}
              className="flex h-10 w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="IMMEDIATE">متاح فوراً عند التسجيل (Immediate)</option>
              <option value="PREVIOUS_LESSON">يتطلب إكمال الدرس السابق (Sequential)</option>
              <option value="TASK_SUBMISSION">يتطلب تسليم الواجب/التكليف (Task Submission)</option>
              <option value="QUIZ_PASS">يتطلب اجتياز الاختبار بنجاح (Quiz Pass)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="freePreview"
              checked={isFreePreview}
              onChange={(e) => setIsFreePreview(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <label htmlFor="freePreview" className="text-xs text-slate-700 cursor-pointer font-bold">
              معاينة مجانية (متاح للجميع دون الحاجة للاشتراك)
            </label>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">ملاحظات ومحتوى الدرس النصي (Markdown)</label>
            <Textarea
              rows={4}
              placeholder="شروحات برمجية، روابط خارجية، مذكرات الدرس..."
              value={lessonContent}
              onChange={(e) => setLessonContent(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLessonModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isAddingLesson}
              className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold"
            >
              {isAddingLesson ? "جاري الإضافة..." : "إضافة الدرس"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Lesson Dialog */}
      <Dialog open={lessonEditOpen} onOpenChange={setLessonEditOpen}>
        <DialogHeader>
          <DialogTitle>تعديل الدرس</DialogTitle>
          <DialogDescription>عدّل محتوى الدرس، مصدر الفيديو، حالة النشر والمرفقات.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSaveLesson} className="space-y-4 py-2 text-right">
          {lessonUploadError && <Alert variant="destructive"><AlertDescription>{lessonUploadError}</AlertDescription></Alert>}
          <Input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="عنوان الدرس" required />
          <div className="grid grid-cols-2 gap-3">
            <select value={lessonType} onChange={(e) => setLessonType(e.target.value as "VIDEO" | "TEXT")} className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs">
              <option value="VIDEO">فيديو</option>
              <option value="TEXT">نصي</option>
            </select>
            <Input type="number" min={0} value={lessonDuration} onChange={(e) => setLessonDuration(Number(e.target.value))} placeholder="المدة بالثواني" />
          </div>
          {lessonType === "VIDEO" && (
            <>
              <select value={videoSource} onChange={(e) => setVideoSource(e.target.value as typeof videoSource)} className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs">
                <option value="YOUTUBE">YouTube</option>
                <option value="GOOGLE_DRIVE">Google Drive</option>
                <option value="ONEDRIVE">OneDrive</option>
                <option value="SHAREPOINT">SharePoint</option>
                <option value="UPLOAD">رفع مباشر</option>
              </select>
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="رابط الفيديو" />
              <label className="block text-xs font-bold text-slate-700">استبدال ملف الفيديو
                <input type="file" accept="video/*" className="mt-1 block w-full text-xs" onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleLessonUpload(file, "VIDEO"); e.currentTarget.value = ""; }} />
              </label>
            </>
          )}
          <Textarea rows={5} value={lessonContent} onChange={(e) => setLessonContent(e.target.value)} placeholder="محتوى الدرس" />
          <label className="block text-xs font-bold text-slate-700">إضافة ملف للدرس
            <input type="file" accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.zip" className="mt-1 block w-full text-xs" onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleLessonUpload(file, file.type === "application/pdf" ? "PDF" : "DOCUMENT"); e.currentTarget.value = ""; }} />
          </label>

          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label className="block text-xs font-bold text-slate-700">رابط Google Drive / ملف خارجي</label>
            <Input
              value={lessonDriveUrl}
              onChange={(e) => setLessonDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="font-mono text-xs dir-ltr text-left"
            />
            <Input
              value={lessonDriveName}
              onChange={(e) => setLessonDriveName(e.target.value)}
              placeholder="اسم الملف الذي سيظهر للطلاب"
              className="text-xs"
            />
            <Button type="button" variant="outline" className="w-full" onClick={() => void handleAddLessonDriveLink()}>
              ربط رابط الملف
            </Button>
          </div>

          {editingLesson?.files?.map((file) => <p key={file.id} className="text-xs text-slate-600">ملف مرتبط: {file.originalName}</p>)}
          {lessonFileAsset && <p className="text-xs text-emerald-700">تم ربط الملف: {lessonFileAsset.originalName}</p>}
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700"><input type="checkbox" checked={editingLesson?.isFreePreview || false} onChange={(e) => setIsFreePreview(e.target.checked)} /> معاينة مجانية</label>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setLessonEditOpen(false)}>إلغاء</Button>
            <Button type="submit" disabled={isSavingLesson} className="bg-[#2563EB] text-white">{isSavingLesson ? "جاري الحفظ..." : "حفظ الدرس"}</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Add Quiz Dialog */}
      <Dialog open={quizModalOpen} onOpenChange={setQuizModalOpen}>
        <DialogHeader>
          <DialogTitle>{editingQuizId ? "تعديل الاختبار" : "إعداد اختبار تقييمي جديد"}</DialogTitle>
          <DialogDescription>
            حدد معايير الاختبار، درجة النجاح، والوقت المحدد للمحاولة.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddQuiz} className="quiz-form-card space-y-4 rounded-2xl p-4 py-3 text-right">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">عنوان الاختبار</label>
            <Input
              placeholder="مثال: تقييم الوحدة الأولى في التحليل الإحصائي"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">تحديد المحاضرة المرتبطة بهذا الاختبار</label>
            <select
              value={quizLessonId}
              onChange={(e) => setQuizLessonId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">لا يوجد ربط مباشر بمحاضرة</option>
              {allLessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.sectionTitle} / {lesson.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <label className="text-xs font-bold text-slate-700">الوقت المحدد (بالدقائق)</label>
              <Input
                type="number"
                min={1}
                value={quizTimeLimit || ""}
                placeholder="20"
                onChange={(e) => setQuizTimeLimit(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">يفتح الامتحان</label>
              <Input
                type="datetime-local"
                value={quizStartsAt}
                onChange={(e) => setQuizStartsAt(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">يغلق الامتحان</label>
              <Input
                type="datetime-local"
                value={quizEndsAt}
                min={quizStartsAt || undefined}
                onChange={(e) => setQuizEndsAt(e.target.value)}
              />
            </div>
            <p className="sm:col-span-2 text-[11px] text-slate-500">
              اترك الموعدين فارغين ليظل الامتحان متاحًا حسب حالة النشر فقط.
            </p>
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
              disabled={isAddingQuiz}
              className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold"
            >
              {isAddingQuiz ? "جاري الحفظ..." : editingQuizId ? "حفظ تعديلات الاختبار" : "إنشاء الاختبار"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Add Quiz Question Dialog */}
      <Dialog open={questionModalOpen} onOpenChange={setQuestionModalOpen}>
        <DialogHeader>
          <DialogTitle>{editingQuestionId ? "تعديل سؤال الاختبار" : "إضافة سؤال للاختبار"}</DialogTitle>
          <DialogDescription>أدخل السؤال وخياراته وحدد الإجابة الصحيحة.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddQuestion} className="space-y-4 py-2 text-right">
          <Textarea rows={3} value={questionPrompt} onChange={(e) => setQuestionPrompt(e.target.value)} placeholder="نص السؤال" required />
          <Input type="number" min={1} value={questionPoints} onChange={(e) => setQuestionPoints(Number(e.target.value))} placeholder="النقاط" />
          <div className="space-y-2">
            {questionOptions.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input type="radio" name="correctOption" checked={option.isCorrect} onChange={() => setQuestionOptions((current) => current.map((item, itemIndex) => ({ ...item, isCorrect: itemIndex === index })))} />
                <Input value={option.text} onChange={(e) => setQuestionOptions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, text: e.target.value } : item))} placeholder={`الخيار ${index + 1}`} required={index < 2} />
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setQuestionModalOpen(false)}>إلغاء</Button>
            <Button type="submit" disabled={isAddingQuestion} className="bg-[#2563EB] text-white">{isAddingQuestion ? "جاري الحفظ..." : editingQuestionId ? "حفظ تعديلات السؤال" : "إضافة السؤال"}</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
