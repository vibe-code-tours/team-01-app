"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { publicFetch } from "@/lib/api-client";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  type: string;
  packSize: string | null;
  imageUrl: string | null;
  status: string;
}

const categoryMap: Record<string, string> = {
  bottle: "bottles",
  pump: "dispensers",
  retail: "retail",
};

function getImageSrc(url: string | null): string {
  if (!url) return "";
  if (url.startsWith("/")) return `/api${url}`;
  return url;
}

const features = [
  {
    title: "Scheduled Delivery",
    desc: "Choose your preferred delivery date and time. We deliver on your schedule.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 3v5a2 2 0 0 1-2 2h-1" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    title: "Premium Quality",
    desc: "Multi-stage purification process ensures the cleanest, safest water for your family.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "Easy Scheduling",
    desc: "Set up recurring deliveries on your schedule. Modify or cancel anytime from your phone.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: "Subscription Plans",
    desc: "Save more with monthly plans. Use coupons to order 20L bottles whenever you need.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
  {
    title: "Eco-Friendly",
    desc: "Reusable bottles and carbon-neutral delivery. We care about the planet as much as you do.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
      </svg>
    ),
  },
  {
    title: "Flexible Payments",
    desc: "Pay via bank transfer (verified within 2-3 business days) or cash on delivery.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
];

const tabs = ["All", "Bottles", "Dispensers", "Retail"];

function formatPrice(price: string) {
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(Number(price));
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await publicFetch<{ products: Product[] }>("/products?limit=6");
      if (result.success && result.data) {
        setProducts(result.data.products);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered =
    activeTab === "All"
      ? products
      : products.filter((p) => categoryMap[p.type] === activeTab.toLowerCase());

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-sky-100/60 via-blue-50/40 to-cyan-100/50">
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6 animate-fade-in">
            <img src="/ytpz-mark.svg" alt="YTPZ" className="h-4 w-4" />
            Trusted by 500+ Families
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-base-content leading-tight animate-fade-in-up">
            Fresh Water, <span className="text-cyan-600">Delivered</span> to
            Your Door
          </h1>
          <p
            className="text-lg text-base-content/60 mt-6 leading-relaxed max-w-2xl mx-auto animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            Subscribe to our water delivery service and never worry about
            running out. Pure, clean, refreshing water on your schedule.
          </p>
          <div
            className="flex flex-col sm:flex-row gap-3 mt-8 justify-center animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            <Link href="/subscription" className="btn btn-primary btn-lg px-8">
              Start Order
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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
            <Link href="/products" className="btn btn-outline btn-lg px-8">
              View Products
            </Link>
          </div>
          <div
            className="flex gap-8 mt-10 justify-center animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            <div>
              <div className="text-2xl font-bold text-base-content">500+</div>
              <div className="text-sm text-base-content/50">Happy Families</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-base-content">10K+</div>
              <div className="text-sm text-base-content/50">Deliveries</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-base-content">4.9</div>
              <div className="text-sm text-base-content/50">Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-base-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">
              Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">
              Everything You Need for{" "}
              <span className="text-cyan-600">Hydration</span>
            </h2>
            <p className="text-base-content/60 mt-3 max-w-2xl mx-auto">
              A complete water delivery platform designed for modern households.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-base-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-base-content/60 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-20 px-4 bg-base-200/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-block bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">
              Our Products
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">
              Water for <span className="text-cyan-600">Every Need</span>
            </h2>
            <p className="text-base-content/60 mt-3 max-w-2xl mx-auto">
              From personal hydration to family-sized bottles, we have the
              perfect solution.
            </p>
          </div>
          {/* Filter tabs */}
          <div className="flex justify-center gap-2 mb-10 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-primary text-primary-content shadow-md"
                    : "bg-base-100 text-base-content/60 hover:text-base-content hover:bg-base-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Product grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            {loading && (
              <div className="col-span-full flex justify-center py-12">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-base-content/50">No products found</p>
              </div>
            )}
            {!loading && filtered.map((product) => (
              <div
                key={product.id}
                className="bg-base-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up"
              >
                <div className="h-48 bg-gradient-to-br from-primary/5 to-cyan-600/5 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={getImageSrc(product.imageUrl)}
                      alt={product.name}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <img src="/ytpz-mark.svg" alt="YTPZ" className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-base-content">
                        {product.name}
                      </h3>
                      <p className="text-sm text-base-content/50 mt-1">
                        {product.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-200/50">
                    <span className="text-xs font-medium text-base-content/40 bg-base-200/50 px-2 py-1 rounded-md">
                      {product.packSize}
                    </span>
                    <span className="font-bold text-primary">
                      {formatPrice(product.price)} MMK
                    </span>
                  </div>
                  <Link
                    href="/subscription"
                    className="btn btn-primary btn-sm w-full mt-4"
                  >
                    Order Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/products" className="btn btn-outline btn-primary">
              View All Products
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
      </section>

      {/* Subscriptions */}
      <section className="py-20 px-4 bg-base-100">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">
            Subscription Plans
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3">
            20L Water <span className="text-cyan-600">Subscription</span>
          </h2>
          <p className="text-base-content/60 mt-4 leading-relaxed max-w-xl mx-auto">
            Save more with our subscription plans. Use coupons to order 20L
            bottles anytime. Cancel or modify your plan anytime.
          </p>
          <ul className="mt-6 space-y-3 inline-block text-left">
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-success shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link href="/subscription" className="btn btn-primary px-8">
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
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-l from-primary to-cyan-600 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <span className="inline-block bg-white/20 text-white rounded-full px-3 py-1 text-xs font-semibold">
                Join Us
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3">
                Start Fresh Water{" "}
                <span className="text-white/80">Delivery</span>
              </h2>
              <p className="text-lg text-white/80 mt-4 leading-relaxed max-w-lg">
                Join thousands of satisfied customers. Fresh water delivered to
                your doorstep on your schedule.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Link
                  href="/subscription"
                  className="btn bg-white border-white hover:bg-white/90 hover:border-white/90 btn-lg px-8"
                  style={{ color: "#1E6091" }}
                >
                  Get Started
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
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
                <Link
                  href="/contact"
                  className="btn border-white/40 hover:bg-white/10 hover:border-white/60 btn-lg px-8"
                  style={{ color: "#ffffff", borderWidth: "1.5px" }}
                >
                  Contact Sales
                </Link>
              </div>
            </div>
            {/* Right - Phone Mockup */}
          </div>
        </div>
      </section>
    </>
  );
}
