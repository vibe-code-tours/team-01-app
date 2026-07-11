import Link from "next/link";

const footerLinks = {
  products: [
    { href: "/products", label: "Purified Water" },
    { href: "/products", label: "Mineral Water" },
    { href: "/products", label: "Alkaline Water" },
    { href: "/products", label: "Sparkling Water" },
  ],
  company: [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
    { href: "/pricing", label: "Pricing" },
    { href: "/subscription", label: "Subscription" },
  ],
  support: [
    { href: "/contact", label: "Help Center" },
    { href: "/contact", label: "Delivery Info" },
    { href: "/contact", label: "Returns" },
    { href: "/contact", label: "FAQ" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-neutral text-neutral-content">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">💧 Yay Thant</h3>
            <p className="text-sm text-neutral-content/70">
              Fresh water delivered to your door. Subscribe today and never run
              out.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Products</h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.products.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="divider opacity-20"></div>

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-neutral-content/70">
          <p>
            &copy; {new Date().getFullYear()} WaterDelivery. All rights
            reserved.
          </p>
          <div className="flex gap-4 mt-2 md:mt-0">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
