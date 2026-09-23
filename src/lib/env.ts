import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required").default("postgresql://postgres:postgres@localhost:5432/kemix_academy_dev?schema=public"),

  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters long").default("kemix-academy-dev-session-secret-at-least-32-chars-long"),
  COOKIE_SECURE: z.string().transform((val) => val === "true").default("false"),

  // Initial Admin Bootstrap (Optional)
  INITIAL_ADMIN_EMAIL: z.string().optional(),
  INITIAL_ADMIN_PASSWORD: z.string().optional(),
  INITIAL_ADMIN_NAME: z.string().optional(),


  // S3-Compatible Object Storage
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY_ID: z.string().default("minioadmin"),
  S3_SECRET_ACCESS_KEY: z.string().default("minioadmin"),
  S3_PUBLIC_BUCKET: z.string().default("kemix-academy-public"),
  S3_PRIVATE_BUCKET: z.string().default("kemix-academy-protected"),
  S3_PUBLIC_URL: z.string().url().optional().or(z.literal("")),
  S3_FORCE_PATH_STYLE: z.string()
    .transform((val) => val === "true")
    .default(process.env.NODE_ENV === "production" ? "false" : "true"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.format());
    // In development or test, allow execution with warning, but log errors
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment variables in production");
    }
  }
  return (parsed.success ? parsed.data : process.env) as Env;
}

export const env = validateEnv();
