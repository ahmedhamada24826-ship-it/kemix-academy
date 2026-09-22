import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuditLogService } from "./audit.service";
import { PrismaClient } from "@prisma/client";

describe("AuditLogService", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any;
  let auditService: AuditLogService;

  beforeEach(() => {
    mockPrisma = {
      auditLog: {
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
      },
    };

    auditService = new AuditLogService(mockPrisma as unknown as PrismaClient);
  });

  describe("recordLog", () => {
    it("creates an immutable audit log record", async () => {
      mockPrisma.auditLog.create.mockResolvedValue({
        id: "log-1",
        actorId: "admin-1",
        actorEmail: "admin@kemix.com",
        actorName: "Admin User",
        action: "MANUAL_OVERRIDE_LESSON_UNLOCK",
        entity: "Lesson",
        entityId: "lesson-1",
        details: { reason: "Special dispensation" },
        reason: "Special dispensation",
        createdAt: new Date(),
      });

      const entry = await auditService.recordLog({
        actorId: "admin-1",
        actorEmail: "admin@kemix.com",
        actorName: "Admin User",
        action: "MANUAL_OVERRIDE_LESSON_UNLOCK",
        entity: "Lesson",
        entityId: "lesson-1",
        details: { reason: "Special dispensation" },
        reason: "Special dispensation",
      });

      expect(entry.id).toBe("log-1");
      expect(entry.action).toBe("MANUAL_OVERRIDE_LESSON_UNLOCK");
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe("listLogs", () => {
    it("retrieves audit logs for admin inspection", async () => {
      mockPrisma.auditLog.count.mockResolvedValue(1);
      mockPrisma.auditLog.findMany.mockResolvedValue([
        {
          id: "log-1",
          action: "COURSE_PUBLISHED",
          entity: "Course",
          entityId: "course-1",
          createdAt: new Date(),
        },
      ]);

      const result = await auditService.listLogs({ page: 1, limit: 10 });
      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].action).toBe("COURSE_PUBLISHED");
      expect(result.total).toBe(1);
    });
  });
});
