"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  MessageCircle,
  BookOpen,
  DollarSign,
  User,
  Filter,
} from "lucide-react";

interface PaymentRequestItem {
  id: string;
  studentId: string;
  courseId: string;
  amount: number;
  currency: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  referenceNumber?: string | null;
  paymentMethod?: string | null;
  adminNotes?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  student: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
  };
  course: {
    id: string;
    title: string;
    price: number;
  };
}

export default function AdminPaymentsPage() {
  const [requests, setRequests] = useState<PaymentRequestItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Review Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<PaymentRequestItem | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRequests = async () => {
    try {
      const url = statusFilter === "ALL" ? "/api/payments" : `/api/payments?status=${statusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.requests) {
          setRequests(json.data.requests);
        }
      }
    } catch (err) {
      console.error("Failed to load payment requests:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const handleOpenReview = (req: PaymentRequestItem, action: "APPROVED" | "REJECTED") => {
    setSelectedReq(req);
    setReviewAction(action);
    setAdminNotes(action === "APPROVED" ? "تم التحقق من إيصال الدفع وتفعيل الكورس بنجاح." : "");
    setModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/payments/${selectedReq.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewAction,
          adminNotes: adminNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        setModalOpen(false);
        await loadRequests();
      }
    } catch (err) {
      console.error("Failed to review request:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-[#2563EB]" />
            <span>مراجعة طلبات الالتحاق والاشتراك عبر واتساب</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            تأكيد إيصالات التحويل البنكي وفودافون كاش وتفعيل وصول الطلاب للكورسات تلقائياً.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {st === "ALL"
                ? "الكل"
                : st === "PENDING"
                ? "قيد المراجعة"
                : st === "APPROVED"
                ? "تم التفعيل"
                : "مرفوض"}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-4">الطالب</th>
                <th className="p-4">الكورس المطلوب</th>
                <th className="p-4">المبلغ</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">تاريخ الطلب</th>
                <th className="p-4 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 animate-pulse font-medium">
                    جاري تحميل طلبات الاشتراك...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    لا توجد طلبات اشتراك في هذه القائمة.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {(req.student?.fullName || req.student?.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{req.student?.fullName || req.student?.email || "Student"}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{req.student?.email || req.student?.phone || "-"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-bold text-slate-800">
                      {req.course.title}
                    </td>

                    <td className="p-4 font-black text-slate-900">
                      {req.amount} {req.currency}
                    </td>

                    <td className="p-4">
                      <Badge
                        variant={
                          req.status === "APPROVED"
                            ? "success"
                            : req.status === "REJECTED"
                            ? "destructive"
                            : "warning"
                        }
                        className="text-[10px] font-bold"
                      >
                        {req.status === "APPROVED"
                          ? "تم التفعيل"
                          : req.status === "REJECTED"
                          ? "مرفوض"
                          : "قيد المراجعة"}
                      </Badge>
                    </td>

                    <td className="p-4 text-slate-500 text-xs font-mono">
                      {new Date(req.createdAt).toLocaleString("ar-EG")}
                    </td>

                    <td className="p-4 text-left">
                      {req.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleOpenReview(req, "APPROVED")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-7 px-3 flex items-center gap-1 shadow-xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>موافقة وتفعيل</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReview(req, "REJECTED")}
                            className="text-xs font-semibold h-7 px-2.5 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>رفض</span>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">
                          تمت المراجعة: {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString("ar-EG") : "-"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Review Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogHeader>
          <DialogTitle>
            {reviewAction === "APPROVED" ? "تأكيد قبول الاشتراك وتفعيل الكورس" : "رفض طلب الاشتراك"}
          </DialogTitle>
          <DialogDescription>
            الطالب: {selectedReq?.student.fullName} • الكورس: {selectedReq?.course.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmitReview} className="space-y-4 py-2 text-right">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">المبلغ المطلوب:</span>
              <span className="font-bold text-slate-900">{selectedReq?.amount} {selectedReq?.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">البريد الإلكتروني:</span>
              <span className="font-mono text-slate-800">{selectedReq?.student.email}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">ملاحظات الإدارة (اختياري)</label>
            <Textarea
              rows={3}
              placeholder="اكتب ملاحظة أو سبب القبول/الرفض..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`font-bold text-white ${
                reviewAction === "APPROVED"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isSubmitting
                ? "جاري التنفيذ..."
                : reviewAction === "APPROVED"
                ? "تأكيد وتفعيل الوصول فوراً"
                : "تأكيد الرفض"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
