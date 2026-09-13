import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { asLocalizedText } from "../../lib/toursFirestore";
import { getCachedTourById, getCachedTours, getCachedPlaces, serializeForClient } from "../../lib/server/cachedData";
import { headers } from "next/headers";
import { SITE_URL, getCanonicalUrl, getAlternateLanguages, LANGUAGE_LOCALES, SUPPORTED_LANGUAGES } from "../../lib/siteConfig";
import TourDetailClient from "../../components/tours/TourDetailClient";
import "./tourDetail.css";

const NOT_FOUND_TITLES = {
  ka: "ტური ვერ მოიძებნა",
  en: "Tour Not Found",
  ru: "Тур не найден",
  tr: "Tur Bulunamadı",
  ar: "لم يتم العثور على الجولة",
};

export async function generateMetadata({ params }) {
  const [resolvedParams, reqHeaders] = await Promise.all([params, headers()]);
  const tourId = resolvedParams?.id;
  const headerLang = reqHeaders.get("x-georgiatrips-locale");
  const lang = SUPPORTED_LANGUAGES.includes(headerLang) ? headerLang : "ka";

  const tour = await getCachedTourById(tourId);

  if (!tour) {
    notFound();
  }

  const tourTitle = asLocalizedText(tour.title, lang) || asLocalizedText(tour.title, "ka") || "Tour";
  const tourDesc = asLocalizedText(tour.desc, lang) || asLocalizedText(tour.desc, "ka") || "GeorgiaTrips";
  const imgUrl = tour.img || `${SITE_URL}/hero.webp`;
  const tourCanonical = getCanonicalUrl(`/tours/${tourId}`, lang);
  const alternateLanguages = getAlternateLanguages(`/tours/${tourId}`);
  const locale = LANGUAGE_LOCALES[lang] || "ka_GE";

  return {
    title: tourTitle,
    description: tourDesc,
    alternates: {
      canonical: tourCanonical,
      languages: alternateLanguages,
    },
    openGraph: {
      title: `${tourTitle} — GeorgiaTrips`,
      description: tourDesc,
      url: tourCanonical,
      siteName: "GeorgiaTrips",
      images: [
        {
          url: imgUrl,
          width: 1200,
          height: 630,
          alt: tourTitle,
        },
      ],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${tourTitle} — GeorgiaTrips`,
      description: tourDesc,
      images: [imgUrl],
    },
  };
}

const BREADCRUMB_LABELS = {
  ka: { home: "მთავარი", tours: "ტურები" },
  en: { home: "Home", tours: "Tours" },
  ru: { home: "Главная", tours: "Туры" },
  tr: { home: "Ana Sayfa", tours: "Turlar" },
  ar: { home: "الرئيسية", tours: "الجولات" },
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

export default async function TourDetailPage({ params }) {
  const [resolvedParams, reqHeaders] = await Promise.all([params, headers()]);
  const tourId = resolvedParams?.id;
  const headerLang = reqHeaders.get("x-georgiatrips-locale");
  const lang = SUPPORTED_LANGUAGES.includes(headerLang) ? headerLang : "ka";

  const [rawTour, allTours, places] = await Promise.all([
    getCachedTourById(tourId),
    getCachedTours(),
    getCachedPlaces(),
  ]);

  if (!rawTour) {
    notFound();
  }

  const cleanTour = serializeForClient(rawTour);
  const cleanAllTours = serializeForClient(allTours);
  const cleanPlaces = serializeForClient(places);

  // Generate localized JSON-LD TouristTrip & BreadcrumbList Schema for Google Search Snippets
  const tourTitle = asLocalizedText(rawTour.title, lang) || asLocalizedText(rawTour.title, "ka") || "Tour";
  const tourDesc = asLocalizedText(rawTour.desc, lang) || asLocalizedText(rawTour.desc, "ka") || "";
  const tourUrl = `${SITE_URL}/${lang}/tours/${encodeURIComponent(tourId)}`;
  const bLabels = BREADCRUMB_LABELS[lang] || BREADCRUMB_LABELS.ka;
  const validPrice = getValidNumericPrice(rawTour);

  const touristTripSchema = {
    "@type": "TouristTrip",
    "@id": `${tourUrl}#trip`,
    "name": tourTitle,
    "description": tourDesc,
    "url": tourUrl,
    "image": rawTour.img || `${SITE_URL}/hero.webp`,
    "inLanguage": lang,
    "touristType": ["Adventure", "Cultural", "Sightseeing"],
    "provider": {
      "@type": "TravelAgency",
      "name": "GeorgiaTrips",
      "url": SITE_URL,
    },
  };

  if (validPrice !== null) {
    touristTripSchema.offers = {
      "@type": "Offer",
      "price": validPrice,
      "priceCurrency": "GEL",
      "availability": "https://schema.org/InStock",
      "url": tourUrl,
    };
  }

  const breadcrumbsSchema = {
    "@type": "BreadcrumbList",
    "@id": `${tourUrl}#breadcrumbs`,
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
      {
        "@type": "ListItem",
        "position": 3,
        "name": tourTitle,
        "item": tourUrl,
      },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [touristTripSchema, breadcrumbsSchema],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center", color: "#0d233a" }}>...</div>}>
        <TourDetailClient
          initialTour={cleanTour}
          initialAllTours={cleanAllTours}
          initialPlaces={cleanPlaces}
        />
      </Suspense>
    </>
  );
}
