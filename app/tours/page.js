import React, { Suspense } from "react";
import "./tours.css";
import ToursCatalogClient from "../components/tours/ToursCatalogClient";
import { asLocalizedText } from "../lib/toursFirestore";
import { getCachedTours, serializeForClient } from "../lib/server/cachedData";
import { headers } from "next/headers";
import { SITE_URL, getRequestLocale, ROUTE_METADATA, buildLocalizedMetadata } from "../lib/siteConfig";

export async function generateMetadata() {
  const reqHeaders = await headers();
  const lang = getRequestLocale(reqHeaders);
  const meta = ROUTE_METADATA.tours[lang] || ROUTE_METADATA.tours.ka;

  return buildLocalizedMetadata({
    path: "/tours",
    lang,
    title: meta.title,
    description: meta.description,
    image: meta.image || "/hero.webp",
  });
}

const BREADCRUMB_LABELS = {
  ka: { home: "მთავარი", tours: "ტურები" },
  en: { home: "Home", tours: "Tours" },
  ru: { home: "Главная", tours: "Туры" },
  tr: { home: "Ana Sayfa", tours: "Turlar" },
  ar: { home: "الرئيسية", tours: "الجولات" },
};

const TOURS_LIST_NAMES = {
  ka: "ტურები საქართველოში — GeorgiaTrips",
  en: "Tours in Georgia — GeorgiaTrips",
  ru: "Туры по Грузии — GeorgiaTrips",
  tr: "Gürcistan Turları — GeorgiaTrips",
  ar: "الجولات في جورجيا — GeorgiaTrips",
};

const TOURS_LIST_DESCS = {
  ka: "საქართველოს პოპულარული ტურების კატალოგი",
  en: "Catalog of top guided tours and day trips in Georgia",
  ru: "Каталог популярных экскурсий и туров по Грузии",
  tr: "Gürcistan'da popüler turlar ve günübirlik geziler kataloğu",
  ar: "دليل أشهر الجولات السياحية والرحلات اليومية في جورجيا",
};

function getValidNumericPrice(tour) {
  if (!tour) return null;
  const candidates = [tour.priceGroup, tour.pricePrivate, tour.price, tour.pricePerPerson];
  for (const val of candidates) {
    if (typeof val === "number" && !isNaN(val) && val > 0) return val;
    if (typeof val === "string") {
      const num = parseFloat(val.replace(/[^0-9.]/g, ""));
      if (!isNaN(num) && num > 0) return num;
    }
  }
  return null;
}

export default async function ToursPage() {
  const [rawTours, reqHeaders] = await Promise.all([getCachedTours(), headers()]);
  const lang = getRequestLocale(reqHeaders);
  const tours = serializeForClient(rawTours) || [];
  const bLabels = BREADCRUMB_LABELS[lang] || BREADCRUMB_LABELS.ka;

  // JSON-LD ItemList & BreadcrumbList Schema for Rich Search Results
  const itemListSchema = {
    "@type": "ItemList",
    "@id": `${SITE_URL}/${lang}/tours#itemlist`,
    "name": TOURS_LIST_NAMES[lang] || TOURS_LIST_NAMES.ka,
    "description": TOURS_LIST_DESCS[lang] || TOURS_LIST_DESCS.ka,
    "itemListElement": (tours || []).slice(0, 20).map((tour, index) => {
      const title = asLocalizedText(tour.title, lang) || asLocalizedText(tour.title, "ka") || tour.title;
      const desc = asLocalizedText(tour.desc, lang) || asLocalizedText(tour.desc, "ka") || tour.desc;
      const tourItemUrl = `${SITE_URL}/${lang}/tours/${encodeURIComponent(tour.id)}`;
      const validPrice = getValidNumericPrice(tour);

      const item = {
        "@type": "TouristTrip",
        "name": title,
        "description": desc,
        "image": tour.img || `${SITE_URL}/hero.webp`,
        "url": tourItemUrl,
        "inLanguage": lang,
      };

      if (validPrice !== null) {
        item.offers = {
          "@type": "Offer",
          "price": validPrice,
          "priceCurrency": "GEL",
          "availability": "https://schema.org/InStock",
          "url": tourItemUrl,
        };
      }

      return {
        "@type": "ListItem",
        "position": index + 1,
        "item": item,
      };
    }),
  };

  const breadcrumbsSchema = {
    "@type": "BreadcrumbList",
    "@id": `${SITE_URL}/${lang}/tours#breadcrumbs`,
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
        "name": bLabels.tours,
        "item": `${SITE_URL}/${lang}/tours`,
      },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [itemListSchema, breadcrumbsSchema],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center", color: "#0d233a" }}>...</div>}>
        <ToursCatalogClient initialTours={tours} />
      </Suspense>
    </>
  );
}
