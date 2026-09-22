"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  History,
  Search,
  ShieldCheck,
  User,
  Clock,
  Filter,
} from "lucide-react";

interface AuditLogItem {
  id: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
    role: string;
  } | null;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await fetch("/api/audit-logs");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.logs) {
            setLogs(json.data.logs);
          }
        }
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <History className="h-6 w-6 text-[#2563EB]" />
          <span>سجل العمليات والتدقيق الأمني (Audit Logs)</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          سجل غير قابل للتعديل يوثق جميع التغييرات الحساسة، التجاوزات الإدارية، وتعديل الصلاحيات.
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <Input
          type="text"
          placeholder="ابحث بنوع الإجراء، اسم المستخدم، أو الكيان المستهدف..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 p-0 text-sm h-8"
        />
      </div>

      {/* Logs Table */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-4">نوع الإجراء</th>
                <th className="p-4">الكيان (Entity)</th>
                <th className="p-4">المسؤول / المستخدم</th>
                <th className="p-4">التفاصيل والبيانات</th>
                <th className="p-4">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 animate-pulse font-medium">
                    جاري تحميل سجل التدقيق...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    لا توجد سجلات تدقيق مطابقة.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <Badge variant="outline" className="font-mono text-[10px] font-bold bg-slate-50">
                        {log.action}
                      </Badge>
                    </td>

                    <td className="p-4">
                      <span className="font-semibold text-slate-800">{log.entityType}</span>
                      {log.entityId && (
                        <p className="text-[10px] font-mono text-slate-400 dir-ltr text-right">
                          {log.entityId.slice(0, 12)}...
                        </p>
                      )}
                    </td>

                    <td className="p-4">
                      {log.user ? (
                        <div>
                          <p className="font-bold text-slate-900">{log.user.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">نظام آلي (System)</span>
                      )}
                    </td>

                    <td className="p-4 max-w-xs truncate text-slate-600 font-mono text-xs dir-ltr text-right">
                      {log.details ? JSON.stringify(log.details) : "-"}
                    </td>

                    <td className="p-4 text-slate-500 text-xs font-mono">
                      {new Date(log.createdAt).toLocaleString("ar-EG")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
