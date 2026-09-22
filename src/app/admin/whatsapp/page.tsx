"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MessageCircle,
  Save,
  Send,
  Sparkles,
  ExternalLink,
  Phone,
  Loader2,
} from "lucide-react";

export default function AdminWhatsAppSettingsPage() {
  const [whatsappNumber, setWhatsappNumber] = useState("+201000000000");
  const [template, setTemplate] = useState(
    "مرحبًا KEMIX Academy، أرغب في الاشتراك في كورس {course_name}.\nالسعر: {price} {currency}\nاسم الطالب: {student_name}\nالبريد الإلكتروني: {student_email}"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Test preview state
  const [testCourse, setTestCourse] = useState("تحليل البيانات المتقدم بـ Python");
  const [testStudent, setTestStudent] = useState("أحمد محمد");
  const testEmail = "ahmed@example.com";
  const [testPrice, setTestPrice] = useState("1500");
  const [testCurrency, setTestCurrency] = useState("EGP");

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.settings) {
            if (json.data.settings.whatsappNumber) setWhatsappNumber(json.data.settings.whatsappNumber);
            if (json.data.settings.whatsappTemplate) setTemplate(json.data.settings.whatsappTemplate);
            if (json.data.settings.defaultCurrency) setTestCurrency(json.data.settings.defaultCurrency);
          }
        }
      } catch (err) {
        console.error("Failed to load WhatsApp settings:", err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappNumber: whatsappNumber.trim(),
          whatsappTemplate: template.trim(),
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const previewMessage = template
    .replace(/{course_name}/g, testCourse)
    .replace(/{price}/g, testPrice)
    .replace(/{currency}/g, testCurrency)
    .replace(/{student_name}/g, testStudent)
    .replace(/{student_email}/g, testEmail)
    .replace(/{student_phone}/g, "");

  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, "");
  const testWhatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(previewMessage)}`;

  const [builtUrl, setBuiltUrl] = useState<string>("");
  const [isBuildingUrl, setIsBuildingUrl] = useState(false);

  const buildUrl = useCallback(async () => {
    setIsBuildingUrl(true);
    try {
      const res = await fetch("/api/settings/whatsapp-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName: testCourse,
          price: Number(testPrice) || 0,
          currency: testCurrency,
          studentName: testStudent,
          studentEmail: testEmail,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setBuiltUrl(json.data.whatsappUrl);
        }
      }
    } catch {
      /* use fallback */
    } finally {
      setIsBuildingUrl(false);
    }
  }, [testCourse, testPrice, testCurrency, testStudent, testEmail]);

  useEffect(() => {
    const timer = setTimeout(() => {
      buildUrl();
    }, 500);
    return () => clearTimeout(timer);
  }, [buildUrl]);

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-emerald-600" />
          <span>إعدادات وتكامل واتساب للاشتراكات</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          تخصيص رقم خدمة العملاء وقالب رسائل طلب الاشتراك عند نقر الطلاب على &ldquo;الاشتراك عبر واتساب&rdquo;.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Form */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-600" />
              <span>بيانات الاتصال وقالب الرسالة</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              يمكنك استخدام المتغيرات: {"{course_name}"}، {"{price}"}، {"{currency}"}، {"{student_name}"}، {"{student_email}"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              {saveSuccess && (
                <Alert variant="success">
                  <AlertDescription>تم حفظ إعدادات واتساب بنجاح!</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">رقم واتساب المعتمد (مع كود الدولة) *</label>
                <Input
                  type="text"
                  placeholder="+201012345678"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="font-mono text-xs dir-ltr text-left"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">قالب الرسالة التلقائية *</label>
                <Textarea
                  rows={5}
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="text-xs leading-relaxed"
                  required
                />
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>المتغيرات المتاحة للاستبدال التلقائي:</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 font-mono text-[11px] pt-1">
                  <span className="bg-white p-1 rounded border border-blue-200 text-center" dir="ltr">{"{course_name}"}</span>
                  <span className="bg-white p-1 rounded border border-blue-200 text-center" dir="ltr">{"{price}"}</span>
                  <span className="bg-white p-1 rounded border border-blue-200 text-center" dir="ltr">{"{currency}"}</span>
                  <span className="bg-white p-1 rounded border border-blue-200 text-center" dir="ltr">{"{student_name}"}</span>
                  <span className="bg-white p-1 rounded border border-blue-200 text-center" dir="ltr">{"{student_email}"}</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full bg-[#0B2D5B] hover:bg-blue-700 text-white font-bold text-xs h-9 flex items-center justify-center gap-1.5"
              >
                <Save className="h-3.5 w-3.5 ml-1" />
                <span>{isSaving ? "جاري الحفظ..." : "حفظ الإعدادات"}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Live Simulator & Tester */}
        <div className="space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <span>محاكي الرسالة المباشر (Live Preview)</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                شاهد كيف ستظهر الرسالة للطالب عند نقر زر الاشتراك.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">اسم الكورس التجريبي:</label>
                  <Input
                    value={testCourse}
                    onChange={(e) => setTestCourse(e.target.value)}
                    className="text-xs h-8 mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">اسم الطالب التجريبي:</label>
                  <Input
                    value={testStudent}
                    onChange={(e) => setTestStudent(e.target.value)}
                    className="text-xs h-8 mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">السعر التجريبي:</label>
                  <Input
                    value={testPrice}
                    onChange={(e) => setTestPrice(e.target.value)}
                    className="text-xs h-8 mt-0.5 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">العملة التجريبية:</label>
                  <Input
                    value={testCurrency}
                    onChange={(e) => setTestCurrency(e.target.value)}
                    className="text-xs h-8 mt-0.5 font-mono"
                  />
                </div>
              </div>

              {/* Chat Bubble Box */}
              <div className="p-4 rounded-2xl bg-[#DCF8C6]/40 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-emerald-800 font-bold border-b border-emerald-200/60 pb-1.5">
                  <span>رسالة واتساب الجاهزة للإرسال:</span>
                  <span className="font-mono dir-ltr">{whatsappNumber}</span>
                </div>
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {previewMessage}
                </p>
              </div>

              <a
                href={builtUrl || testWhatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <Button
                  type="button"
                  variant="outline"
                  disabled={isBuildingUrl}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {isBuildingUrl ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 ml-1 animate-spin" />
                      <span>جاري بناء الرابط...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 ml-1" />
                      <span>اختبار فتح محادثة واتساب الآن</span>
                      <ExternalLink className="h-3 w-3 mr-1" />
                    </>
                  )}
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
