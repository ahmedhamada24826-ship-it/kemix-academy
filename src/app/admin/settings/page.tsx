"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  HomepageCmsEditor,
  type HomepageCms,
} from "@/components/admin/homepage-cms-editor";
import {
  Settings,
  Save,
  Globe,
  Image as ImageIcon,
  FileText,
  LayoutTemplate,
  UserPlus,
  MessageCircle,
} from "lucide-react";

interface PlatformSettings {
  siteName: string;
  siteDescription: string | null;
  supportEmail: string | null;
  logoUrl: string | null;
  footerLogoUrl: string | null;
  faviconUrl: string | null;
  footerText: string | null;
  aboutText: string | null;
  contactText: string | null;
  cms: HomepageCms;
  whatsappNumber: string;
  whatsappTemplate: string;
  defaultCurrency: string;
  allowRegistration: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("identity");

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.settings) {
            setSettings(json.data.settings as PlatformSettings);
          }
        }
      } catch (err) {
        console.error("Failed to load platform settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const setField = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: settings.siteName,
          siteDescription: settings.siteDescription,
          supportEmail: settings.supportEmail,
          logoUrl: settings.logoUrl,
          footerLogoUrl: settings.footerLogoUrl,
          faviconUrl: settings.faviconUrl,
          footerText: settings.footerText,
          aboutText: settings.aboutText,
          contactText: settings.contactText,
          cms: settings.cms,
          whatsappNumber: settings.whatsappNumber,
          whatsappTemplate: settings.whatsappTemplate,
          defaultCurrency: settings.defaultCurrency,
          allowRegistration: settings.allowRegistration,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        setSaveError(json?.error?.message || "فشل في حفظ إعدادات المنصة.");
        return;
      }

      setSettings(json.data.settings as PlatformSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "حدث خطأ أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="space-y-6 animate-pulse" dir="rtl">
        <div className="h-8 w-1/3 bg-slate-200 rounded" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-[#2563EB]" />
          <span>إعدادات المنصة</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          التحكم في هوية الأكاديمية، الشعارات، نصوص الموقع، ومحتوى الصفحة الرئيسية (CMS).
        </p>
      </div>

      {saveSuccess && (
        <Alert variant="success">
          <AlertDescription>تم حفظ وتحديث إعدادات المنصة بنجاح!</AlertDescription>
        </Alert>
      )}

      {saveError && (
        <Alert variant="destructive">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="identity" className="text-xs font-bold flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              <span>الهوية العامة</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="text-xs font-bold flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              <span>الشعارات والصور</span>
            </TabsTrigger>
            <TabsTrigger value="texts" className="text-xs font-bold flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span>نصوص الموقع</span>
            </TabsTrigger>
            <TabsTrigger value="homepage" className="text-xs font-bold flex items-center gap-1.5">
              <LayoutTemplate className="h-3.5 w-3.5" />
              <span>الصفحة الرئيسية (CMS)</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB: Identity */}
          <TabsContent value="identity" className="space-y-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-900">
                  الإعدادات العامة وسياسات التعليم
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  تسري هذه الإعدادات على كامل المنصة: الاسم، الوصف، بريد الدعم، العملة الافتراضية وسياسة التسجيل.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">اسم الأكاديمية</label>
                    <Input
                      value={settings.siteName}
                      maxLength={100}
                      onChange={(e) => setField("siteName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">بريد الدعم الفني</label>
                    <Input
                      type="email"
                      value={settings.supportEmail || ""}
                      onChange={(e) => setField("supportEmail", e.target.value)}
                      className="font-mono text-xs dir-ltr text-left"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">وصف المنصة والرسالة التعليمية</label>
                  <Textarea
                    rows={2}
                    maxLength={2000}
                    value={settings.siteDescription || ""}
                    onChange={(e) => setField("siteDescription", e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">العملة الافتراضية</label>
                  <select
                    value={settings.defaultCurrency}
                    onChange={(e) => setField("defaultCurrency", e.target.value)}
                    className="flex h-10 w-full sm:w-1/2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EGP">جنيه مصري (EGP)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                  </select>
                </div>

                <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <UserPlus className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">السماح بتسجيل الحسابات الجديدة</p>
                      <p className="text-[11px] text-slate-500">
                        عند إيقافه يتم منع إنشاء أي حساب جديد من صفحة التسجيل العامة.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowRegistration}
                    onChange={(e) => setField("allowRegistration", e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-5 w-5 flex-shrink-0"
                  />
                </div>
                <Alert variant="default">
                  <AlertDescription className="text-xs flex items-center justify-between gap-3 flex-wrap">
                    <span className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-emerald-600" />
                      <span>رقم واتساب وقالب رسائل طلبات الاشتراك تُدار من صفحة إعدادات واتساب المخصصة.</span>
                    </span>
                    <a href="/admin/whatsapp" className="font-bold text-[#2563EB] hover:underline">
                      الانتقال إلى إعدادات واتساب
                    </a>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Branding */}
          <TabsContent value="branding" className="space-y-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-900">الشعارات والصور الرسمية</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  روابط الشعارات المستخدمة في الهيدر والتذييل وأيقونة الموقع (Favicon). ارفع الصور من مكتبة الوسائط ثم الصق الرابط هنا.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {(
                  [
                    { key: "logoUrl", label: "شعار الهيدر (Logo)", hint: "يظهر أعلى جميع الصفحات." },
                    { key: "footerLogoUrl", label: "شعار التذييل (Footer Logo)", hint: "يظهر في تذييل الصفحة." },
                    { key: "faviconUrl", label: "أيقونة المتصفح (Favicon)", hint: "أيقونة التبويب في المتصفح." },
                  ] as const
                ).map((item) => (
                  <div key={item.key} className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.label}</p>
                        <p className="text-[11px] text-slate-500">{item.hint}</p>
                      </div>
                      {settings[item.key] ? (
                        <img
                          src={settings[item.key] as string}
                          alt={item.label}
                          className="h-10 w-auto max-w-[140px] rounded-md border border-slate-200 bg-white object-contain p-1"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">لا يوجد شعار</span>
                      )}
                    </div>
                    <Input
                      value={(settings[item.key] as string) || ""}
                      onChange={(e) => setField(item.key, e.target.value)}
                      placeholder="https://..."
                      className="font-mono text-xs dir-ltr text-left h-9"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Site texts */}
          <TabsContent value="texts" className="space-y-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-900">نصوص صفحات الموقع</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  النصوص الرسمية الظاهرة في تذييل الصفحة وصفحتي «عن الأكاديمية» و«تواصل معنا».
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نص التذييل (Footer)</label>
                  <Textarea
                    rows={3}
                    maxLength={2000}
                    value={settings.footerText || ""}
                    onChange={(e) => setField("footerText", e.target.value)}
                    className="text-xs leading-relaxed"
                    placeholder="منصة تعليمية متخصصة في إعداد محللي ومهندسي البيانات..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نص صفحة «عن الأكاديمية»</label>
                  <Textarea
                    rows={5}
                    maxLength={8000}
                    value={settings.aboutText || ""}
                    onChange={(e) => setField("aboutText", e.target.value)}
                    className="text-xs leading-relaxed"
                    placeholder="اتركه فارغًا لاستخدام النص الافتراضي للصفحة."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نص صفحة «تواصل معنا»</label>
                  <Textarea
                    rows={4}
                    maxLength={4000}
                    value={settings.contactText || ""}
                    onChange={(e) => setField("contactText", e.target.value)}
                    className="text-xs leading-relaxed"
                    placeholder="اتركه فارغًا لاستخدام النص الافتراضي للصفحة."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Homepage CMS */}
          <TabsContent value="homepage" className="space-y-4">
            <Alert variant="default">
              <AlertDescription className="text-xs">
                يتم نشر هذه الأقسام على الصفحة الرئيسية مباشرة بعد الضغط على «حفظ الإعدادات». يمكنك إخفاء أي قسم
                بإلغاء تفعيله، أو تغيير ترتيبه الرقمي.
              </AlertDescription>
            </Alert>

            <HomepageCmsEditor value={settings.cms} onChange={(cms) => setField("cms", cms)} />
          </TabsContent>
        </Tabs>

        <div className="sticky bottom-0 z-20 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
          <p className="text-[11px] text-slate-500 hidden sm:block">
            تأكد من حفظ التغييرات قبل مغادرة الصفحة.
          </p>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-[#0B2D5B] hover:bg-blue-700 text-white font-bold text-xs h-9 px-6 flex items-center justify-center gap-1.5"
          >
            <Save className="h-3.5 w-3.5 ml-1" />
            <span>{isSaving ? "جاري الحفظ..." : "حفظ الإعدادات"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
