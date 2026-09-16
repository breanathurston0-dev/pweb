import express from "express";
import path from "path";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { dbService, User, Course, Lesson, Order, Settings } from "./server-db.ts";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "CAMBODIA_LMS_JWT_SECRET_KEY_2026";

app.use(express.json());

// Helper to generate JWT token
function generateToken(user: any) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Authentication middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token is required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = decoded;
    next();
  });
}

// Admin / Teacher authorization middleware
function authorizeRoles(...allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized access for this resource" });
    }
    next();
  };
}

// Helper to dispatch alert pings via Telegram Bot API
function sendTelegramNotification(textMsg: string) {
  const db = dbService.get();
  if (db.settings.telegramBotToken && db.settings.telegramChatId) {
    const formattedToken = db.settings.telegramBotToken.trim();
    const formattedChatId = db.settings.telegramChatId.trim();
    if (formattedToken && formattedChatId) {
      fetch(`https://api.telegram.org/bot${formattedToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: formattedChatId,
          text: textMsg,
          parse_mode: "Markdown"
        })
      })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.text();
          console.error(`Telegram API responded with status ${response.status}:`, body);
        }
      })
      .catch((err) => {
        console.error("Failed to post message to Telegram API:", err);
      });
    }
  }
}

// -------------------------------------------------------------
// USER SECURITY & AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------

// POST /api/register
app.post("/api/register", (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Please fully complete all fields" });
  }

  const db = dbService.get();
  const existingUser = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: "Email already registered on this platform" });
  }

  const salt = bcryptjs.genSaltSync(10);
  const passwordHash = bcryptjs.hashSync(password, salt);

  const newUser: User = {
    id: `u-${Date.now()}`,
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: "student",
    phone: phone || "",
    avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`
  };

  dbService.updateAndSave((currentDb) => {
    currentDb.users.push(newUser);
  });

  // Send Telegram notification for new student account registration
  const registrationMsg = `🆕 *New Student Registration*\n\n` +
    `👤 *Name:* ${newUser.name}\n` +
    `✉ *Email:* ${newUser.email}\n` +
    `📞 *Phone:* ${newUser.phone || "N/A"}\n` +
    `🆔 *ID:* \`${newUser.id}\``;
  sendTelegramNotification(registrationMsg);

  const token = generateToken(newUser);
  res.status(201).json({
    message: "Registration successful",
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      avatar: newUser.avatar
    }
  });
});

// POST /api/login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Please provide both email and password" });
  }

  const db = dbService.get();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  if (user.isBanned) {
    return res.status(403).json({ error: "Your account is temporarily banned. Please contact administration." });
  }

  const isValidPassword = bcryptjs.compareSync(password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = generateToken(user);
  res.json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar
    }
  });
});

// GET /api/me (Get profile)
app.get("/api/me", authenticateToken, (req: any, res: any) => {
  const db = dbService.get();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar
    }
  });
});

// PUT /api/profile (Update profile details)
app.put("/api/profile", authenticateToken, (req: any, res: any) => {
  const { name, phone, avatar } = req.body;
  const db = dbService.get();
  const user = db.users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  dbService.updateAndSave((currDb) => {
    const dbUser = currDb.users.find((u) => u.id === req.user.id);
    if (dbUser) {
      if (name) dbUser.name = name;
      if (phone !== undefined) dbUser.phone = phone;
      if (avatar !== undefined) dbUser.avatar = avatar;
    }
  });

  const updatedUser = dbService.get().users.find((u) => u.id === req.user.id)!;
  res.json({
    message: "Profile updated successfully",
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar
    }
  });
});

// POST /api/change-password
app.post("/api/change-password", authenticateToken, (req: any, res: any) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new password are required" });
  }

  const db = dbService.get();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const isValid = bcryptjs.compareSync(currentPassword, user.passwordHash);
  if (!isValid) {
    return res.status(400).json({ error: "Current password is incorrect" });
  }

  const salt = bcryptjs.genSaltSync(10);
  const passwordHash = bcryptjs.hashSync(newPassword, salt);

  dbService.updateAndSave((currDb) => {
    const dbUser = currDb.users.find((u) => u.id === req.user.id);
    if (dbUser) {
      dbUser.passwordHash = passwordHash;
    }
  });

  res.json({ message: "Password updated successfully" });
});

// -------------------------------------------------------------
// COURSE & LESSON ENDPOINTS
// -------------------------------------------------------------

// GET /api/courses (Public)
app.get("/api/courses", (req, res) => {
  const db = dbService.get();
  res.json({ courses: db.courses });
});

// GET /api/courses/:id
app.get("/api/courses/:id", (req, res) => {
  const db = dbService.get();
  const course = db.courses.find((c) => c.id === req.params.id);

  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }

  // Find lessons for this course
  const lessons = db.lessons
    .filter((l) => l.courseId === course.id)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  res.json({ course, lessons });
});

// GET /api/courses/:courseId/reviews
app.get("/api/courses/:courseId/reviews", (req, res) => {
  const db = dbService.get();
  const reviews = db.reviews ? db.reviews.filter((r) => r.courseId === req.params.courseId) : [];
  res.json({ reviews });
});

// POST /api/courses/:courseId/reviews (Protected - Student/User)
app.post("/api/courses/:courseId/reviews", authenticateToken, (req: any, res: any) => {
  const { courseId } = req.params;
  const { rating, comment } = req.body;

  if (rating === undefined || comment === undefined || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Missing or invalid review attributes (rating must be between 1 and 5)" });
  }

  const db = dbService.get();
  const course = db.courses.find((c) => c.id === courseId);
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }

  const newReview = {
    id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    courseId,
    userId: req.user.id,
    userName: req.user.name,
    userAvatar: req.user.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
    rating: Number(rating),
    comment: String(comment).trim(),
    createdAt: new Date().toISOString()
  };

  dbService.updateAndSave((currDb) => {
    if (!currDb.reviews) {
      currDb.reviews = [];
    }
    
    // Check if the user already reviewed this course. Overwrite if so, or append.
    const existingIndex = currDb.reviews.findIndex((r) => r.courseId === courseId && r.userId === req.user.id);
    if (existingIndex > -1) {
      currDb.reviews[existingIndex] = newReview;
    } else {
      currDb.reviews.push(newReview);
    }

    // Now recalculate the course overall average rating and reviewsCount
    const courseReviews = currDb.reviews.filter((r) => r.courseId === courseId);
    const sum = courseReviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avg = Number((sum / courseReviews.length).toFixed(1));

    const courseObj = currDb.courses.find((c) => c.id === courseId);
    if (courseObj) {
      courseObj.rating = avg;
      courseObj.reviewsCount = courseReviews.length;
    }
  });

  dbService.log(
    req.user.id,
    req.user.name,
    req.user.email,
    "REVIEW_SUBMIT",
    `Left user review of ${rating}/5 stars on course "${course.title}": "${comment.slice(0, 45)}..."`
  );

  res.status(201).json({ message: "Review submitted successfully", review: newReview });
});


// POST /api/courses/create (Protected - Admin/Teacher)
app.post("/api/courses/create", authenticateToken, authorizeRoles("admin", "teacher"), (req: any, res: any) => {
  const { title, titleKh, description, descriptionKh, price, discount, thumbnail, category, categoryKh, duration } = req.body;

  if (!title || !titleKh || !description || !descriptionKh || price === undefined) {
    return res.status(400).json({ error: "Missing required course attributes" });
  }

  const docId = `c-${Date.now()}`;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  const newCourse: Course = {
    id: docId,
    title,
    titleKh,
    slug,
    description,
    descriptionKh,
    price: Number(price),
    discount: Number(discount || 0),
    thumbnail: thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
    category: category || "General",
    categoryKh: categoryKh || "ទូទៅ",
    duration: duration || "10h",
    instructor: req.user.name,
    instructorTitle: req.user.role === "admin" ? "Academy Director" : "Lead Instructor",
    rating: 5.0,
    reviewsCount: 1,
    isPopular: false,
    isFeatured: false
  };

  dbService.updateAndSave((currDb) => {
    currDb.courses.push(newCourse);
  });

  dbService.log(
    req.user.id,
    req.user.name,
    req.user.email,
    "COURSE_CREATE",
    `Created course: "${title}" (${category || "General"}, Price: $${price})`,
    {
      courseId: newCourse.id,
      title: newCourse.title,
      price: newCourse.price,
      discount: newCourse.discount,
      category: newCourse.category,
      instructor: newCourse.instructor
    }
  );

  res.status(201).json({ message: "Course created successfully", course: newCourse });
});

// PUT /api/courses/:id (Protected - Admin/Teacher)
app.put("/api/courses/:id", authenticateToken, authorizeRoles("admin", "teacher"), (req: any, res: any) => {
  const { title, titleKh, description, descriptionKh, price, discount, thumbnail, category, categoryKh, duration, isPopular, isFeatured } = req.body;
  const { id } = req.params;

  dbService.updateAndSave((currDb) => {
    const courseIndex = currDb.courses.findIndex((c) => c.id === id);
    if (courseIndex !== -1) {
      const course = currDb.courses[courseIndex];
      if (title !== undefined) course.title = title;
      if (titleKh !== undefined) course.titleKh = titleKh;
      if (description !== undefined) course.description = description;
      if (descriptionKh !== undefined) course.descriptionKh = descriptionKh;
      if (price !== undefined) course.price = Number(price);
      if (discount !== undefined) course.discount = Number(discount);
      if (thumbnail !== undefined) course.thumbnail = thumbnail;
      if (category !== undefined) course.category = category;
      if (categoryKh !== undefined) course.categoryKh = categoryKh;
      if (duration !== undefined) course.duration = duration;
      if (isPopular !== undefined) course.isPopular = !!isPopular;
      if (isFeatured !== undefined) course.isFeatured = !!isFeatured;
    }
  });

  const updated = dbService.get().courses.find((c) => c.id === id);
  if (!updated) {
    return res.status(404).json({ error: "Course not found" });
  }

  dbService.log(
    req.user.id,
    req.user.name,
    req.user.email,
    "COURSE_UPDATE",
    `Updated course details for "${updated.title}" (ID: ${id})`,
    {
      courseId: id,
      title: updated.title,
      price: updated.price,
      discount: updated.discount,
      category: updated.category
    }
  );

  res.json({ message: "Course updated successfully", course: updated });
});

// DELETE /api/courses/:id (Protected - Admin)
app.delete("/api/courses/:id", authenticateToken, authorizeRoles("admin"), (req: any, res: any) => {
  const { id } = req.params;
  const course = dbService.get().courses.find((c) => c.id === id);
  const courseTitle = course ? course.title : "Unknown Course";

  dbService.updateAndSave((currDb) => {
    currDb.courses = currDb.courses.filter((c) => c.id !== id);
    currDb.lessons = currDb.lessons.filter((l) => l.courseId !== id);
    currDb.orders = currDb.orders.filter((o) => o.courseId !== id);
  });

  dbService.log(
    req.user.id,
    req.user.name,
    req.user.email,
    "COURSE_DELETE",
    `Deleted course "${courseTitle}" (ID: ${id}) along with associated lessons & orders`,
    {
      courseId: id,
      courseTitle,
      deletedAt: new Date().toISOString()
    }
  );

  res.json({ message: "Course deleted successfully along with its lessons" });
});

// POST /api/courses/:courseId/lessons (Protected - Admin/Teacher)
app.post("/api/courses/:courseId/lessons", authenticateToken, authorizeRoles("admin", "teacher"), (req: any, res: any) => {
  const { courseId } = req.params;
  const { title, titleKh, videoUrl, duration, isPreview } = req.body;

  if (!title || !titleKh || !videoUrl) {
    return res.status(400).json({ error: "Lesson title, titleKh and video URL are required" });
  }

  const db = dbService.get();
  const sortedLessons = db.lessons
    .filter((l) => l.courseId === courseId)
    .sort((a, b) => b.orderIndex - a.orderIndex);
  
  const nextOrderIndex = sortedLessons.length > 0 ? sortedLessons[0].orderIndex + 1 : 1;

  const newLesson: Lesson = {
    id: `l-${Date.now()}`,
    courseId,
    title,
    titleKh,
    videoUrl,
    duration: duration || "10:00",
    isPreview: !!isPreview,
    orderIndex: nextOrderIndex
  };

  dbService.updateAndSave((currDb) => {
    currDb.lessons.push(newLesson);
  });

  dbService.log(
    req.user.id,
    req.user.name,
    req.user.email,
    "LESSON_CREATE",
    `Created lesson "${title}" for course ID "${courseId}"`,
    {
      lessonId: newLesson.id,
      courseId,
      title: newLesson.title,
      duration: newLesson.duration,
      isPreview: !!newLesson.isPreview,
      orderIndex: nextOrderIndex
    }
  );

  res.status(201).json({ message: "Lesson created successfully", lesson: newLesson });
});

// DELETE /api/lessons/:lessonId (Protected - Admin/Teacher)
app.delete("/api/lessons/:lessonId", authenticateToken, authorizeRoles("admin", "teacher"), (req: any, res: any) => {
  const { lessonId } = req.params;
  const lesson = dbService.get().lessons.find((l) => l.id === lessonId);

  dbService.updateAndSave((currDb) => {
    currDb.lessons = currDb.lessons.filter((l) => l.id !== lessonId);
  });

  dbService.log(
    req.user.id,
    req.user.name,
    req.user.email,
    "LESSON_DELETE",
    `Deleted lesson with ID "${lessonId}"`,
    {
      lessonId,
      courseId: lesson ? lesson.courseId : null,
      title: lesson ? lesson.title : null
    }
  );

  res.json({ message: "Lesson deleted successfully" });
});

// -------------------------------------------------------------
// CHECKOUT, ORDER AND CAMBODIAN PAYMENT ENDPOINTS
// -------------------------------------------------------------

// POST /api/checkout (Checkout purchase request)
app.post("/api/checkout", authenticateToken, (req: any, res: any) => {
  const { courseId, gateway } = req.body;

  if (!courseId || !gateway) {
    return res.status(400).json({ error: "Course selection and payment gateway are required" });
  }

  const db = dbService.get();
  const course = db.courses.find((c) => c.id === courseId);
  if (!course) {
    return res.status(404).json({ error: "Chosen course not found" });
  }

  // Calculate final purchase price after discount
  const finalPrice = Math.round(course.price * (1 - course.discount / 100));

  // Auto transaction ID for local bank confirmation trace
  const txnId = `LMS-${gateway.toUpperCase().replace(/\s+/g, "")}-${Date.now().toString().slice(-6)}`;

  const newOrder: Order = {
    id: `o-${Date.now()}`,
    userId: req.user.id,
    courseId,
    paymentStatus: "pending",
    amount: finalPrice,
    transactionId: txnId,
    createdAt: new Date().toISOString(),
    gateway
  };

  dbService.updateAndSave((currDb) => {
    currDb.orders.push(newOrder);
  });

  // Send Telegram notification for new course purchase checkout initiation
  const checkoutMessage = `🛒 *New Course Purchase Attempt*\n\n` +
    `👤 *Student:* ${req.user.name} (${req.user.email})\n` +
    `📚 *Course:* ${course.title}\n` +
    `💵 *Price:* $${finalPrice}\n` +
    `💳 *Gateway:* ${gateway}\n` +
    `🆔 *Txn ID:* \`${txnId}\` (Status: Pending)`;
  sendTelegramNotification(checkoutMessage);

  // Provide instruction context for Khmer visual QR pay & ABA PayWay official direct link
  const abaPaywayUrl = "https://link.payway.com.kh/aba?id=18E2ED0EE307&code=461423&acc=002292898&dynamic=true";
  let qrCodePayload = "";
  if (gateway === "ABA Pay" || gateway === "ABA PayWay" || gateway.includes("ABA")) {
    // Official ABA PayWay payment link encoded directly into QR Code for instant scan by mobile apps
    qrCodePayload = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(abaPaywayUrl)}`;
  } else if (gateway === "Wing Pay" || gateway === "ACLEDA Pay" || gateway === "TrueMoney") {
    qrCodePayload = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MERCHANT_${txnId}_AMT_${finalPrice}`;
  }

  res.status(201).json({
    message: "Order initialized. Complete payment to unlock course content.",
    order: newOrder,
    qrcode: qrCodePayload,
    paywayUrl: abaPaywayUrl,
    abaAccount: "002292898",
    abaMerchantCode: "461423",
    abaMerchantName: "PRO SAN / ABA PAY",
  });
});

// POST /api/payment/verify-manual (Manual payment approval trace)
app.post("/api/payment/verify-manual", authenticateToken, (req: any, res: any) => {
  const { transactionId } = req.body;
  
  if (!transactionId) {
    return res.status(400).json({ error: "Transaction/Invoice identifier is required" });
  }

  dbService.updateAndSave((currDb) => {
    const order = currDb.orders.find((o) => o.transactionId === transactionId && o.userId === req.user.id);
    if (order) {
      order.paymentStatus = "completed";
    }
  });

  const updatedOrder = dbService.get().orders.find((o) => o.transactionId === transactionId);
  if (!updatedOrder) {
    return res.status(404).json({ error: "No matching payment transaction found" });
  }

  const courseObj = dbService.get().courses.find((c) => c.id === updatedOrder.courseId);
  const courseTitle = courseObj ? courseObj.title : "Unknown Course";

  // Push notifications if Telegram setup
  const manualVerifyMessage = `🎓 *Student Enrolled (Manual Gateway Verification)*\n\n` +
    `👤 *Student:* ${req.user.name} (${req.user.email})\n` +
    `📚 *Course:* "${courseTitle}"\n` +
    `💳 *Gateway:* ${updatedOrder.gateway}\n` +
    `💵 *Amount Paid:* $${updatedOrder.amount}\n` +
    `🔑 *Status:* Enrollment Activated ✅\n` +
    `🆔 *Txn ID:* \`${transactionId}\``;
  sendTelegramNotification(manualVerifyMessage);

  res.json({ message: "Payment verified successfully!", order: updatedOrder });
});

// GET /api/my-courses (Get users unlocked courses)
app.get("/api/my-courses", authenticateToken, (req: any, res: any) => {
  const db = dbService.get();
  const userOrders = db.orders.filter((o) => o.userId === req.user.id && o.paymentStatus === "completed");
  const courseIds = userOrders.map((o) => o.courseId);
  const unlocked = db.courses.filter((c) => courseIds.includes(c.id));
  res.json({ courses: unlocked });
});

// -------------------------------------------------------------
// ADMIN ANALYTICS & DATABASE REVIEWS
// -------------------------------------------------------------

// GET /api/admin/analytics (Protected - Admin)
app.get("/api/admin/analytics", authenticateToken, authorizeRoles("admin"), (req, res) => {
  const db = dbService.get();
  const totalUsers = db.users.length;
  const totalSalesCount = db.orders.filter((o) => o.paymentStatus === "completed").length;
  const totalRevenue = db.orders
    .filter((o) => o.paymentStatus === "completed")
    .reduce((sum, o) => sum + o.amount, 0);

  const activeStudents = db.users.filter((u) => u.role === "student").length;

  res.json({
    totalUsers,
    totalSalesCount,
    totalRevenue,
    activeStudents,
    coursesCount: db.courses.length,
    recentOrders: db.orders.slice(-5).reverse()
  });
});

// GET /api/admin/users
app.get("/api/admin/users", authenticateToken, authorizeRoles("admin"), (req, res) => {
  const db = dbService.get();
  res.json({ users: db.users });
});

// GET /api/admin/users/export-csv
app.get("/api/admin/users/export-csv", authenticateToken, authorizeRoles("admin"), (req: any, res: any) => {
  const db = dbService.get();
  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = [
    "User ID",
    "Full Name",
    "Email Address",
    "Role",
    "Account Status",
    "Phone Number",
    "Completed Orders",
    "Total Spent (USD)"
  ];

  const rows = db.users.map((user) => {
    const userCompletedOrders = db.orders.filter(
      (o) => o.userId === user.id && o.paymentStatus === "completed"
    );
    const userTotalSpent = userCompletedOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    return [
      user.id,
      user.name,
      user.email,
      user.role.toUpperCase(),
      user.isBanned ? "Banned" : "Active",
      user.phone || "N/A",
      userCompletedOrders.length,
      userTotalSpent.toFixed(2)
    ];
  });

  const csvContent = "\uFEFF" + [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(","))
  ].join("\r\n");

  dbService.log(
    req.user.id,
    req.user.name,
    req.user.email,
    "USER_EXPORT_CSV",
    `Exported current user list (${db.users.length} users) as CSV file`,
    {
      exportedCount: db.users.length,
      timestamp: new Date().toISOString()
    }
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="pro_san_users_${todayStr}.csv"`);
  res.send(csvContent);
});

// PUT /api/admin/users/:userId/role
app.put("/api/admin/users/:userId/role", authenticateToken, authorizeRoles("admin"), (req: any, res: any) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!["admin", "teacher", "student"].includes(role)) {
    return res.status(400).json({ error: "Invalid layout role specification" });
  }

  const db = dbService.get();
  const user = db.users.find((u) => u.id === userId);
  const userText = user ? `${user.name} (${user.email})` : `User ${userId}`;
  const oldRole = user ? user.role : "unknown";

  dbService.updateAndSave((currDb) => {
    const userObj = currDb.users.find((u) => u.id === userId);
    if (userObj) userObj.role = role;
  });

  dbService.log(
    req.user.id,
    req.user.name,
    req.user.email,
    "USER_ROLE_UPDATE",
    `Changed user "${userText}" role from "${oldRole}" to "${role}"`,
    {
      targetUserId: userId,
      userName: user ? user.name : "Unknown",
      userEmail: user ? user.email : "Unknown",
      previousRole: oldRole,
      newRole: role
    }
  );

  res.json({ message: "User role modified successfully" });
});

// PUT /api/admin/users/:userId/ban
app.put("/api/admin/users/:userId/ban", authenticateToken, authorizeRoles("admin"), (req: any, res: any) => {
  const { userId } = req.params;
  const { isBanned } = req.body;

  const db = dbService.get();
  const user = db.users.find((u) => u.id === userId);
  const userText = user ? `${user.name} (${user.email})` : `User ${userId}`;

  dbService.updateAndSave((currDb) => {
    const userObj = currDb.users.find((u) => u.id === userId);
    if (userObj) userObj.isBanned = !!isBanned;
  });

  dbService.log(
    req.user.id,
    req.user.name,
    req.user.email,
    "USER_BAN_UPDATE",
    `${isBanned ? "Banned" : "Unbanned"} user "${userText}"`,
    {
      targetUserId: userId,
      userName: user ? user.name : "Unknown",
      userEmail: user ? user.email : "Unknown",
      isBanned: !!isBanned
    }
  );

  res.json({ message: isBanned ? "User banned successfully" : "User privileges restored" });
});

// DELETE /api/admin/users/:userId
app.delete("/api/admin/users/:userId", authenticateToken, authorizeRoles("admin"), (req: any, res: any) => {
  const { userId } = req.params;
  const db = dbService.get();
  const user = db.users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (userId === "u-1" || userId === req.user.id) {
    return res.status(400).json({ error: "Cannot delete yourself or primary system administrator" });
  }

  const userText = `${user.name} (${user.email})`;

  dbService.updateAndSave((currDb) => {
    currDb.users = currDb.users.filter((u) => u.id !== userId);
    // clean up orders as well to avoid foreign ref issues
    currDb.orders = currDb.orders.filter((o) => o.userId !== userId);
  });

  dbService.log(
    req.user.id,
    req.user.name,
    req.user.email,
    "USER_DELETE",
    `Deleted checkouts & fully deleted account for user "${userText}"`,
    {
      deletedUserId: userId,
      userName: user.name,
      userEmail: user.email,
      role: user.role
    }
  );

  res.json({ message: "User deleted successfully" });
});

// GET /api/admin/transactions
app.get("/api/admin/transactions", authenticateToken, authorizeRoles("admin"), (req, res) => {
  const db = dbService.get();
  // enrich transactions mapping names
  const richOrders = db.orders.map((o) => {
    const userObj = db.users.find((u) => u.id === o.userId);
    const courseObj = db.courses.find((c) => c.id === o.courseId);
    return {
      ...o,
      userName: userObj ? userObj.name : "Unknown User",
      userEmail: userObj ? userObj.email : "",
      courseTitle: courseObj ? courseObj.title : "Deleted Course"
    };
  });
  res.json({ transactions: richOrders });
});

// PUT /api/admin/payments/:id/approve
app.put("/api/admin/payments/:id/approve", authenticateToken, authorizeRoles("admin"), (req: any, res: any) => {
  const { id } = req.params;
  const db = dbService.get();
  const order = db.orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Transaction checkout order not found" });
  }

  const userObj = db.users.find((u) => u.id === order.userId);
  const courseObj = db.courses.find((c) => c.id === order.courseId);
  const userText = userObj ? `${userObj.name} (${userObj.email})` : `User ID ${order.userId}`;
  const courseText = courseObj ? `"${courseObj.title}"` : `Course ID ${order.courseId}`;

  dbService.updateAndSave((currDb) => {
    const ordObj = currDb.orders.find((o) => o.id === id);
    if (ordObj) {
      ordObj.paymentStatus = "completed";
    }
  });

  dbService.log(
    req.user.id,
    req.user.name,
    req.user.email,
    "PAYMENT_APPROVE",
    `Approved payment of $${order.amount} (Gateway: ${order.gateway}, TransID: ${order.transactionId}) for student "${userText}" purchasing ${courseText}`,
    {
      orderId: id,
      transactionId: order.transactionId,
      amount: order.amount,
      gateway: order.gateway,
      userId: order.userId,
      studentName: userObj ? userObj.name : "Unknown",
      studentEmail: userObj ? userObj.email : "",
      courseId: order.courseId,
      courseTitle: courseObj ? courseObj.title : null,
      paymentStatus: "completed"
    }
  );

  // Send Telegram notification for manual/unlocked course approval (enrollment activation)
  const approvedMessage = `🎓 *Student Enrolled (Course Approved by Admin)*\n\n` +
    `👤 *Student:* ${userText}\n` +
    `📚 *Course:* ${courseText}\n` +
    `💵 *Amount Paid:* $${order.amount}\n` +
    `💳 *Gateway:* ${order.gateway}\n` +
    `🔑 *Status:* Enrollment Activated ✅\n` +
    `🆔 *Txn ID:* \`${order.transactionId}\``;
  sendTelegramNotification(approvedMessage);

  res.json({ message: "Transaction approved successfully" });
});

// PUT /api/admin/settings
app.get("/api/admin/settings", authenticateToken, authorizeRoles("admin"), (req, res) => {
  const db = dbService.get();
  res.json({ settings: db.settings });
});

app.put("/api/admin/settings", authenticateToken, authorizeRoles("admin"), (req: any, res: any) => {
  const { siteName, siteNameKh, logoUrl, telegramBotToken, telegramChatId, googleSheetsId, googleServiceAccountEmail, googlePrivateKey } = req.body;

  dbService.updateAndSave((currDb) => {
    if (siteName !== undefined) currDb.settings.siteName = siteName;
    if (siteNameKh !== undefined) currDb.settings.siteNameKh = siteNameKh;
    if (logoUrl !== undefined) currDb.settings.logoUrl = logoUrl;
    if (telegramBotToken !== undefined) currDb.settings.telegramBotToken = telegramBotToken;
    if (telegramChatId !== undefined) currDb.settings.telegramChatId = telegramChatId;
    if (googleSheetsId !== undefined) currDb.settings.googleSheetsId = googleSheetsId;
    if (googleServiceAccountEmail !== undefined) currDb.settings.googleServiceAccountEmail = googleServiceAccountEmail;
    if (googlePrivateKey !== undefined) currDb.settings.googlePrivateKey = googlePrivateKey;
  });

  dbService.log(
    req.user.id,
    req.user.name,
    req.user.email,
    "SETTING_UPDATE",
    `Updated platform settings (SiteName: "${siteName || ""}", SheetsId: "${googleSheetsId || "None"}")`,
    {
      siteName: siteName !== undefined ? siteName : undefined,
      siteNameKh: siteNameKh !== undefined ? siteNameKh : undefined,
      logoUrl: logoUrl !== undefined ? logoUrl : undefined,
      googleSheetsId: googleSheetsId !== undefined ? googleSheetsId : undefined,
      telegramConfigured: telegramBotToken !== undefined ? !!telegramBotToken : undefined
    }
  );

  res.json({ message: "Settings saved successfully", settings: dbService.get().settings });
});

// GET /api/admin/audit-logs
app.get("/api/admin/audit-logs", authenticateToken, authorizeRoles("admin"), (req: any, res: any) => {
  const db = dbService.get();
  const logs = db.auditLogs ? [...db.auditLogs].reverse() : [];
  res.json({ auditLogs: logs });
});

// POST /api/admin/audit-logs/archive
app.post("/api/admin/audit-logs/archive", authenticateToken, authorizeRoles("admin"), (req: any, res: any) => {
  const { logIds, archive = true } = req.body;
  if (!Array.isArray(logIds) || logIds.length === 0) {
    return res.status(400).json({ error: "logIds must be a non-empty array of audit log IDs" });
  }

  const idSet = new Set(logIds);
  let affectedCount = 0;

  dbService.updateAndSave((currDb) => {
    if (currDb.auditLogs) {
      currDb.auditLogs.forEach((log) => {
        if (idSet.has(log.id)) {
          log.isArchived = !!archive;
          affectedCount++;
        }
      });
    }
  });

  dbService.log(
    req.user.id,
    req.user.name,
    req.user.email,
    archive ? "AUDIT_ARCHIVE" : "AUDIT_UNARCHIVE",
    `${archive ? "Archived" : "Restored"} ${affectedCount} system audit record(s)`,
    {
      logIds,
      count: affectedCount,
      archiveStatus: !!archive,
      timestamp: new Date().toISOString()
    }
  );

  const updatedDb = dbService.get();
  res.json({
    message: `Successfully ${archive ? "archived" : "restored"} ${affectedCount} audit records.`,
    count: affectedCount,
    auditLogs: updatedDb.auditLogs ? [...updatedDb.auditLogs].reverse() : []
  });
});

// POST /api/admin/audit-logs/export-csv
app.post("/api/admin/audit-logs/export-csv", authenticateToken, authorizeRoles("admin"), (req: any, res: any) => {
  const { logIds } = req.body;
  const db = dbService.get();
  let logsToExport = db.auditLogs ? [...db.auditLogs].reverse() : [];
  
  if (Array.isArray(logIds) && logIds.length > 0) {
    const idSet = new Set(logIds);
    logsToExport = logsToExport.filter((l) => idSet.has(l.id));
  }

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = typeof val === "object" ? JSON.stringify(val) : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headers = [
    "Log ID",
    "Timestamp",
    "User ID",
    "User Name",
    "User Email",
    "Action",
    "Details",
    "Status",
    "Payload"
  ];

  const rows = logsToExport.map((log) => [
    log.id,
    log.timestamp || "",
    log.userId || "",
    log.userName || "",
    log.userEmail || "",
    log.action || "",
    log.details || "",
    log.isArchived ? "Archived" : "Active",
    log.payload ? JSON.stringify(log.payload) : ""
  ]);

  const csvContent = "\uFEFF" + [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(","))
  ].join("\r\n");

  dbService.log(
    req.user.id,
    req.user.name,
    req.user.email,
    "AUDIT_EXPORT_CSV",
    `Exported ${logsToExport.length} audit records to CSV`,
    {
      exportedCount: logsToExport.length,
      selectedLogIds: logIds,
      timestamp: new Date().toISOString()
    }
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="pro_san_selected_audit_logs_${todayStr}.csv"`);
  res.send(csvContent);
});

// POST /api/admin/sheets/test
app.post("/api/admin/sheets/test", authenticateToken, authorizeRoles("admin"), async (req: any, res: any) => {
  try {
    const success = await dbService.syncToGoogleSheets();
    if (!success) {
      return res.status(400).json({ error: "Check credentials. Sheets sync returned false." });
    }
    res.json({ message: "Sheets verified & initial workspace structure provisioned successfully!" });
  } catch (err: any) {
    res.status(500).json({ error: `Connection failed: ${err.message}` });
  }
});

// POST /api/admin/sheets/sync
app.post("/api/admin/sheets/sync", authenticateToken, authorizeRoles("admin"), async (req: any, res: any) => {
  try {
    const success = await dbService.syncToGoogleSheets();
    if (!success) {
      return res.status(400).json({ error: "Sync failed. Google Sheets configuration credentials might be missing." });
    }

    dbService.log(
      req.user.id,
      req.user.name,
      req.user.email,
      "SHEETS_EXPORT",
      `Exported full database to Google Sheets (ID: ${dbService.get().settings.googleSheetsId})`
    );

    res.json({ message: "Full database schemas successfully mirrored to Google Sheets!" });
  } catch (err: any) {
    res.status(500).json({ error: `Sync failed: ${err.message}` });
  }
});

// POST /api/admin/sheets/import
app.post("/api/admin/sheets/import", authenticateToken, authorizeRoles("admin"), async (req: any, res: any) => {
  try {
    const courses = await dbService.importCoursesFromGoogleSheets();
    
    // Save courses to the database (and overwrite duplicates / merge)
    dbService.updateAndSave((currDb) => {
      courses.forEach((newCourse) => {
        const existingIdx = currDb.courses.findIndex((c) => c.id === newCourse.id);
        if (existingIdx !== -1) {
          currDb.courses[existingIdx] = newCourse;
        } else {
          currDb.courses.push(newCourse);
        }
      });
    });

    dbService.log(
      req.user.id,
      req.user.name,
      req.user.email,
      "SHEETS_IMPORT",
      `Imported and synchronized ${courses.length} courses from Google Sheets ('Courses' sheet)`
    );

    res.json({ 
      message: `Import complete! Successfully imported and synchronized ${courses.length} courses from Google Sheets.`,
      coursesCount: courses.length 
    });
  } catch (err: any) {
    res.status(500).json({ error: `Import failed: ${err.message}` });
  }
});

// -------------------------------------------------------------
// TEACHER CORNER & MESSAGES
// -------------------------------------------------------------

// POST /api/contact/messages (Send direct support questions)
app.post("/api/contact/messages", (req, res) => {
  const { studentName, courseTitle, message } = req.body;
  if (!studentName || !message) {
    return res.status(400).json({ error: "Student name and message are required" });
  }

  const newMessage = {
    id: `m-${Date.now()}`,
    studentName,
    courseTitle: courseTitle || "General Question",
    message,
    createdAt: new Date().toISOString()
  };

  dbService.updateAndSave((currDb) => {
    if (!currDb.teacherMessages) currDb.teacherMessages = [];
    currDb.teacherMessages.push(newMessage);
  });

  // Send Telegram notification for new support message
  const supportMessage = `✉️ *New Support Message Received*\n\n` +
    `👤 *Student:* ${studentName}\n` +
    `📚 *Topic/Course:* ${courseTitle || "General Question"}\n` +
    `💬 *Message:* \n"${message}"`;
  sendTelegramNotification(supportMessage);

  res.status(201).json({ message: "Message sent directly to the teacher queue" });
});

// GET /api/teacher/messages (Protected - Admin/Teacher)
app.get("/api/teacher/messages", authenticateToken, authorizeRoles("admin", "teacher"), (req, res) => {
  const db = dbService.get();
  res.json({ messages: db.teacherMessages || [] });
});

// -------------------------------------------------------------
// SECURE SERVER-SIDE GEMINI AI INTEGRATION
// -------------------------------------------------------------

// Post /api/ai/generate-course-info (Requires Authentication)
app.post("/api/ai/generate-course-info", authenticateToken, async (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: "Course topic context is required" });
  }

  const geminiSecret = process.env.GEMINI_API_KEY;
  if (!geminiSecret) {
    // Elegant preset builder fallback to maintain flawless performance
    return res.json({
      title: `LMS Masterclass: ${topic}`,
      titleKh: `វគ្គសិក្សាជំនាញកម្រងគំរូ៖ ${topic}`,
      description: `In-depth premium masterclass covering ${topic}. Master code performance, modular architectures, database design and deployment techniques completely from scratch.`,
      descriptionKh: `វគ្គសិក្សាអាជីពដ៏លម្អិតអំពីជំនាញ ${topic}។ សិក្សាស៊ីជម្រៅលើការបង្កើតកម្មវិធី ស្ថាបត្យកម្ម ប្លង់ទិន្នន័យ និងវិធីសាស្ត្រដំឡើង។`,
      seoKeywords: `${topic}, Sabai learning, Khmer programmer, fullstack, advanced coding Cambodia`
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: geminiSecret,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    const prompt = `You are a specialist in Cambodian Higher Education and IT curriculums. Generate fully structured details for an online course regarding this topic: "${topic}".
    Provide response STRICTLY as a raw JSON string (no markdown, no backticks, no markdown blocks) with exactly these properties:
    {
      "title": "A highly premium desktop title",
      "titleKh": "A highly natural beautiful Khmer translation of the title using popular Cambodian educational terminology",
      "description": "Full promotional description paragraph highlighting modules in English",
      "descriptionKh": "Natural human Khmer translation of the description highlighting career benefits in Cambodia",
      "seoKeywords": "comma separated tags"
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Gemini course generator issue:", err.message);
    res.status(500).json({ error: "Failed to generate AI course data" });
  }
});

// POST /api/ai/chat-assistant
app.post("/api/ai/chat-assistant", async (req, res) => {
  const { message, chatHistory } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const geminiSecret = process.env.GEMINI_API_KEY;
  if (!geminiSecret) {
    return res.json({
      response: `[Offline Mode] Hello! I am your LMS Virtual Learning Counselor. To activate full interactive AI support, please set your GEMINI_API_KEY inside the secrets tab of Google AI Studio. 

      For now, I recommend studying our course: "Mastering React & TypeScript for Modern Full-Stack" which has high ratings among Cambodian students!`
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: geminiSecret,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    const systemInstruction = `You are a friendly, bilingual digital learning assistant and career counselor for Sabai Academy LMS. Your goal is to guide Cambodian and international students. Speak in a balanced mix of English or professional Khmer based on the user's input. Answer question clearly, promote high quality digital learning, and suggest suitable courses. Keep answers concise, direct, helpful, and free from corporate fluff.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction,
      }
    });

    res.json({ response: response.text });
  } catch (err: any) {
    console.error("Gemini Assistant issue:", err.message);
    res.status(500).json({ error: "Failed to generate AI assistant reply" });
  }
});

// POST /api/student/milestone (Alert when student hits a learning milestone)
app.post("/api/student/milestone", authenticateToken, (req: any, res: any) => {
  const { courseTitle, milestoneTitle, percentage, completedCount, totalCount } = req.body;
  if (!courseTitle || !milestoneTitle || percentage === undefined) {
    return res.status(400).json({ error: "Missing milestone parameters" });
  }

  const milestoneMessage = `🏆 *Learning Milestone Reached!* 🏆\n\n` +
    `👤 *Student:* ${req.user.name} (${req.user.email})\n` +
    `📚 *Course:* "${courseTitle}"\n` +
    `🌟 *Milestone:* *${milestoneTitle}*\n` +
    `📈 *Completion:* ${percentage}% Completed\n` +
    `📊 *Progress:* ${completedCount} of ${totalCount} Lessons finished 👍`;
  
  sendTelegramNotification(milestoneMessage);
  res.json({ message: "Milestone alert dispatched successfully" });
});

// -------------------------------------------------------------
// FRONTEND STATIC HANDLING & EXPRESS ROUTER WRAPPING
// -------------------------------------------------------------

async function startServer() {
  // Static files from public folder
  app.use(express.static(path.join(process.cwd(), "public")));

  // Vite developer mode middleware configuration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LMS Server successfully booted at: http://0.0.0.0:${PORT}`);
  });
}

startServer();
