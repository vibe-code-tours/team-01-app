"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { useCart } from "@/lib/cart-context";
import { fetchSession, signOut } from "@/lib/api-client";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/subscription", label: "Subscription" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role?: string;
  } | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { itemCount } = useCart();

  useEffect(() => {
    function checkDark() {
      setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
    }
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetchSession().then((res) => {
      if (res.success && res.data) {
        const d = res.data as {
          user: { name: string; email: string; role?: string };
        };
        setUser(d.user);
      } else {
        setUser(null);
      }
    });
  }, [pathname]);

  async function handleSignOut() {
    await signOut();
    setUser(null);
    setUserMenuOpen(false);
    window.location.href = "/";
  }

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? "shadow-lg" : "bg-base-100"}`}
      style={scrolled ? { backgroundColor: "#0B2545" } : undefined}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center"
        >
          <img
            src={scrolled || isDark ? "/ytpz-logo-horizontal-white.svg" : "/ytpz-logo-horizontal.svg"}
            alt="Yay Thal Pya Zat"
            className="h-8"
          />
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

          {/* Cart */}
          <div className="relative">
            <Link
              href="/cart"
              className={`btn btn-ghost btn-sm ${scrolled ? "text-white hover:bg-white/10" : ""}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                />
              </svg>
            </Link>
            {itemCount > 0 && (
              <span
                className={`absolute -top-0.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold leading-none px-1 z-10 ${scrolled ? "bg-white text-primary" : "bg-black text-white"}`}
              >
                {itemCount}
              </span>
            )}
          </div>

          {/* Notifications */}
          {user && <NotificationBell scrolled={scrolled} />}

          {/* User menu or Login */}
          {user ? (
            <div className="relative">
              <button
                className={`btn btn-ghost btn-sm gap-1 ${scrolled ? "text-white hover:bg-white/10" : ""}`}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="avatar placeholder">
                  <div className="bg-white/20 text-white rounded-full w-7">
                    <span className="text-xs">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                </div>
                <span className="hidden sm:inline text-sm">{user.name}</span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-base-100 rounded-xl shadow-lg border border-base-200 py-1 w-48 z-50 animate-fade-in">
                  {user.role !== "super-admin" && user.role !== "admin" && (
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm hover:bg-base-200"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  {user.role !== "super-admin" && user.role !== "admin" && (
                    <Link
                      href="/profile/complete"
                      className="block px-4 py-2 text-sm hover:bg-base-200"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                  )}
                  {user.role === "super-admin" || user.role === "admin" ? (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-sm hover:bg-base-200"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  ) : null}
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-error hover:bg-base-200"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className={`btn btn-sm transition-all duration-200 ${
                  scrolled
                    ? "bg-white text-primary border-white hover:bg-white/90"
                    : "btn-primary"
                }`}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className={`btn btn-sm transition-all duration-200 ${
                  scrolled
                    ? "border-white text-white hover:bg-white/10"
                    : "btn-outline"
                }`}
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            className={`btn btn-ghost btn-sm lg:hidden ${scrolled ? "text-white hover:bg-white/10" : ""}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
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
              {user ? (
                <>
                  {user.role !== "super-admin" && user.role !== "admin" && (
                    <Link
                      href="/dashboard"
                      className="btn btn-outline btn-sm w-full"
                      onClick={() => setMobileOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    className="btn btn-ghost btn-sm w-full text-error"
                    onClick={() => {
                      handleSignOut();
                      setMobileOpen(false);
                    }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="btn btn-primary btn-sm w-full"
                    onClick={() => setMobileOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="btn btn-outline btn-sm w-full mt-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
