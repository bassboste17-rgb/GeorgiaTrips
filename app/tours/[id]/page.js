import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { asLocalizedText } from "../../lib/toursFirestore";
import { getCachedTourById, getCachedTours, getCachedPlaces, serializeForClient } from "../../lib/server/cachedData";
import { headers } from "next/headers";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata } from "../../lib/siteConfig";
import TourDetailClient from "../../components/tours/TourDetailClient";
import "./tourDetail.css";

export async function generateMetadata({ params }) {
  const [resolvedParams, reqHeaders] = await Promise.all([params, headers()]);
  const tourId = resolvedParams?.id;
  const lang = getRequestLocale(reqHeaders);

  const tour = await getCachedTourById(tourId);

  if (!tour) {
    notFound();
  }

  const rawTitle = asLocalizedText(tour.title, lang) || asLocalizedText(tour.title, "ka") || "Tour";
  const rawDesc = asLocalizedText(tour.desc, lang) || asLocalizedText(tour.desc, "ka") || "";
  const cleanDesc = rawDesc.replace(/\s+/g, " ").trim().slice(0, 160);
  const imgUrl = tour.img || "/hero.webp";

  return buildLocalizedMetadata({
    path: `/tours/${tourId}`,
    lang,
    title: rawTitle,
    description: cleanDesc,
    image: imgUrl,
    imageAlt: rawTitle,
  });
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
  const lang = getRequestLocale(reqHeaders);

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
