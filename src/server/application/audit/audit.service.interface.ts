import { AuditLogDto, RecordAuditLogInput, AuditLogFilterParams } from "@/server/domain/audit/audit.types";

export interface IAuditLogService {
  recordLog(input: RecordAuditLogInput): Promise<AuditLogDto>;
  listLogs(params: AuditLogFilterParams): Promise<{ logs: AuditLogDto[]; total: number; page: number; limit: number }>;
}
