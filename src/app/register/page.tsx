"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Mail, User, Check, X } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      setError("يرجى ملء جميع الحقول المطلوبة.");
      return;
    }

    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      setError("يرجى استيفاء جميع شروط كلمة المرور.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await register(fullName.trim(), email.trim(), password);
    if (!result.success) {
      setError(result.error || "فشل في إنشاء الحساب. تأكد من صحة البيانات المدخلة.");
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6" dir="rtl">
      <Card className="w-full max-w-md bg-white border-slate-200 shadow-xl">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="flex justify-center mb-2">
            <Logo variant="app-icon" size="md" href="/" />
          </div>
          <CardTitle className="text-2xl font-black text-slate-900">
            إنشاء حساب جديد
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-slate-500">
            ابدأ رحلتك في احتراف تحليل البيانات والذكاء الاصطناعي مع كيميكس.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-right">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">الاسم الكامل *</label>
              <div className="relative">
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="مثال: أحمد محمد علي"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pr-10"
                  required
                  autoComplete="name"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                سيظهر هذا الاسم رسمياً على الشهادات الرقمية المعتمدة الصادرة لك.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">البريد الإلكتروني *</label>
              <div className="relative">
                <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="ahmed@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10 font-mono text-xs dir-ltr text-left"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">كلمة المرور *</label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 font-mono text-xs dir-ltr text-left"
                  required
                  autoComplete="new-password"
                />
              </div>

              {password.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1 mt-2">
                  <p className="font-bold text-slate-700 mb-1.5">شروط أمان كلمة المرور:</p>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                      {hasMinLength ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      <span>8 أحرف أو أكثر</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUppercase ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                      {hasUppercase ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      <span>حرف كبير (Uppercase)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasLowercase ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                      {hasLowercase ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      <span>حرف صغير (Lowercase)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasNumber && hasSpecial ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                      {hasNumber && hasSpecial ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      <span>رقم ورمز خاص (@, #)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0B2D5B] hover:bg-[#2563EB] text-white font-bold h-11 shadow-sm mt-2 transition-colors"
            >
              {isLoading ? "جاري إنشاء الحساب..." : "إنشاء الحساب وبدء التعلم"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 text-center border-t border-slate-100 pt-4 text-xs text-slate-500">
          <p>
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="font-bold text-[#2563EB] hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
