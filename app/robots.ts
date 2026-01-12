import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/seo/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/faq", "/learn"],
        disallow: ["/app", "/app/*", "/alerts", "/copilot", "/telegram"]
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
