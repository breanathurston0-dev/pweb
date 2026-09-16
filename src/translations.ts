export type Language = "en" | "km";

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    km: string;
  };
}

export const translations: TranslationDictionary = {
  // Navigation
  home: { en: "Home", km: "ទំព័រដើម" },
  courses: { en: "Courses", km: "វគ្គសិក្សា" },
  about: { en: "About Us", km: "អំពីយើង" },
  contact: { en: "Contact", km: "ទំនាក់ទំនង" },
  blog: { en: "Blog", km: "ប្លុក" },
  faq: { en: "FAQ", km: "សំណួរពេញនិយម" },
  studentDashboard: { en: "Student Area", km: "តំបន់សិក្សា" },
  adminDashboard: { en: "Admin Panel", km: "ផ្ទាំងគ្រប់គ្រង" },
  logout: { en: "Logout", km: "ចាកចេញ" },
  login: { en: "Login", km: "ចូលប្រើប្រាស់" },
  register: { en: "Register", km: "ចុះឈ្មោះ" },

  // Hero Section
  heroTitle: { en: "Accelerate Your Future with Khmer's Premium LMS", km: "ពន្លឿនអនាគតរបស់អ្នកជាមួយថ្នាក់រៀនអនឡាញកម្ពុជា" },
  heroSlogan: { en: "Master programming, design, and backend architectural standards from local senior industry architects. Localized payment, uncompromised performance.", km: "ស្ទាត់ជំនាញសរសេរកូដ រចនាប្លង់ និងស្ថាបត្យកម្មម៉ាស៊ីនបម្រើជាមួយគ្រូជំនាញខ្មែរ។ ទូទាត់រហ័សតាមធនាគារក្នុងស្រុក។" },
  startLearning: { en: "Start Learning", km: "ចាប់ផ្តើមរៀនឥឡូវនេះ" },
  exploreCourses: { en: "Explore Courses", km: "វគ្គសិក្សាទាំងអស់" },

  // Stats
  statStudents: { en: "Active Student Enrollment", km: "សិស្សកំពុងសិក្សា" },
  statCourses: { en: "Certified Video Courses", km: "វគ្គសិក្សាស្តង់ដារ" },
  statDuration: { en: "Total Streaming Content", km: "ម៉ោងវីដេអូសរុប" },
  statInstructors: { en: "Local Tech Architects", km: "គ្រូឧទ្ទេសជំនាញ" },

  // Categories
  categoriesTitle: { en: "Browse Top Tech Categories", km: "ស្វែងរកតាមប្រភេទវគ្គសិក្សា" },
  programming: { en: "Programming", km: "សរសេរកូដ" },
  backendDevelopment: { en: "Backend Development", km: "ផ្នែកម៉ាស៊ីនបម្រើ" },
  design: { en: "UI/UX Design", km: "រចនាប្លង់កម្មវិធី" },

  // Course Cards & Details
  popular: { en: "Popular", km: "ពេញនិយម" },
  featured: { en: "Featured", km: "ពិសេស" },
  instructor: { en: "Instructor", km: "គ្រូសម្របសម្រួល" },
  lessonsCount: { en: "Lessons", km: "មេរៀន" },
  unlocked: { en: "Unlocked", km: "បើកសិក្សាហើយ" },
  purchaseNeeded: { en: "Buy Now", km: "ទិញវគ្គសិក្សានេះ" },
  rating: { en: "Rating", km: "ការវាយតម្លៃ" },
  reviews: { en: "Reviews", km: "មតិយោបល់" },
  hours: { en: "Hours", km: "ម៉ោង" },
  courseTrailer: { en: "Preview Introduction", km: "ទស្សនាវីដេអូណែនាំ" },
  whatYouWillLearn: { en: "What You Will Learn", km: "អ្វីដែលអ្នកនឹងទទួលបាន" },
  lessonsList: { en: "Lessons Curriculum", km: "មាតិកាមេរៀនលម្អិត" },
  unlockedTag: { en: "You have purchased this course", km: "សមាសភាពសិក្សាត្រូវបានផ្ទៀងផ្ទាត់រួចរាល់" },

  // Auth pages
  email: { en: "Email Address", km: "អាសយដ្ឋានអ៊ីមែល" },
  password: { en: "Account Password", km: "លេខសម្ងាត់" },
  name: { en: "Full Legal Name", km: "ឈ្មោះពេញ" },
  phone: { en: "Phone Number", km: "លេខទូរស័ព្ទ" },
  alreadyHaveAccount: { en: "Already have an account? Login", km: "មានគណនីរួចហើយ? ចូលគណនី" },
  dontHaveAccount: { en: "Need an account? Register", km: "មិនទាន់មានគណនី? ចុះឈ្មោះ" },
  verificationText: { en: "Fully secure JWT Token Verification", km: "ប្រព័ន្ធសុវត្ថិភាពខ្ពស់ ផ្ទៀងផ្ទាត់ដោយ JWT" },

  // Student Section
  myCourses: { en: "My Learning Desk", km: "តុរៀនរបស់ខ្ញុំ" },
  progress: { en: "Course Progress", km: "វឌ្ឍនភាពមេរៀន" },
  certificateClaim: { en: "Claim Academy Certificate", km: "ទទួលវិញ្ញាបនបត្របញ្ចប់ការសិក្សា" },
  verifiedTransactions: { en: "Payment Orders", km: "វិក្កយបត្របង់ប្រាក់" },
  nowPlaying: { en: "Active Lesson Playing", km: "កំពុងចាក់ផ្សាយមេរៀន" },
  autoNext: { en: "Auto Play Next Lesson", km: "ចាក់មេរៀនបន្ទាប់ស្វ័យប្រវត្ត" },
  speed: { en: "Playback Speed", km: "ល្បឿនវីដេអូ" },
  watermarkDisclaimer: { en: "Prevent unauthorized distribution.", km: "រក្សាសិទ្ធិបញ្ញាដើម្បីការពារការចម្លង។" },

  // Payments / Checkout
  checkoutTitle: { en: "Instant QR Payment Verification", km: "ការទូទាត់រហ័សនិងផ្ទៀងផ្ទាត់" },
  selectGateway: { en: "Select Cambodian Payment Gateway", km: "ជ្រើសរើសធនាគារក្នុងស្រុក" },
  paySubtitle: { en: "Please scan the QR code using your banking app. Once paid, click 'Verify Payment' below to instantly unlock.", km: "សូមស្កេន QR ខាងក្រោមជាមួយកម្មវិធីធនាគារ។ បន្ទាប់ពីទូទាត់រួច សូមចុច 'ផ្ទៀងផ្ទាត់ទូទាត់' ដើម្បីបើកមេរៀនភ្លាមៗ។" },
  verifyPayment: { en: "Verify Code & Unlock", km: "ផ្ទៀងផ្ទាត់និងបើកការសិក្សា" },
  verifySuccess: { en: "Course Unlocked! Go to Student Panel to start watching.", km: "ការទូទាត់ជោគជ័យ! មេរៀនទាំងអស់ត្រូវបានបើកដំណើរការ។" },

  // Admin section
  overview: { en: "Analytics & Overview", km: "ទិន្នន័យវិភាគរួម" },
  totalUsers: { en: "Total Platform Users", km: "អ្នកប្រើប្រាស់សរុប" },
  totalRevenue: { en: "Revenue Collection", km: "ចំណូលសរុប" },
  activeStudents: { en: "Active Students", km: "សិស្សសកម្ម" },
  totalSales: { en: "Sales Transactions", km: "ការលក់សរុប" },
  manageCourses: { en: "Course CMS Manager", km: "គ្រប់គ្រងផ្នែកវគ្គសិក្សា" },
  manageUsers: { en: "User Portal", km: "គ្រប់គ្រងព័ត៌មានអ្នកប្រើ" },
  managePayments: { en: "Authorize Payments", km: "អនុម័តការបង់ប្រាក់" },
  appSettings: { en: "LMS Integrations & Core Config", km: "កំណត់រចនាសម្ព័ន្ធប្រព័ន្ធ" },
  aiCourseGen: { en: "AI Course Material Generator", km: "ប្រព័ន្ធជំនួយបង្កើតវគ្គសិក្សា (Gemini AI)" },
  generateWithAI: { en: "Generate Metadata With AI", km: "ស្វែងរកនិងរចនាដោយបញ្ញាសិប្បនិម្មិត" },
  aiTopicPlaceholder: { en: "Enter course topic (e.g. Next.js, Flutter, English for IT)", km: "បញ្ចូលប្រធានបទ (ឧទាហរណ៍៖ React Native, IELTS, SQL)" },
  generateBtn: { en: "Generate Course Architecture", km: "បញ្ជាបញ្ញាសិប្បនិម្មិតឱ្យបង្កើត" },
  addCourse: { en: "Create New Course", km: "បង្កើតវគ្គសិក្សាថ្មី" },
  exportUsersCsv: { en: "Export Users (CSV)", km: "ទាញយកទិន្នន័យអ្នកប្រើ (CSV)" }
};
