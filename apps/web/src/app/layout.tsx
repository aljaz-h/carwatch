import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarWatch",
  description: "Used-car listing aggregator and monitoring platform",
};

export const viewport: Viewport = {
  themeColor: "#0c0d0f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-base font-sans text-fg antialiased">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              color: "var(--color-fg)",
            },
          }}
        />
      </body>
    </html>
  );
}
