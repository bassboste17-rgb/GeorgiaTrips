/**
 * GeorgiaTrips - Canonical Site & Locale Configuration
 * Single source of truth for base URLs, supported languages, and SEO helpers.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.georgiatrips.ge"
).replace(/\/+$/, "");

export const SUPPORTED_LANGUAGES = ["ka", "en", "ru", "tr", "ar"];

export const DEFAULT_LANGUAGE = "ka";

export const LANGUAGE_LOCALES = {
  ka: "ka_GE",
  en: "en_US",
  ru: "ru_RU",
  tr: "tr_TR",
  ar: "ar_SA",
};

export const HREFLANG_MAP = {
  ka: "ka-GE",
  en: "en-US",
  ru: "ru-RU",
  tr: "tr-TR",
  ar: "ar-SA",
};

/**
 * Extracts a supported language code from a path prefix if present
 * e.g. "/en/tours" -> "en", "/ru/places/123" -> "ru", "/tours" -> null
 */
export function extractLocaleFromPath(pathname = "") {
  if (!pathname || typeof pathname !== "string") return null;
  const match = pathname.match(/^\/([a-zA-Z]{2})(?=\/|$)/);
  if (match) {
    const code = match[1].toLowerCase();
    if (SUPPORTED_LANGUAGES.includes(code)) {
      return code;
    }
  }
  return null;
}

/**
 * Returns the clean path without any leading language prefix
 * e.g. "/ka/tours/batumi" -> "/tours/batumi", "/ka" -> "/"
 */
export function stripLocaleFromPath(pathname = "/") {
  if (!pathname || pathname === "/") return "/";
  const cleaned = pathname.replace(/^\/(?:ka|en|ru|tr|ar)(?=\/|$)/i, "");
  return cleaned || "/";
}

/**
 * Resolves the request locale from Next.js server headers.
 * Prefers x-georgiatrips-locale, then falls back to x-georgiatrips-path prefix,
 * defaulting to DEFAULT_LANGUAGE ("ka").
 */
export function getRequestLocale(requestHeaders) {
  if (!requestHeaders) return DEFAULT_LANGUAGE;
  const headerLang = typeof requestHeaders.get === "function"
    ? requestHeaders.get("x-georgiatrips-locale")
    : requestHeaders["x-georgiatrips-locale"];
  if (headerLang && SUPPORTED_LANGUAGES.includes(headerLang)) {
    return headerLang;
  }
  const pathHeader = typeof requestHeaders.get === "function"
    ? requestHeaders.get("x-georgiatrips-path")
    : requestHeaders["x-georgiatrips-path"];
  const pathLocale = extractLocaleFromPath(pathHeader);
  if (pathLocale) return pathLocale;
  return DEFAULT_LANGUAGE;
}

/**
 * Returns the full canonical URL for a given path and language.
 * Self-canonicalizes to the passed or extracted locale, ensuring no accidental fallback to "ka".
 * e.g. ("/tours", "en") -> "https://www.georgiatrips.ge/en/tours"
 * e.g. ("/en/tours") -> "https://www.georgiatrips.ge/en/tours"
 * e.g. ("/", "en") -> "https://www.georgiatrips.ge/en"
 */
export function getCanonicalUrl(path = "/", lang) {
  const pathLang = extractLocaleFromPath(path);
  const targetLang = (lang && SUPPORTED_LANGUAGES.includes(lang))
    ? lang
    : (pathLang && SUPPORTED_LANGUAGES.includes(pathLang))
      ? pathLang
      : DEFAULT_LANGUAGE;

  const cleanPath = stripLocaleFromPath(path).replace(/\/+$/, "");
  const normalizedPath = cleanPath === "" ? "" : cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `${SITE_URL}/${targetLang}${normalizedPath}`;
}

/**
 * Returns hreflang alternates dictionary suitable for Next.js metadata.alternates.languages
 */
export function getAlternateLanguages(path = "/") {
  const cleanPath = stripLocaleFromPath(path).replace(/\/+$/, "");
  const normalizedPath = cleanPath === "" ? "" : cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  
  return {
    "ka-GE": `${SITE_URL}/ka${normalizedPath}`,
    "en-US": `${SITE_URL}/en${normalizedPath}`,
    "ru-RU": `${SITE_URL}/ru${normalizedPath}`,
    "tr-TR": `${SITE_URL}/tr${normalizedPath}`,
    "ar-SA": `${SITE_URL}/ar${normalizedPath}`,
    "x-default": `${SITE_URL}/en${normalizedPath}`,
  };
}

/**
 * Transforms an internal route / path into a localized URL with the given language prefix.
 * Preserves query params and hashes. Avoids modifying external links, mailto/tel, /api, or /_next.
 * e.g. ("/tours", "en") -> "/en/tours"
 * e.g. ("/", "en") -> "/en"
 * e.g. ("/#booking", "en") -> "/en#booking"
 * e.g. ("/ka/places/123", "ru") -> "/ru/places/123"
 */
export function getLocalizedHref(href, lang = DEFAULT_LANGUAGE) {
  if (!href || typeof href !== "string") return href || "/";

  // Ignore external or protocol-relative URLs
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("whatsapp:") ||
    href.startsWith("//")
  ) {
    return href;
  }

  // Ignore API and Next.js internal paths
  if (href.startsWith("/api/") || href === "/api" || href.startsWith("/_next/")) {
    return href;
  }

  // Pure in-page hash links on the current page e.g. "#booking"
  if (href.startsWith("#")) {
    return href;
  }

  const currentLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;

  // Split path, query, and hash
  const hashIndex = href.indexOf("#");
  const hash = hashIndex !== -1 ? href.slice(hashIndex) : "";
  const withoutHash = hashIndex !== -1 ? href.slice(0, hashIndex) : href;

  const queryIndex = withoutHash.indexOf("?");
  const query = queryIndex !== -1 ? withoutHash.slice(queryIndex) : "";
  const rawPath = queryIndex !== -1 ? withoutHash.slice(0, queryIndex) : withoutHash;

  const cleanPath = stripLocaleFromPath(rawPath);
  const normalizedClean = cleanPath === "/transport" ? "/transfers" : (cleanPath.startsWith("/transport/") ? `/transfers${cleanPath.slice(10)}` : cleanPath);
  const normalizedPath = normalizedClean === "/" ? "" : normalizedClean.startsWith("/") ? normalizedClean : `/${normalizedClean}`;

  return `/${currentLang}${normalizedPath}${query}${hash}`;
}

export const ROUTE_METADATA = {
  home: {
    ka: {
      title: "GeorgiaTrips — პრემიუმ ტურები და ტრანსფერები საქართველოში",
      description: "აღმოაჩინე საქართველო უმაღლესი კომფორტით. ერთდღიანი და მრავალდღიანი ტურები ბათუმიდან და თბილისიდან: ყაზბეგი, მარტვილი, კახეთი, სვანეთი. VIP ტრანსპორტი და 24/7 მხარდაჭერა.",
      image: "/hero.webp",
    },
    en: {
      title: "GeorgiaTrips — Premium Tours, Excursions & Private Transfers in Georgia",
      description: "Discover Georgia in comfort and luxury. Best day trips and multi-day tours departing from Batumi and Tbilisi: Kazbegi, Martvili Canyon, Kakheti wine tours, and Svaneti. VIP transport & 24/7 booking.",
      image: "/hero.webp",
    },
    ru: {
      title: "GeorgiaTrips — Премиум экскурсии, туры и трансферы по Грузии",
      description: "Откройте Грузию с максимальным комфортом. Лучшие экскурсии и авторские туры из Батуми и Тбилиси: Казбеги, каньон Мартвили, Кахетия, Сванетия. VIP авто, русскоязычные гиды.",
      image: "/hero.webp",
    },
    tr: {
      title: "GeorgiaTrips — Gürcistan'da Premium Turlar, Geziler ve Özel Transferler",
      description: "Gürcistan'ı üstün konforla keşfedin. Batum ve Tiflis çıkışlı günübirlik turlar, Kazbegi, Kaheti ve Martvili kanyonu. Türkçe rehberler ve VIP transferler.",
      image: "/hero.webp",
    },
    ar: {
      title: "GeorgiaTrips — جولات سياحية فاخرة وتوصيل خاص وسائق في جورجيا",
      description: "اكتشف جمال وسحر جورجيا بأعلى درجات الراحة والفخامة. أفضل الجولات اليومية من باتومي وتبليسي: كازبيجي، مارتفيلي، كاخيتي، وسوانيتي مع سائق خاص ودعم 24/7.",
      image: "/hero.webp",
    },
  },
  tours: {
    ka: {
      title: "ტურები და ექსკურსიები საქართველოში — ბათუმიდან და თბილისიდან",
      description: "საუკეთესო 1-დღიანი და მრავალდღიანი ინდივიდუალური და ჯგუფური ტურები საქართველოში: ბათუმი, სვანეთი, ყაზბეგი, კახეთი, რაჭა. დაჯავშნეთ ონლაინ.",
      image: "/hero.webp",
    },
    en: {
      title: "Tours & Day Trips in Georgia — from Batumi & Tbilisi",
      description: "Discover top-rated private and group day trips from Batumi and Tbilisi. Explore Kazbegi, Svaneti, Martvili Canyon, and Kakheti with professional local guides.",
      image: "/hero.webp",
    },
    ru: {
      title: "Экскурсии и однодневные туры по Грузии — из Батуми и Тбилиси",
      description: "Индивидуальные и групповые экскурсии по Грузии из Батуми и Тбилиси: Казбеги, Сванетия, Кахетия, каньон Мартвили. Бронируйте онлайн без предоплаты.",
      image: "/hero.webp",
    },
    tr: {
      title: "Gürcistan Turları ve Günübirlik Geziler — Batum ve Tiflis Çıkışlı",
      description: "Batum ve Tiflis çıkışlı en popüler günübirlik ve çok günlük Gürcistan turları. Kazbegi, Martvili Kanyonu, Kaheti ve Svaneti turlarını keşfedin.",
      image: "/hero.webp",
    },
    ar: {
      title: "جولات سياحية ورحلات يومية في جورجيا — من باتومي وتبليسي",
      description: "أفضل الجولات السياحية والرحلات اليومية في جورجيا من باتومي وتبليسي مع سيارة خاصة وسائق: كازبيجي، سوانيتي، كاخيتي، ومارتفيلي.",
      image: "/hero.webp",
    },
  },
  places: {
    ka: {
      title: "ღირსშესანიშნაობები და ულამაზესი ადგილები საქართველოში",
      description: "საქართველოს გამორჩეული ისტორიული და ბუნებრივი ძეგლები: ყაზბეგი, მარტვილის კანიონი, პრომეთეს მღვიმე, ვარძია და სვანეთის კოშკები.",
      image: "/tbilisi.webp",
    },
    en: {
      title: "Top Attractions & Places to Visit in Georgia",
      description: "Explore must-see landmarks, national parks, and historic sites in Georgia: Kazbegi, Martvili Canyon, Prometheus Cave, Vardzia, and Svaneti.",
      image: "/tbilisi.webp",
    },
    ru: {
      title: "Главные достопримечательности и красивые места Грузии",
      description: "Путеводитель по лучшим достопримечательностям Грузии: Казбеги, каньоны Мартвили и Окаце, пещера Прометея, Вардзия, Сванетия и старый Тбилиси.",
      image: "/tbilisi.webp",
    },
    tr: {
      title: "Gürcistan'da Gezilecek En İyi Yerler ve Tarihi Mekanlar",
      description: "Gürcistan'ın en güzel turistik yerleri, kanyonları, tarihi kaleleri ve milli parkları hakkında kapsamlı gezi rehberi.",
      image: "/tbilisi.webp",
    },
    ar: {
      title: "أفضل المعالم والأماكن السياحية في جورجيا",
      description: "دليل شامل لأجمل المعالم السياحية والطبيعية والتاريخية في جورجيا: كازبيجي، وادي مارتفيلي، كهف بروميثيوس، وفاردزيا.",
      image: "/tbilisi.webp",
    },
  },
  hotels: {
    ka: {
      title: "სასტუმროები, ვილები და აპარტამენტები საქართველოში",
      description: "რჩეული სასტუმროები, კოტეჯები და პრემიუმ აპარტამენტები ბათუმში, თბილისში, ყაზბეგში, კახეთსა და სვანეთში. პირდაპირი ჯავშანი.",
      image: "/villa.webp",
    },
    en: {
      title: "Hotels, Villas & Accommodations in Georgia",
      description: "Find verified hotels, luxury villas, and boutique accommodations in Batumi, Tbilisi, Kazbegi, Kakheti, and Svaneti.",
      image: "/villa.webp",
    },
    ru: {
      title: "Отели, виллы и апартаменты в Грузии",
      description: "Проверенные отели, уютные коттеджи и апартаменты в Батуми, Тбилиси, Казбеги, Кахетии и Сванетии. Прямое бронирование по лучшим ценам.",
      image: "/villa.webp",
    },
    tr: {
      title: "Gürcistan Otelleri, Villaları ve Konaklama Yerleri",
      description: "Batum, Tiflis, Kazbegi, Kaheti ve Svaneti'de en iyi otel, villa ve daire seçenekleri.",
      image: "/villa.webp",
    },
    ar: {
      title: "فنادق وفلل وأماكن إقامة في جورجيا",
      description: "أفضل الفنادق والمنتجعات والفلل الفاخرة في باتومي، تبليسي، كازبيجي، كاخيتي وسوانيتي.",
      image: "/villa.webp",
    },
  },
  transfers: {
    ka: {
      title: "აეროპორტის ტრანსფერები და პირადი მძღოლი საქართველოში",
      description: "უსაფრთხო და კომფორტული ტრანსფერები ბათუმის, თბილისისა და ქუთაისის აეროპორტებიდან გუდაურში, ყაზბეგში, მესტიაში და მთელ საქართველოში.",
      image: "/hero.webp",
    },
    en: {
      title: "Airport Transfers & Private Driver Service in Georgia",
      description: "Reliable private airport transfers and chauffeur services from Batumi, Tbilisi, and Kutaisi airports to Gudauri, Kazbegi, Mestia, and across Georgia.",
      image: "/hero.webp",
    },
    ru: {
      title: "Трансферы из аэропортов и авто с водителем в Грузии",
      description: "Комфортные трансферы из аэропортов Батуми, Тбилиси и Кутаиси в Гудаури, Казбеги, Местию и по всей Грузии. Седаны, минивэны и спринтеры.",
      image: "/hero.webp",
    },
    tr: {
      title: "Havalimanı Transferleri ve Özel Şoför Hizmeti — Gürcistan",
      description: "Batum, Tiflis ve Kutaisi havalimanlarından Gudauri, Kazbegi, Mestia ve tüm Gürcistan şehirlerine konforlu özel transfer.",
      image: "/hero.webp",
    },
    ar: {
      title: "توصيل من المطار وسائق خاص في جورجيا",
      description: "خدمات نقل وتوصيل خاصة من مطارات باتومي، تبليسي، وكوتايسي إلى غوداوري، كازبيجي، ميستيا وجميع أنحاء جورجيا.",
      image: "/hero.webp",
    },
  },
  posts: {
    ka: {
      title: "ბლოგი და მოგზაურთა შთაბეჭდილებები საქართველოზე",
      description: "სასარგებლო რჩევები, ტურისტული მარშრუტები, ფოტოამბები და მოგზაურთა რეალური გამოცდილება საქართველოში.",
      image: "/mestia.webp",
    },
    en: {
      title: "Travel Blog & Stories from Georgia",
      description: "Helpful travel tips, detailed itineraries, and real traveler stories for exploring Georgia's top destinations.",
      image: "/mestia.webp",
    },
    ru: {
      title: "Блог о путешествиях по Грузии и советы туристам",
      description: "Полезные советы, маршруты путешествий, фотоотчеты и отзывы туристов об отдыхе в Грузии.",
      image: "/mestia.webp",
    },
    tr: {
      title: "Seyahat Rehberi ve Gezgin Hikayeleri — Gürcistan",
      description: "Gürcistan gezi rehberi, seyahat ipuçları, popüler rotalar ve gezgin hikayeleri.",
      image: "/mestia.webp",
    },
    ar: {
      title: "مدونة السفر وتجارب الزوار في جورجيا",
      description: "نصائح سفر عملية، مسارات سياحية وتجارب حقيقية لزوار جورجيا.",
      image: "/mestia.webp",
    },
  },
  terms: {
    ka: {
      title: "წესები და პირობები",
      description: "GeorgiaTrips-ის მომსახურების წესები, ჯავშნის, გადახდისა და გაუქმების პირობები.",
      image: "/hero.webp",
    },
    en: {
      title: "Terms and Conditions",
      description: "Terms of service, booking policy, payment details, and cancellation rules for GeorgiaTrips.",
      image: "/hero.webp",
    },
    ru: {
      title: "Условия и положения",
      description: "Условия обслуживания, правила бронирования, оплаты и отмены заказов в GeorgiaTrips.",
      image: "/hero.webp",
    },
    tr: {
      title: "Şartlar ve Koşullar",
      description: "GeorgiaTrips kullanım koşulları, rezervasyon, ödeme ve iptal kuralları.",
      image: "/hero.webp",
    },
    ar: {
      title: "الشروط والأحكام",
      description: "شروط وأحكام الخدمة، سياسة الحجز والدفع والإلغاء في GeorgiaTrips.",
      image: "/hero.webp",
    },
  },
  privacy: {
    ka: {
      title: "კონფიდენციალობის პოლიტიკა",
      description: "გაეცანით როგორ იცავს GeorgiaTrips თქვენს პერსონალურ მონაცემებსა და კონფიდენციალობას.",
      image: "/hero.webp",
    },
    en: {
      title: "Privacy Policy",
      description: "Learn how GeorgiaTrips collects, uses, and safeguards your personal information and privacy.",
      image: "/hero.webp",
    },
    ru: {
      title: "Политика конфиденциальности",
      description: "Информация о том, как GeorgiaTrips собирает, использует и защищает ваши персональные данные.",
      image: "/hero.webp",
    },
    tr: {
      title: "Gizlilik Politikası",
      description: "GeorgiaTrips'in kişisel verilerinizi nasıl topladığı, kullandığı ve koruduğu hakkında bilgi.",
      image: "/hero.webp",
    },
    ar: {
      title: "سياسة الخصوصية",
      description: "تعرف على كيفية جمع واستخدام وحماية بياناتك الشخصية في GeorgiaTrips.",
      image: "/hero.webp",
    },
  },
  toursFromBatumi: {
    ka: {
      title: "ტურები ბათუმიდან — 1-დღიანი ექსკურსიები და მოგზაურობები",
      description: "საუკეთესო 1-დღიანი ტურები ბათუმიდან: მთიანი აჭარა, მარტვილის კანიონი, პრომეთეს მღვიმე, მაჭახელა და სვანეთი. კომფორტული ტრანსპორტი და გიდი.",
      image: "/hero.webp",
    },
    en: {
      title: "Tours from Batumi — Best Day Trips & Guided Excursions",
      description: "Explore the best day trips and guided tours departing from Batumi: Mountain Adjara, Martvili Canyon, Prometheus Cave, Machakhela, and Svaneti.",
      image: "/hero.webp",
    },
    ru: {
      title: "Экскурсии из Батуми — Однодневные туры и поездки по Грузии",
      description: "Лучшие однодневные экскурсии из Батуми: Горная Аджария, каньон Мартвили, пещера Прометея, Мачахела и Сванетия с опытным гидом и водителем.",
      image: "/hero.webp",
    },
    tr: {
      title: "Batum Çıkışlı Turlar — Günübirlik Geziler ve Rehberli Turlar",
      description: "Batum'dan hareket eden en popüler günübirlik turlar: Dağlık Acaristan, Martvili Kanyonu, Promethe Mağarası ve Maçakhela.",
      image: "/hero.webp",
    },
    ar: {
      title: "جولات سياحية من باتومي — أفضل الرحلات اليومية في جورجيا",
      description: "أفضل الرحلات اليومية والجولات السياحية المنطلقة من باتومي: جبال أجاريا، وادي مارتفيلي، كهف بروميثيوس، ومحمية ماجاخيلا.",
      image: "/hero.webp",
    },
  },
  privateToursBatumi: {
    ka: {
      title: "ინდივიდუალური VIP ტურები ბათუმში — პირადი მძღოლი და გიდი",
      description: "პრემიუმ ინდივიდუალური ტურები ბათუმიდან Mercedes VIP ავტომობილებით. პერსონალიზებული მარშრუტები, სასტუმროდან გაყვანა და 24/7 მხარდაჭერა.",
      image: "/hero.webp",
    },
    en: {
      title: "Private Tours in Batumi — VIP Driver, Custom Itineraries & Guides",
      description: "Book exclusive private tours from Batumi with premium Mercedes vehicles, multilingual local guides, flexible routes, and door-to-door hotel pickup.",
      image: "/hero.webp",
    },
    ru: {
      title: "Индивидуальные VIP туры в Батуми — Авто с водителем и гидом",
      description: "Персональные премиум туры из Батуми на комфортабельных авто Mercedes с личным гидом. Гибкий маршрут, трансфер от отеля и персональный сервис.",
      image: "/hero.webp",
    },
    tr: {
      title: "Batum Özel VIP Turları — Şoförlü Araç ve Özel Rehber",
      description: "Batum'dan size özel VIP Gürcistan turları. Mercedes araçlar, kişiye özel rota, otelden alma ve profesyonel rehberlik hizmeti.",
      image: "/hero.webp",
    },
    ar: {
      title: "جولات خاصة VIP في باتومي — سائق ومرشد خاص وسيارات فاخرة",
      description: "جولات سياحية خاصة وفاخرة من باتومي بسيارات مرسيدس حديثة ومرشد سياحي خاص. مسارات مخصصة واستقبال من الفندق مباشرة.",
      image: "/hero.webp",
    },
  },
  thingsToDoInBatumi: {
    ka: {
      title: "რა ვნახოთ ბათუმში — ტოპ ღირსშესანიშნაობები და აქტივობები",
      description: "ბათუმის საუკეთესო ადგილები: ბათუმის ბულვარი, ბოტანიკური ბაღი, გონიოს ციხე, არგოს საბაგირო, მტირალას პარკი და დელფინარიუმი. სრული გზამკვლევი.",
      image: "/tbilisi.webp",
    },
    en: {
      title: "Things to Do in Batumi — Top Attractions & Sightseeing Guide",
      description: "The ultimate guide to Batumi: Batumi Boulevard, Botanical Garden, Gonio Fortress, Argo Cable Car, Mtirala National Park, and top local activities.",
      image: "/tbilisi.webp",
    },
    ru: {
      title: "Что посмотреть в Батуми — Главные достопримечательности и развлечения",
      description: "Путеводитель по Батуми: Батумский бульвар, Ботанический сад, крепость Гонио, канатная дорога Арго, парк Мтирала и дельфинарий.",
      image: "/tbilisi.webp",
    },
    tr: {
      title: "Batum'da Gezilecek Yerler — En İyi Aktiviteler ve Şehir Rehberi",
      description: "Batum gezi rehberi: Batum Bulvarı, Botanik Bahçesi, Gonio Kalesi, Argo Teleferiği ve Mtirala Milli Parkı hakkında her şey.",
      image: "/tbilisi.webp",
    },
    ar: {
      title: "أفضل الأنشطة والأماكن السياحية في باتومي — دليل شامل",
      description: "دليل السياحة في باتومي: بوليفارد باتومي، الحديقة النباتية، قلعة غونيو، تلفريك أرغو، حديقة متيرالا الوطنية، وأجمل المعالم.",
      image: "/tbilisi.webp",
    },
  },
  waterfallsNearBatumi: {
    ka: {
      title: "ჩანჩქერები ბათუმთან — მახუნცეთი, მირვეთი და მტირალა",
      description: "აჭარის ულამაზესი ჩანჩქერები: მახუნცეთის ჩანჩქერი, მირვეთის ტყის ჩანჩქერი, სარფის ანდრია პირველწოდებულის ჩანჩქერი და მტირალა. გზამკვლევი და ტურები.",
      image: "/hero.webp",
    },
    en: {
      title: "Waterfalls Near Batumi — Makhuntseti, Mirveti & Adjara Nature Guide",
      description: "Discover the most beautiful waterfalls around Batumi: Makhuntseti, Mirveti hidden rainforest falls, Andrew the Apostle in Sarpi, and Mtirala National Park.",
      image: "/hero.webp",
    },
    ru: {
      title: "Водопады рядом с Батуми — Махунцети, Мирвети и природа Аджарии",
      description: "Гид по самым красивым водопадам Аджарии: водопад Махунцети, лесной водопад Мирвети, водопад Андрея Первозванного в Сарпи и парк Мтирала.",
      image: "/hero.webp",
    },
    tr: {
      title: "Batum Yakınlarındaki Şelaleler — Mahuntseti, Mirveti ve Doğa Rehberi",
      description: "Batum çevresindeki muhteşem şelaleler: Mahuntseti Şelalesi, Mirveti orman şelalesi, Sarpi şelalesi ve Mtirala doğa parkı rehberi.",
      image: "/hero.webp",
    },
    ar: {
      title: "شلالات قريبة من باتومي — ماخونتسيتي، ميرفيتي وطبيعة أجاريا",
      description: "اكتشف أجمل الشلالات الطبيعية حول باتومي: شلال ماخونتسيتي، شلال ميرفيتي الساحر، وشلالات حديقة متيرالا الوطنية.",
      image: "/hero.webp",
    },
  },
  batumiAirportTransfer: {
    ka: {
      title: "ბათუმის აეროპორტის ტრანსფერი (BUS) — ფიქსირებული ფასი და VIP სერვისი",
      description: "კომფორტული ტრანსფერი ბათუმის აეროპორტიდან ქალაქის ცენტრში, გონიოში, სარფში, ქობულეთსა და ქუთაისში. ფრენის თვალყურისდევნება და დახვედრა.",
      image: "/hero.webp",
    },
    en: {
      title: "Batumi Airport Transfer (BUS) — Private Pickup & Fixed Low Rates",
      description: "Book reliable private transfers from Batumi International Airport (BUS) to Batumi City, Gonio, Sarpi, Kobuleti, Shekvetili, and Kutaisi. 24/7 meet & greet.",
      image: "/hero.webp",
    },
    ru: {
      title: "Трансфер из аэропорта Батуми (BUS) — Фиксированные цены и VIP авто",
      description: "Индивидуальный трансфер из международного аэропорта Батуми в отель, Гонио, Сарпи, Кобулети, Шекветили и Кутаиси. Встреча с табличкой 24/7.",
      image: "/hero.webp",
    },
    tr: {
      title: "Batum Havalimanı Transferi (BUS) — Özel Karşılama ve Sabit Fiyatlar",
      description: "Batum Havalimanı'ndan (BUS) şehir merkezi, Gonio, Sarpi, Kobuleti ve Kutaisi'ye konforlu özel VIP havalimanı transferi.",
      image: "/hero.webp",
    },
    ar: {
      title: "توصيل من مطار باتومي (BUS) — سيارات خاصة وأسعار ثابتة",
      description: "خدمة توصيل خاصة ومباشرة من مطار باتومي الدولي (BUS) إلى الفنادق، غونيو، ساربي، كوبوليتي، وكوتايسي مع استقبال بالاسم 24/7.",
      image: "/hero.webp",
    },
  },
  coupons: {
    ka: {
      title: "ფასდაკლების კუპონები და პრომო აქციები",
      description: "ექსკლუზიური ფასდაკლების კუპონები და პრომოკოდები GeorgiaTrips-ის ტურებზე.",
      image: "/hero.webp",
      noIndex: true,
    },
    en: {
      title: "Exclusive Discount Coupons & Promo Codes",
      description: "Claim exclusive discount coupons and promo codes for top GeorgiaTrips tours and transfers.",
      image: "/hero.webp",
      noIndex: true,
    },
    ru: {
      title: "Скидочные купоны и промокоды",
      description: "Эксклюзивные скидочные купоны и промокоды на туры и трансферы от GeorgiaTrips.",
      image: "/hero.webp",
      noIndex: true,
    },
    tr: {
      title: "İndirim Kuponları ve Kampanyalar",
      description: "GeorgiaTrips turlarında geçerli özel indirim kuponları ve promosyon kodları.",
      image: "/hero.webp",
      noIndex: true,
    },
    ar: {
      title: "قسائم الخصم والعروض الترويجية",
      description: "احصل على قسائم خصم حصرية ورموز ترويجية لجولات وتوصيلات GeorgiaTrips.",
      image: "/hero.webp",
      noIndex: true,
    },
  },
  bookingStatus: {
    ka: {
      title: "ჯავშნის სტატუსის შემოწმება",
      description: "შეამოწმეთ თქვენი ტურის ან ტრანსფერის ჯავშნის მიმდინარე სტატუსი ონლაინ.",
      image: "/hero.webp",
      noIndex: true,
    },
    en: {
      title: "Check Booking Status",
      description: "Track the current confirmation status of your tour or transfer booking online.",
      image: "/hero.webp",
      noIndex: true,
    },
    ru: {
      title: "Проверка статуса бронирования",
      description: "Узнайте текущий статус подтверждения вашей брони тура или трансфера онлайн.",
      image: "/hero.webp",
      noIndex: true,
    },
    tr: {
      title: "Rezervasyon Durumu Sorgulama",
      description: "Tur veya transfer rezervasyonunuzun güncel onay durumunu online takip edin.",
      image: "/hero.webp",
      noIndex: true,
    },
    ar: {
      title: "التحقق من حالة الحجز",
      description: "تحقق من حالة تأكيد حجز جولتك أو خدمة التوصيل الخاصة بك عبر الإنترنت.",
      image: "/hero.webp",
      noIndex: true,
    },
  },
  login: {
    ka: {
      title: "ავტორიზაცია და რეგისტრაცია",
      description: "შედით თქვენს GeorgiaTrips-ის ანგარიშში ან გაიარეთ სწრაფი რეგისტრაცია.",
      image: "/hero.webp",
      noIndex: true,
    },
    en: {
      title: "Login & Registration",
      description: "Sign in to your GeorgiaTrips account or create a new account.",
      image: "/hero.webp",
      noIndex: true,
    },
    ru: {
      title: "Вход и регистрация",
      description: "Войдите в личный кабинет GeorgiaTrips или зарегистрируйтесь.",
      image: "/hero.webp",
      noIndex: true,
    },
    tr: {
      title: "Giriş ve Kayıt",
      description: "GeorgiaTrips hesabınıza giriş yapın veya yeni hesap oluşturun.",
      image: "/hero.webp",
      noIndex: true,
    },
    ar: {
      title: "تسجيل الدخول والتسجيل",
      description: "تسجيل الدخول إلى حسابك في GeorgiaTrips أو إنشاء حساب جديد.",
      image: "/hero.webp",
      noIndex: true,
    },
  },
  admin: {
    ka: {
      title: "ადმინ პანელი",
      description: "GeorgiaTrips-ის ადმინისტრაციული პანელი.",
      image: "/hero.webp",
      noIndex: true,
    },
    en: {
      title: "Admin Panel",
      description: "GeorgiaTrips Administrative Dashboard.",
      image: "/hero.webp",
      noIndex: true,
    },
    ru: {
      title: "Панель администратора",
      description: "Панель администратора GeorgiaTrips.",
      image: "/hero.webp",
      noIndex: true,
    },
    tr: {
      title: "Yönetici Paneli",
      description: "GeorgiaTrips Yönetici Paneli.",
      image: "/hero.webp",
      noIndex: true,
    },
    ar: {
      title: "لوحة التحكم",
      description: "لوحة تحكم GeorgiaTrips.",
      image: "/hero.webp",
      noIndex: true,
    },
  },
};

/**
 * Builds standard localized Next.js metadata for any route or dynamic entity.
 */
export function buildLocalizedMetadata({
  path = "/",
  lang = DEFAULT_LANGUAGE,
  title,
  description,
  ogTitle,
  ogDesc,
  image = "/hero.webp",
  imageAlt,
  noIndex = false,
  type = "website",
  isRoot = false,
}) {
  const isPreview =
    process.env.VERCEL_ENV === "preview" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
    process.env.NEXT_PUBLIC_IS_PREVIEW === "true";

  const shouldNoIndex = noIndex || isPreview;
  const currentLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  const canonicalUrl = getCanonicalUrl(path, currentLang);
  const alternateLanguages = getAlternateLanguages(path);
  const locale = LANGUAGE_LOCALES[currentLang] || "ka_GE";
  
  const rawTitle = title || "GeorgiaTrips";
  const cleanTitle = rawTitle.replace(/\s*\|\s*GeorgiaTrips(?:\.ge)?$/i, "").trim();
  const fullOgTitle = ogTitle || (cleanTitle ? `${cleanTitle} | GeorgiaTrips` : "GeorgiaTrips");
  const fullOgDesc = ogDesc || description || "";
  const fullImgUrl = image.startsWith("http") ? image : `${SITE_URL}${image.startsWith("/") ? "" : "/"}${image}`;

  const metadata = {
    title: isRoot ? { default: cleanTitle, template: "%s | GeorgiaTrips" } : cleanTitle,
    description: description || "",
    alternates: {
      canonical: canonicalUrl,
      languages: alternateLanguages,
    },
    openGraph: {
      title: isRoot ? cleanTitle : fullOgTitle,
      description: fullOgDesc,
      url: canonicalUrl,
      siteName: "GeorgiaTrips",
      locale,
      type,
      images: [
        {
          url: fullImgUrl,
          width: 1200,
          height: 630,
          alt: imageAlt || cleanTitle || "GeorgiaTrips",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: isRoot ? cleanTitle : fullOgTitle,
      description: fullOgDesc,
      images: [fullImgUrl],
    },
  };

  if (shouldNoIndex) {
    metadata.robots = {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    };
  }

  return metadata;
}
