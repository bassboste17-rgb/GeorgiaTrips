import { headers } from "next/headers";
import { getRequestLocale, ROUTE_METADATA, buildLocalizedMetadata } from "../lib/siteConfig";

export async function generateMetadata() {
  const reqHeaders = await headers();
  const lang = getRequestLocale(reqHeaders);
  const routeMeta = ROUTE_METADATA.admin?.[lang] || ROUTE_METADATA.admin?.ka || {};

  return buildLocalizedMetadata({
    path: "/admin",
    lang,
    title: routeMeta.title,
    description: routeMeta.description,
    image: routeMeta.image,
    noIndex: true,
  });
}

export default function AdminLayout({ children }) {
  return children;
}

