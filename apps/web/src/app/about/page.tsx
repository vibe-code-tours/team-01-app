export default function AboutPage() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12">About Us</h1>

        <div className="card bg-base-100 shadow-md mb-12">
          <div className="card-body">
            <h2 className="card-title text-2xl">Our Mission</h2>
            <p className="text-base-content/70 leading-relaxed">
              We believe everyone deserves access to clean, fresh water. Founded
              in 2024, Water Delivery set out to make premium water accessible
              and affordable, delivered right to your doorstep with care for
              both you and the planet.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="stat bg-base-100 shadow-md rounded-box p-6 text-center">
            <div className="stat-title">Happy Customers</div>
            <div className="stat-value text-primary">10K+</div>
            <div className="stat-desc">And growing daily</div>
          </div>
          <div className="stat bg-base-100 shadow-md rounded-box p-6 text-center">
            <div className="stat-title">Deliveries Made</div>
            <div className="stat-value text-primary">500K+</div>
            <div className="stat-desc">On time, every time</div>
          </div>
          <div className="stat bg-base-100 shadow-md rounded-box p-6 text-center">
            <div className="stat-title">Carbon Offset</div>
            <div className="stat-value text-primary">100%</div>
            <div className="stat-desc">Net zero since day one</div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-2xl">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-base-200 rounded-box">
                <h3 className="font-bold mb-1">Quality First</h3>
                <p className="text-sm text-base-content/70">
                  Every batch tested to exceed safety standards.
                </p>
              </div>
              <div className="p-4 bg-base-200 rounded-box">
                <h3 className="font-bold mb-1">Sustainability</h3>
                <p className="text-sm text-base-content/70">
                  Reusable containers and carbon-neutral logistics.
                </p>
              </div>
              <div className="p-4 bg-base-200 rounded-box">
                <h3 className="font-bold mb-1">Community</h3>
                <p className="text-sm text-base-content/70">
                  Supporting local water access initiatives.
                </p>
              </div>
              <div className="p-4 bg-base-200 rounded-box">
                <h3 className="font-bold mb-1">Convenience</h3>
                <p className="text-sm text-base-content/70">
                  Manage everything from your phone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
