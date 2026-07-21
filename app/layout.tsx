import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thirst. — Hot Chocolate, Waffles, Shakes & Desserts | Thiruvallur",
  description:
    "Thirst. — handcrafted hot chocolate, loaded waffles, thick shakes, brownies & more in Thiruvallur. Made fresh daily, 5 PM to 10 PM.",
  keywords:
    "hot chocolate, waffles, thick shakes, brownies, pancakes, boba, desserts, Thiruvallur, Thirst",
  authors: [{ name: "Thirst." }],
  robots: "index, follow",
  manifest: "/manifest.json",
  icons: { icon: "/assets/thirst-logo.png" },
  alternates: { canonical: "https://www.thirst.in/" },
  openGraph: {
    title: "Thirst. — One for Living",
    description:
      "Handcrafted hot chocolate, loaded waffles, thick shakes & desserts in Thiruvallur.",
    type: "website",
    url: "https://www.thirst.in/",
    images: ["https://www.thirst.in/assets/hero.jpg"],
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: {
    capable: true,
    title: "Thirst.",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#C4213C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Pacifico&family=Playfair+Display:ital,wght@0,700;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        {/* No caching service worker is registered — the old one caused stale
            HTML/asset bugs (blank / unstyled pages across dev restarts). This
            script proactively removes any worker + caches still left in a
            visitor's browser. The kill-switch /sw.js finishes the job for
            browsers that had the old worker actively controlling the page. */}
        <Script id="sw-cleanup" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations()
              .then((regs) => regs.forEach((r) => r.unregister()))
              .catch(() => {});
            if (window.caches) {
              caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
            }
          }`}
        </Script>
      </body>
    </html>
  );
}
