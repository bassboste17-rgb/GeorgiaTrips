import React, { Suspense } from "react";
import "./posts.css";
import PostsCatalogClient from "../components/posts/PostsCatalogClient";
import { getCachedPosts } from "../lib/server/cachedData";
import { headers } from "next/headers";
import { SITE_URL, getRequestLocale, ROUTE_METADATA, buildLocalizedMetadata } from "../lib/siteConfig";

export async function generateMetadata() {
  const reqHeaders = await headers();
  const lang = getRequestLocale(reqHeaders);
  const meta = ROUTE_METADATA.posts[lang] || ROUTE_METADATA.posts.ka;

  return buildLocalizedMetadata({
    path: "/posts",
    lang,
    title: meta.title,
    description: meta.description,
    image: meta.image || "/mestia.webp",
  });
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
  const lang = getRequestLocale(reqHeaders);
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
        "description": ROUTE_METADATA.posts[lang]?.description || ROUTE_METADATA.posts.ka.description,
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
