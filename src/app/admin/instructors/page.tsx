"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

interface Instructor {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
}

export default function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadInstructors() {
      try {
        const response = await fetch("/api/admin/instructors");
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || "تعذر تحميل المدربين");
        if (!cancelled) setInstructors(result.data?.instructors ?? []);
      } catch (error) {
        if (!cancelled) {
          setCreateError(error instanceof Error ? error.message : "تعذر تحميل المدربين");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadInstructors();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateInstructor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(false);

    try {
      const response = await fetch("/api/admin/instructors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          bio: bio.trim() || undefined,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error?.message || "فشل إنشاء حساب المدرب");

      setInstructors((current) => [...current, result.data.instructor].sort((a, b) =>
        a.fullName.localeCompare(b.fullName, "ar")
      ));
      setFullName("");
      setEmail("");
      setPassword("");
      setBio("");
      setCreateSuccess(true);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "فشل إنشاء حساب المدرب");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveInstructor = async (instructor: Instructor) => {
    setSaveErrors((current) => ({ ...current, [instructor.id]: "" }));
    setSavedIds((current) => current.filter((id) => id !== instructor.id));

    try {
      const response = await fetch("/api/admin/instructors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructorId: instructor.id,
          fullName: instructor.fullName.trim(),
          bio: instructor.bio?.trim() || null,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error?.message || "فشل حفظ بيانات المدرب");

      setSavedIds((current) => [...current, instructor.id]);
    } catch (error) {
      setSaveErrors((current) => ({
        ...current,
        [instructor.id]: error instanceof Error ? error.message : "فشل حفظ بيانات المدرب",
      }));
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <header>
        <h1 className="text-2xl font-black text-slate-900">إدارة المدربين</h1>
        <p className="mt-1 text-sm text-slate-500">إنشاء ملفات المدربين وتحديث أسمائهم ونبذتهم.</p>
      </header>

      <section className="border-b border-slate-200 pb-6">
        <h2 className="mb-3 text-sm font-bold text-slate-800">إضافة مدرب</h2>
        <form onSubmit={handleCreateInstructor} className="grid gap-3 md:grid-cols-2">
          <Input
            required
            minLength={2}
            maxLength={120}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="اسم المدرب"
            aria-label="اسم المدرب"
          />
          <Input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="البريد الإلكتروني"
            aria-label="البريد الإلكتروني للمدرب"
          />
          <div className="space-y-1">
            <Input
              required
              type="password"
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="كلمة مرور مؤقتة"
              aria-label="كلمة المرور المؤقتة"
            />
            <p className="text-[10px] text-slate-500">يجب أن تتضمن حرفًا كبيرًا وصغيرًا ورقمًا ورمزًا.</p>
          </div>
          <Textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            maxLength={2000}
            rows={2}
            placeholder="نبذة المدرب وخبراته"
            aria-label="نبذة المدرب"
          />
          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "جارٍ إنشاء الحساب" : "إضافة المدرب"}
            </Button>
            {createSuccess && <span className="text-xs text-emerald-700">تمت إضافة المدرب.</span>}
            {createError && <span role="alert" className="text-xs text-red-600">{createError}</span>}
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold text-slate-800">المدربون المسجلون ({instructors.length})</h2>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-slate-500">جارٍ تحميل المدربين...</p>
        ) : instructors.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">لا توجد حسابات مدربين حتى الآن.</p>
        ) : (
          <div className="space-y-3">
            {instructors.map((instructor) => (
              <Card key={instructor.id} className="grid gap-3 p-4 md:grid-cols-[1fr_1.5fr_auto] md:items-start">
                <div className="space-y-2">
                  <Input
                    required
                    minLength={2}
                    maxLength={120}
                    value={instructor.fullName}
                    aria-label={`اسم ${instructor.email}`}
                    onChange={(event) =>
                      setInstructors((current) => current.map((item) =>
                        item.id === instructor.id ? { ...item, fullName: event.target.value } : item
                      ))
                    }
                  />
                  <p className="text-xs text-slate-500">{instructor.email}</p>
                </div>
                <Textarea
                  value={instructor.bio ?? ""}
                  maxLength={2000}
                  rows={3}
                  placeholder="نبذة المدرب وخبراته"
                  aria-label={`نبذة ${instructor.fullName}`}
                  onChange={(event) =>
                    setInstructors((current) => current.map((item) =>
                      item.id === instructor.id ? { ...item, bio: event.target.value } : item
                    ))
                  }
                />
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => handleSaveInstructor(instructor)}>
                    حفظ
                  </Button>
                  {savedIds.includes(instructor.id) && <span className="text-xs text-emerald-700">تم الحفظ</span>}
                  {saveErrors[instructor.id] && <span role="alert" className="text-xs text-red-600">{saveErrors[instructor.id]}</span>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}