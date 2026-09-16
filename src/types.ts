export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "teacher" | "student";
  avatar: string;
  phone?: string;
  isBanned?: boolean;
}

export interface Course {
  id: string;
  title: string;
  titleKh: string;
  slug: string;
  description: string;
  descriptionKh: string;
  price: number;
  discount: number;
  thumbnail: string;
  category: string;
  categoryKh: string;
  duration: string;
  instructor: string;
  instructorTitle: string;
  rating: number;
  reviewsCount: number;
  isPopular?: boolean;
  isFeatured?: boolean;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  titleKh: string;
  videoUrl: string;
  duration: string;
  isPreview?: boolean;
  orderIndex: number;
}

export interface Order {
  id: string;
  userId: string;
  courseId: string;
  paymentStatus: "pending" | "completed" | "refunded" | "failed";
  amount: number;
  transactionId: string;
  createdAt: string;
  gateway: string;
  userName?: string;
  userEmail?: string;
  courseTitle?: string;
}

export interface TeacherMessage {
  id: string;
  studentName: string;
  courseTitle: string;
  message: string;
  createdAt: string;
}

export interface Settings {
  siteName: string;
  siteNameKh: string;
  logoUrl: string;
  telegramBotToken: string;
  telegramChatId: string;
  googleSheetsId: string;
  googleServiceAccountEmail: string;
  googlePrivateKey: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
  payload?: any;
  isArchived?: boolean;
}

export interface Review {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

