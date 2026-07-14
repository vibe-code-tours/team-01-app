"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { userFetch, publicFetch, fetchSession } from "@/lib/api-client";

interface Location {
  id: string;
  name: string;
}

export default function ProfileCompletePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [townshipId, setTownshipId] = useState("");

  const [provinces, setProvinces] = useState<Location[]>([]);
  const [townships, setTownships] = useState<Location[]>([]);

  useEffect(() => {
    async function init() {
      const session = await fetchSession();
      if (!session.success) {
        router.push("/login");
        return;
      }

      const provincesRes = await publicFetch<Location[]>("/provinces/list");
      if (provincesRes.success && provincesRes.data) {
        setProvinces(provincesRes.data);
      }

      try {
        const profileRes = await userFetch<{
          phone: string | null;
          address: string | null;
          provinceId: string | null;
          townshipId: string | null;
        }>("/profile");
        if (profileRes.success && profileRes.data) {
          const p = profileRes.data;
          if (p.phone) setPhone(p.phone);
          if (p.address) setAddress(p.address);
          if (p.provinceId) setProvinceId(p.provinceId);
          if (p.townshipId) setTownshipId(p.townshipId);
        }
      } catch (e) {
        console.error("Failed to load profile:", e);
      }

      setLoading(false);
    }
    init();
  }, [router]);

  useEffect(() => {
    if (!provinceId) {
      setTownships([]);
      setTownshipId("");
      return;
    }
    async function loadTownships() {
      const result = await publicFetch<Location[]>(
        `/townships-by-province/${provinceId}`
      );
      if (result.success && result.data) {
        setTownships(result.data);
      }
    }
    loadTownships();
  }, [provinceId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const result = await userFetch("/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, address, provinceId, townshipId }),
    });

    setSaving(false);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Failed to update profile");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100/60 via-blue-50/40 to-cyan-100/50 px-4">
      <div className="w-full max-w-lg animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-base-content">
            Complete Your Profile
          </h1>
          <p className="text-sm text-base-content/50 mt-1">
            Tell us your delivery location so we can serve you better.
          </p>
        </div>

        <div className="bg-base-100 rounded-2xl shadow-lg p-6">
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="province">
                <span className="label-text font-medium">Province</span>
              </label>
              <select
                id="province"
                className="select select-bordered w-full"
                value={provinceId}
                onChange={(e) => setProvinceId(e.target.value)}
                required
              >
                <option value="">Select province</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="township">
                <span className="label-text font-medium">Township</span>
              </label>
              <select
                id="township"
                className="select select-bordered w-full"
                value={townshipId}
                onChange={(e) => setTownshipId(e.target.value)}
                required
                disabled={!provinceId}
              >
                <option value="">Select township</option>
                {townships.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="phone">
                <span className="label-text font-medium">Phone Number</span>
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="09xxxxxxxxx"
                className="input input-bordered w-full"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="label" htmlFor="address">
                <span className="label-text font-medium">Delivery Address</span>
              </label>
              <textarea
                id="address"
                placeholder="Street address, building, floor..."
                className="textarea textarea-bordered w-full"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-full ${saving ? "loading" : ""}`}
              disabled={saving}
            >
              Save & Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
