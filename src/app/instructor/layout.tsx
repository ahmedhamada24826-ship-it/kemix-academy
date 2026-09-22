"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Logo } from "@/components/brand/logo";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  LogOut,
  ChevronLeft,
  FileCheck,
  HelpCircle,
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login?returnUrl=/instructor");
      } else if (user && user.role !== "INSTRUCTOR" && user.role !== "ADMIN") {
        router.push("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !user || (user.role !== "INSTRUCTOR" && user.role !== "ADMIN")) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#07162C] text-white" dir="rtl">
        <div className="space-y-3 text-center animate-pulse">
          <Logo variant="app-icon" size="md" className="mx-auto" />
          <p className="text-sm font-medium text-slate-400">جاري التحقق من صلاحيات المعلم...</p>
        </div>
      </div>
    );
  }

  const navLinks = [
    { label: "نظرة عامة", href: "/instructor", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "كورساتي التعليمية", href: "/instructor/courses", icon: <BookOpen className="h-4 w-4" /> },
    { label: "طلابي", href: "/instructor/students", icon: <Users className="h-4 w-4" /> },
    { label: "تسليمات التكليفات", href: "/instructor/tasks", icon: <FileCheck className="h-4 w-4" /> },
    { label: "نتائج الاختبارات", href: "/instructor/quizzes", icon: <HelpCircle className="h-4 w-4" /> },
    { label: "تقارير الأداء", href: "/instructor/performance", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-slate-100" dir="rtl">
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed bottom-5 left-5 z-50">
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="h-12 w-12 rounded-full bg-[#0B2D5B] text-white shadow-xl flex items-center justify-center focus:outline-none"
          aria-label="قائمة المعلم"
        >
          {mobileNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Instructor Sidebar */}
      <aside
        className={cn(
          "w-64 bg-[#07162C] border-l border-slate-800 text-slate-300 flex flex-col justify-between p-4 fixed md:sticky top-16 h-[calc(100vh-64px)] z-40 transition-transform duration-200 overflow-y-auto",
          mobileNavOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        )}
      >
        <div className="space-y-5">
          <div className="px-2 pt-1">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-950/80 border border-blue-800/60 text-cyan-300 text-xs font-bold">
              <GraduationCap className="h-4 w-4" />
              <span>لوحة المعلم والمدرب</span>
            </div>
          </div>

          <nav className="space-y-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/instructor"
                  ? pathname === "/instructor"
                  : pathname === link.href || pathname.startsWith(link.href + "/");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors",
                    isActive
                      ? "bg-[#2563EB] text-white font-bold shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {link.icon}
                    <span>{link.label}</span>
                  </div>
                  {isActive && <ChevronLeft className="h-3.5 w-3.5 text-blue-200" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Instructor User Card */}
        <div className="border-t border-slate-800 pt-4 px-2 space-y-3 mt-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs">
              {user.fullName.charAt(0)}
            </div>
            <div className="text-xs truncate">
              <p className="font-bold text-white truncate">{user.fullName}</p>
              <p className="text-[10px] text-slate-400 font-mono">{user.email}</p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Instructor Content Container */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl">
        {children}
      </main>
    </div>
  );
}
