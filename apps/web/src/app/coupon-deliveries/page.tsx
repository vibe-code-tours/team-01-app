"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { userFetch, fetchSession } from "@/lib/api-client";

interface ScheduleSlot {
  id: string;
  date: string;
  time_start: string;
  time_end: string;
  max_orders: number;
  current_orders: number;
  spots_left: number;
}

interface Subscription {
  couponsRemaining: number;
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function CouponDeliveriesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [totalCoupons, setTotalCoupons] = useState(0);

  const [bottleCount, setBottleCount] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const dates: string[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(formatDate(d));
  }

  useEffect(() => {
    async function init() {
      const session = await fetchSession();
      if (!session.success) {
        router.push("/login");
        return;
      }

      const [profileRes, subsRes] = await Promise.all([
        userFetch<{ phone: string | null; address: string | null }>("/profile"),
        userFetch<Subscription[]>("/subscriptions"),
      ]);

      if (profileRes.success && profileRes.data) {
        if (profileRes.data.phone) setContactPhone(profileRes.data.phone);
        if (profileRes.data.address) setDeliveryAddress(profileRes.data.address);
      }

      if (subsRes.success && subsRes.data) {
        const total = subsRes.data
          .filter((s) => s.couponsRemaining > 0)
          .reduce((sum, s) => sum + s.couponsRemaining, 0);
        setTotalCoupons(total);
      }

      setSelectedDate(formatDate(new Date()));
      setLoading(false);
    }
    init();
  }, [router]);

  useEffect(() => {
    if (!selectedDate) return;
    async function loadSlots() {
      setLoadingSlots(true);
      const result = await userFetch<ScheduleSlot[]>(`/schedules?date=${selectedDate}`);
      setSlots(result.success && result.data ? result.data : []);
      setLoadingSlots(false);
    }
    loadSlots();
  }, [selectedDate]);

  async function handleSchedule() {
    if (!selectedSlot || bottleCount < 1) return;
    setSubmitting(true);
    setMessage("");

    const result = await userFetch("/coupon-deliveries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bottleCount,
        scheduleId: selectedSlot,
        deliveryAddress,
        contactPhone,
        notes,
      }),
    });

    setSubmitting(false);
    if (result.success) {
      setMessage("Delivery scheduled! Coupons have been deducted.");
      setTimeout(() => router.push("/dashboard"), 1500);
    } else {
      setMessage(result.error || "Failed to schedule delivery");
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (totalCoupons === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">No Coupons Available</h1>
        <p className="text-base-content/50 mb-6">You need an active subscription to schedule deliveries.</p>
        <a href="/subscription" className="btn btn-primary">Buy Subscription</a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Schedule Water Delivery</h1>
      <p className="text-base-content/50 mb-8">Use your coupons to schedule 20L water bottle delivery.</p>

      {message && (
        <div className={`alert ${message.includes("success") || message.includes("Scheduled") ? "alert-success" : "alert-error"} mb-6`}>
          <span>{message}</span>
        </div>
      )}

      {/* Coupon balance + bottle count */}
      <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Bottles to Schedule</h2>
          <span className="text-sm text-base-content/50">{totalCoupons} coupons available</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="btn btn-sm btn-outline"
            onClick={() => setBottleCount(Math.max(1, bottleCount - 1))}
            disabled={bottleCount <= 1}
          >
            -
          </button>
          <span className="text-2xl font-bold w-12 text-center">{bottleCount}</span>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => setBottleCount(Math.min(totalCoupons, bottleCount + 1))}
            disabled={bottleCount >= totalCoupons}
          >
            +
          </button>
          <span className="text-sm text-base-content/50 ml-2">
            {bottleCount} {bottleCount === 1 ? "bottle" : "bottles"} = {bottleCount} coupons
          </span>
        </div>
      </div>

      {/* Date picker */}
      <div className="mb-6">
        <h2 className="font-semibold mb-3">Select Date</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((d) => (
            <button
              key={d}
              className={`btn btn-sm shrink-0 ${selectedDate === d ? "btn-primary" : "btn-outline"}`}
              onClick={() => { setSelectedDate(d); setSelectedSlot(null); }}
            >
              {formatDisplayDate(d)}
            </button>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div className="mb-6">
        <h2 className="font-semibold mb-3">Available Time Slots</h2>
        {loadingSlots ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner"></span>
          </div>
        ) : slots.length === 0 ? (
          <div className="bg-base-200/50 rounded-xl p-8 text-center text-base-content/40">
            No available slots for this date.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {slots.map((slot) => (
              <button
                key={slot.id}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedSlot === slot.id
                    ? "border-primary bg-primary/5"
                    : "border-base-200 hover:border-primary/50"
                }`}
                onClick={() => setSelectedSlot(slot.id)}
              >
                <div className="font-semibold">
                  {slot.time_start} — {slot.time_end}
                </div>
                <div className="text-sm text-base-content/50 mt-1">
                  {slot.spots_left} spots left
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delivery details */}
      {selectedSlot && (
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-6 mb-6">
          <h2 className="font-semibold mb-4">Delivery Details</h2>
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="address">
                <span className="label-text font-medium">Delivery Address</span>
              </label>
              <textarea
                id="address"
                className="textarea textarea-bordered w-full"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Full address including street, building, floor..."
                rows={2}
              />
            </div>
            <div>
              <label className="label" htmlFor="phone">
                <span className="label-text font-medium">Contact Phone</span>
              </label>
              <input
                id="phone"
                type="tel"
                className="input input-bordered w-full"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="09xxxxxxxxx"
              />
            </div>
            <div>
              <label className="label" htmlFor="notes">
                <span className="label-text font-medium">Notes (optional)</span>
              </label>
              <textarea
                id="notes"
                className="textarea textarea-bordered w-full"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special instructions..."
                rows={2}
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary + submit */}
      {selectedSlot && (
        <div className="bg-primary/5 rounded-xl border border-primary/20 p-4 mb-6">
          <div className="flex justify-between text-sm">
            <span>{bottleCount} x 20L Water Bottle</span>
            <span className="font-semibold">{bottleCount} coupon{bottleCount > 1 ? "s" : ""}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span>Remaining after delivery</span>
            <span className="font-semibold">{totalCoupons - bottleCount} coupons</span>
          </div>
        </div>
      )}

      <button
        className={`btn btn-primary w-full ${submitting ? "loading" : ""}`}
        onClick={handleSchedule}
        disabled={!selectedSlot || submitting}
      >
        {submitting ? "Scheduling..." : `Schedule ${bottleCount} Bottle${bottleCount > 1 ? "s" : ""} (${bottleCount} Coupon${bottleCount > 1 ? "s" : ""})`}
      </button>
    </div>
  );
}
