import Link from "next/link";

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-base-content/20 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  );
}

const plans = [
  {
    name: "Basic",
    description: "Perfect for individuals",
    price: 12,
    features: [
      { text: "2 deliveries per month", included: true },
      { text: "19L per delivery", included: true },
      { text: "Free dispenser loan", included: true },
      { text: "Priority delivery", included: false },
      { text: "Dedicated support", included: false },
    ],
  },
  {
    name: "Standard",
    description: "Best for families",
    price: 24,
    featured: true,
    features: [
      { text: "4 deliveries per month", included: true },
      { text: "19L per delivery", included: true },
      { text: "Free dispenser loan", included: true },
      { text: "Priority delivery", included: true },
      { text: "Dedicated support", included: false },
    ],
  },
  {
    name: "Premium",
    description: "Best for offices",
    price: 48,
    features: [
      { text: "8 deliveries per month", included: true },
      { text: "19L per delivery", included: true },
      { text: "Free dispenser loan", included: true },
      { text: "Priority delivery", included: true },
      { text: "Dedicated support", included: true },
    ],
  },
];

export default function SubscriptionPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-100/60 via-blue-50/40 to-cyan-100/50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMS41IiBmaWxsPSIjMUU2MDkxIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')] opacity-40"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-20 text-center">
          <span className="inline-block bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold mb-4 animate-fade-in">Subscription Plans</span>
          <h1 className="text-3xl md:text-5xl font-bold mt-3 mb-4 animate-fade-in-up">20L Water <span className="text-cyan-600">Subscription</span></h1>
          <p className="text-base-content/60 max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            Save more with our subscription plans. Use coupons to order 20L bottles anytime.
          </p>
        </div>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,15 1440,30 L1440,60 L0,60 Z" className="fill-base-100"/>
        </svg>
      </section>

      {/* Plans */}
      <section className="py-16 px-4 bg-base-100">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start stagger">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl overflow-hidden transition-all duration-300 animate-fade-in-up ${
                plan.featured
                  ? "bg-gradient-to-br from-primary to-cyan-600 text-white shadow-xl shadow-primary/20 md:-mt-4 md:mb-4"
                  : "bg-base-100 shadow-sm hover:shadow-lg"
              }`}
            >
              {plan.featured && (
                <div className="absolute top-0 right-0 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-bl-xl">
                  Most Popular
                </div>
              )}
              <div className="p-8">
                <h3 className={`text-xl font-bold ${plan.featured ? "" : "text-base-content"}`}>{plan.name}</h3>
                <p className={`text-sm mt-1 ${plan.featured ? "text-white/70" : "text-base-content/50"}`}>{plan.description}</p>
                <div className="mt-6 mb-6">
                  <span className={`text-5xl font-bold ${plan.featured ? "" : "text-primary"}`}>${plan.price}</span>
                  <span className={`text-sm ml-1 ${plan.featured ? "text-white/60" : "text-base-content/40"}`}>/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f.text} className={`flex items-center gap-3 text-sm ${f.included ? "" : plan.featured ? "text-white/40" : "text-base-content/30"}`}>
                      {f.included ? <CheckIcon /> : <XIcon />}
                      {f.text}
                    </li>
                  ))}
                </ul>
                <button
                  className={`btn w-full ${
                    plan.featured ? "bg-white text-primary border-white hover:bg-white/90" : "btn-primary"
                  }`}
                >
                  Get Started
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard mockup section */}
      <section className="py-16 px-4 bg-base-200/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <span className="inline-block bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">Manage Delivery</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3">Track Every <span className="text-cyan-600">Delivery</span></h2>
              <p className="text-base-content/60 mt-4 leading-relaxed max-w-lg">
                Manage your subscription from your phone. Track deliveries, schedule new orders, and use your coupons anytime.
              </p>
              <ul className="mt-6 space-y-3">
                {["Same-day delivery", "Priority scheduling", "Free dispenser loan", "Cancel anytime"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-base-content/70">
                    <CheckIcon />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="btn btn-primary mt-8 px-8">
                Get Started
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
            {/* Right - Mockup */}
            <div className="bg-base-100 rounded-3xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">Regular Plan</h3>
                  <p className="text-sm text-base-content/50">12 coupons remaining</p>
                </div>
                <span className="bg-success/10 text-success text-xs font-semibold px-3 py-1 rounded-full">Active</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-base-200/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">12</div>
                  <div className="text-xs text-base-content/50 mt-1">Coupons Left</div>
                </div>
                <div className="bg-base-200/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">3</div>
                  <div className="text-xs text-base-content/50 mt-1">This Month</div>
                </div>
              </div>
              <div className="bg-base-200/50 rounded-xl p-4">
                <div className="text-sm font-semibold mb-3">Recent Orders</div>
                <div className="space-y-2">
                  {["20L Water x2", "20L Water x1", "20L Water x3"].map((order, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-base-content/60">{order}</span>
                      <span className="text-xs text-base-content/40">{i === 0 ? "Tomorrow" : i === 1 ? "Last week" : "2 weeks ago"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="py-16 px-4 bg-base-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Have Questions?</h2>
          <p className="text-base-content/60 mb-6">
            Our team is happy to help you choose the right plan. No commitment required.
          </p>
          <Link href="/contact" className="btn btn-outline btn-primary px-8">
            Talk to Us
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}