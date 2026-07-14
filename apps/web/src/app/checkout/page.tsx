"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { fetchSession, userFetch } from "@/lib/api-client";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", { style: "decimal", maximumFractionDigits: 0 }).format(price);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSession().then((res) => {
      if (!res.success) router.push("/login");
      else setLoading(false);
    });
  }, [router]);

  async function handleSubmit() {
    setError("");
    setSubmitting(true);

    const orderItems = items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
    }));

    const result = await userFetch("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: orderItems,
        paymentDetails: paymentDetails || undefined,
      }),
    });

    setSubmitting(false);

    if (result.success && result.data) {
      clearCart();
      const order = result.data as { id: string };
      router.push(`/orders/${order.id}`);
    } else {
      setError(result.error || "Failed to create order");
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">No items to checkout</h1>
        <p className="text-base-content/50">Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-6 mb-6">
        <h2 className="font-semibold mb-4">Order Summary</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span>{item.name} x {item.quantity}</span>
              <span className="font-medium">{formatPrice(Number(item.price) * item.quantity)} MMK</span>
            </div>
          ))}
        </div>
        <div className="border-t border-base-200 mt-4 pt-4 flex justify-between font-bold">
          <span>Total</span>
          <span className="text-primary">{formatPrice(total)} MMK</span>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-6 mb-6">
        <h2 className="font-semibold mb-4">Payment Details</h2>
        <p className="text-sm text-base-content/50 mb-3">
          Enter bank transfer reference or payment notes (optional).
        </p>
        <textarea
          className="textarea textarea-bordered w-full"
          placeholder="e.g. KBZ Pay reference, bank transfer ID..."
          value={paymentDetails}
          onChange={(e) => setPaymentDetails(e.target.value)}
          rows={3}
        />
      </div>

      <button
        className={`btn btn-primary w-full ${submitting ? "loading" : ""}`}
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? "Placing Order..." : `Place Order — ${formatPrice(total)} MMK`}
      </button>
    </div>
  );
}
