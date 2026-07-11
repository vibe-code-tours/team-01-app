export default function SubscriptionPage() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">Subscription Plans</h1>
        <p className="text-center text-base-content/70 mb-12 max-w-2xl mx-auto">
          Choose a plan that fits your household. Cancel or modify anytime.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h3 className="card-title">Basic</h3>
              <p className="text-base-content/70">Perfect for individuals</p>
              <div className="mt-4">
                <span className="text-4xl font-bold">$12</span>
                <span className="text-base-content/70">/month</span>
              </div>
              <ul className="mt-6 space-y-2">
                <li className="flex items-center gap-2"><span>✅</span> 2 deliveries per month</li>
                <li className="flex items-center gap-2"><span>✅</span> 19L per delivery</li>
                <li className="flex items-center gap-2"><span>✅</span> Free dispenser loan</li>
                <li className="flex items-center gap-2 text-base-content/40"><span>❌</span> Priority delivery</li>
                <li className="flex items-center gap-2 text-base-content/40"><span>❌</span> Dedicated support</li>
              </ul>
              <div className="mt-6">
                <button className="btn btn-outline btn-primary w-full">Get Started</button>
              </div>
            </div>
          </div>

          <div className="card bg-primary text-primary-content shadow-xl">
            <div className="card-body">
              <div className="badge badge-secondary">Popular</div>
              <h3 className="card-title">Standard</h3>
              <p className="text-primary-content/70">Best for families</p>
              <div className="mt-4">
                <span className="text-4xl font-bold">$24</span>
                <span className="text-primary-content/70">/month</span>
              </div>
              <ul className="mt-6 space-y-2">
                <li className="flex items-center gap-2"><span>✅</span> 4 deliveries per month</li>
                <li className="flex items-center gap-2"><span>✅</span> 19L per delivery</li>
                <li className="flex items-center gap-2"><span>✅</span> Free dispenser loan</li>
                <li className="flex items-center gap-2"><span>✅</span> Priority delivery</li>
                <li className="flex items-center gap-2 text-primary-content/40"><span>❌</span> Dedicated support</li>
              </ul>
              <div className="mt-6">
                <button className="btn btn-secondary w-full">Get Started</button>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h3 className="card-title">Premium</h3>
              <p className="text-base-content/70">Best for offices</p>
              <div className="mt-4">
                <span className="text-4xl font-bold">$48</span>
                <span className="text-base-content/70">/month</span>
              </div>
              <ul className="mt-6 space-y-2">
                <li className="flex items-center gap-2"><span>✅</span> 8 deliveries per month</li>
                <li className="flex items-center gap-2"><span>✅</span> 19L per delivery</li>
                <li className="flex items-center gap-2"><span>✅</span> Free dispenser loan</li>
                <li className="flex items-center gap-2"><span>✅</span> Priority delivery</li>
                <li className="flex items-center gap-2"><span>✅</span> Dedicated support</li>
              </ul>
              <div className="mt-6">
                <button className="btn btn-outline btn-primary w-full">Get Started</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}