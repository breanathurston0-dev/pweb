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
      title: "BUILD SOFTWARE WITH AI",
      titleKh: "បង្កើតសូហ្វវែរជាមួយ AI (BUILD SOFTWARE WITH AI)",
      slug: "build-software-with-ai",
      description: "Learning to Build Software with AI — Better tools. Faster development. A smarter future. Master AI-assisted coding with ChatGPT, GitHub Copilot, VS Code, full-stack web applications, automated debugging, and rapid cloud deployment with Vercel & Render.",
      descriptionKh: "រៀនបង្កើតសូហ្វវែរជាមួយ AI — ឧបករណ៍ទំនើបជាងមុន អភិវឌ្ឍន៍រហ័សជាងមុន អនាគតឆ្លាតវៃជាងមុន។ ចេះប្រើប្រាស់ ChatGPT, GitHub Copilot, VS Code បង្កើត Full-stack Apps, APIs និង Deploy លើ Cloud (Vercel/Render)។",
      price: 59,
      discount: 10,
      thumbnail: "/build_software_ai.jpg",
      category: "AI Development",
      categoryKh: "បច្ចេកវិទ្យា AI & កូដ",
      duration: "16h 30m",
      instructor: "Pro San (Sopheap Mok)",
      instructorTitle: "Senior AI & Web Architect",
      rating: 4.9,
      reviewsCount: 142,
      isPopular: true,
      isFeatured: true
    },
    {
      id: "c-2",
      title: "SCAN ACCOUNT PRIME",
      titleKh: "ស្កេនគណនី PRIME (SCAN ACCOUNT PRIME)",
      slug: "scan-account-prime",
      description: "Comprehensive techniques for Prime account scanning, security diagnostics, authorization verification, multi-platform account health audits, and forensic protection.",
      descriptionKh: "បច្ចេកទេសស្កេន និងត្រួតពិនិត្យសុវត្ថិភាពគណនី PRIME ការផ្ទៀងផ្ទាត់ Authorization កម្រិតខ្ពស់ ការពិនិត្យសុខភាពគណនី និងវិធានការការពារសុវត្ថិភាព។",
      price: 69,
      discount: 15,
      thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800",
      category: "Account Security",
      categoryKh: "សុវត្ថិភាពគណនី",
      duration: "15h 45m",
      instructor: "Pro San (Sopheap Mok)",
      instructorTitle: "Security & Systems Specialist",
      rating: 4.9,
      reviewsCount: 98,
      isPopular: true,
      isFeatured: true
    },
    {
      id: "c-3",
      title: "MMO",
      titleKh: "រកប្រាក់តាមអនឡាញ MMO (Make Money Online)",
      slug: "mmo-make-money-online",
      description: "Master high-income MMO strategies: digital affiliate networks, content marketing, automated monetization pipelines, e-commerce stores, and sustainable online income.",
      descriptionKh: "យុទ្ធសាស្ត្ររកប្រាក់តាមអនឡាញ (MMO) ជាក់ស្តែង៖ Affiliate Marketing ការកសាង Funnel លក់ទំនិញឌីជីថល ការផលិតមាតិកាទាក់ទាញអតិថិជន និងការបង្កើតចំណូលអកម្ម។",
      price: 49,
      discount: 10,
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
      category: "Online Business",
      categoryKh: "រកប្រាក់តាមអនឡាញ",
      duration: "18h 15m",
      instructor: "Pro San (Sopheap Mok)",
      instructorTitle: "Digital Business & Growth Strategist",
      rating: 4.8,
      reviewsCount: 116,
      isPopular: false,
      isFeatured: true
    }
  ],
  lessons: [
    // Lessons for BUILD SOFTWARE WITH AI (c-1) - 4 modules matching roadmap
    {
      id: "l-1",
      courseId: "c-1",
      title: "Step 1: Learn the Basics — Python, JavaScript & Modern Dev Environment",
      titleKh: "មេរៀនទី១ (Step 1)៖ រៀនមូលដ្ឋានគ្រឹះកូដ Python & JS និងការរៀបចំ Dev Environment",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      duration: "18:40",
      isPreview: true,
      orderIndex: 1
    },
    {
      id: "l-2",
      courseId: "c-1",
      title: "Step 2: Use AI Assistants — Master ChatGPT & GitHub Copilot for Coding",
      titleKh: "មេរៀនទី២ (Step 2)៖ ជំនួយការ AI — ប្រើ ChatGPT & GitHub Copilot សរសេរកូដ",
      videoUrl: "https://www.w3schools.com/html/movie.mp4",
      duration: "28:15",
      isPreview: false,
      orderIndex: 2
    },
    {
      id: "l-3",
      courseId: "c-1",
      title: "Step 3: Build Your Project — Full-Stack Web Apps, APIs & AI Integration",
      titleKh: "មេរៀនទី៣ (Step 3)៖ បង្កើតគម្រោងផ្ទាល់ខ្លួន — Full-Stack Web Apps, APIs & AI",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      duration: "35:50",
      isPreview: false,
      orderIndex: 3
    },
    {
      id: "l-4",
      courseId: "c-1",
      title: "Step 4: Deploy & Grow — Automated Testing, Vercel/Render Cloud & Scaling",
      titleKh: "មេរៀនទី៤ (Step 4)៖ ដាក់ដំណើរការលើ Cloud (Vercel/Render) និងការពង្រីកគម្រោង",
      videoUrl: "https://www.w3schools.com/html/movie.mp4",
      duration: "24:30",
      isPreview: false,
      orderIndex: 4
    },
    // Lessons for SCAN ACCOUNT PRIME (c-2) - 4 lessons
    {
      id: "l-5",
      courseId: "c-2",
      title: "Prime Account Fundamentals & Automated Scanning Concepts",
      titleKh: "មេរៀនទី១៖ មូលដ្ឋានគ្រឹះនៃគណនី Prime និងគោលការណ៍ស្កេនស្វ័យប្រវត្តិ",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      duration: "16:30",
      isPreview: true,
      orderIndex: 1
    },
    {
      id: "l-6",
      courseId: "c-2",
      title: "Authentication Protocols, Session Tokens & Multi-Factor Auditing",
      titleKh: "មេរៀនទី២៖ ពិធីការផ្ទៀងផ្ទាត់ Session Tokens និងការធ្វើសវនកម្ម 2FA",
      videoUrl: "https://www.w3schools.com/html/movie.mp4",
      duration: "26:15",
      isPreview: false,
      orderIndex: 2
    },
    {
      id: "l-7",
      courseId: "c-2",
      title: "Deep Account Diagnostics, Anomaly Detection & Live Health Scans",
      titleKh: "មេរៀនទី៣៖ ការស្កេនរោគវិនិច្ឆ័យស៊ីជម្រៅ និងការចាប់កំហុសមិនប្រក្រតីនៃគណនី Prime",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      duration: "29:40",
      isPreview: false,
      orderIndex: 3
    },
    {
      id: "l-8",
      courseId: "c-2",
      title: "Security Remediation, Account Recovery & Anti-Fraud Shielding",
      titleKh: "មេរៀនទី៤៖ ដំណោះស្រាយសុវត្ថិភាព ការសង្គ្រោះគណនី និងការការពារប្រឆាំងការក្លែងបន្លំ",
      videoUrl: "https://www.w3schools.com/html/movie.mp4",
      duration: "22:50",
      isPreview: false,
      orderIndex: 4
    },
    // Lessons for MMO (c-3) - 4 lessons
    {
      id: "l-9",
      courseId: "c-3",
      title: "MMO Landscape Overview & Sustainable Revenue Models",
      titleKh: "មេរៀនទី១៖ ទិដ្ឋភាពទូទៅនៃពិភព MMO និងគំរូចំណូលឌីជីថលប្រកបដោយនិរន្តរភាព",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      duration: "15:40",
      isPreview: true,
      orderIndex: 1
    },
    {
      id: "l-10",
      courseId: "c-3",
      title: "Affiliate Marketing Mastery & High-Converting Funnel Setup",
      titleKh: "មេរៀនទី២៖ ជំនាញ Affiliate Marketing និងការរៀបចំ Sales Funnel កម្រិតខ្ពស់",
      videoUrl: "https://www.w3schools.com/html/movie.mp4",
      duration: "28:10",
      isPreview: false,
      orderIndex: 2
    },
    {
      id: "l-11",
      courseId: "c-3",
      title: "Content Creation, Traffic Generation & Viral Social Reach",
      titleKh: "មេរៀនទី៣៖ ការផលិតមាតិកា ការទាញយក Traffic និងការបង្កើន Reach លើបណ្តាញសង្គម",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      duration: "30:25",
      isPreview: false,
      orderIndex: 3
    },
    {
      id: "l-12",
      courseId: "c-3",
      title: "Scaling Online Income, Gateway Integration & Automation Systems",
      titleKh: "មេរៀនទី៤៖ ការពង្រីកប្រាក់ចំណូល ការភ្ជាប់ Payment Gateway និងប្រព័ន្ធស្វ័យប្រវត្តិកម្ម",
      videoUrl: "https://www.w3schools.com/html/movie.mp4",
      duration: "24:50",
      isPreview: false,
      orderIndex: 4
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
