import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const live = process.env.ALLOW_INDEXING === "true";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://layeredfx.com").replace(/\/$/, "");
  // Google Business Profile links point here, so the sitemap is advertised whenever indexing is enabled.
  return { rules: { userAgent: "*", ...(live ? { allow: "/", disallow: ["/api/", "/admin/"] } : { disallow: "/" }) }, ...(live ? { sitemap: `${siteUrl}/sitemap.xml` } : {}) };
}
