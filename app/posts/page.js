import React, { Suspense } from "react";
import "./posts.css";
import PostsCatalogClient from "../components/posts/PostsCatalogClient";
import { getCachedPosts } from "../lib/server/cachedData";
import { headers } from "next/headers";
import { SITE_URL, getCanonicalUrl, getAlternateLanguages, LANGUAGE_LOCALES, SUPPORTED_LANGUAGES } from "../lib/siteConfig";

const POSTS_META = {
  ka: {
    title: "ბლოგი და მოგზაურთა შთაბეჭდილებები",
    description: "საქართველოში მოგზაურობის გამოცდილება, რჩევები, ისტორიები და ფოტოები რეალური მოგზაურებისა და გიდებისგან.",
  },
  en: {
    title: "Travel Blog & Traveler Stories in Georgia",
    description: "Tips, itineraries, guides, and real travel stories from travelers exploring Georgia.",
  },
  ru: {
    title: "Блог о путешествиях по Грузии и отзывы туристов",
    description: "Советы туристам, маршруты, путеводители и реальные отзывы путешественников по Грузии.",
  },
  tr: {
    title: "Seyahat Rehberi ve Gezgin Hikayeleri — Gürcistan",
    description: "Gürcistan seyahat rehberi, gezi rotaları, ipuçları ve gezginlerin gerçek deneyimleri.",
  },
  ar: {
    title: "مدونة السفر وتجارب الزوار في جورجيا",
    description: "نصائح وإرشادات وقصص واقعية وتجارب المسافرين في جورجيا.",
  },
};

export async function generateMetadata() {
  const reqHeaders = await headers();
  const headerLang = reqHeaders.get("x-georgiatrips-locale");
  const lang = SUPPORTED_LANGUAGES.includes(headerLang) ? headerLang : "ka";
  const meta = POSTS_META[lang] || POSTS_META.ka;
  const canonicalUrl = getCanonicalUrl("/posts", lang);
  const alternateLanguages = getAlternateLanguages("/posts");
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
          url: "/mestia.webp",
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
      images: ["/mestia.webp"],
    },
  };
}

const BREADCRUMB_LABELS = {
  ka: { home: "მთავარი", posts: "ბლოგი & პოსტები" },
  en: { home: "Home", posts: "Blog & Stories" },
  ru: { home: "Главная", posts: "Блог и истории" },
  tr: { home: "Ana Sayfa", posts: "Blog ve Yazılar" },
  ar: { home: "الرئيسية", posts: "المدونة والمنشورات" },
};

const BLOG_TITLES = {
  ka: "GeorgiaTrips სამოგზაურო ბლოგი",
  en: "GeorgiaTrips Travel Community Blog",
  ru: "Блог путешественников GeorgiaTrips",
  tr: "GeorgiaTrips Seyahat Rehberi Bloğu",
  ar: "مدونة مجتمع السفر GeorgiaTrips",
};

export default async function PostsPage() {
  const [posts, reqHeaders] = await Promise.all([getCachedPosts(), headers()]);
  const headerLang = reqHeaders.get("x-georgiatrips-locale");
  const lang = SUPPORTED_LANGUAGES.includes(headerLang) ? headerLang : "ka";
  const bLabels = BREADCRUMB_LABELS[lang] || BREADCRUMB_LABELS.ka;

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/${lang}/posts#breadcrumbs`,
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
            "name": bLabels.posts,
            "item": `${SITE_URL}/${lang}/posts`,
          },
        ],
      },
      {
        "@type": "Blog",
        "@id": `${SITE_URL}/${lang}/posts#blog`,
        "name": BLOG_TITLES[lang] || BLOG_TITLES.ka,
        "description": POSTS_META[lang]?.description || POSTS_META.ka.description,
        "url": `${SITE_URL}/${lang}/posts`,
        "inLanguage": lang,
        "blogPost": (posts || []).slice(0, 20).map((post) => ({
          "@type": "BlogPosting",
          "headline": post.title || post.content?.slice(0, 70) || "Traveler Story",
          "articleBody": post.content || "",
          "image": post.img || `${SITE_URL}/mestia.webp`,
          "author": {
            "@type": "Person",
            "name": post.author || "GeorgiaTrips Traveler",
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <Suspense fallback={<div className="posts-loading-state"><p>იტვირთება...</p></div>}>
        <PostsCatalogClient initialPosts={posts} />
      </Suspense>
    </>
  );
}
