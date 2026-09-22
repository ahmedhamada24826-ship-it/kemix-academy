"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Shield, Calendar } from "lucide-react";

export default function StudentProfilePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="container mx-auto max-w-2xl py-10 px-4 space-y-4 animate-pulse" dir="rtl">
        <div className="h-8 w-1/4 bg-slate-200 rounded" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="container mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#0B2D5B]">الملف الشخصي</h1>
            <p className="text-xs text-slate-500 mt-1">بيانات حسابك في منصة KEMIX Academy</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="text-xs font-bold">
              العودة للوحة دراستي
            </Button>
          </Link>
        </div>

        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-[#07162C] text-white p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-2xl uppercase border-2 border-blue-400">
                {user.fullName.charAt(0)}
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold text-white">{user.fullName}</CardTitle>
                <Badge variant="cyan" className="text-xs font-mono">
                  {user.role === "ADMIN" ? "مدير المنصة" : user.role === "INSTRUCTOR" ? "معلم / مدرب" : "طالب"}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <span className="text-xs text-slate-500 block">البريد الإلكتروني:</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{user.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="text-xs text-slate-500 block">حالة الحساب:</span>
                <span className="text-sm font-bold text-emerald-700">نشط ومعتمد ✓</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
              <Button
                variant="destructive"
                onClick={() => logout()}
                className="text-xs font-bold"
              >
                تسجيل الخروج من الحساب
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
