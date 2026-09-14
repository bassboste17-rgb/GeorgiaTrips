import React from "react";
import { headers } from "next/headers";
import { SOCIAL_PROFILES } from "../lib/shared";
import { SITE_URL, getRequestLocale, ROUTE_METADATA, buildLocalizedMetadata } from "../lib/siteConfig";
import TransfersClient from "../components/transfers/TransfersClient";
import "./transfers.css";

export async function generateMetadata() {
  const reqHeaders = await headers();
  const lang = getRequestLocale(reqHeaders);
  const meta = ROUTE_METADATA.transfers[lang] || ROUTE_METADATA.transfers.ka;

  return buildLocalizedMetadata({
    path: "/transfers",
    lang,
    title: meta.title,
    description: meta.description,
    image: meta.image || "/hero.webp",
  });
}

const BREADCRUMB_LABELS = {
  ka: { home: "მთავარი", transfers: "ტრანსფერები" },
  en: { home: "Home", transfers: "Transfers" },
  ru: { home: "Главная", transfers: "Трансферы" },
  tr: { home: "Ana Sayfa", transfers: "Transferler" },
  ar: { home: "الرئيسية", transfers: "التوصيل" },
};

export default async function TransfersPage() {
  const reqHeaders = await headers();
  const lang = getRequestLocale(reqHeaders);
  const meta = ROUTE_METADATA.transfers[lang] || ROUTE_METADATA.transfers.ka;
  const bLabels = BREADCRUMB_LABELS[lang] || BREADCRUMB_LABELS.ka;

  const transferJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TaxiService", "Service"],
        "@id": `${SITE_URL}/${lang}/transfers#service`,
        "name": meta.title,
        "description": meta.description,
        "url": `${SITE_URL}/${lang}/transfers`,
        "inLanguage": lang,
        "provider": {
          "@type": "TravelAgency",
          "name": "GeorgiaTrips",
          "url": SITE_URL,
          "telephone": "+995504220020",
          "sameAs": SOCIAL_PROFILES,
        },
        "areaServed": [
          { "@type": "Country", "name": "Georgia" },
          { "@type": "City", "name": "Tbilisi" },
          { "@type": "City", "name": "Batumi" },
          { "@type": "City", "name": "Kutaisi" },
          { "@type": "City", "name": "Gudauri" },
          { "@type": "City", "name": "Kazbegi" },
        ],
        "offers": {
          "@type": "AggregateOffer",
          "lowPrice": 35,
          "highPrice": 350,
          "priceCurrency": "GEL",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/${lang}/transfers#breadcrumbs`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": bLabels.home,
            "item": `${SITE_URL}/${lang}`,
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": bLabels.transfers,
            "item": `${SITE_URL}/${lang}/transfers`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(transferJsonLd) }}
      />
      <TransfersClient />
    </>
  );
}
