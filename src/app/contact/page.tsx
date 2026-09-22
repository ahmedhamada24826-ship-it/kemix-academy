"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MessageCircle,
  Mail,
  Send,
  Clock,
} from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="container mx-auto max-w-5xl space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            تواصل مع فريق أكاديمية كيميكس
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            نحن هنا للإجابة على استفساراتك حول الكورسات، طرق الدفع، والمسارات التدريبية.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="space-y-4">
            <Card className="bg-[#07162C] text-white border-0 shadow-lg p-6 space-y-6">
              <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
                قنوات الدعم السريع
              </h2>

              <div className="space-y-4 text-xs">
                <a
                  href="https://wa.me/201000000000"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40 transition-colors"
                >
                  <MessageCircle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-bold">خدمة العملاء عبر واتساب</p>
                    <p className="text-[11px] text-emerald-400/80">استجابة مباشرة على مدار اليوم</p>
                  </div>
                </a>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 text-slate-300">
                  <Mail className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-white">البريد الإلكتروني</p>
                    <p className="font-mono text-slate-400 text-[11px]">support@kemix.academy</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 text-slate-300">
                  <Clock className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-white">أوقات العمل</p>
                    <p className="text-slate-400 text-[11px]">السبت - الخميس: 9:00 ص - 10:00 م</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-slate-200 shadow-sm p-6 sm:p-8">
              <CardHeader className="p-0 pb-6">
                <CardTitle className="text-xl font-bold text-slate-900">
                  أرسل لنا رسالتك
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  سيتواصل معك مستشارنا التعليمي في أقرب وقت.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                {submitted && (
                  <Alert variant="success" className="mb-4">
                    <AlertDescription>
                      تم استلام رسالتك بنجاح! سيتواصل معك فريق الدعم قريباً.
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-right">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">الاسم الكامل *</label>
                      <Input
                        placeholder="مثال: سارة أحمد"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">البريد الإلكتروني *</label>
                      <Input
                        type="email"
                        placeholder="sara@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="font-mono text-xs dir-ltr text-left"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">موضوع الاستفسار *</label>
                    <Input
                      placeholder="مثال: استفسار حول كورس تحليل البيانات المتقدم بـ Python"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">تفاصيل الرسالة *</label>
                    <Textarea
                      rows={4}
                      placeholder="اكتب استفسارك بالتفصيل..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="bg-[#0B2D5B] hover:bg-[#2563EB] text-white font-bold text-xs h-10 px-6 flex items-center gap-1.5"
                  >
                    <Send className="h-4 w-4 ml-1" />
                    <span>إرسال الرسالة</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
