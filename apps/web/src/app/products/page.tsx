"use client";

import { useState } from "react";
import Link from "next/link";

const products = [
  { id: "1", name: "350ml Water", description: "Perfect for on-the-go. Compact and refreshing.", price: 5000, packSize: "12 bottles", category: "Bottles" },
  { id: "2", name: "500ml Water", description: "Ideal for daily hydration. Great for office and home.", price: 7000, packSize: "12 bottles", category: "Bottles" },
  { id: "3", name: "1L Water", description: "Family size. Perfect for meals and gatherings.", price: 10000, packSize: "12 bottles", category: "Bottles" },
  { id: "4", name: "1.5L Water", description: "Extra capacity for active families and events.", price: 13000, packSize: "12 bottles", category: "Bottles" },
  { id: "5", name: "Water Pump", description: "Easy-to-use dispenser pump for 20L bottles.", price: 15000, packSize: "1 unit", category: "Dispensers" },
  { id: "6", name: "Stainless Bottle", description: "Durable, BPA-free. Available in 500ml and 1L.", price: 20000, packSize: "Various sizes", category: "Accessories" },
];

const tabs = ["All", "Bottles", "Dispensers", "Accessories"];

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", { style: "decimal", maximumFractionDigits: 0 }).format(price);
}

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState("All");

  const filtered = activeTab === "All" ? products : products.filter((p) => p.category === activeTab);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-100/60 via-blue-50/40 to-cyan-100/50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMS41IiBmaWxsPSIjMUU2MDkxIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')] opacity-40"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-20 text-center">
          <span className="inline-block bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold mb-4 animate-fade-in">Our Products</span>
          <h1 className="text-3xl md:text-5xl font-bold mt-3 mb-4 animate-fade-in-up">Water for <span className="text-cyan-600">Every Need</span></h1>
          <p className="text-base-content/60 max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            From personal hydration to family-sized bottles, we have the perfect solution for you.
          </p>
        </div>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,15 1440,30 L1440,60 L0,60 Z" className="fill-base-100"/>
        </svg>
      </section>

      {/* Products */}
      <section className="py-16 px-4 bg-base-100">
        <div className="max-w-6xl mx-auto">
          {/* Filter tabs */}
          <div className="flex justify-center gap-2 mb-10 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-primary text-primary-content shadow-md"
                    : "bg-base-200/50 text-base-content/60 hover:text-base-content"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            {filtered.map((product) => (
              <div key={product.id} className="bg-base-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up">
                <div className="h-40 bg-gradient-to-br from-primary/5 to-cyan-600/5 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-base-content">{product.name}</h3>
                      <p className="text-sm text-base-content/50 mt-1">{product.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-200/50">
                    <span className="text-xs font-medium text-base-content/40 bg-base-200/50 px-2 py-1 rounded-md">{product.packSize}</span>
                    <span className="font-bold text-primary">{formatPrice(product.price)} MMK</span>
                  </div>
                  <Link href="/subscription" className="btn btn-primary btn-sm w-full mt-4">
                    Order Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-base-200/50">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Need Bulk Orders?</h2>
          <p className="text-base-content/60 mb-6">We offer special pricing for offices, restaurants, and businesses. Contact us for a custom quote.</p>
          <Link href="/contact" className="btn btn-primary px-8">
            Contact Sales
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}