import { PrismaClient, Role, CourseStatus, CourseLevel, LessonType, QuestionType } from "@prisma/client";
import { bootstrapAdmin } from "../src/server/application/auth/admin-bootstrap";
import { passwordHasher } from "../src/server/infrastructure/security/argon2-hasher";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 KEMIX Academy Database Seeder — Phase 3");
  console.log("─────────────────────────────────────────────────────");

  // 1. Foundational System Health Check verification
  await prisma.systemHealthCheck.create({
    data: {
      service: "kemix-academy-seed",
      status: "SEED_RAN_OK",
    },
  });

  // 2. Initial Admin Bootstrap
  const adminResult = await bootstrapAdmin(undefined, prisma);
  if (adminResult.bootstrapped && adminResult.user) {
    console.log(`✅ Admin account bootstrapped: ${adminResult.user.email}`);
  }

  // 3. Demo Instructor Account
  const instructorEmail = "instructor@kemix.academy";
  let instructor = await prisma.user.findUnique({ where: { email: instructorEmail } });
  if (!instructor) {
    const passwordHash = await passwordHasher.hash("InstructorPass123!");
    instructor = await prisma.user.create({
      data: {
        email: instructorEmail,
        fullName: "Dr. Alex Vance",
        passwordHash,
        role: Role.INSTRUCTOR,
        bio: "Principal Data Scientist & Lead Analytical Engineering Instructor at KEMIX Academy. Ex-Tech Lead with 12+ years experience in Big Data.",
      },
    });
    console.log(`✅ Demo Instructor created: ${instructor.email}`);
  }

  // 4. Demo Courses
  const pythonCourseSlug = "python-data-analysis-mastery";
  let course1 = await prisma.course.findUnique({ where: { slug: pythonCourseSlug } });
  if (!course1) {
    course1 = await prisma.course.create({
      data: {
        title: "Python Data Analysis & Analytics Engineering",
        slug: pythonCourseSlug,
        shortDescription: "Master Pandas, NumPy, statistical data modeling, and automated ETL pipelines with production-grade datasets.",
        description: `This flagship course gives you the hands-on skills to analyze real-world datasets using modern Python. 
You will build full data transformation pipelines, clean messy industrial data, compute aggregations with Pandas & NumPy, and build interactive visualizations.

### What you will learn:
- Data Wrangling with Pandas & NumPy
- Exploratory Data Analysis & Statistical Modeling
- Parquet & Arrow Fast Data Processing
- Automated Analytical Scripting & Jupyter Workflows`,
        coverImageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80",
        status: CourseStatus.PUBLISHED,
        level: CourseLevel.BEGINNER,
        instructorId: instructor.id,
        durationSeconds: 14400,
        publishedAt: new Date(),
      },
    });

    // Sections & Lessons for Course 1
    const sec1 = await prisma.courseSection.create({
      data: {
        courseId: course1.id,
        title: "Module 1: Foundations of Scientific Python & Vectorization",
        sortOrder: 1,
      },
    });

    const l1 = await prisma.lesson.create({
      data: {
        sectionId: sec1.id,
        title: "Welcome to KEMIX Data Engineering & Python Setup",
        slug: "welcome-setup",
        lessonType: LessonType.VIDEO,
        sortOrder: 1,
        isPublished: true,
        isFreePreview: true,
        durationSeconds: 620,
        content: `### Welcome to KEMIX Academy!
In this introductory lesson, we configure your Python 3.11 analytical environment using UV and JupyterLab.

Download the initial setup repository and verify your vector math environment.`,
      },
    });

    const l2 = await prisma.lesson.create({
      data: {
        sectionId: sec1.id,
        title: "Vectorized Arithmetic with NumPy & Multi-Dimensional Arrays",
        slug: "numpy-vectorized-arrays",
        lessonType: LessonType.VIDEO,
        sortOrder: 2,
        isPublished: true,
        durationSeconds: 1250,
        content: `### NumPy Vectorization Principles
Learn how NumPy avoids Python GIL overhead through SIMD vector instructions and contiguous memory allocation.

Key topics covered:
1. Memory Strides & C-contiguous arrays
2. Universal Functions (ufuncs)
3. Broadcasting rules across tensors`,
      },
    });

    const sec2 = await prisma.courseSection.create({
      data: {
        courseId: course1.id,
        title: "Module 2: High-Performance Data Wrangling with Pandas",
        sortOrder: 2,
      },
    });

    const l3 = await prisma.lesson.create({
      data: {
        sectionId: sec2.id,
        title: "DataFrame Transformations, Joins, and GroupBy Aggregations",
        slug: "pandas-aggregations",
        lessonType: LessonType.VIDEO,
        sortOrder: 1,
        isPublished: true,
        durationSeconds: 1800,
        content: `### Pandas Transformations
Master the core Pandas aggregation pipeline: Split-Apply-Combine patterns and window operations.`,
      },
    });

    // Quiz for Module 2
    const quiz1 = await prisma.quiz.create({
      data: {
        courseId: course1.id,
        title: "Python Data Analysis Knowledge Verification",
        description: "Assess your understanding of NumPy vectorization, Pandas indexing, and analytical performance.",
        passingScore: 75,
        isPublished: true,
      },
    });

    const q1 = await prisma.quizQuestion.create({
      data: {
        quizId: quiz1.id,
        prompt: "Why is vectorized array arithmetic in NumPy significantly faster than standard Python list loops?",
        questionType: QuestionType.SINGLE_CHOICE,
        sortOrder: 1,
        points: 50,
        explanation: "NumPy executes operations in compiled C/Fortran code using SIMD vector instructions and continuous memory layouts.",
      },
    });

    await prisma.quizOption.createMany({
      data: [
        { questionId: q1.id, text: "NumPy compiles operations into optimized C loops operating on contiguous memory buffers", isCorrect: true, sortOrder: 1 },
        { questionId: q1.id, text: "NumPy compresses data using gzip before executing mathematical operations", isCorrect: false, sortOrder: 2 },
        { questionId: q1.id, text: "Standard Python lists are stored on disk while NumPy stores arrays in GPU memory", isCorrect: false, sortOrder: 3 },
      ],
    });

    const q2 = await prisma.quizQuestion.create({
      data: {
        quizId: quiz1.id,
        prompt: "Which Pandas method implements the Split-Apply-Combine paradigm for aggregations?",
        questionType: QuestionType.SINGLE_CHOICE,
        sortOrder: 2,
        points: 50,
        explanation: ".groupby() splits the DataFrame into groups, applies an aggregation function, and combines the results.",
      },
    });

    await prisma.quizOption.createMany({
      data: [
        { questionId: q2.id, text: "df.groupby()", isCorrect: true, sortOrder: 1 },
        { questionId: q2.id, text: "df.pivot_table()", isCorrect: false, sortOrder: 2 },
        { questionId: q2.id, text: "df.filter()", isCorrect: false, sortOrder: 3 },
      ],
    });

    console.log(`✅ Demo Course 1 created: ${course1.title}`);
  }

  // Demo Course 2: SQL Analytics
  const sqlCourseSlug = "sql-analytics-query-optimization";
  let course2 = await prisma.course.findUnique({ where: { slug: sqlCourseSlug } });
  if (!course2) {
    course2 = await prisma.course.create({
      data: {
        title: "Advanced SQL Analytics & Query Optimization",
        slug: sqlCourseSlug,
        shortDescription: "Write lightning-fast SQL queries, window functions, recursive CTEs, and index strategies on PostgreSQL.",
        description: `Deep dive into relational database internals, query execution plans (EXPLAIN ANALYZE), window partitions, and analytical reporting with SQL.`,
        coverImageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&q=80",
        status: CourseStatus.PUBLISHED,
        level: CourseLevel.INTERMEDIATE,
        instructorId: instructor.id,
        durationSeconds: 18000,
        publishedAt: new Date(),
      },
    });

    const s1 = await prisma.courseSection.create({
      data: {
        courseId: course2.id,
        title: "Section 1: Window Functions & Analytical Partitioning",
        sortOrder: 1,
      },
    });

    await prisma.lesson.create({
      data: {
        sectionId: s1.id,
        title: "ROW_NUMBER, RANK, DENSE_RANK, and Moving Averages",
        slug: "window-functions-deep-dive",
        lessonType: LessonType.VIDEO,
        sortOrder: 1,
        isPublished: true,
        isFreePreview: true,
        durationSeconds: 980,
        content: `### Window Functions
Understand framing clauses (ROWS BETWEEN 3 PRECEDING AND CURRENT ROW) and partition ordering.`,
      },
    });

    console.log(`✅ Demo Course 2 created: ${course2.title}`);
  }

  console.log("─────────────────────────────────────────────────────");
  console.log("✅ Phase 3 Database Seeding Complete.");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
