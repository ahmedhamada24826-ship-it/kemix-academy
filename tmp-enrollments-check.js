const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const rows = await prisma.enrollment.findMany({
    take: 20,
    include: { user: true, course: true },
    orderBy: { enrolledAt: 'desc' },
  });

  console.log('ENROLLMENTS_COUNT', rows.length);
  console.log(JSON.stringify(rows, null, 2));

  await prisma.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
