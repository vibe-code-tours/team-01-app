import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "@better-auth/passkey";
import { twoFactor } from "better-auth/plugins";
import { db, user, account, session, verification } from "@water-delivery/db";

export const auth = betterAuth({
  trustedOrigins: [process.env.API_CORS_ORIGIN || "http://localhost:3005"],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      account,
      session,
      verification,
    },
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        required: false,
      },
      status: {
        type: "string",
        defaultValue: "active",
        required: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      address: {
        type: "string",
        required: false,
      },
      provinceId: {
        type: "string",
        required: false,
      },
      townshipId: {
        type: "string",
        required: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: false,
    },
  },
  plugins: [
    passkey({
      rpName: "Water Delivery",
      rpID: "localhost",
      origin: process.env.BETTER_AUTH_URL || "https://api-bir004ynp-klockdevops.vercel.app",
    }),
    twoFactor({
      issuer: "Water Delivery",
    }),
  ],
});
