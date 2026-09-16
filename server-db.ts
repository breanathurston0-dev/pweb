import fs from "fs";
import path from "path";
import crypto from "crypto";

// Define the Database location
const DB_FILE = path.join(process.cwd(), "data", "database.json");

// Ensure the data directory exists
if (!fs.existsSync(path.dirname(DB_FILE))) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "teacher" | "student";
  avatar?: string;
  isBanned?: boolean;
  phone?: string;
}

export interface Course {
  id: string;
  title: string;
  titleKh: string;
  slug: string;
  description: string;
  descriptionKh: string;
  price: number;
  discount: number; // percentage or fixed discount
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
  videoUrl: string; // fallback video
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
}

export interface TeacherMessage {
  id: string;
  studentName: string;
  courseTitle: string;
  message: string;
  createdAt: string;
}

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  khIndex: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  qrTemplate: string;
}

export interface Settings {
  siteName: string;
  siteNameKh: string;
  logoUrl: string;
  telegramBotToken: string;
  telegramChatId: string;
  googleSheetsId: string;
  googleServiceAccountEmail: string;
  googlePrivateKey: string; // Base64 or directly stored
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

export interface DatabaseSchema {
  users: User[];
  courses: Course[];
  lessons: Lesson[];
  orders: Order[];
  settings: Settings;
  teacherMessages: TeacherMessage[];
  auditLogs: AuditLog[];
  reviews: Review[];
}

const DEFAULT_DB: DatabaseSchema = {
  auditLogs: [],
  reviews: [],
  users: [
    {
      id: "u-1",
      name: "Pro San (Sopheap Mok)",
      email: "admin@lms-cambodia.com",
      passwordHash: "$2a$10$U22PGrF/CizL5s8gXbeoWuy8Oa7/zX.g9.05T4u9C9mX63U4bQ6yG", // hash for "admin123"
      role: "admin",
      avatar: "/pro-san.jpg",
      phone: "012345678"
    },
    {
      id: "u-2",
      name: "Dara Samath",
      email: "teacher@lms-cambodia.com",
      passwordHash: "$2a$10$U22PGrF/CizL5s8gXbeoWuy8Oa7/zX.g9.05T4u9C9mX63U4bQ6yG", // hash for "admin123"
      role: "teacher",
      avatar: "/pro-san.jpg",
      phone: "098765432"
    },
    {
      id: "u-3",
      name: "Sokha Chan",
      email: "student@lms-cambodia.com",
      passwordHash: "$2a$10$U22PGrF/CizL5s8gXbeoWuy8Oa7/zX.g9.05T4u9C9mX63U4bQ6yG", // hash for "admin123"
      role: "student",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
      phone: "085555444"
    }
  ],
  courses: [
    {
      id: "c-1",
      title: "Mastering React & TypeScript for Modern Full-Stack",
      titleKh: "ស្ទាត់ជំនាញ React & TypeScript សម្រាប់ស្ថាបនាគេហទំព័រ",
      slug: "mastering-react-typescript",
      description: "Build robust scalable client applications with global states, motion layouts, and server-side optimizations using standard guidelines.",
      descriptionKh: "ស្ថាបនាគេហទំព័រទំនើបជាមួយ React និង TypeScript ស្វែងយល់ចាប់ពីកម្រិតដំបូងរហូតដល់កម្រិតជំនាញខ្ពស់ រួមទាំងការតភ្ជាប់ Backend។",
      price: 59,
      discount: 10,
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
      category: "Programming",
      categoryKh: "សរសេរកូដ",
      duration: "18h 45m",
      instructor: "Dara Samath",
      instructorTitle: "Senior Web Architect",
      rating: 4.8,
      reviewsCount: 124,
      isPopular: true,
      isFeatured: true
    },
    {
      id: "c-2",
      title: "Node.js & Express.js Backend Development",
      titleKh: "ការអភិវឌ្ឍផ្នែក Backend ជាមួយ Node.js & Express",
      slug: "node-express-backend",
      description: "Learn server architectural design, API security validations, secure database syncing, rate limiting, and authenticating with JWT.",
      descriptionKh: "ស្វែងយល់អំពីស្ថាបត្យកម្មម៉ាស៊ីនបម្រើ (Server) សុវត្ថិភាព API ការគ្រប់គ្រងទិន្នន័យ Google Sheet និងការប្រើប្រាស់ JWT Token។",
      price: 49,
      discount: 15,
      thumbnail: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800",
      category: "Backend Development",
      categoryKh: "អភិវឌ្ឍន៍ម៉ាស៊ីនបម្រើ",
      duration: "14h 30m",
      instructor: "Sophy Phirum",
      instructorTitle: "Lead Principal Engineer",
      rating: 4.9,
      reviewsCount: 88,
      isPopular: true,
      isFeatured: false
    },
    {
      id: "c-3",
      title: "UX/UI Design Foundations for Mobile & Web Applications",
      titleKh: "គ្រឹះនៃការរចនា UX/UI សម្រាប់កម្មវិធីទូរស័ព្ទ និងគេហទំព័រ",
      slug: "ui-ux-design-foundations",
      description: "Design pixel-perfect beautiful web experiences following luxury typography rules, negative space layouts, and responsive flow grids.",
      descriptionKh: "ការរចនាបទពិសោធន៍អ្នកប្រើប្រាស់ និងចំណុចប្រទាក់ដ៏ស្រស់ស្អាត តាមរយៈការផ្គូផ្គងអក្សរ ពណ៌ និងរចនាសម្ព័ន្ធប្លង់។",
      price: 39,
      discount: 0,
      thumbnail: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800",
      category: "Design",
      categoryKh: "ការរចនាប្លង់",
      duration: "10h 15m",
      instructor: "Kanha Srey",
      instructorTitle: "Creative Director",
      rating: 4.7,
      reviewsCount: 52,
      isPopular: false,
      isFeatured: true
    }
  ],
  lessons: [
    // Lessons for mastering-react-typescript (c-1)
    {
      id: "l-1",
      courseId: "c-1",
      title: "Course Introduction & Setup Guide",
      titleKh: "ការណែនាំអំពីវគ្គសិក្សានិងការដំឡើងបរិស្ថានការងារ",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      duration: "12:15",
      isPreview: true,
      orderIndex: 1
    },
    {
      id: "l-2",
      courseId: "c-1",
      title: "Understanding React 19 State Management & Custom Hooks",
      titleKh: "ស្វែងយល់អំពីការគ្រប់គ្រង State ក្នុង React 19 និង Custom Hooks",
      videoUrl: "https://www.w3schools.com/html/movie.mp4",
      duration: "25:40",
      isPreview: false,
      orderIndex: 2
    },
    {
      id: "l-3",
      courseId: "c-1",
      title: "TypeScript Deep Dive with Generics & Types",
      titleKh: "ស្វែងយល់លម្អិតអំពី TypeScript Generics និង Types",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      duration: "32:10",
      isPreview: false,
      orderIndex: 3
    },
    {
      id: "l-4",
      courseId: "c-1",
      title: "Adding Motion Layouts & Complex Route Transitions",
      titleKh: "ការបន្ថែមចលនា និងការផ្លាស់ប្តូរទំព័រជាមួយ Framer Motion",
      videoUrl: "https://www.w3schools.com/html/movie.mp4",
      duration: "18:22",
      isPreview: false,
      orderIndex: 4
    },
    // Lessons for node-express-backend (c-2)
    {
      id: "l-5",
      courseId: "c-2",
      title: "Introduction to Node.js Runtime and CommonJS vs ESM",
      titleKh: "ការណែនាំអំពី Node.js Runtime និងការប្រៀបធៀប CommonJS និង ESM",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      duration: "15:45",
      isPreview: true,
      orderIndex: 1
    },
    {
      id: "l-6",
      courseId: "c-2",
      title: "Configuring Express Routes, Middlewares and CORS Policy",
      titleKh: "ការកំណត់រចនាសម្ព័ន្ធ Express Routes, Middlewares និង CORS",
      videoUrl: "https://www.w3schools.com/html/movie.mp4",
      duration: "22:50",
      isPreview: false,
      orderIndex: 2
    },
    {
      id: "l-7",
      courseId: "c-2",
      title: "JWT Authentication, Bearer Token Validations & Input Sanitizations",
      titleKh: "ការផ្ទៀងផ្ទាត់ JWT Authentication និងសុវត្ថិភាពការបញ្ចូលទិន្នន័យ",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      duration: "28:15",
      isPreview: false,
      orderIndex: 3
    },
    // Lessons for ui-ux-design-foundations (c-3)
    {
      id: "l-8",
      courseId: "c-3",
      title: "Design Principles: Contrast, Alignment, & Luxury Fonts",
      titleKh: "គោលការណ៍រចនា៖ ភាពខុសគ្នា តម្រឹម និងពុម្ពអក្សរប្រណីត",
      videoUrl: "https://www.w3schools.com/html/movie.mp4",
      duration: "14:10",
      isPreview: true,
      orderIndex: 1
    },
    {
      id: "l-9",
      courseId: "c-3",
      title: "Figma Prototyping and Desktop Responsive Layouts",
      titleKh: "ការបង្កើតគំរូ Figma Prototyping និងប្លង់សម្របតាមអេក្រង់កុំព្យូទ័រ",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      duration: "24:35",
      isPreview: false,
      orderIndex: 2
    }
  ],
  orders: [
    {
      id: "o-1",
      userId: "u-3",
      courseId: "c-1",
      paymentStatus: "completed",
      amount: 49,
      transactionId: "TXNABA92841029",
      createdAt: "2026-05-25T14:22:00Z",
      gateway: "ABA Pay"
    }
  ],
  teacherMessages: [],
  settings: {
    siteName: "PRO SAN",
    siteNameKh: "ប្រូសាន",
    logoUrl: "",
    telegramBotToken: "",
    telegramChatId: "",
    googleSheetsId: "",
    googleServiceAccountEmail: "",
    googlePrivateKey: ""
  }
};

class DBService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(fileContent);
        // Merge with DEFAULT_DB keys to ensure safety if schemas change
        return {
          users: parsed.users || DEFAULT_DB.users,
          courses: parsed.courses || DEFAULT_DB.courses,
          lessons: parsed.lessons || DEFAULT_DB.lessons,
          orders: parsed.orders || DEFAULT_DB.orders,
          settings: parsed.settings || DEFAULT_DB.settings,
          teacherMessages: parsed.teacherMessages || DEFAULT_DB.teacherMessages || [],
          auditLogs: parsed.auditLogs || DEFAULT_DB.auditLogs || [],
          reviews: parsed.reviews || DEFAULT_DB.reviews || []
        };
      }
    } catch (e) {
      console.error("Failed to load local DB, using default.", e);
    }
    this.saveData(DEFAULT_DB);
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }

  // Method to record an audit trace
  public log(userId: string, userName: string, userEmail: string, action: string, details: string, payload?: any) {
    this.updateAndSave((currDb) => {
      if (!currDb.auditLogs) {
        currDb.auditLogs = [];
      }
      currDb.auditLogs.push({
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId,
        userName,
        userEmail,
        action,
        details,
        timestamp: new Date().toISOString(),
        payload: payload !== undefined ? payload : null
      });
    });
  }

  private saveData(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write database.json", e);
    }
  }

  public get(): DatabaseSchema {
    return this.data;
  }

  public updateAndSave(modifier: (db: DatabaseSchema) => void) {
    modifier(this.data);
    this.saveData(this.data);
    // Optionally trigger Google Sheet sync
    this.syncToGoogleSheets().catch(err => console.error("Sheets auto-sync error:", err));
  }

  // Helper to get Google Sheets access token using Service Account credentials
  private async getGoogleSheetsAccessToken(): Promise<string> {
    const { googleServiceAccountEmail, googlePrivateKey } = this.data.settings;
    if (!googleServiceAccountEmail || !googlePrivateKey) {
      throw new Error("Missing Google Service Account credentials (email or private key)");
    }

    // Clean private key format
    let privateKey = googlePrivateKey.trim();
    if (privateKey.startsWith("BASE64:")) {
      privateKey = Buffer.from(privateKey.replace("BASE64:", ""), "base64").toString("utf-8");
    } else {
      // Handle escaped newlines
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    // Standard RS256 JWT signature using Node's native crypto
    const header = { alg: "RS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: googleServiceAccountEmail,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    };

    const base64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
    const base64Claim = Buffer.from(JSON.stringify(claim)).toString("base64url");
    const signInput = `${base64Header}.${base64Claim}`;

    const signer = crypto.createSign("RSA-SHA256");
    signer.update(signInput);
    signer.end();
    const signature = signer.sign(privateKey, "base64url");

    const jwt = `${signInput}.${signature}`;

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google OAuth token retrieval failed: ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  // Ensures required sheets exist within the Spreadsheet
  public async ensureSheetsExist(accessToken: string): Promise<void> {
    const { googleSheetsId } = this.data.settings;
    if (!googleSheetsId) {
      throw new Error("Missing Spreadsheet ID");
    }

    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${googleSheetsId}`;
    const getRes = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!getRes.ok) {
      const err = await getRes.text();
      throw new Error(`Failed to access spreadsheet. Verify ID is correct and shared with your Service Account Email.\nDetails: ${err}`);
    }

    const spreadsheet = await getRes.json();
    const currentSheetTitles = spreadsheet.sheets?.map((s: any) => s.properties?.title) || [];

    const requiredSheets = ["Courses", "Users", "Orders", "Lessons"];
    const addRequests = [];

    for (const title of requiredSheets) {
      if (!currentSheetTitles.includes(title)) {
        addRequests.push({
          addSheet: {
            properties: { title }
          }
        });
      }
    }

    if (addRequests.length > 0) {
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${googleSheetsId}:batchUpdate`;
      const updateRes = await fetch(updateUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ requests: addRequests })
      });

      if (!updateRes.ok) {
        const err = await updateRes.text();
        throw new Error(`Failed to create necessary worksheets: ${err}`);
      }
    }
  }

  // Helper to write table data into Google Sheets
  private async syncTableToSheet(
    accessToken: string,
    sheetTitle: string,
    headers: string[],
    rows: any[][]
  ): Promise<void> {
    const { googleSheetsId } = this.data.settings;
    if (!googleSheetsId) return;

    // Clear sheet existing data up to column Z
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${googleSheetsId}/values/${sheetTitle}!A1:Z2000:clear`;
    await fetch(clearUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    // Write new header and rows
    const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${googleSheetsId}/values/${sheetTitle}!A1?valueInputOption=USER_ENTERED`;
    const bodyData = {
      values: [headers, ...rows]
    };

    const writeRes = await fetch(writeUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bodyData)
    });

    if (!writeRes.ok) {
      const err = await writeRes.text();
      throw new Error(`Failed to sync worksheet '${sheetTitle}': ${err}`);
    }
  }

  // Pure REST API service mapping for sheets sync
  public async syncToGoogleSheets(): Promise<boolean> {
    const { googleSheetsId, googleServiceAccountEmail, googlePrivateKey } = this.data.settings;
    if (!googleSheetsId || !googleServiceAccountEmail || !googlePrivateKey) {
      // Configuration missing - silent skip (relying on robust local storage fallback)
      return false;
    }

    try {
      console.log("Triggering robust Google Sheets Sync for Database sheets...");
      const accessToken = await this.getGoogleSheetsAccessToken();
      await this.ensureSheetsExist(accessToken);

      // 1. Sync Courses
      const coursesHeaders = ["id", "title", "titleKh", "slug", "description", "descriptionKh", "price", "discount", "thumbnail", "category", "duration", "instructor", "rating"];
      const coursesRows = this.data.courses.map((c) => [
        c.id, c.title, c.titleKh, c.slug, c.description, c.descriptionKh || "", c.price, c.discount, c.thumbnail, c.category, c.duration, c.instructor, c.rating
      ]);
      await this.syncTableToSheet(accessToken, "Courses", coursesHeaders, coursesRows);

      // 2. Sync Users
      const usersHeaders = ["id", "name", "email", "role", "phone", "isBanned"];
      const usersRows = this.data.users.map((u) => [
        u.id, u.name, u.email, u.role, u.phone || "", u.isBanned ? "Yes" : "No"
      ]);
      await this.syncTableToSheet(accessToken, "Users", usersHeaders, usersRows);

      // 3. Sync Orders
      const ordersHeaders = ["id", "userId", "courseId", "paymentStatus", "amount", "transactionId", "createdAt", "gateway"];
      const ordersRows = this.data.orders.map((o) => [
        o.id, o.userId, o.courseId, o.paymentStatus, o.amount, o.transactionId, o.createdAt, o.gateway
      ]);
      await this.syncTableToSheet(accessToken, "Orders", ordersHeaders, ordersRows);

      // 4. Sync Lessons
      const lessonsHeaders = ["id", "courseId", "title", "titleKh", "videoUrl", "duration", "isPreview", "orderIndex"];
      const lessonsRows = this.data.lessons.map((l) => [
        l.id, l.courseId, l.title, l.titleKh, l.videoUrl, l.duration, l.isPreview ? "Yes" : "No", l.orderIndex
      ]);
      await this.syncTableToSheet(accessToken, "Lessons", lessonsHeaders, lessonsRows);

      console.log("Google Sheets sync completed successfully!");
      return true;
    } catch (err: any) {
      console.error("Failed to perform background Google Sheets sync:", err.message);
      return false;
    }
  }

  // Import courses from Spreadsheet 'Courses' tab
  public async importCoursesFromGoogleSheets(): Promise<Course[]> {
    const { googleSheetsId } = this.data.settings;
    if (!googleSheetsId) {
      throw new Error("Google Sheets ID not configured yet.");
    }

    const accessToken = await this.getGoogleSheetsAccessToken();
    // Validate or create worksheets structure
    await this.ensureSheetsExist(accessToken);

    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${googleSheetsId}/values/Courses!A1:Z2000`;
    const res = await fetch(readUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to read 'Courses' tab from Google Sheet. Verify that data exists under the 'Courses' tab. Details: ${err}`);
    }

    const sheetData = await res.json();
    const rows = sheetData.values;
    if (!rows || rows.length < 2) {
      throw new Error("No courses found in Google Spreadsheet. Verify 'Courses' sheet has a header row and content.");
    }

    const headers = rows[0].map((h: string) => h.trim().toLowerCase());
    const importedCourses: Course[] = [];

    const getColIndex = (options: string[]): number => {
      return headers.findIndex((h: string) => options.some(opt => h.includes(opt)));
    };

    const idIdx = getColIndex(["id", "identification"]);
    const titleIdx = getColIndex(["title", "name"]);
    const titleKhIdx = getColIndex(["titlekh", "title kh", "khmer title"]);
    const descIdx = getColIndex(["desc", "summary", "description"]);
    const descKhIdx = getColIndex(["desckh", "desc kh", "khmer desc", "descriptionkh", "description kh"]);
    const priceIdx = getColIndex(["price", "dollar", "amount"]);
    const discountIdx = getColIndex(["discount", "off", "promo"]);
    const thumbIdx = getColIndex(["thumbnail", "thumb", "image", "photo"]);
    const catIdx = getColIndex(["category", "cat"]);
    const catKhIdx = getColIndex(["categorykh", "category kh", "khmer category"]);
    const durationIdx = getColIndex(["duration", "time", "hour"]);
    const instructorIdx = getColIndex(["instructor", "teacher", "author"]);

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const getVal = (idx: number, fallback: string = "") => {
        return idx !== -1 && idx < row.length ? row[idx].trim() : fallback;
      };

      const titleVal = getVal(titleIdx);
      if (!titleVal) continue; // skip blank course rows

      const idVal = getVal(idIdx, `c-import-${Date.now()}-${i}`);
      const priceVal = Number(getVal(priceIdx, "0").replace(/[^0-9.]/g, "")) || 0;
      const discountVal = Number(getVal(discountIdx, "0").replace(/[^0-9.]/g, "")) || 0;
      const ratingPreset = 4.5 + Math.random() * 0.5;

      const newCourse: Course = {
        id: idVal,
        title: titleVal,
        titleKh: getVal(titleKhIdx, titleVal),
        slug: titleVal.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
        description: getVal(descIdx, `Comprehensive online lessons on ${titleVal}`),
        descriptionKh: getVal(descKhIdx, `រៀនសរសេរកូដលម្អិតអំពី ${titleVal}`),
        price: priceVal,
        discount: discountVal,
        thumbnail: getVal(thumbIdx, "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"),
        category: getVal(catIdx, "Programming"),
        categoryKh: getVal(catKhIdx, "សរសេរកូដ"),
        duration: getVal(durationIdx, "12 hours"),
        instructor: getVal(instructorIdx, "Senior Sabai Leader"),
        instructorTitle: "Lead LMS Instructor",
        rating: Number(ratingPreset.toFixed(1)),
        reviewsCount: Math.floor(10 + Math.random() * 100),
        isPopular: i === 1,
        isFeatured: i <= 2
      };

      importedCourses.push(newCourse);
    }

    return importedCourses;
  }
}

export const dbService = new DBService();
