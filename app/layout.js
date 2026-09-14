import { Suspense } from "react";
import { Noto_Sans_Georgian, Noto_Serif_Georgian, Playfair_Display, Noto_Sans_Arabic } from "next/font/google";
import { cookies, headers } from "next/headers";
import Script from "next/script";
import "./globals.css";
import "./coupon.css";
import { AuthProvider } from "./lib/AuthContext";
import { LanguageProvider } from "./lib/i18n/LanguageContext";
import { CurrencyProvider } from "./lib/currency/CurrencyContext";
import { CouponProvider } from "./lib/CouponContext";
import { isRtlLanguage } from "./lib/i18n/locale";
import CookieConsent from "./components/CookieConsent";
import AnalyticsTracker from "./components/AnalyticsTracker";
import WelcomeCouponPopup from "./components/WelcomeCouponPopup";

const notoGeorgian = Noto_Sans_Georgian({
  variable: "--font-noto-georgian",
  subsets: ["georgian"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const notoSerifGeorgian = Noto_Serif_Georgian({
  variable: "--font-noto-serif-georgian",
  subsets: ["georgian"],
  weight: ["600", "700", "800"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

import { SOCIAL_PROFILES } from "./lib/shared";
import { SITE_URL, getCanonicalUrl, getAlternateLanguages, getRequestLocale, LANGUAGE_LOCALES, SUPPORTED_LANGUAGES, ROUTE_METADATA } from "./lib/siteConfig";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0d233a",
};

export async function generateMetadata() {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const currentPath = requestHeaders.get("x-georgiatrips-path") || "";
  const storedLang = cookieStore.get("gt_language")?.value;

  const requestLocale = getRequestLocale(requestHeaders);
  const lang = (requestHeaders.get("x-georgiatrips-locale") || requestHeaders.get("x-georgiatrips-path"))
    ? requestLocale
    : (storedLang && SUPPORTED_LANGUAGES.includes(storedLang))
      ? storedLang
      : requestLocale;
  const finalPath = currentPath || `/${lang}`;
  const canonicalUrl = getCanonicalUrl(finalPath, lang);
  const alternateLanguages = getAlternateLanguages(finalPath);
  const curr = ROUTE_METADATA.home[lang] || ROUTE_METADATA.home.ka;
  const locale = LANGUAGE_LOCALES[lang] || "ka_GE";

  return {
    metadataBase: new URL(SITE_URL),
    manifest: "/manifest.json",
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    title: {
      default: curr.title,
      template: "%s | GeorgiaTrips",
    },
    description: curr.description,
    authors: [{ name: "GeorgiaTrips", url: SITE_URL }],
    publisher: "GeorgiaTrips",
    alternates: {
      canonical: canonicalUrl,
      languages: alternateLanguages,
    },
    openGraph: {
      title: curr.title,
      description: curr.description,
      url: canonicalUrl,
      siteName: "GeorgiaTrips",
      locale,
      type: "website",
      images: [
        {
          url: "/hero.webp",
          width: 1200,
          height: 630,
          alt: curr.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: curr.title,
      description: curr.description,
      images: ["/hero.webp"],
    },
    verification: {
      google: "pqDpqUT-VHHamkaxnisNnk8LO2z-v0EdXak_z77V86U",
      yandex: "b8d0557b47549680",
      other: {
        "facebook-domain-verification": "ef9kax36lazdya98y738pn5e10ny2e",
      },
    },
    robots: (
      process.env.VERCEL_ENV === "preview" ||
      process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
      process.env.NEXT_PUBLIC_IS_PREVIEW === "true"
    )
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}

function buildStructuredData(htmlLang = "ka") {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TravelAgency", "Organization"],
        "@id": `${SITE_URL}/#organization`,
        name: "GeorgiaTrips",
        legalName: "GeorgiaTrips",
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        image: `${SITE_URL}/hero.webp`,
        description: "Premium tours, private excursions, and VIP transfers in Georgia (Tbilisi, Batumi, Kazbegi, Kakheti, Svaneti).",
        telephone: "+995504220020",
        email: "info@georgiatrips.ge",
        priceRange: "$$",
        currenciesAccepted: "GEL, USD, EUR",
        paymentAccepted: "Cash, Credit Card, Bank Transfer, Online Payment",
        areaServed: [
          { "@type": "Country", name: "Georgia" },
          { "@type": "AdministrativeArea", name: "Adjara" },
          { "@type": "City", name: "Batumi" },
          { "@type": "City", name: "Tbilisi" },
          { "@type": "City", name: "Kutaisi" },
        ],
        address: {
          "@type": "PostalAddress",
          streetAddress: "27 Kutaisi St",
          addressLocality: "Batumi",
          postalCode: "6010",
          addressRegion: "Adjara",
          addressCountry: "GE",
        },
        hasMap: "https://www.google.com/maps/place/?q=place_id:ChIJBXgJNomHZ0ARMFv54m7MSmk",
        sameAs: SOCIAL_PROFILES,
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens: "00:00",
          closes: "23:59",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "GeorgiaTrips",
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/${htmlLang}/tours?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
        inLanguage: ["ka", "en", "ru", "tr", "ar"],
      },
    ],
  };
}

export default async function RootLayout({ children }) {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const storedLang = cookieStore.get("gt_language")?.value;

  // The URL locale is 100% authoritative:
  // 1. Explicit locale from x-georgiatrips-locale / x-georgiatrips-path
  // 2. Cookie storedLang only when URL has no explicit locale
  // 3. Default "ka"
  const requestLocale = getRequestLocale(requestHeaders);
  const htmlLang = (requestHeaders.get("x-georgiatrips-locale") || requestHeaders.get("x-georgiatrips-path"))
    ? requestLocale
    : (storedLang && SUPPORTED_LANGUAGES.includes(storedLang))
      ? storedLang
      : requestLocale;
  const htmlDir = isRtlLanguage(htmlLang) ? "rtl" : "ltr";
  const jsonLd = buildStructuredData(htmlLang);

  return (
    <html
      lang={htmlLang}
      dir={htmlDir}
      className={`${notoGeorgian.variable} ${notoSerifGeorgian.variable} ${playfair.variable} ${notoArabic.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://georgiatripsge.firebaseapp.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://georgiatripsge.firebaseapp.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />

        {/* Meta Pixel Code (Direct in Head for Meta Crawler & Verification) */}
        <script
          id="fb-pixel-base"
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && typeof Node !== 'undefined' && !Node.prototype.getBoundingClientRect) {
                Node.prototype.getBoundingClientRect = function() {
                  if (this.parentElement && typeof this.parentElement.getBoundingClientRect === 'function') {
                    return this.parentElement.getBoundingClientRect();
                  }
                  return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 };
                };
              }
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '4302985556633819');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=4302985556633819&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LanguageProvider initialLang={htmlLang}>
          <CurrencyProvider>
            <AuthProvider>
              <CouponProvider>
                {children}
                <Suspense fallback={null}>
                  <AnalyticsTracker />
                </Suspense>
                <CookieConsent />
                <WelcomeCouponPopup />
              </CouponProvider>
            </AuthProvider>
          </CurrencyProvider>
        </LanguageProvider>

        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').catch(function() {});
              });
            }
          `}
        </Script>

        {/* Google Analytics 4 */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="lazyOnload"
            />
            <Script id="google-analytics" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}

        {/* Microsoft Clarity (Free Screen Recordings & Heatmaps) */}
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <Script id="ms-clarity" strategy="lazyOnload">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
