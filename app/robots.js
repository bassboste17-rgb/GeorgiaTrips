import { SITE_URL, SUPPORTED_LANGUAGES } from "./lib/siteConfig";

export default function robots() {
  const isPreview =
    process.env.VERCEL_ENV === "preview" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
    process.env.NEXT_PUBLIC_IS_PREVIEW === "true";

  if (isPreview) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
      sitemap: `${SITE_URL}/sitemap.xml`,
      host: SITE_URL,
    };
  }

  // Private section prefixes
  const privateSections = [
    "/admin",
    "/login",
    "/coupons",
    "/booking",
    "/api",
  ];

  // Explicit localized disallow rules (e.g. /ka/admin, /en/login, /ru/coupons, /ka/booking/status)
  const localizedDisallows = [];
  for (const lang of SUPPORTED_LANGUAGES) {
    for (const section of privateSections) {
      localizedDisallows.push(`/${lang}${section}`);
      localizedDisallows.push(`/${lang}${section}/`);
      localizedDisallows.push(`/${lang}${section}/*`);
    }
  }

  // General & wildcard disallow rules
  const generalDisallows = [];
  for (const section of privateSections) {
    generalDisallows.push(section);
    generalDisallows.push(`${section}/`);
    generalDisallows.push(`${section}/*`);
    generalDisallows.push(`/*${section}`);
    generalDisallows.push(`/*${section}/*`);
  }

  const allDisallows = Array.from(new Set([...generalDisallows, ...localizedDisallows]));

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: allDisallows,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

