"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  GraduationCap,
  Award,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems = [
    { label: "الرئيسية", href: "/" },
    { label: "الكورسات", href: "/courses" },
    { label: "عن الأكاديمية", href: "/about" },
    { label: "تواصل معنا", href: "/contact" },
    { label: "التحقق من الشهادات", href: "/verify" },
  ];

  const isCurrent = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Logo href="/" size="md" showTagline={false} />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors py-1 relative",
                isCurrent(item.href)
                  ? "text-[#2563EB] font-bold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {item.label}
              {isCurrent(item.href) && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* Auth CTA & User Menu */}
        <div className="hidden md:flex items-center gap-3">
          {isLoading ? (
            <div className="h-9 w-24 bg-slate-100 animate-pulse rounded-md" />
          ) : isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-expanded={userDropdownOpen}
              >
                <div className="h-7 w-7 rounded-full bg-[#0B2D5B] text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {user.fullName.charAt(0)}
                </div>
                <div className="text-right text-xs pl-1">
                  <p className="font-semibold text-slate-900 truncate max-w-[130px]">
                    {user.fullName}
                  </p>
                  <p className="text-[10px] text-[#2563EB] font-medium">
                    {user.role === "ADMIN"
                      ? "مدير المنصة"
                      : user.role === "INSTRUCTOR"
                      ? "معلم / مدرب"
                      : "طالب"}
                  </p>
                </div>
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-56 rounded-xl bg-white p-1.5 shadow-xl border border-slate-200 z-50 text-sm animate-in fade-in zoom-in-95 duration-150 text-right"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="font-bold text-slate-900 truncate">{user.fullName}</p>
                    <p className="text-xs text-slate-500 truncate font-mono">{user.email}</p>
                  </div>

                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <ShieldCheck className="h-4 w-4 text-[#0B2D5B]" />
                      <span>لوحة تحكم الإدارة</span>
                    </Link>
                  )}

                  {user.role === "INSTRUCTOR" && (
                    <Link
                      href="/instructor"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <GraduationCap className="h-4 w-4 text-[#2563EB]" />
                      <span>لوحة تحكم المعلم</span>
                    </Link>
                  )}

                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4 text-slate-500" />
                    <span>لوحة دراستي (الطلاب)</span>
                  </Link>

                  <Link
                    href="/courses"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <BookOpen className="h-4 w-4 text-slate-500" />
                    <span>تصفح الكورسات</span>
                  </Link>

                  <Link
                    href="/verify"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Award className="h-4 w-4 text-slate-500" />
                    <span>التحقق من الشهادات</span>
                  </Link>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => logout()}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-right"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                تسجيل الدخول
              </Link>
              <Link href="/register">
                <Button size="md" className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm font-bold">
                  إنشاء حساب جديد
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200 text-right">
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-3 py-2 rounded-lg text-base font-medium transition-colors",
                  isCurrent(item.href)
                    ? "bg-blue-50 text-[#2563EB] font-bold"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="px-3 py-1">
                  <p className="font-bold text-slate-900">{user.fullName}</p>
                  <p className="text-xs text-slate-500 font-mono">{user.email}</p>
                </div>

                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#0B2D5B] hover:bg-blue-50 font-bold"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>لوحة تحكم الإدارة</span>
                  </Link>
                )}

                {user.role === "INSTRUCTOR" && (
                  <Link
                    href="/instructor"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#2563EB] hover:bg-blue-50 font-bold"
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>لوحة تحكم المعلم</span>
                  </Link>
                )}

                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100"
                >
                  <LayoutDashboard className="h-4 w-4 text-blue-600" />
                  <span>لوحة دراستي</span>
                </Link>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-right font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2.5 rounded-lg bg-[#2563EB] text-sm font-bold text-white hover:bg-[#1D4ED8] shadow-sm"
                >
                  إنشاء حساب
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
