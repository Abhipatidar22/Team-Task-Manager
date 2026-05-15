import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  PORT: z.coerce.number().int().positive().optional(),
  CORS_ORIGIN: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const flattened = parsed.error.flatten();
  const details = Object.entries(flattened.fieldErrors)
    .filter(([, messages]) => messages && messages.length > 0)
    .map(([key, messages]) => `${key}: ${messages.join(", ")}`)
    .join("; ");

  throw new Error(`Invalid environment variables: ${details || parsed.error.message}`);
}

export const env = {
  ...parsed.data,
  PORT: parsed.data.PORT ?? 3000,
};
