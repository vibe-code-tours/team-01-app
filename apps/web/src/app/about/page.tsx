const values = [
  {
    title: "Quality First",
    description: "Every batch tested to exceed safety standards.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  },
  {
    title: "Sustainability",
    description: "Reusable containers and carbon-neutral logistics.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
      </svg>
    ),
  },
  {
    title: "Community",
    description: "Supporting local water access initiatives.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    title: "Convenience",
    description: "Manage everything from your phone.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-100/60 via-blue-50/40 to-cyan-100/50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMS41IiBmaWxsPSIjMUU2MDkxIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')] opacity-40"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-20 text-center">
          <span className="inline-block bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold mb-4 animate-fade-in">About Us</span>
          <h1 className="text-3xl md:text-5xl font-bold mt-3 mb-4 animate-fade-in-up">Clean Water for <span className="text-cyan-600">Everyone</span></h1>
          <p className="text-base-content/60 max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            We believe everyone deserves access to clean, fresh water.
          </p>
        </div>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,15 1440,30 L1440,60 L0,60 Z" className="fill-base-100"/>
        </svg>
      </section>

      {/* Mission */}
      <section className="py-20 px-4 bg-base-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">Our Mission</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3">Premium Water, <span className="text-cyan-600">Affordable</span> for All</h2>
              <p className="text-base-content/60 mt-4 leading-relaxed">
                Founded in 2024, Water Delivery set out to make premium water accessible
                and affordable, delivered right to your doorstep with care for both you and the planet.
                What started as a small local service has grown into a trusted name for hundreds of families.
              </p>
              <p className="text-base-content/60 mt-4 leading-relaxed">
                We are committed to sustainability, quality, and community. Every bottle we deliver
                is part of our promise to bring clean water to everyone.
              </p>
            </div>
            {/* Right - Decorative card */}
            <div className="bg-base-100 rounded-3xl shadow-xl p-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-base-200/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">10K+</div>
                  <div className="text-xs text-base-content/50 mt-1">Happy Customers</div>
                </div>
                <div className="bg-base-200/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">500K+</div>
                  <div className="text-xs text-base-content/50 mt-1">Deliveries Made</div>
                </div>
                <div className="bg-base-200/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">4.9</div>
                  <div className="text-xs text-base-content/50 mt-1">Customer Rating</div>
                </div>
                <div className="bg-base-200/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">100%</div>
                  <div className="text-xs text-base-content/50 mt-1">Carbon Offset</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 bg-base-200/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">Our Values</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">What <span className="text-cyan-600">Drives Us</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
            {values.map((v) => (
              <div key={v.title} className="bg-base-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 text-center animate-fade-in-up">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  {v.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{v.title}</h3>
                <p className="text-sm text-base-content/60 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}