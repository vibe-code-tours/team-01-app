const env = {
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/water_delivery",
  REDIS_URL: process.env.REDIS_URL || "redis://redis:6379",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "change-me-to-a-secure-random-string-at-least-32-chars",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  API_PORT: parseInt(process.env.API_PORT || "3001", 10),
  API_CORS_ORIGIN: process.env.API_CORS_ORIGIN || "https://water-delivery-system-prod.vercel.app",
  NODE_ENV: process.env.NODE_ENV || "development",
} as const;

export default env;