"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, fetchSession } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn(email, password);
    if (!result.success) {
      setError(result.error || "Invalid credentials");
      setLoading(false);
      return;
    }

    const session = await fetchSession();
    setLoading(false);

    if (session.success && session.data) {
      const role = (session.data as { user: { role?: string } }).user?.role;
      if (role === "super-admin" || role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100/60 via-blue-50/40 to-cyan-100/50 px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <span className="text-3xl" role="img" aria-label="water drop">💧</span>
          </div>
          <h1 className="text-2xl font-bold text-base-content">Welcome Back</h1>
          <p className="text-sm text-base-content/50 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-base-100 rounded-2xl shadow-lg p-6">
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-control mb-4">
              <label className="label" htmlFor="email">
                <span className="label-text font-medium">Email</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="input input-bordered w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-control mb-6">
              <label className="label" htmlFor="password">
                <span className="label-text font-medium">Password</span>
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-full ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              Sign In
            </button>
          </form>

          <div className="text-center mt-4">
            <span className="text-sm text-base-content/50">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </span>
          </div>
        </div>

        <p className="text-center text-xs text-base-content/40 mt-6">
          &copy; {new Date().getFullYear()} WaterDelivery. All rights reserved.
        </p>
      </div>
    </div>
  );
}
