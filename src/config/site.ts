export const siteConfig = {
  name: "KEMIX Academy",
  tagline: "Learn → Build → Grow",
  description:
    "منصة تعليمية من مصر إلى العالم، تساعد المتعلمين على بناء مهارات رقمية وتحليلية وتطبيقها بثقة.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  links: {
    github: "https://github.com/kemix-academy",
  },
  navItems: [
    { label: "الرئيسية", href: "/" },
    { label: "الكورسات", href: "/courses" },
    { label: "عن الأكاديمية", href: "/about" },
    { label: "تواصل معنا", href: "/contact" },
    { label: "التحقق من الشهادة", href: "/verify" },
  ],
};
