import React, { Suspense } from "react";
import "./places.css";
import PlacesCatalogClient from "../components/places/PlacesCatalogClient";
import { getCachedPlaces } from "../lib/server/cachedData";
import { asLocalizedText } from "../lib/toursFirestore";
import { headers } from "next/headers";
import { SITE_URL, getRequestLocale, ROUTE_METADATA, buildLocalizedMetadata } from "../lib/siteConfig";

export async function generateMetadata() {
  const reqHeaders = await headers();
  const lang = getRequestLocale(reqHeaders);
  const meta = ROUTE_METADATA.places[lang] || ROUTE_METADATA.places.ka;

  return buildLocalizedMetadata({
    path: "/places",
    lang,
    title: meta.title,
    description: meta.description,
    image: meta.image || "/tbilisi.webp",
  });
}

const BREADCRUMB_LABELS = {
  ka: { home: "მთავარი", places: "ღირსშესანიშნაობები" },
  en: { home: "Home", places: "Attractions" },
  ru: { home: "Главная", places: "Достопримечательности" },
  tr: { home: "Ana Sayfa", places: "Gezilecek Yerler" },
  ar: { home: "الرئيسية", places: "المعالم السياحية" },
};

const PLACES_LIST_NAMES = {
  ka: "საქართველოს ღირსშესანიშნაობები — GeorgiaTrips",
  en: "Top Attractions & Places to Visit in Georgia — GeorgiaTrips",
  ru: "Главные достопримечательности Грузии — GeorgiaTrips",
  tr: "Gürcistan'da Gezilecek Yerler — GeorgiaTrips",
  ar: "أفضل المعالم السياحية في جورجيا — GeorgiaTrips",
};

export default async function PlacesPage() {
  const [places, reqHeaders] = await Promise.all([getCachedPlaces(), headers()]);
  const lang = getRequestLocale(reqHeaders);
  const bLabels = BREADCRUMB_LABELS[lang] || BREADCRUMB_LABELS.ka;

  // Schema.org JSON-LD BreadcrumbList & ItemList
  const placesJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/${lang}/places#breadcrumbs`,
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
            "name": bLabels.places,
            "item": `${SITE_URL}/${lang}/places`,
          },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/${lang}/places#list`,
        "name": PLACES_LIST_NAMES[lang] || PLACES_LIST_NAMES.ka,
        "itemListElement": (places || []).slice(0, 30).map((place, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "item": {
            "@type": "TouristAttraction",
            "name": asLocalizedText(place.title, lang) || asLocalizedText(place.title, "ka") || place.title,
            "description": asLocalizedText(place.desc, lang) || asLocalizedText(place.desc, "ka") || place.desc,
            "image": place.img || `${SITE_URL}/tbilisi.webp`,
            "url": `${SITE_URL}/${lang}/places/${encodeURIComponent(place.id)}`,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placesJsonLd) }}
      />
      <Suspense fallback={<div className="places-state">იტვირთება...</div>}>
        <PlacesCatalogClient initialPlaces={places} />
      </Suspense>
    </>
  );
}