import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCachedPlaces } from "../../lib/server/cachedData";
import { asLocalizedText } from "../../lib/toursFirestore";
import { headers } from "next/headers";
import { formatRegionName } from "../../lib/placesMeta";
import { SITE_URL, getCanonicalUrl, getAlternateLanguages, LANGUAGE_LOCALES, SUPPORTED_LANGUAGES } from "../../lib/siteConfig";
import PlaceDetailClient from "../../components/places/PlaceDetailClient";
import "../places.css";

const NOT_FOUND_PLACES = {
  ka: "ადგილი ვერ მოიძებნა",
  en: "Attraction Not Found",
  ru: "Достопримечательность не найдена",
  tr: "Gezilecek Yer Bulunamadı",
  ar: "لم يتم العثور على المعلم",
};

export async function generateMetadata({ params }) {
  const [resolvedParams, reqHeaders] = await Promise.all([params, headers()]);
  const placeId = resolvedParams?.id;
  const headerLang = reqHeaders.get("x-georgiatrips-locale");
  const lang = SUPPORTED_LANGUAGES.includes(headerLang) ? headerLang : "ka";

  const places = await getCachedPlaces();
  const place = (places || []).find((p) => p.id === placeId);

  if (!place) {
    notFound();
  }

  const title = asLocalizedText(place.title, lang) || asLocalizedText(place.title, "ka") || "Attraction";
  const desc = asLocalizedText(place.desc, lang) || asLocalizedText(place.desc, "ka") || "";
  const rawRegion = asLocalizedText(place.region, lang) || asLocalizedText(place.region, "ka") || "";
  const region = rawRegion ? formatRegionName(rawRegion, lang) : "";
  const fullTitle = region ? `${title} (${region})` : title;
  const imgUrl = place.img || `${SITE_URL}/hero.webp`;
  const placeCanonical = getCanonicalUrl(`/places/${placeId}`, lang);
  const alternateLanguages = getAlternateLanguages(`/places/${placeId}`);
  const locale = LANGUAGE_LOCALES[lang] || "ka_GE";

  return {
    title: fullTitle,
    description: desc.slice(0, 160),
    alternates: {
      canonical: placeCanonical,
      languages: alternateLanguages,
    },
    openGraph: {
      title: `${fullTitle} — GeorgiaTrips`,
      description: desc.slice(0, 200),
      url: placeCanonical,
      siteName: "GeorgiaTrips",
      images: [
        {
          url: imgUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${fullTitle} — GeorgiaTrips`,
      description: desc.slice(0, 160),
      images: [imgUrl],
    },
  };
}

const BREADCRUMB_LABELS = {
  ka: { home: "მთავარი", places: "ადგილები" },
  en: { home: "Home", places: "Attractions" },
  ru: { home: "Главная", places: "Места" },
  tr: { home: "Ana Sayfa", places: "Gezilecek Yerler" },
  ar: { home: "الرئيسية", places: "الأماكن" },
};

export default async function PlaceDetailPage({ params }) {
  const [resolvedParams, reqHeaders] = await Promise.all([params, headers()]);
  const placeId = resolvedParams?.id;
  const headerLang = reqHeaders.get("x-georgiatrips-locale");
  const lang = SUPPORTED_LANGUAGES.includes(headerLang) ? headerLang : "ka";

  const places = await getCachedPlaces();
  const place = (places || []).find((p) => p.id === placeId) || null;

  if (!place) {
    notFound();
  }

  const title = asLocalizedText(place.title, lang) || asLocalizedText(place.title, "ka") || "Attraction";
  const desc = asLocalizedText(place.desc, lang) || asLocalizedText(place.desc, "ka") || "";
  const rawRegion = asLocalizedText(place.region, lang) || asLocalizedText(place.region, "ka") || "";
  const region = rawRegion ? formatRegionName(rawRegion, lang) : "Georgia";
  const placeUrl = `${SITE_URL}/${lang}/places/${encodeURIComponent(placeId)}`;
  const bLabels = BREADCRUMB_LABELS[lang] || BREADCRUMB_LABELS.ka;

  const attractionSchema = {
    "@type": "TouristAttraction",
    "@id": `${placeUrl}#attraction`,
    "name": title,
    "description": desc,
    "url": placeUrl,
    "image": place.img || `${SITE_URL}/hero.webp`,
    "inLanguage": lang,
    "address": {
      "@type": "PostalAddress",
      "addressRegion": region,
      "addressCountry": "GE",
    },
  };

  const breadcrumbsSchema = {
    "@type": "BreadcrumbList",
    "@id": `${placeUrl}#breadcrumbs`,
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
      {
        "@type": "ListItem",
        "position": 3,
        "name": title,
        "item": placeUrl,
      },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [attractionSchema, breadcrumbsSchema],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center", color: "#0d233a" }}>...</div>}>
        <PlaceDetailClient initialPlace={place} initialAllPlaces={places} />
      </Suspense>
    </>
  );
}