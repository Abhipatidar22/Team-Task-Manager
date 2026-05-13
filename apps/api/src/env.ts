import { z } from "zod";

const envSchema = z.object({
  JWT_SECRET: z.string().min(1),
  PORT: z.coerce.number().int().positive().optional(),
  CORS_ORIGIN: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}

export const env = {
  ...parsed.data,
  PORT: parsed.data.PORT ?? 3000,
};
