import { PrismaClient, Prisma } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import {
  AuditLogDto,
  RecordAuditLogInput,
  AuditLogFilterParams,
} from "@/server/domain/audit/audit.types";
import { IAuditLogService } from "./audit.service.interface";

export class AuditLogService implements IAuditLogService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async recordLog(input: RecordAuditLogInput): Promise<AuditLogDto> {
    try {
      const log = await this.prisma.auditLog.create({
        data: {
          actorId: input.actorId,
          actorEmail: input.actorEmail,
          actorName: input.actorName,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId,
          details: input.details ?? Prisma.JsonNull,
          reason: input.reason,
        },
      });
      return log;
    } catch (err) {
      console.error("Failed to persist audit log:", err);
      return {
        id: "transient",
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        actorName: input.actorName ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        details: (input.details as Prisma.JsonValue) ?? null,
        reason: input.reason ?? null,
        createdAt: new Date(),
      };
    }
  }

  async listLogs(
    params: AuditLogFilterParams
  ): Promise<{ logs: AuditLogDto[]; total: number; page: number; limit: number }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 25;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (params.action) {
      where.action = params.action;
    }

    if (params.entity) {
      where.entity = params.entity;
    }

    if (params.actorId) {
      where.actorId = params.actorId;
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.createdAt.lte = params.endDate;
      }
    }

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          actor: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
    };
  }
}

export const auditLogService = new AuditLogService();
