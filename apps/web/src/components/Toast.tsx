"use client";

import Link from "next/link";

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

function getToastColor(type: string) {
  if (type.includes("cancel") || type.includes("rejected")) return "bg-red-50 border border-red-200 text-red-800";
  if (type.includes("approved") || type.includes("delivered") || type.includes("subscription_approved")) return "bg-emerald-50 border border-emerald-200 text-emerald-800";
  if (type.includes("created") || type.includes("purchased") || type.includes("order_created")) return "bg-sky-50 border border-sky-200 text-sky-800";
  if (type.includes("status_changed") || type.includes("assigned")) return "bg-amber-50 border border-amber-200 text-amber-800";
  return "bg-gray-50 border border-gray-200 text-gray-800";
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`alert ${getToastColor(toast.type)} shadow-lg text-sm animate-slide-up`}
        >
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">{toast.title}</div>
            <div className="text-xs opacity-80 mt-0.5">{toast.message}</div>
            {toast.link && (
              <Link
                href={toast.link}
                className="link link-hover text-xs font-medium mt-1 inline-block"
                onClick={() => onRemove(toast.id)}
              >
                View details
              </Link>
            )}
          </div>
          <button
            className="text-current opacity-50 hover:opacity-100 transition-opacity p-1"
            onClick={() => onRemove(toast.id)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
