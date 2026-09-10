import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const live = process.env.ALLOW_INDEXING === "true";
  return { rules: { userAgent: "*", ...(live ? { allow: "/", disallow: ["/api/", "/admin/"] } : { disallow: "/" }) } };
}
