const products = [
  {
    id: "1",
    name: "350ml Water",
    description: "Perfect for on-the-go. Compact and refreshing.",
    price: 5000,
    packSize: "12 bottles",
    image: "/images/products/350ml.jpg",
  },
  {
    id: "2",
    name: "500ml Water",
    description: "Ideal for daily hydration. Great for office and home.",
    price: 7000,
    packSize: "12 bottles",
    image: "/images/products/500ml.jpg",
  },
  {
    id: "3",
    name: "1L Water",
    description: "Family size. Perfect for meals and gatherings.",
    price: 10000,
    packSize: "12 bottles",
    image: "/images/products/1l.jpg",
  },
  {
    id: "4",
    name: "1.5L Water",
    description: "Extra capacity for active families and events.",
    price: 13000,
    packSize: "12 bottles",
    image: "/images/products/1.5l.jpg",
  },
  {
    id: "5",
    name: "Water Pump",
    description: "Easy-to-use dispenser pump for 20L bottles.",
    price: 15000,
    packSize: "1 unit",
    image: "/images/products/pump.jpg",
  },
  {
    id: "6",
    name: "Stainless Bottle",
    description: "Durable, BPA-free. Available in 500ml and 1L.",
    price: 20000,
    packSize: "Various sizes",
    image: "/images/products/bottle.jpg",
  },
];

const subscriptions = [
  {
    id: "1",
    name: "Starter",
    coupons: 5,
    price: 5000,
    description: "Try our 20L delivery service",
  },
  {
    id: "2",
    name: "Regular",
    coupons: 12,
    price: 10000,
    description: "Great value for regular users",
  },
  {
    id: "3",
    name: "Premium",
    coupons: 24,
    price: 18000,
    description: "Best value for families",
  },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="hero min-h-[80vh] bg-base-200">
        <div className="hero-content text-center flex-col gap-6 max-w-3xl">
          <div className="text-6xl">💧</div>
          <h1 className="text-5xl font-bold text-base-content">
            Fresh Water, Delivered to Your Door
          </h1>
          <p className="text-lg text-base-content/70 max-w-xl">
            Subscribe to our water delivery service and never worry about running
            out. Pure, clean, refreshing water — on your schedule.
          </p>
          <div className="flex gap-4 mt-4">
            <a href="/subscription" className="btn btn-primary btn-lg">
              Get Started
            </a>
            <a href="/products" className="btn btn-outline btn-lg">
              View Products
            </a>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-20 px-4 bg-base-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Our Products</h2>
          <p className="text-center text-base-content/60 mb-12 max-w-2xl mx-auto">
            Quality water products for every need. From personal hydration to
            family-sized bottles.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="card bg-base-200 shadow-sm">
                <figure className="px-6 pt-6">
                  <div className="bg-base-300 rounded-lg w-full h-40 flex items-center justify-center">
                    <span className="text-4xl">💧</span>
                  </div>
                </figure>
                <div className="card-body">
                  <h3 className="card-title text-sm">{product.name}</h3>
                  <p className="text-xs text-base-content/60">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-base-content/50">
                      {product.packSize}
                    </span>
                    <span className="font-bold text-primary">
                      {formatPrice(product.price)} MMK
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <a href="/products" className="btn btn-outline">
              View All Products
            </a>
          </div>
        </div>
      </section>

      {/* Subscriptions */}
      <section className="py-20 px-4 bg-base-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            20L Water Subscription
          </h2>
          <p className="text-center text-base-content/60 mb-12 max-w-2xl mx-auto">
            Save more with our subscription plans. Use coupons to order 20L
            bottles anytime.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {subscriptions.map((sub, index) => (
              <div
                key={sub.id}
                className={`card ${
                  index === 1 ? "bg-primary text-primary-content" : "bg-base-100"
                } shadow-md`}
              >
                <div className="card-body items-center text-center">
                  {index === 1 && (
                    <div className="badge badge-secondary mb-2">Popular</div>
                  )}
                  <h3 className="card-title">{sub.name}</h3>
                  <div className="text-4xl font-bold my-4">
                    {sub.coupons}
                    <span className="text-sm font-normal ml-1">coupons</span>
                  </div>
                  <p
                    className={`text-sm ${
                      index === 1 ? "text-primary-content/80" : "text-base-content/60"
                    }`}
                  >
                    {sub.description}
                  </p>
                  <div className="mt-4">
                    <span className="text-2xl font-bold">
                      {formatPrice(sub.price)} MMK
                    </span>
                  </div>
                  <button
                    className={`btn mt-4 ${
                      index === 1 ? "btn-secondary" : "btn-primary"
                    }`}
                  >
                    Subscribe Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4 bg-base-100">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Why Choose Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-200 shadow-sm">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-2">🚚</div>
                <h3 className="card-title">Reliable Delivery</h3>
                <p>
                  Schedule deliveries that fit your life. Same-day and next-day
                  options available.
                </p>
              </div>
            </div>
            <div className="card bg-base-200 shadow-sm">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-2">💎</div>
                <h3 className="card-title">Premium Quality</h3>
                <p>
                  Our water goes through rigorous purification to ensure the
                  highest quality.
                </p>
              </div>
            </div>
            <div className="card bg-base-200 shadow-sm">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-2">♻️</div>
                <h3 className="card-title">Eco-Friendly</h3>
                <p>
                  We use sustainable packaging and carbon-neutral delivery
                  methods.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary text-primary-content">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 text-primary-content/80">
            Join thousands of satisfied customers. Fresh water delivered to your
            doorstep.
          </p>
          <a href="/register" className="btn btn-secondary btn-lg">
            Create Account
          </a>
        </div>
      </section>
    </>
  );
}