import { headers } from "next/headers";
import { getRequestLocale, ROUTE_METADATA, buildLocalizedMetadata } from "../lib/siteConfig";

export async function generateMetadata() {
  const reqHeaders = await headers();
  const lang = getRequestLocale(reqHeaders);
  const routeMeta = ROUTE_METADATA.login?.[lang] || ROUTE_METADATA.login?.ka || {};

  return buildLocalizedMetadata({
    path: "/login",
    lang,
    title: routeMeta.title,
    description: routeMeta.description,
    image: routeMeta.image,
    noIndex: true,
  });
}

export default function LoginLayout({ children }) {
  return children;
}

