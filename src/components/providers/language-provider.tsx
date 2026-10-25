"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "ar" | "en";

interface LanguageContextValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: (key: string) => string;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const LOCALE_STORAGE_KEY = "kemix-locale";

const dictionary: Record<Locale, Record<string, string>> = {
  ar: {
    home: "الرئيسية",
    courses: "الكورسات",
    about: "عن الأكاديمية",
    contact: "تواصل معنا",
    verify: "التحقق من الشهادات",
    login: "تسجيل الدخول",
    signup: "إنشاء حساب جديد",
    dashboard: "لوحة دراستي",
    admin: "لوحة تحكم الإدارة",
    instructor: "لوحة تحكم المعلم",
    logout: "تسجيل الخروج",
    themeDark: "تفعيل الوضع الداكن",
    themeLight: "تفعيل الوضع الفاتح",
    themeLabel: "المظهر",
    languageLabel: "اللغة",
    arabic: "العربية",
    english: "English",
  },
  en: {
    home: "Home",
    courses: "Courses",
    about: "About",
    contact: "Contact",
    verify: "Certificate Verification",
    login: "Login",
    signup: "Create account",
    dashboard: "My dashboard",
    admin: "Admin dashboard",
    instructor: "Instructor dashboard",
    logout: "Log out",
    themeDark: "Enable dark mode",
    themeLight: "Enable light mode",
    themeLabel: "Theme",
    languageLabel: "Language",
    arabic: "العربية",
    english: "English",
  },
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function applyLocale(locale: Locale) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = locale;
  document.documentElement.dir = dir;
  document.documentElement.style.direction = dir;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    async function loadLocalePreference() {
      const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (storedLocale === "ar" || storedLocale === "en") {
        setLocaleState(storedLocale);
        applyLocale(storedLocale);
        return;
      }

      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        if (!response.ok) throw new Error(`Settings request failed (${response.status})`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error?.message || "Failed to load language preference");
        const configuredLocale = result.data?.settings?.cms?.preferences?.locale;
        const latestStoredLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
        const browserLocale = window.navigator.language?.toLowerCase().startsWith("en") ? "en" : "ar";
        const nextLocale: Locale =
          latestStoredLocale === "ar" || latestStoredLocale === "en"
            ? latestStoredLocale
            : configuredLocale === "en" || configuredLocale === "ar"
            ? configuredLocale
            : browserLocale;
        setLocaleState(nextLocale);
        applyLocale(nextLocale);
      } catch (error) {
        console.error("Failed to load configured language; using Arabic", error);
        setLocaleState("ar");
        applyLocale("ar");
      }
    }

    loadLocalePreference();
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    applyLocale(nextLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "ar" ? "en" : "ar");
  }, [locale, setLocale]);

  const t = useCallback((key: string) => dictionary[locale][key] ?? key, [locale]);

  const value = useMemo<LanguageContextValue>(
    () => ({ locale, dir: locale === "ar" ? "rtl" : "ltr", t, setLocale, toggleLocale }),
    [locale, setLocale, t, toggleLocale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
