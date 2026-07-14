"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { publicFetch, fetchSession, userFetch } from "@/lib/api-client";

interface SubscriptionPackage {
  id: string;
  name: string;
  couponCount: number;
  price: string;
  description: string | null;
  expiresInDays: number;
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-success shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function formatPrice(price: string) {
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(Number(price));
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      const result = await publicFetch<SubscriptionPackage[]>(
        "/subscription-packages",
      );
      if (result.success && result.data) {
        setPackages(result.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handlePurchase(pkg: SubscriptionPackage) {
    setMessage(null);
    const session = await fetchSession();
    if (!session.success) {
      router.push("/login");
      return;
    }

    setPurchasing(pkg.id);
    const result = await userFetch<{ orderId: string }>("/subscriptions/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId: pkg.id }),
    });
    setPurchasing(null);

    if (result.success && result.data) {
      router.push(`/orders/${result.data.orderId}`);
    } else {
      setMessage({
        type: "error",
        text: result.error || "Purchase failed. Please try again.",
      });
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-100/60 via-blue-50/40 to-cyan-100/50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMS41IiBmaWxsPSIjMUU2MDkxIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')] opacity-40"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-20 text-center">
          <span className="inline-block bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold mb-4 animate-fade-in">
            Subscription Plans
          </span>
          <h1 className="text-3xl md:text-5xl font-bold mt-3 mb-4 animate-fade-in-up">
            20L Water <span className="text-cyan-600">Subscription</span>
          </h1>
          <p
            className="text-base-content/60 max-w-xl mx-auto animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            Save more with our subscription plans. Each coupon = 1 bottle of 20L
            water. Use them anytime before the subscription expires.
          </p>
        </div>
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,15 1440,30 L1440,60 L0,60 Z"
            className="fill-base-100"
          />
        </svg>
      </section>

      {/* Plans */}
      <section className="py-16 px-4 bg-base-100">
        <div className="max-w-5xl mx-auto">
          {message && (
            <div
              className={`alert ${message.type === "success" ? "alert-success" : "alert-error"} mb-8 max-w-lg mx-auto`}
            >
              <span>{message.text}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-12 text-base-content/40">
              No subscription packages available yet. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start stagger">
              {packages.map((pkg, index) => {
                const isFeatured =
                  index === 1 || (packages.length === 3 && index === 1);
                return (
                  <div
                    key={pkg.id}
                    className={`relative rounded-2xl overflow-hidden transition-all duration-300 animate-fade-in-up ${
                      isFeatured
                        ? "bg-gradient-to-br from-primary to-cyan-600 text-white shadow-xl shadow-primary/20 md:-mt-4 md:mb-4"
                        : "bg-base-100 shadow-sm hover:shadow-lg"
                    }`}
                  >
                    {isFeatured && (
                      <div className="absolute top-0 right-0 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-bl-xl">
                        Most Popular
                      </div>
                    )}
                    <div className="p-8">
                      <h3
                        className={`text-xl font-bold ${isFeatured ? "" : "text-base-content"}`}
                      >
                        {pkg.name}
                      </h3>
                      <p
                        className={`text-sm mt-1 ${isFeatured ? "text-white/70" : "text-base-content/50"}`}
                      >
                        {pkg.description ||
                          `${pkg.couponCount} coupons — each for 1 bottle of 20L water`}
                      </p>
                      <div className="mt-6 mb-6">
                        <span
                          className={`text-5xl font-bold ${isFeatured ? "" : "text-primary"}`}
                        >
                          {formatPrice(pkg.price)}
                        </span>
                        <span
                          className={`text-sm ml-1 ${isFeatured ? "text-white/60" : "text-base-content/40"}`}
                        >
                          MMK
                        </span>
                      </div>
                      <ul className="space-y-3 mb-8">
                        <li className="flex items-center gap-3 text-sm">
                          <CheckIcon />
                          <span
                            className={isFeatured ? "" : "text-base-content/70"}
                          >
                            {pkg.couponCount} coupons included
                          </span>
                        </li>
                        <li className="flex items-center gap-3 text-sm">
                          <CheckIcon />
                          <span
                            className={isFeatured ? "" : "text-base-content/70"}
                          >
                            Each coupon = 1 bottle of 20L water
                          </span>
                        </li>
                        <li className="flex items-center gap-3 text-sm">
                          <CheckIcon />
                          <span
                            className={isFeatured ? "" : "text-base-content/70"}
                          >
                            Valid for {pkg.expiresInDays || 30} days
                          </span>
                        </li>
                        <li className="flex items-center gap-3 text-sm">
                          <CheckIcon />
                          <span
                            className={isFeatured ? "" : "text-base-content/70"}
                          >
                            Use anytime during subscription
                          </span>
                        </li>
                      </ul>
                      <button
                        className={`btn w-full ${
                          isFeatured
                            ? "bg-white text-primary border-white hover:bg-white/90"
                            : "btn-primary"
                        } ${purchasing === pkg.id ? "loading" : ""}`}
                        onClick={() => handlePurchase(pkg)}
                        disabled={purchasing !== null}
                      >
                        {purchasing === pkg.id
                          ? "Purchasing..."
                          : "Get Started"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Dashboard section */}
      <section className="py-16 px-4 bg-base-200/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">
                Manage Delivery
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3">
                Track Every <span className="text-cyan-600">Delivery</span>
              </h2>
              <p className="text-base-content/60 mt-4 leading-relaxed max-w-lg">
                Manage your subscription from your phone. Track deliveries,
                schedule new orders, and use your coupons anytime.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Scheduled delivery",
                  "Priority scheduling",
                  "Free dispenser loan",
                  "Cancel anytime",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm text-base-content/70"
                  >
                    <CheckIcon />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="btn btn-primary mt-8 px-8">
                Get Started
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="py-16 px-4 bg-base-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Have Questions?
          </h2>
          <p className="text-base-content/60 mb-6">
            Our team is happy to help you choose the right plan. No commitment
            required.
          </p>
          <Link href="/contact" className="btn btn-outline btn-primary px-8">
            Talk to Us
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
