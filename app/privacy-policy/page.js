import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getLocalizedHref, getRequestLocale, ROUTE_METADATA, buildLocalizedMetadata } from "../lib/siteConfig";

const CONTENT = {
  ka: {
    title: "კონფიდენციალობის პოლიტიკა",
    updated: "ბოლო განახლება: 2026 წლის აგვისტო",
    intro: "GeorgiaTrips პატივს სცემს თქვენს კონფიდენციალობას და იცავს თქვენს პერსონალურ მონაცემებს. წინამდებარე პოლიტიკა განმარტავს, თუ როგორ ვაგროვებთ, ვიყენებთ და ვიცავთ თქვენს ინფორმაციას.",
    s1Title: "1. ინფორმაციის შეგროვება",
    s1Desc: "ჩვენ ვაგროვებთ მხოლოდ იმ ინფორმაციას, რომელსაც გვაწვდით ტურის ან ტრანსფერის დაჯავშნისას (სახელი, ტელეფონის ნომერი, ელ-ფოსტა, ფრენის მონაცემები).",
    s2Title: "2. ინფორმაციის გამოყენება",
    s2Desc: "თქვენი მონაცემები გამოიყენება მხოლოდ შეკვეთის დასადასტურებლად, მომსახურების უზრუნველსაყოფად და თქვენთან დასაკავშირებლად (მაგ. WhatsApp-ის ან ელ-ფოსტის მეშვეობით).",
    s3Title: "3. Cookie ფაილები",
    s3Desc: "ჩვენ ვიყენებთ cookie ფაილებს თქვენი ენისა და ვალუტის პრეფერენციების შესანახად და საიტის გამართული მუშაობისთვის.",
    s4Title: "4. მესამე მხარეები",
    s4Desc: "ჩვენ არ გადავცემთ, არ ვყიდით და არ ვუზიარებთ თქვენს პირად მონაცემებს მესამე პირებს, გარდა იმ შემთხვევებისა, რაც აუცილებელია ტურის ორგანიზებისთვის (მაგ. დაზღვევა).",
    backHome: "← მთავარ გვერდზე დაბრუნება",
  },
  en: {
    title: "Privacy Policy",
    updated: "Last Updated: August 2026",
    intro: "GeorgiaTrips respects your privacy and is committed to protecting your personal data. This policy outlines how we collect, use, and safeguard your information.",
    s1Title: "1. Information We Collect",
    s1Desc: "We only collect information necessary to process your tour or transfer bookings (such as full name, phone number, email address, and flight details).",
    s2Title: "2. How We Use Information",
    s2Desc: "Your information is used strictly to confirm your bookings, organize transportation/guiding, and communicate with you via WhatsApp or email.",
    s3Title: "3. Cookies & Preferences",
    s3Desc: "We utilize cookies to remember your language and currency preferences, ensuring a seamless browsing experience.",
    s4Title: "4. Third Parties & Data Security",
    s4Desc: "We never sell or disclose your personal data to third parties, except as required to fulfill tour services (e.g., travel insurance where applicable).",
    backHome: "← Back to Home",
  },
  ru: {
    title: "Политика конфиденциальности",
    updated: "Последнее обновление: Август 2026",
    intro: "GeorgiaTrips уважает вашу конфиденциальность и защищает ваши персональные данные. Настоящая политика объясняет порядок сбора, использования и защиты информации.",
    s1Title: "1. Сбор информации",
    s1Desc: "Мы собираем только ту информацию, которая необходима для бронирования туров и трансферов (имя, телефон, e-mail, детали рейса).",
    s2Title: "2. Использование данных",
    s2Desc: "Данные используются исключительно для подтверждения заказа, организации поездки и связи с вами (через WhatsApp или по почте).",
    s3Title: "3. Файлы Cookie",
    s3Desc: "Мы используем файлы cookie для сохранения языковых и валютных настроек и корректной работы сайта.",
    s4Title: "4. Третьи лица",
    s4Desc: "Мы не передаем и не продаем ваши персональные данные третьим лицам, за исключением случаев, обязательных для проведения тура.",
    backHome: "← На главную",
  },
  tr: {
    title: "Gizlilik Politikası",
    updated: "Son Güncelleme: Ağustos 2026",
    intro: "GeorgiaTrips gizliliğinize saygı duyar ve kişisel verilerinizi korur. Bu politika, bilgilerinizi nasıl topladığımızı ve koruduğumuzu açıklar.",
    s1Title: "1. Bilgi Toplama",
    s1Desc: "Yalnızca tur ve transfer rezervasyonları için gerekli bilgileri (ad, telefon, e-posta, uçuş detayları) topluyoruz.",
    s2Title: "2. Bilgi Kullanımı",
    s2Desc: "Bilgileriniz yalnızca rezervasyon onayları ve tur organizasyonu için WhatsApp veya e-posta yoluyla iletişimde kullanılır.",
    s3Title: "3. Çerezler (Cookies)",
    s3Desc: "Dil ve para birimi tercihlerinizi hatırlamak ve site performansını optimize etmek için çerezler kullanmaktayız.",
    s4Title: "4. Üçüncü Taraflar",
    s4Desc: "Kişisel verileriniz hiçbir koşulda üçüncü şahıslara satılmaz veya ticari amaçla paylaşılmaz.",
    backHome: "← Ana Sayfaya Dön",
  },
  ar: {
    title: "سياسة الخصوصية",
    updated: "آخر تحديث: أغسطس 2026",
    intro: "تحترم GeorgiaTrips خصوصيتكم وتلتزم بحماية بياناتكم الشخصية. توضح هذه السياسة كيفية جمع المعلومات واستخدامها وحمايتها.",
    s1Title: "1. جمع المعلومات",
    s1Desc: "نقوم بجمع المعلومات اللازمة فقط لتأكيد حجوزات الجولات السياحية أو التوصيلات (الاسم، الهاتف، البريد الإلكتروني، تفاصيل الرحلة).",
    s2Title: "2. استخدام المعلومات",
    s2Desc: "تُستخدم بياناتكم حصرياً لتأكيد الحجوزات، تقديم الخدمات، والتواصل معكم عبر واتساب أو البريد الإلكتروني.",
    s3Title: "3. ملفات تعريف الارتباط (Cookies)",
    s3Desc: "نستخدم ملفات تعريف الارتباط لحفظ تفضيلاتكم الخاصة باللغة والعملة وضمان تجربة تصفح مثالية.",
    s4Title: "4. الأطراف الثالثة",
    s4Desc: "نحن لا نبيع ولا نشارك بياناتكم الشخصية مع أي طرف ثالث لأغراض تجارية إطلاقاً.",
    backHome: "← العودة للرئيسية",
  },
};

export async function generateMetadata() {
  const reqHeaders = await headers();
  const lang = getRequestLocale(reqHeaders);
  const meta = ROUTE_METADATA.privacy[lang] || ROUTE_METADATA.privacy.ka;

  return buildLocalizedMetadata({
    path: "/privacy-policy",
    lang,
    title: meta.title,
    description: meta.description,
    image: meta.image || "/hero.webp",
  });
}

export default async function PrivacyPolicyPage() {
  const reqHeaders = await headers();
  const lang = getRequestLocale(reqHeaders);
  const t = CONTENT[lang] || CONTENT.ka;

  return (
    <>
      <Navbar />
      <main style={{ padding: "7rem 1.5rem 5rem 1.5rem", minHeight: "80vh", background: "var(--bg, #f8fafc)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", background: "#ffffff", padding: "3rem 2.5rem", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <Link href={getLocalizedHref("/", lang)} style={{ color: "var(--teal, #29b2b7)", fontWeight: 700, textDecoration: "none", display: "inline-block", marginBottom: "1.5rem" }}>
            {t.backHome}
          </Link>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--navy, #0d233a)", marginBottom: "0.5rem" }}>{t.title}</h1>
          <p style={{ color: "var(--text-muted, #64748b)", fontSize: "0.9rem", marginBottom: "2rem" }}>{t.updated}</p>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "var(--text, #334155)", marginBottom: "2rem" }}>{t.intro}</p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--navy, #0d233a)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>{t.s1Title}</h2>
          <p style={{ lineHeight: 1.7, color: "var(--text, #334155)", marginBottom: "1.5rem" }}>{t.s1Desc}</p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--navy, #0d233a)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>{t.s2Title}</h2>
          <p style={{ lineHeight: 1.7, color: "var(--text, #334155)", marginBottom: "1.5rem" }}>{t.s2Desc}</p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--navy, #0d233a)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>{t.s3Title}</h2>
          <p style={{ lineHeight: 1.7, color: "var(--text, #334155)", marginBottom: "1.5rem" }}>{t.s3Desc}</p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--navy, #0d233a)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>{t.s4Title}</h2>
          <p style={{ lineHeight: 1.7, color: "var(--text, #334155)", marginBottom: "1.5rem" }}>{t.s4Desc}</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

