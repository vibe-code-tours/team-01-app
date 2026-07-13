import type { Context } from "hono";

export const errorHandler = (err: Error, c: Context) => {
  const isDev = process.env.NODE_ENV !== "production";
  console.error(`[Error] ${err.message}${isDev ? `\n${err.stack}` : ""}`);

  if (err.name === "UnauthorizedError" || err.message === "Unauthorized") {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  if (err.name === "ValidationError") {
    return c.json({ success: false, error: err.message }, 400);
  }

  return c.json({ success: false, error: "Internal server error" }, 500);
};