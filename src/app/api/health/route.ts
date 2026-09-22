import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let dbStatus = "disconnected";
  try {
    // Quick probe to verify database connectivity if configured
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch {
    dbStatus = "unreachable_or_not_started";
  }

  return NextResponse.json({
    status: "healthy",
    project: "KEMIX Academy",
    phase: "2.1 - Foundation Baseline",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || "development",
    services: {
      database: dbStatus,
      storageAbstraction: "ready",
      authProvider: "self-hosted-argon2id",
    },
  });
}
