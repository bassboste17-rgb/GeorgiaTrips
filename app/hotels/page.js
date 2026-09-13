import React, { Suspense } from "react";
import "./hotels.css";
import HotelsCatalogClient from "../components/hotels/HotelsCatalogClient";
import { getCachedHotels } from "../lib/server/cachedData";
import { asLocalizedText } from "../lib/toursFirestore";
import { headers } from "next/headers";
import { SITE_URL, getCanonicalUrl, getAlternateLanguages, LANGUAGE_LOCALES, SUPPORTED_LANGUAGES } from "../lib/siteConfig";

const HOTELS_META = {
  ka: {
    title: "სასტუმროები და აპარტამენტები საქართველოში",
    description: "საუკეთესო სასტუმროები, ვილები და საოჯახო სასტუმროები თბილისში, ბათუმში, ყაზბეგში, კახეთსა და სვანეთში. პირდაპირი დაჯავშნა საუკეთესო ფასად.",
  },
  en: {
    title: "Hotels, Villas & Accommodations in Georgia",
    description: "Find the best hotels, luxury villas, and boutique accommodations in Tbilisi, Batumi, Kazbegi, Kakheti, and Svaneti.",
  },
  ru: {
    title: "Отели, виллы и апартаменты в Грузии",
    description: "Лучшие отели, виллы и гостевые дома в Тбилиси, Батуми, Казбеги, Кахетии и Сванетии. Прямое бронирование по лучшим ценам.",
  },
  tr: {
    title: "Gürcistan Otelleri, Villaları ve Konaklama Yerleri",
    description: "Tiflis, Batum, Kazbegi, Kaheti ve Svaneti'de en iyi otel ve villa seçenekleri.",
  },
  ar: {
    title: "فنادق وفلل وأماكن إقامة فاخرة في جورجيا",
    description: "أفضل الفنادق والمنتجعات والفلل في تبليسي، باتومي، كازبيجي، كاخيتي وسوانيتي.",
  },
};

export async function generateMetadata() {
  const reqHeaders = await headers();
  const headerLang = reqHeaders.get("x-georgiatrips-locale");
  const lang = SUPPORTED_LANGUAGES.includes(headerLang) ? headerLang : "ka";
  const meta = HOTELS_META[lang] || HOTELS_META.ka;
  const canonicalUrl = getCanonicalUrl("/hotels", lang);
  const alternateLanguages = getAlternateLanguages("/hotels");
  const locale = LANGUAGE_LOCALES[lang] || "ka_GE";

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: canonicalUrl,
      languages: alternateLanguages,
    },
    openGraph: {
      title: `${meta.title} — GeorgiaTrips`,
      description: meta.description,
      url: canonicalUrl,
      siteName: "GeorgiaTrips",
      images: [
        {
          url: "/villa.webp",
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${meta.title} — GeorgiaTrips`,
      description: meta.description,
      images: ["/villa.webp"],
    },
  };
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
  const headerLang = reqHeaders.get("x-georgiatrips-locale");
  const lang = SUPPORTED_LANGUAGES.includes(headerLang) ? headerLang : "ka";
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