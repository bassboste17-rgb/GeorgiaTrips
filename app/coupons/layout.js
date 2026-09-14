import { headers } from "next/headers";
import { getRequestLocale, ROUTE_METADATA, buildLocalizedMetadata } from "../lib/siteConfig";

export async function generateMetadata() {
  const reqHeaders = await headers();
  const lang = getRequestLocale(reqHeaders);
  const routeMeta = ROUTE_METADATA.coupons?.[lang] || ROUTE_METADATA.coupons?.ka || {};

  return buildLocalizedMetadata({
    path: "/coupons",
    lang,
    title: routeMeta.title,
    description: routeMeta.description,
    image: routeMeta.image,
    noIndex: true,
  });
}

export default function CouponsLayout({ children }) {
  return children;
}

