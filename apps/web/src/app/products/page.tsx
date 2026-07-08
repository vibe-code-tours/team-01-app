export default function ProductsPage() {
  const products = [
    { name: "Purified Water", size: "19L", price: "$8.99", description: "Multi-stage filtered water, free of impurities", icon: "💧" },
    { name: "Mineral Water", size: "19L", price: "$11.99", description: "Naturally enriched with essential minerals", icon: "🏔️" },
    { name: "Alkaline Water", size: "19L", price: "$13.99", description: "pH-balanced water for optimal hydration", icon: "⚡" },
    { name: "Purified Water", size: "10L", price: "$5.49", description: "Same great quality in a smaller size", icon: "💧" },
    { name: "Mineral Water", size: "10L", price: "$7.49", description: "Mineral-rich water, conveniently sized", icon: "🏔️" },
    { name: "Sparkling Water", size: "10L", price: "$9.49", description: "Refreshing carbonated mineral water", icon: "🫧" },
  ];

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">Our Products</h1>
        <p className="text-center text-base-content/70 mb-12 max-w-2xl mx-auto">
          We offer a variety of water types and sizes to match your needs. All products are available for home delivery.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.name + product.size} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body items-center text-center">
                <div className="text-5xl mb-3">{product.icon}</div>
                <h3 className="card-title">{product.name}</h3>
                <p className="text-sm text-base-content/70">{product.description}</p>
                <div className="badge badge-outline badge-lg mt-2">{product.size}</div>
                <p className="text-2xl font-bold text-primary mt-3">{product.price}</p>
                <a href="/subscription" className="btn btn-primary btn-sm mt-2">Subscribe</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}