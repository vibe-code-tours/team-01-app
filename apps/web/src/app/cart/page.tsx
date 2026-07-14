"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

function getImageSrc(url: string | null): string {
  if (!url) return "";
  if (url.startsWith("/")) return `/api${url}`;
  return url;
}

function formatPrice(price: string | number) {
  return new Intl.NumberFormat("en-US", { style: "decimal", maximumFractionDigits: 0 }).format(Number(price));
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-2xl bg-base-200 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-base-content/50 mb-6">Browse our products and add items to get started.</p>
        <Link href="/products" className="btn btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Shopping Cart</h1>
        <button className="btn btn-ghost btn-sm text-error" onClick={clearCart}>Clear Cart</button>
      </div>

      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <div key={item.productId} className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-4 flex gap-4">
            <div className="w-16 h-16 rounded-lg bg-base-200 overflow-hidden shrink-0 flex items-center justify-center">
              {item.imageUrl ? (
                <img src={getImageSrc(item.imageUrl)} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-base-content/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-sm text-primary font-medium">{formatPrice(item.price)} MMK</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              >-</button>
              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              >+</button>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold">{formatPrice(Number(item.price) * item.quantity)} MMK</p>
              <button className="btn btn-ghost btn-xs text-error" onClick={() => removeItem(item.productId)}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-base-200/50 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-base-content/60">Total ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
          <span className="text-2xl font-bold text-primary">{formatPrice(total)} MMK</span>
        </div>
        <Link href="/checkout" className="btn btn-primary w-full">
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
