const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const [attempts, users, quizzes] = await Promise.all([
    prisma.quizAttempt.findMany({ take: 10, include: { user: true, quiz: true } }),
    prisma.user.findMany({ take: 5 }),
    prisma.quiz.findMany({ take: 10 })
  ]);

  console.log('ATTEMPTS_COUNT', attempts.length);
  console.log(JSON.stringify(attempts, null, 2));
  console.log('USERS_COUNT', users.length);
  console.log('QUIZZES_COUNT', quizzes.length);

  await prisma.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
