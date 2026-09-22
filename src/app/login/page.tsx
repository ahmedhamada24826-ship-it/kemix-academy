"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Mail } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await login(email, password, rememberMe);
    if (!result.success) {
      setError(result.error || "بيانات تسجيل الدخول غير صحيحة.");
      setIsLoading(false);
      return;
    }

    router.push(returnUrl);
    router.refresh();
  };

  return (
    <Card className="w-full max-w-md bg-white border-slate-200 shadow-xl" dir="rtl">
      <CardHeader className="text-center space-y-2 pb-4">
        <div className="flex justify-center mb-2">
          <Logo variant="app-icon" size="md" href="/" />
        </div>
        <CardTitle className="text-2xl font-black text-slate-900">
          تسجيل الدخول إلى حسابك
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-slate-500">
          أدخل بياناتك للمتابعة إلى قاعة التعلم، التكليفات، وشهاداتك.
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
            <label className="text-xs font-bold text-slate-700">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pr-10 font-mono text-xs dir-ltr text-left"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 font-mono text-xs dir-ltr text-left"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span>تذكرني لمدة 30 يوماً</span>
            </label>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0B2D5B] hover:bg-[#2563EB] text-white font-bold h-11 shadow-sm transition-colors"
          >
            {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-3 text-center border-t border-slate-100 pt-4 text-xs text-slate-500">
        <p>
          ليس لديك حساب بعد؟{" "}
          <Link href="/register" className="font-bold text-[#2563EB] hover:underline">
            إنشاء حساب جديد
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6" dir="rtl">
      <Suspense fallback={<div className="h-96 w-full max-w-md bg-white rounded-xl animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
