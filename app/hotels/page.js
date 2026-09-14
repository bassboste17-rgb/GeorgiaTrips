import React, { Suspense } from "react";
import "./hotels.css";
import HotelsCatalogClient from "../components/hotels/HotelsCatalogClient";
import { getCachedHotels } from "../lib/server/cachedData";
import { asLocalizedText } from "../lib/toursFirestore";
import { headers } from "next/headers";
import { SITE_URL, getRequestLocale, ROUTE_METADATA, buildLocalizedMetadata } from "../lib/siteConfig";

export async function generateMetadata() {
  const reqHeaders = await headers();
  const lang = getRequestLocale(reqHeaders);
  const meta = ROUTE_METADATA.hotels[lang] || ROUTE_METADATA.hotels.ka;

  return buildLocalizedMetadata({
    path: "/hotels",
    lang,
    title: meta.title,
    description: meta.description,
    image: meta.image || "/villa.webp",
  });
}

const BREADCRUMB_LABELS = {
  ka: { home: "მთავარი", hotels: "სასტუმროები" },
  en: { home: "Home", hotels: "Hotels & Accommodations" },
  ru: { home: "Главная", hotels: "Отели и жилье" },
  tr: { home: "Ana Sayfa", hotels: "Oteller ve Konaklama" },
  ar: { home: "الرئيسية", hotels: "الفنادق وأماكن الإقامة" },
};

const HOTELS_LIST_NAMES = {
  ka: "სასტუმროები და აპარტამენტები საქართველოში — GeorgiaTrips",
  en: "Hotels, Villas & Accommodations in Georgia — GeorgiaTrips",
  ru: "Отели, виллы и апартаменты в Грузии — GeorgiaTrips",
  tr: "Gürcistan Otelleri ve Konaklama Yerleri — GeorgiaTrips",
  ar: "فنادق وفلل وأماكن إقامة في جورجيا — GeorgiaTrips",
};

export default async function HotelsPage() {
  const [hotels, reqHeaders] = await Promise.all([getCachedHotels(), headers()]);
  const lang = getRequestLocale(reqHeaders);
  const bLabels = BREADCRUMB_LABELS[lang] || BREADCRUMB_LABELS.ka;

  const hotelsJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/${lang}/hotels#breadcrumbs`,
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
            "name": bLabels.hotels,
            "item": `${SITE_URL}/${lang}/hotels`,
          },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/${lang}/hotels#list`,
        "name": HOTELS_LIST_NAMES[lang] || HOTELS_LIST_NAMES.ka,
        "itemListElement": (hotels || []).map((hotel, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "item": {
            "@type": "Hotel",
            "name": asLocalizedText(hotel.name, lang) || asLocalizedText(hotel.name, "ka") || hotel.name,
            "description": asLocalizedText(hotel.desc, lang) || asLocalizedText(hotel.desc, "ka") || hotel.desc,
            "image": hotel.gallery?.[0] || `${SITE_URL}/villa.webp`,
            "url": hotel.bookingUrl || `${SITE_URL}/${lang}/hotels`,
            ...(hotel.priceFrom
              ? {
                  "priceRange": `₾${hotel.priceFrom}+`,
                }
              : {}),
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelsJsonLd) }}
      />
      <Suspense fallback={<div className="hm-section"><p>იტვირთება...</p></div>}>
        <HotelsCatalogClient initialHotels={hotels} />
      </Suspense>
    </>
  );
}