export default function PricingPage() {
  const addons = [
    { name: "Water Dispenser Stand", price: "$0", period: "included with any plan", desc: "Hot & cold dispenser on loan" },
    { name: "Cup Holder Attachment", price: "$2", period: "/month", desc: "Convenient cup dispenser" },
    { name: "Extra 19L Bottle", price: "$4.99", period: "per bottle", desc: "Add more bottles per delivery" },
    { name: "Same-Day Delivery", price: "$5", period: "per delivery", desc: "Need it today? We got you" },
  ];

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">Pricing & Add-ons</h1>
        <p className="text-center text-base-content/70 mb-12">
          Transparent pricing with no hidden fees. All subscription plans include free delivery.
        </p>
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Add-on</th>
                <th>Price</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {addons.map((addon) => (
                <tr key={addon.name}>
                  <td className="font-semibold">{addon.name}</td>
                  <td>
                    <span className="text-primary font-bold">{addon.price}</span>
                    <span className="text-sm text-base-content/70">{addon.period}</span>
                  </td>
                  <td className="text-base-content/70">{addon.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card bg-neutral text-neutral-content mt-12">
          <div className="card-body text-center">
            <h3 className="card-title justify-center">Custom Enterprise Plans</h3>
            <p>Need a custom plan for your office or business? We offer volume discounts and dedicated account management.</p>
            <a href="/contact" className="btn btn-primary btn-md mt-4">Contact Us</a>
          </div>
        </div>
      </div>
    </section>
  );
}