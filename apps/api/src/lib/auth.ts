import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "@better-auth/passkey";
import { twoFactor } from "better-auth/plugins";
import { db, users } from "@water-delivery/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
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
  plugins: [
    passkey({
      rpName: "Water Delivery",
      rpID: "localhost",
      origin: process.env.BETTER_AUTH_URL || "http://localhost:3001",
    }),
    twoFactor({
      issuer: "Water Delivery",
    }),
  ],
});
