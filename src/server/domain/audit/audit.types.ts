import { Prisma } from "@prisma/client";

export interface AuditLogDto {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: Prisma.JsonValue | null;
  reason: string | null;
  createdAt: Date;
  actor?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export interface RecordAuditLogInput {
  actorId?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Prisma.InputJsonValue;
  reason?: string | null;
}

export interface AuditLogFilterParams {
  action?: string;
  entity?: string;
  actorId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}
