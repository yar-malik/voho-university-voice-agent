/**
 * The institution this deployment answers for.
 *
 * Everything specific to one university lives here. Fork the repository,
 * replace this file, and the assistant is yours — the agent prompt, the
 * greeting, the departments, the routing table and the branding all read
 * from it. Nothing else in `lib/` or `components/` names a university.
 *
 * The shipped configuration is Imam Abdulrahman Bin Faisal University, used
 * as the reference demo. See `config/README.md` for how to write your own.
 */

export type LanguageCode = 'ar-SA' | 'en-US'

export interface Department {
  /** Stable key. Tools and the agent prompt both refer to this. */
  id: string
  nameAr: string
  nameEn: string
  /** What this department actually handles, in the agent's own words. */
  handlesAr: string
  handlesEn: string
  phone?: string
  email?: string
}

export interface UniversityConfig {
  id: string
  nameAr: string
  nameEn: string
  shortName: string
  assistantNameAr: string
  assistantNameEn: string
  website: string
  /** The language the assistant opens in. It follows the caller after that. */
  primaryLanguage: LanguageCode
  supportedLanguages: LanguageCode[]
  greetingAr: string
  greetingEn: string
  departments: Department[]
  /**
   * How a weighted admission score is calculated, as published by the
   * institution. Weights must sum to 1.
   */
  admissionScore: {
    weights: { highSchool: number; aptitude: number; achievement: number }
    /** Indicative only — never quoted to a caller as a guarantee. */
    indicativeCutoffs?: { program: string; score: number }[]
  }
  contact: {
    admissionsPhone: string
    supportPhone: string
    admissionsEmail: string
    admissionsUrl: string
    supportUrl: string
  }
  branding: {
    /** Tailwind-compatible CSS colours used by the demo shell. */
    primary: string
    accent: string
    surface: string
  }
  /** Files under `/data` that make up the knowledge base. */
  knowledgeSources: string[]
}

export const university: UniversityConfig = {
  id: 'iau',
  nameAr: 'جامعة الإمام عبدالرحمن بن فيصل',
  nameEn: 'Imam Abdulrahman Bin Faisal University',
  shortName: 'IAU',
  assistantNameAr: 'المساعد الصوتي الذكي',
  assistantNameEn: 'AI Voice Assistant',
  website: 'https://www.iau.edu.sa',
  primaryLanguage: 'ar-SA',
  supportedLanguages: ['ar-SA', 'en-US'],

  greetingAr:
    'السلام عليكم، أهلاً بك في جامعة الإمام عبدالرحمن بن فيصل. أنا المساعد الصوتي الذكي للجامعة. كيف أقدر أخدمك اليوم؟',
  greetingEn:
    'Welcome to Imam Abdulrahman Bin Faisal University. I am the university AI voice assistant. How can I help you today?',

  departments: [
    {
      id: 'admissions',
      nameAr: 'القبول والتسجيل',
      nameEn: 'Admissions',
      handlesAr: 'شروط القبول، التقديم، النسب الموزونة، حالة الطلب',
      handlesEn: 'Admission requirements, applying, weighted scores, application status',
    },
    {
      id: 'registration',
      nameAr: 'شؤون التسجيل',
      nameEn: 'Registration',
      handlesAr: 'الجداول، الحذف والإضافة، السجل الأكاديمي',
      handlesEn: 'Schedules, add/drop, academic records',
    },
    {
      id: 'it_support',
      nameAr: 'الدعم التقني',
      nameEn: 'IT Support',
      handlesAr: 'الحسابات، كلمات المرور، البريد الجامعي، الشبكة',
      handlesEn: 'Accounts, passwords, university email, network',
    },
    {
      id: 'elearning',
      nameAr: 'دعم التعلم الإلكتروني',
      nameEn: 'E-Learning Support',
      handlesAr: 'البلاك بورد، المحاضرات الافتراضية، الاختبارات الإلكترونية',
      handlesEn: 'Blackboard, virtual classes, online exams',
    },
    {
      id: 'student_services',
      nameAr: 'خدمات الطلاب',
      nameEn: 'Student Services',
      handlesAr: 'المكافآت، السكن، الأنشطة، الإرشاد',
      handlesEn: 'Stipends, housing, activities, counselling',
    },
    {
      id: 'general',
      nameAr: 'الدعم العام',
      nameEn: 'General University Support',
      handlesAr: 'أي استفسار آخر',
      handlesEn: 'Anything else',
    },
  ],

  admissionScore: {
    // DEMO WEIGHTING. Confirm against the university's published admission
    // policy for the current cycle before using this anywhere real.
    weights: { highSchool: 0.3, aptitude: 0.3, achievement: 0.4 },
    indicativeCutoffs: [
      { program: 'Medicine (demo figure)', score: 92 },
      { program: 'Engineering (demo figure)', score: 85 },
      { program: 'Computer Science (demo figure)', score: 83 },
      { program: 'Business Administration (demo figure)', score: 76 },
    ],
  },

  contact: {
    // DEMO CONTACT DETAILS — replace with the institution's published ones.
    admissionsPhone: '+966 13 333 0000',
    supportPhone: '+966 13 333 1111',
    admissionsEmail: 'admissions@example.edu.sa',
    admissionsUrl: 'https://www.iau.edu.sa/en/admission',
    supportUrl: 'https://www.iau.edu.sa/en/services',
  },

  branding: {
    primary: '#0B5D3B',
    accent: '#C9A227',
    surface: '#F7F8F7',
  },

  knowledgeSources: ['iau-faqs.json', 'iau-services.json', 'iau-programs.json'],
}

export function greetingFor(lang: LanguageCode): string {
  return lang === 'ar-SA' ? university.greetingAr : university.greetingEn
}

export function departmentById(id: string): Department | undefined {
  return university.departments.find((d) => d.id === id)
}
