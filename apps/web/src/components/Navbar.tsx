"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/subscription", label: "Subscription" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? "shadow-lg" : "bg-base-100"}`}
      style={scrolled ? { backgroundColor: "#1E6091" } : undefined}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className={`flex items-center gap-2 font-bold text-lg transition-colors duration-200 ${scrolled ? "text-white" : "text-primary"}`}>
          <span className="text-2xl" role="img" aria-label="water drop">💧</span>
          <span>Yay Thal Pya Zat</span>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  scrolled
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : "text-base-content/70 hover:text-primary hover:bg-primary/5"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle scrolled={scrolled} />
          <Link
            href="/subscription"
            className={`btn btn-sm hidden sm:inline-flex transition-all duration-200 ${
              scrolled
                ? "bg-white text-primary border-white hover:bg-white/90"
                : "btn-primary"
            }`}
          >
            Subscribe Now
          </Link>

          {/* Mobile menu button */}
          <button
            className={`btn btn-ghost btn-sm lg:hidden ${scrolled ? "text-white hover:bg-white/10" : ""}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-base-100 animate-fade-in">
          <ul className="menu p-4 gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2">
              <Link href="/subscription" className="btn btn-primary btn-sm w-full" onClick={() => setMobileOpen(false)}>
                Subscribe Now
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}