import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import "./globals.css";
import "@/components/layeredfx/layeredfx.css";
import "@/components/layeredfx/frontend.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://layeredfx.com";
const allowIndexing = process.env.ALLOW_INDEXING === "true";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  manifest: '/manifest.webmanifest',
  icons: { icon: [
    { url: brand.favicon.light, type: 'image/png', media: '(prefers-color-scheme: light)' },
    { url: brand.favicon.dark, type: 'image/png', media: '(prefers-color-scheme: dark)' },
  ] },
  title: "LayeredFX — A whole new feeling",
  description: "Residential and commercial wall, cabinet, countertop and appliance wraps, wallpaper, Roman clay, faux concrete overlays, window film, and interior and exterior painting.",
  alternates: { canonical: "/" },
  robots: { index: allowIndexing, follow: allowIndexing },
  openGraph: { title: "LayeredFX — A whole new feeling", description: "Architectural finishes. Thoughtful transformations.", type: "website", url: "/", images: [{ url: "/images/social-card.png", width: 1200, height: 630, alt: "LayeredFX architectural surface concept" }] },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
