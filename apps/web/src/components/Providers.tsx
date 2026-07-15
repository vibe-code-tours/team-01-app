"use client";

import { CartProvider } from "@/lib/cart-context";
import { NotificationProvider } from "@/lib/notification-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </CartProvider>
  );
}
