import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Water Delivery - Fresh Water Delivered to Your Door",
  description:
    "Subscribe to fresh water delivery. Choose from our selection of purified, mineral, and alkaline water products delivered on your schedule.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("theme")||"light";document.documentElement.setAttribute("data-theme",t==="dark"?"dark":"water")})()`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <SiteHeader>{children}</SiteHeader>
        </Providers>
      </body>
    </html>
  );
}
