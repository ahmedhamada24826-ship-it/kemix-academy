export interface CmsStatItem {
  value: string;
  label: string;
}

export interface CmsFeatureItem {
  title: string;
  description: string;
}

export interface CmsTestimonialItem {
  quote: string;
  author: string;
  role: string;
  badge: string;
}

export interface HomepageCms {
  hero: {
    enabled: boolean;
    sortOrder: number;
    badge: string;
    heading: string;
    subheading: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    imageUrl: string;
    videoUrl: string;
    videoTitle: string;
  };
  stats: {
    enabled: boolean;
    sortOrder: number;
    items: CmsStatItem[];
  };
  featuredCourses: {
    enabled: boolean;
    sortOrder: number;
    heading: string;
    description: string;
  };
  about: {
    enabled: boolean;
    sortOrder: number;
    heading: string;
    description: string;
    imageUrl: string;
  };
  features: {
    enabled: boolean;
    sortOrder: number;
    heading: string;
    description: string;
    items: CmsFeatureItem[];
  };
  instructors: {
    enabled: boolean;
    sortOrder: number;
    heading: string;
    description: string;
  };
  testimonials: {
    enabled: boolean;
    sortOrder: number;
    heading: string;
    items: CmsTestimonialItem[];
  };
  cta: {
    enabled: boolean;
    sortOrder: number;
    heading: string;
    description: string;
    buttonText: string;
  };
  footer: {
    enabled: boolean;
    sortOrder: number;
  };
}

export const DEFAULT_HOMEPAGE_CMS: HomepageCms = {
  hero: {
    enabled: true,
    sortOrder: 0,
    badge: "الأكاديمية العربية الرائدة في علوم البيانات والذكاء الاصطناعي",
    heading: "مهاراتك اليوم .. تبني مستقبلك المهني الغد",
    subheading: "تعلم • ابنِ • تميّز",
    description:
      "احترف تحليل البيانات، بايثون، استعلامات SQL، ولوحات تحكم Power BI مع مشاريع عملية وتطبيقات حقيقية تؤهلك للعمل المباشر.",
    ctaPrimary: "ابدأ رحلة التعلم",
    ctaSecondary: "استعراض دليل الكورسات",
    imageUrl: "",
    videoUrl: "",
    videoTitle: "",
  },
  stats: {
    enabled: true,
    sortOrder: 1,
    items: [
      { value: "+5,000", label: "طالب ومتدرب مسجل" },
      { value: "100%", label: "تطبيق عملي على بيانات حقيقية" },
      { value: "98%", label: "نسبة رضا الخريجين" },
      { value: "شهادات موثقة", label: "برمز تحقق رقمي دائم" },
    ],
  },
  featuredCourses: {
    enabled: true,
    sortOrder: 2,
    heading: "استكشف أقوى الكورسات الموجهة لسوق العمل",
    description: "مسارات تدريبية مصممة خطوة بخطوة لبناء المهارات التحليلية والبرمجية.",
  },
  about: {
    enabled: true,
    sortOrder: 3,
    heading: "لماذا تختار أكاديمية كيميكس التعليمية؟",
    description:
      "صُممت منصتنا خصيصاً للمتخصصين في البيانات الذين يبحثون عن مهارات حقيقية قابلة للتطبيق مباشرة وليست مجرد معلومات نظرية.",
    imageUrl: "",
  },
  features: {
    enabled: true,
    sortOrder: 4,
    heading: "المنهجية التعليمية",
    description: "",
    items: [
      {
        title: "بيانات ومشاريع واقعية",
        description:
          "تطبيق عملي على مجموعات بيانات حقيقية ضخمة بصيغ CSV و Parquet و SQL تناسب متطلبات سوق العمل الفعلية.",
      },
      {
        title: "مشغل تعليمي متكامل",
        description:
          "مشاهدة الدروس بدقة عالية، مصادر متعددة للفيديو، وتنزيل ملفات الأكواد والدفاتر.",
      },
      {
        title: "اختبارات وتقييمات بمؤقت",
        description:
          "تقييم مستوى الفهم مع تصحيح فوري وشرح تفصيلي للإجابات الصحيحة.",
      },
      {
        title: "شهادات معتمدة برمز موثق",
        description:
          "شهادات إتمام رقمية معتمدة لكل مسار تدريبي يمكن إضافتها لحساب LinkedIn.",
      },
    ],
  },
  instructors: {
    enabled: false,
    sortOrder: 5,
    heading: "المدربون",
    description: "نخبة من الممارسين في تحليل البيانات وذكاء الأعمال.",
  },
  testimonials: {
    enabled: true,
    sortOrder: 6,
    heading: "تجارب خريجينا في سوق العمل",
    items: [
      {
        quote:
          "المناهج العملية في تحليل البيانات وبايثون بأكاديمية كيميكس ساعدتني على بناء معرض أعمال قوي ساهم بشكل مباشر في توظيفي كمهندس بيانات.",
        author: "أحمد عبد الله",
        role: "مهندس تحليل بيانات",
        badge: "خريج مسار Python & SQL",
      },
      {
        quote:
          "التطبيقات العملية والشرح المباشر بدون إطالة نظرية غير مفيدة جعلتني أتقن كتابة استعلامات SQL المعقدة وبناء لوحات تحكم احترافية.",
        author: "سارة محمود",
        role: "أخصائية ذكاء أعمال BI",
        badge: "حاصلة على شهادة Power BI",
      },
      {
        quote:
          "الشهادات الموثقة ونظام المتابعة المستمر للواجبات والتكليفات يعطيك التزاماً حقيقياً يختلف عن الدورات المسجلة التقليدية.",
        author: "محمد إبراهيم",
        role: "محلل بيانات أعمال",
        badge: "خريج المسار الشامل",
      },
    ],
  },
  cta: {
    enabled: true,
    sortOrder: 7,
    heading: "ابدأ رحلتك في احتراف علوم البيانات اليوم",
    description: "انضم إلى آلاف الطلاب والمحللين الذين يبنون مشاريع حقيقية مع أكاديمية كيميكس.",
    buttonText: "إنشاء حساب مجاني",
  },
  footer: {
    enabled: true,
    sortOrder: 8,
  },
};

const SECTION_KEYS = [
  "hero",
  "stats",
  "featuredCourses",
  "about",
  "features",
  "instructors",
  "testimonials",
  "cta",
  "footer",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeHomepageCms(raw: unknown): HomepageCms {
  if (!isRecord(raw)) {
    return structuredClone(DEFAULT_HOMEPAGE_CMS);
  }

  const merged = structuredClone(DEFAULT_HOMEPAGE_CMS);

  // Section-wise shallow merge. The record view keeps the union-typed section keys
  // assignable without weakening the public HomepageCms contract.
  const mergedSections = merged as unknown as Record<string, Record<string, unknown>>;

  for (const key of SECTION_KEYS) {
    const incoming = raw[key];
    if (!isRecord(incoming)) continue;
    mergedSections[key] = {
      ...mergedSections[key],
      ...incoming,
    };
  }

  if (Array.isArray((raw.stats as { items?: unknown })?.items)) {
    merged.stats.items = (raw.stats as { items: CmsStatItem[] }).items.map((item) => ({
      value: String(item?.value ?? ""),
      label: String(item?.label ?? ""),
    }));
  }

  if (Array.isArray((raw.features as { items?: unknown })?.items)) {
    merged.features.items = (raw.features as { items: CmsFeatureItem[] }).items.map((item) => ({
      title: String(item?.title ?? ""),
      description: String(item?.description ?? ""),
    }));
  }

  if (Array.isArray((raw.testimonials as { items?: unknown })?.items)) {
    merged.testimonials.items = (raw.testimonials as { items: CmsTestimonialItem[] }).items.map(
      (item) => ({
        quote: String(item?.quote ?? ""),
        author: String(item?.author ?? ""),
        role: String(item?.role ?? ""),
        badge: String(item?.badge ?? ""),
      })
    );
  }

  return merged;
}

export function orderedSectionKeys(cms: HomepageCms): (keyof HomepageCms)[] {
  return [...SECTION_KEYS].sort((a, b) => cms[a].sortOrder - cms[b].sortOrder);
}
