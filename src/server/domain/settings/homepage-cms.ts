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

export interface CmsSkillItem {
  title: string;
  englishTitle: string;
  description: string;
  query: string;
  icon: string;
}

export interface HomepageCms {
  preferences: {
    theme: "light" | "dark";
    locale: "ar" | "en";
  };
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
  impact: {
    enabled: boolean;
    sortOrder: number;
    items: string[];
  };
  skills: {
    enabled: boolean;
    sortOrder: number;
    eyebrow: string;
    heading: string;
    description: string;
    items: CmsSkillItem[];
  };
  featuredCourses: {
    enabled: boolean;
    sortOrder: number;
    heading: string;
    description: string;
  };
  dataStory: {
    enabled: boolean;
    sortOrder: number;
    eyebrow: string;
    heading: string;
    description: string;
    imageAlt: string;
    note: string;
  };
  build: {
    enabled: boolean;
    sortOrder: number;
    eyebrow: string;
    heading: string;
    description: string;
    imageAlt: string;
    steps: string[];
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
  visuals: {
    heroImageUrl: string;
    dataStoryImageUrl: string;
    buildImageUrl: string;
    innovationImageUrl: string;
  };
}

export const DEFAULT_HOMEPAGE_CMS: HomepageCms = {
  preferences: { theme: "light", locale: "ar" },
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
    sortOrder: 2,
    items: [
      { value: "+5,000", label: "طالب ومتدرب مسجل" },
      { value: "100%", label: "تطبيق عملي على بيانات حقيقية" },
      { value: "98%", label: "نسبة رضا الخريجين" },
      { value: "شهادات موثقة", label: "برمز تحقق رقمي دائم" },
    ],
  },
  impact: {
    enabled: true,
    sortOrder: 1,
    items: ["مهارات المستقبل", "التعلّم بالتطبيق", "التفكير التحليلي", "الابتكار وصناعة الفرص"],
  },
  skills: {
    enabled: true,
    sortOrder: 3,
    eyebrow: "مجالات تتغير معها طريقة رؤيتك للعالم",
    heading: "المهارات التي تصنع الفارق.",
    description: "اكتشف المجالات التي تساعدك على فهم العالم الرقمي، وتحليل المعلومات، وبناء حلول أكثر ذكاءً.",
    items: [
      { title: "تحليل البيانات", englishTitle: "Data Analytics", description: "اكتشف ما تخبرك به البيانات، وحوّل الأسئلة إلى رؤى قابلة للفهم.", query: "Data", icon: "chart" },
      { title: "البرمجة بـ Python", englishTitle: "Python", description: "ابدأ ببناء مهارات برمجية تساعدك على استكشاف البيانات ومعالجتها.", query: "Python", icon: "code" },
      { title: "قواعد البيانات", englishTitle: "SQL", description: "نظّم البيانات واستخرج منها إجابات دقيقة باستخدام SQL.", query: "SQL", icon: "database" },
      { title: "ذكاء الأعمال", englishTitle: "Power BI", description: "قدّم المعلومات بوضوح عبر لوحات وتقارير تفاعلية.", query: "Power BI", icon: "dashboard" },
    ],
  },
  featuredCourses: {
    enabled: true,
    sortOrder: 4,
    heading: "استكشف أقوى الكورسات الموجهة لسوق العمل",
    description: "مسارات تدريبية مصممة خطوة بخطوة لبناء المهارات التحليلية والبرمجية.",
  },
  dataStory: {
    enabled: true,
    sortOrder: 5,
    eyebrow: "من السؤال إلى الرؤية",
    heading: "وراء كل رقم… فرصة لاكتشاف شيء جديد.",
    description: "تعلّم كيف تحوّل البيانات من أرقام متفرقة إلى رؤى واضحة تساعدك على فهم المشكلات واتخاذ قرارات أفضل.",
    imageAlt: "لوحة تحليل بيانات تعرض رسومًا بيانية ومؤشرات تحليلية على شاشة حاسوب",
    note: "مثال بصري توضيحي — لا يعرض مؤشرات أداء للأكاديمية",
  },
  build: {
    enabled: true,
    sortOrder: 6,
    eyebrow: "تعلّم بالممارسة",
    heading: "ما تتعلّمه اليوم، تستطيع أن تبني به غدًا.",
    description: "المعرفة تصبح أكثر قيمة عندما تتحول إلى تطبيق. طوّر مهاراتك، واختبر أفكارك، وابدأ ببناء مشروعات تعبّر عن قدراتك.",
    imageAlt: "فريق يعمل معًا على أجهزة الحاسوب ضمن مساحة تعلّم وتعاون",
    steps: ["تعلّم المفهوم", "جرّب بنفسك", "طوّر الحل"],
  },
  about: {
    enabled: true,
    sortOrder: 7,
    heading: "لماذا تختار أكاديمية كيميكس التعليمية؟",
    description:
      "صُممت منصتنا خصيصاً للمتخصصين في البيانات الذين يبحثون عن مهارات حقيقية قابلة للتطبيق مباشرة وليست مجرد معلومات نظرية.",
    imageUrl: "",
  },
  features: {
    enabled: true,
    sortOrder: 8,
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
    sortOrder: 9,
    heading: "المدربون",
    description: "نخبة من الممارسين في تحليل البيانات وذكاء الأعمال.",
  },
  testimonials: {
    enabled: true,
    sortOrder: 10,
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
    sortOrder: 11,
    heading: "ابدأ رحلتك في احتراف علوم البيانات اليوم",
    description: "انضم إلى آلاف الطلاب والمحللين الذين يبنون مشاريع حقيقية مع أكاديمية كيميكس.",
    buttonText: "إنشاء حساب مجاني",
  },
  footer: {
    enabled: true,
    sortOrder: 8,
  },
  visuals: {
    heroImageUrl: "/images/homepage/hero-team.webp",
    dataStoryImageUrl: "/images/homepage/data-analytics.webp",
    buildImageUrl: "/images/homepage/learning-team.webp",
    innovationImageUrl: "/images/homepage/strategy-team.webp",
  },
};

const SECTION_KEYS = [
  "hero",
  "stats",
  "impact",
  "skills",
  "featuredCourses",
  "dataStory",
  "build",
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
  if (isRecord(raw.preferences)) {
    if (raw.preferences.theme === "light" || raw.preferences.theme === "dark") {
      merged.preferences.theme = raw.preferences.theme;
    }
    if (raw.preferences.locale === "ar" || raw.preferences.locale === "en") {
      merged.preferences.locale = raw.preferences.locale;
    }
  }

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

  if (isRecord(raw.visuals)) {
    merged.visuals = {
      ...merged.visuals,
      heroImageUrl: String(raw.visuals.heroImageUrl ?? merged.visuals.heroImageUrl),
      dataStoryImageUrl: String(raw.visuals.dataStoryImageUrl ?? merged.visuals.dataStoryImageUrl),
      buildImageUrl: String(raw.visuals.buildImageUrl ?? merged.visuals.buildImageUrl),
      innovationImageUrl: String(raw.visuals.innovationImageUrl ?? merged.visuals.innovationImageUrl),
    };
  }

  if (Array.isArray((raw.stats as { items?: unknown })?.items)) {
    merged.stats.items = (raw.stats as { items: CmsStatItem[] }).items.map((item) => ({
      value: String(item?.value ?? ""),
      label: String(item?.label ?? ""),
    }));
  }

  if (Array.isArray((raw.impact as { items?: unknown })?.items)) {
    merged.impact.items = (raw.impact as { items: unknown[] }).items.map((item) => String(item ?? ""));
  }

  if (Array.isArray((raw.skills as { items?: unknown })?.items)) {
    merged.skills.items = (raw.skills as { items: CmsSkillItem[] }).items.map((item) => ({
      title: String(item?.title ?? ""),
      englishTitle: String(item?.englishTitle ?? ""),
      description: String(item?.description ?? ""),
      query: String(item?.query ?? ""),
      icon: String(item?.icon ?? "chart"),
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
