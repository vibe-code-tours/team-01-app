import Link from "next/link";

const footerLinks = {
  Product: [
    { href: "/products", label: "Water Bottles" },
    { href: "/products", label: "Dispensers" },
    { href: "/products", label: "Accessories" },
    { href: "/subscription", label: "Subscription" },
  ],
  Company: [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
    { href: "/", label: "Careers" },
    { href: "/", label: "Blog" },
  ],
  Support: [
    { href: "/contact", label: "Help Center" },
    { href: "/contact", label: "Delivery Info" },
    { href: "/contact", label: "Returns" },
    { href: "/contact", label: "FAQ" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <span className="text-xl" role="img" aria-label="water drop">💧</span>
              Yay Thal Pya Zat
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mt-4 max-w-xs">
              Fresh water delivered to your door. Subscribe today and never run out.
            </p>
            {/* Social icons */}
            <div className="flex gap-3 mt-6">
              {["Facebook", "Instagram", "Twitter"].map((platform) => (
                <span key={platform} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-sm text-white mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} WaterDelivery. All rights reserved.</p>
          <div className="flex gap-6 mt-3 md:mt-0">
            <span className="hover:text-white/70 transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white/70 transition-colors cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}