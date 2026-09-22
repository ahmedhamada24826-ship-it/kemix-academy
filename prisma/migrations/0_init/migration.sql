-- CreateTable
CREATE TABLE "system_health_checks" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL DEFAULT 'kemix-academy-core',
    "status" TEXT NOT NULL DEFAULT 'HEALTHY',
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_health_checks_pkey" PRIMARY KEY ("id")
);
