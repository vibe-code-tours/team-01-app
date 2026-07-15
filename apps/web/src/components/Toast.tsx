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
  if (type.includes("cancel")) return "alert-error";
  if (type.includes("approved")) return "alert-success";
  if (type.includes("created") || type.includes("purchased")) return "alert-info";
  return "alert-warning";
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
            className="btn btn-ghost btn-xs"
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
