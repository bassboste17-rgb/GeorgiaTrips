import { headers } from "next/headers";
import { getRequestLocale, ROUTE_METADATA, buildLocalizedMetadata } from "../lib/siteConfig";

export async function generateMetadata() {
  const reqHeaders = await headers();
  const lang = getRequestLocale(reqHeaders);
  const routeMeta = ROUTE_METADATA.bookingStatus?.[lang] || ROUTE_METADATA.bookingStatus?.ka || {};

  return buildLocalizedMetadata({
    path: "/booking/status",
    lang,
    title: routeMeta.title,
    description: routeMeta.description,
    image: routeMeta.image,
    noIndex: true,
  });
}

export default function BookingLayout({ children }) {
  return children;
}

