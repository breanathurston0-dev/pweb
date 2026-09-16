/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  BookOpen, Award, Users, TrendingUp, Sparkles, Globe, LogOut, LogIn, UserPlus, 
  ArrowRight, Search, Video, Clock, Star, CheckCircle, DollarSign, Menu, X, 
  Shield, Heart, CreditCard, Lock, Settings, Activity, FileText, Check, Trash2, 
  Plus, ChevronDown, ChevronRight, ChevronUp, Copy, Code, Eye, Tv, Send, MessageSquare, MapPin, Phone, Mail, Book, RefreshCw, AlertCircle,
  Sun, Moon, ShieldAlert, Info, Download, Archive, CheckSquare, FileSpreadsheet, Play, ExternalLink, QrCode
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Course, Lesson, Order, User, TeacherMessage, Settings as AppSettings, AuditLog, Review } from "./types.ts";
import { translations, Language } from "./translations.ts";
import { useTheme } from "./hooks/useTheme.ts";
import AIAssistant from "./components/AIAssistant.tsx";
import VerificationModal from "./components/CertificationModal.tsx";
import VideoPlayer from "./components/VideoPlayer.tsx";
import proSanImage from "./assets/images/pro_san.jpg";

export const ABA_PAYWAY_URL = "https://link.payway.com.kh/aba?id=18E2ED0EE307&code=461423&acc=002292898&dynamic=true";
export const ABA_ACCOUNT_NO = "002292898";
export const ABA_MERCHANT_CODE = "461423";

interface AuditLogDetailsInfo {
  ids: { label: string; value: string; colorClass: string }[];
  changes: { field: string; from?: string | number | boolean; to: string | number | boolean }[];
  fullPayload: Record<string, any>;
}

function getAuditLogDetailsInfo(log: AuditLog): AuditLogDetailsInfo {
  const ids: { label: string; value: string; colorClass: string }[] = [];
  const changes: { field: string; from?: string | number | boolean; to: string | number | boolean }[] = [];

  // Extract from payload if present
  if (log.payload && typeof log.payload === "object") {
    if (log.payload.courseId) {
      ids.push({ label: "Course ID", value: String(log.payload.courseId), colorClass: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800" });
    }
    if (log.payload.lessonId) {
      ids.push({ label: "Lesson ID", value: String(log.payload.lessonId), colorClass: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800" });
    }
    if (log.payload.orderId) {
      ids.push({ label: "Order ID", value: String(log.payload.orderId), colorClass: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" });
    }
    if (log.payload.transactionId) {
      ids.push({ label: "Txn ID", value: String(log.payload.transactionId), colorClass: "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800" });
    }
    if (log.payload.targetUserId || log.payload.deletedUserId) {
      ids.push({ label: "Target User ID", value: String(log.payload.targetUserId || log.payload.deletedUserId), colorClass: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800" });
    }
    if (log.payload.previousRole !== undefined && log.payload.newRole !== undefined) {
      changes.push({ field: "Role Transition", from: log.payload.previousRole, to: log.payload.newRole });
    }
    if (log.payload.isBanned !== undefined) {
      changes.push({ field: "Account Ban Status", from: log.payload.isBanned ? "Active" : "Banned", to: log.payload.isBanned ? "Banned" : "Active" });
    }
    if (log.payload.paymentStatus) {
      changes.push({ field: "Payment Status", from: "pending", to: log.payload.paymentStatus });
    }
  }

  // Fallback extraction from details string
  const details = log.details || "";
  const courseMatch = details.match(/\(ID:\s*([c\w\-]+)\)/i) || details.match(/course\s+ID\s*["']?([c\w\-]+)/i);
  if (courseMatch && !ids.some(i => i.label === "Course ID")) {
    ids.push({ label: "Course ID", value: courseMatch[1], colorClass: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800" });
  }

  const userMatch = details.match(/User\s+(u-\d+)/i) || details.match(/user\s+ID\s*["']?([u\w\-]+)/i);
  if (userMatch && !ids.some(i => i.label === "Target User ID")) {
    ids.push({ label: "Target User ID", value: userMatch[1], colorClass: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800" });
  }

  const lessonMatch = details.match(/lesson\s+(?:with\s+)?ID\s*["']?([l\w\-]+)/i);
  if (lessonMatch && !ids.some(i => i.label === "Lesson ID")) {
    ids.push({ label: "Lesson ID", value: lessonMatch[1], colorClass: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800" });
  }

  const transMatch = details.match(/TransID:\s*([^,)\s]+)/i);
  if (transMatch && !ids.some(i => i.label === "Txn ID")) {
    ids.push({ label: "Txn ID", value: transMatch[1], colorClass: "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800" });
  }

  // Build complete JSON payload object
  const fullPayload: Record<string, any> = {
    eventId: log.id,
    eventAction: log.action,
    timestamp: log.timestamp,
    actor: {
      userId: log.userId,
      name: log.userName,
      email: log.userEmail
    },
    actionSummary: log.details,
    ...(log.payload ? { payload: log.payload } : {}),
    ...(ids.length > 0 ? { objectIdentifiers: Object.fromEntries(ids.map(i => [i.label, i.value])) } : {})
  };

  return { ids, changes, fullPayload };
}

function isCriticalAuditAction(action: string): boolean {
  const act = (action || "").toUpperCase();
  return act.includes("DELETE") || act.includes("ROLE") || act.includes("BAN");
}

export default function App() {
  // Theme Switching using useTheme Hook
  const { darkMode, setDarkMode } = useTheme();

  // Locale / Language State
  const [lang, setLang] = useState<Language>("en");

  // Router State: "home" | "courses" | "course-detail" | "about" | "contact" | "faq" | "blog" | "student" | "admin" | "checkout"
  const [view, setView] = useState<string>("home");
  
  // Selected Objects State
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [activeLessonId, setActiveLessonId] = useState<string>("");
  const [checkoutCourseId, setCheckoutCourseId] = useState<string>("");

  // Authenticated User State
  const [token, setToken] = useState<string>(() => localStorage.getItem("token") || "");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Audit Logs States
  const [adminAuditLogs, setAdminAuditLogs] = useState<AuditLog[]>([]);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("ALL");
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  // Audit Logs Batch Selection & Actions
  const [selectedAuditLogIds, setSelectedAuditLogIds] = useState<string[]>([]);
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const [isArchivingLogs, setIsArchivingLogs] = useState(false);
  const [isExportingAuditCsv, setIsExportingAuditCsv] = useState(false);
  const [batchActionFeedback, setBatchActionFeedback] = useState<{ type: string; message: string } | null>(null);
  const batchDropdownRef = useRef<HTMLDivElement>(null);

  // Audit Logs Live Monitoring
  const [isLiveMonitorActive, setIsLiveMonitorActive] = useState(false);
  const [isPollingLogs, setIsPollingLogs] = useState(false);
  const [lastPollTime, setLastPollTime] = useState<Date | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (batchDropdownRef.current && !batchDropdownRef.current.contains(event.target as Node)) {
        setIsBatchDropdownOpen(false);
      }
    };
    if (isBatchDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isBatchDropdownOpen]);

  const toggleLogDetails = (id: string) => {
    setExpandedLogIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyPayload = (logId: string, jsonString: string) => {
    navigator.clipboard.writeText(jsonString);
    setCopiedLogId(logId);
    setTimeout(() => {
      setCopiedLogId((current) => (current === logId ? null : current));
    }, 2000);
  };

  // Authentication Forms State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [authError, setAuthError] = useState("");

  // LMS Data States
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<Course | null>(null);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [lessonSearchText, setLessonSearchText] = useState("");

  // Favorites State with LocalStorage Persistence
  const [favoriteCourseIds, setFavoriteCourseIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("favoriteCourseIds");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [studentTab, setStudentTab] = useState<"enrolled" | "favorites">("enrolled");

  // HD Video Player Preview Modal State
  const [hdPreviewModal, setHdPreviewModal] = useState<{
    isOpen: boolean;
    videoUrl: string;
    title: string;
    poster?: string;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem("favoriteCourseIds", JSON.stringify(favoriteCourseIds));
  }, [favoriteCourseIds]);

  const toggleFavorite = (courseId: string) => {
    setFavoriteCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  // Review & Rating States
  const [courseReviews, setCourseReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewSubmitError, setReviewSubmitError] = useState<string | null>(null);
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState<string | null>(null);

  // Admin and CMS Editor States
  const [adminAnalytics, setAdminAnalytics] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [csvExportSuccess, setCsvExportSuccess] = useState(false);
  const [teacherMessages, setTeacherMessages] = useState<TeacherMessage[]>([]);
  const [platformSettings, setPlatformSettings] = useState<any>(null);
  const [googleSheetsId, setGoogleSheetsId] = useState("");
  const [googleServiceAccountEmail, setGoogleServiceAccountEmail] = useState("");
  const [googlePrivateKey, setGooglePrivateKey] = useState("");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [sheetsSyncLoading, setSheetsSyncLoading] = useState(false);
  const [sheetsSuccess, setSheetsSuccess] = useState("");
  const [sheetsError, setSheetsError] = useState("");
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [newCourseForm, setNewCourseForm] = useState({
    title: "", titleKh: "", description: "", descriptionKh: "",
    price: "", discount: "", category: "Programming", categoryKh: "សរសេរកូដ",
    duration: "10h", thumbnail: ""
  });
  const [aiTopicInput, setAiTopicInput] = useState("");
  const [aiGeneratorLoading, setAiGeneratorLoading] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [newLessonForm, setNewLessonForm] = useState({
    title: "", titleKh: "", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: "10:00", isPreview: false
  });

  // Payments and Checks States
  const [checkoutInfo, setCheckoutInfo] = useState<any>(null);
  const [paymentGateway, setPaymentGateway] = useState("ABA Pay");
  const [checkoutError, setCheckoutError] = useState("");
  const [verificationFeedback, setVerificationFeedback] = useState("");
  const [copiedAbaAccount, setCopiedAbaAccount] = useState(false);

  // Contact Message form states
  const [contactForm, setContactForm] = useState({ name: "", course: "General Question", msg: "" });
  const [contactSuccess, setContactSuccess] = useState("");

  // Certificates claims States
  const [claimCertModalOpen, setClaimCertModalOpen] = useState(false);
  const [claimCertParams, setClaimCertParams] = useState<any>(null);

  // Layout Responsive Menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-play option state
  const [autoPlayNext, setAutoPlayNext] = useState(true);

  // Sync retrieved platform settings with inputs
  useEffect(() => {
    if (platformSettings) {
      setGoogleSheetsId(platformSettings.googleSheetsId || "");
      setGoogleServiceAccountEmail(platformSettings.googleServiceAccountEmail || "");
      setGooglePrivateKey(platformSettings.googlePrivateKey || "");
      setTelegramBotToken(platformSettings.telegramBotToken || "");
      setTelegramChatId(platformSettings.telegramChatId || "");
    }
  }, [platformSettings]);

  // Translation shorthand helper
  const t = (key: string) => {
    return translations[key]?.[lang] || translations[key]?.en || key;
  };

  // 1. Initial Load Config
  useEffect(() => {
    fetchCourses();
    if (token) {
      fetchProfile();
      fetchMyCourses();
    }
  }, [token]);

  // Handle auto reload details if course selected changes
  useEffect(() => {
    if (selectedCourseId) {
      fetchCourseDetails(selectedCourseId);
    }
  }, [selectedCourseId]);

  // Fetch Public Courses
  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      if (data.courses) setCourses(data.courses);
    } catch (e) {
      console.error("Failed to load courses list", e);
    }
  };

  // Fetch Profile Info
  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else {
        handleLogout();
      }
    } catch (e) {
      console.error("Profile load issue", e);
    }
  };

  // Fetch student courses
  const fetchMyCourses = async () => {
    try {
      const res = await fetch("/api/my-courses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.courses) setMyCourses(data.courses);
    } catch (e) {
      console.error("Student courses loading issues", e);
    }
  };

  // Fetch reviews for a specific course
  const fetchCourseReviews = async (courseId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setCourseReviews(data.reviews || []);
      }
    } catch (e) {
      console.error("Failed to load course reviews", e);
    }
  };

  // Submit a review on Course Detail screen
  const executeSubmitReview = async (courseId: string) => {
    if (!token) {
      alert(lang === "en" ? "Please sign in to your student account to write a review." : "សូមចូលគណនីរបស់អ្នកដើម្បីសរសេរមតិយោបល់។");
      setShowAuthModal(true);
      return;
    }
    if (!reviewComment.trim()) {
      setReviewSubmitError(lang === "en" ? "Please write details for your review comment." : "សូមសរសេរមតិយោបល់របស់អ្នក។");
      return;
    }

    setIsSubmittingReview(true);
    setReviewSubmitError(null);
    setReviewSubmitSuccess(null);

    try {
      const res = await fetch(`/api/courses/${courseId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReviewSubmitSuccess(lang === "en" ? "Thank you! Your review has been submitted." : "សូមអរគុណ! មតិយោបល់របស់អ្នកត្រូវបានបញ្ជូនដោយជោគជ័យ។");
        setReviewComment("");
        
        // Refresh reviews on details display page
        fetchCourseReviews(courseId);
        
        // Reload course overall rating & reviewsCount counters
        const coursesRes = await fetch(`/api/courses/${courseId}`);
        const cData = await coursesRes.json();
        if (cData.course) {
          setSelectedCourseDetail(cData.course);
        }
        
        // Refresh general course listings
        fetchCourses();

      } else {
        setReviewSubmitError(data.error || "Failed to submit review.");
      }
    } catch (e: any) {
      console.error(e);
      setReviewSubmitError(lang === "en" ? "An error occurred while submitting." : "មានបញ្ហាបច្ចេកទេសក្នុងការបញ្ជូន។");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Fetch individual course details with associated lessons list
  const fetchCourseDetails = async (courseId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      const data = await res.json();
      if (data.course) {
        setSelectedCourseDetail(data.course);
        setLessons(data.lessons || []);
        if (data.lessons && data.lessons.length > 0) {
          setActiveLessonId(data.lessons[0].id);
        }
        // Load reviews!
        fetchCourseReviews(courseId);
        // Reset subform states
        setReviewRating(5);
        setReviewComment("");
        setReviewSubmitError(null);
        setReviewSubmitSuccess(null);
        setLessonSearchText("");
      }
    } catch (e) {
      console.error("Course Details failed to retrieve", e);
    }
  };

  // Fetch admin dashboard details
  const fetchAdminDetails = async () => {
    try {
      const authHeader = { Authorization: `Bearer ${token}` };
      const [analyticsRes, usersRes, transRes, msgRes, settingsRes, auditRes] = await Promise.all([
        fetch("/api/admin/analytics", { headers: authHeader }),
        fetch("/api/admin/users", { headers: authHeader }),
        fetch("/api/admin/transactions", { headers: authHeader }),
        fetch("/api/teacher/messages", { headers: authHeader }),
        fetch("/api/admin/settings", { headers: authHeader }),
        fetch("/api/admin/audit-logs", { headers: authHeader })
      ]);

      if (analyticsRes.ok && usersRes.ok) {
        setAdminAnalytics(await analyticsRes.json());
        setAdminUsers((await usersRes.json()).users || []);
        setAdminOrders((await transRes.json()).transactions || []);
        setTeacherMessages((await msgRes.json()).messages || []);
        setPlatformSettings((await settingsRes.json()).settings || null);
        if (auditRes.ok) {
          setAdminAuditLogs((await auditRes.json()).auditLogs || []);
        }
      }
    } catch (e) {
      console.error("Failed to load admin systems parameters", e);
    }
  };

  // Live Monitor: Polling for new audit logs every 10 seconds
  const pollAuditLogs = async () => {
    if (!token) return;
    try {
      setIsPollingLogs(true);
      const res = await fetch("/api/admin/audit-logs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.auditLogs)) {
          setAdminAuditLogs(data.auditLogs);
        }
        setLastPollTime(new Date());
      }
    } catch (err) {
      console.warn("Live monitor poll error:", err);
    } finally {
      setIsPollingLogs(false);
    }
  };

  useEffect(() => {
    if (!isLiveMonitorActive || !token) return;

    // Immediately poll upon enabling
    pollAuditLogs();

    const intervalId = setInterval(() => {
      pollAuditLogs();
    }, 10000); // Poll every 10 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [isLiveMonitorActive, token]);

  // Authentications Registration & logins execution
  const executeAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    const endpoint = authMode === "login" ? "/api/login" : "/api/register";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || "Authentication error encountered.");
        return;
      }

      localStorage.setItem("token", data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      setShowAuthModal(false);
      setAuthForm({ name: "", email: "", password: "", phone: "" });
      
      // Auto redirect to correct panel
      if (data.user.role === "admin") {
        setView("admin");
        fetchAdminDetails();
      } else {
        setView("student");
        fetchMyCourses();
      }
    } catch (err) {
      setAuthError("Failed to communicate with service auth route.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setCurrentUser(null);
    setMyCourses([]);
    setView("home");
  };

  // Setup payments checkout
  const handleInitiateCheckout = async (courseId: string, gatewayOverride?: string) => {
    if (!token) {
      setAuthMode("login");
      setShowAuthModal(true);
      return;
    }

    const gatewayToUse = gatewayOverride || paymentGateway;
    if (gatewayOverride) {
      setPaymentGateway(gatewayOverride);
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ courseId, gateway: gatewayToUse })
      });
      const data = await res.json();

      if (res.ok) {
        setCheckoutInfo(data);
        setCheckoutCourseId(courseId);
        setView("checkout");
      } else {
        setCheckoutError(data.error || "Payment creation failed.");
      }
    } catch (e) {
      setCheckoutError("Failed to connect to merchant APIs.");
    }
  };

  // Change Payment Gateway selection from checkout screen
  const performGatewaySelectionChange = async (newGateway: string) => {
    setPaymentGateway(newGateway);
    if (checkoutCourseId) {
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ courseId: checkoutCourseId, gateway: newGateway })
        });
        const data = await res.json();
        if (res.ok) {
          setCheckoutInfo(data);
        }
      } catch (e) {
        console.error("Failed to alter invoice configurations", e);
      }
    }
  };

  // Manual payment submission verification
  const handleVerifyManualPayment = async () => {
    if (!checkoutInfo?.order?.transactionId) return;

    try {
      const res = await fetch("/api/payment/verify-manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ transactionId: checkoutInfo.order.transactionId })
      });
      
      const data = await res.json();
      if (res.ok) {
        setVerificationFeedback(t("verifySuccess"));
        fetchMyCourses();
        setTimeout(() => {
          setVerificationFeedback("");
          setView("student");
        }, 3000);
      } else {
        alert(data.error || "Validation pending, please check terminal logs.");
      }
    } catch (e) {
      alert("Validation failed to connect.");
    }
  };

  // Student Watch Course Progress Tracker
  const computedProgressPercentage = useMemo(() => {
    if (lessons.length === 0) return 0;
    const activeIndex = lessons.findIndex((l) => l.id === activeLessonId);
    if (activeIndex === -1) return 0;
    return Math.floor(((activeIndex + 1) / lessons.length) * 100);
  }, [lessons, activeLessonId]);

  // Helper to parse duration string to seconds
  const parseDurationToSeconds = (dur: string): number => {
    if (!dur) return 0;
    const cleaned = dur.toLowerCase();
    if (cleaned.includes("min")) {
      const num = parseInt(cleaned, 10);
      return isNaN(num) ? 0 : num * 60;
    }
    const parts = cleaned.split(":").map(Number);
    if (parts.some(isNaN)) return 0;
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]; // MM:SS
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
    }
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed * 60;
  };

  // Helper to format seconds to human readable form
  const formatSecondsToFriendly = (secs: number): string => {
    if (secs <= 0) return "0 min";
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs > 0) {
      return `${hrs} hr ${mins} min`;
    }
    return `${mins} min`;
  };

  // Learning Path calculations
  const learningStats = useMemo(() => {
    if (!lessons.length || !selectedCourseDetail) {
      return {
        completedCount: 0,
        totalCount: 0,
        totalTimeSpentSec: 0,
        estimatedTimeLeftSec: 0,
        completedTimeFormatted: "0 min",
        remainingTimeFormatted: "0 min",
        upcomingMilestones: [] as { percentage: number; title: string; lessonTitle: string; completed: boolean; icon: string }[]
      };
    }

    const activeIndex = lessons.findIndex((l) => l.id === activeLessonId);
    const completedCount = activeIndex === -1 ? 0 : activeIndex; // lessons before activeIndex
    const totalCount = lessons.length;

    // Convert duration strings
    let completedSeconds = 0;
    let remainingSeconds = 0;

    lessons.forEach((l, idx) => {
      const sec = parseDurationToSeconds(l.duration);
      if (idx < completedCount) {
        completedSeconds += sec;
      } else {
        remainingSeconds += sec;
      }
    });

    // Make sure we have a base "Time Spent" if no lessons completed yet
    if (completedSeconds === 0 && activeIndex > 0) {
      completedSeconds = activeIndex * 10 * 60; // 10 mins per lesson fallback
    }

    const upcomingMilestones = [];
    
    // Milestone 1: Quarter point
    const quarterIdx = Math.floor(totalCount * 0.25);
    if (quarterIdx > 0 && quarterIdx < totalCount) {
      upcomingMilestones.push({
        percentage: 25,
        title: lang === "en" ? "Foundation Check" : "ជំហានគ្រឹះដំបូង",
        lessonTitle: lang === "en" ? lessons[quarterIdx].title : lessons[quarterIdx].titleKh,
        completed: completedCount >= quarterIdx,
        icon: "BookOpen"
      });
    } else {
      upcomingMilestones.push({
        percentage: 25,
        title: lang === "en" ? "Foundation Check" : "ជំហានគ្រឹះដំបូង",
        lessonTitle: lang === "en" ? "Get started with the first modules" : "ចាប់ផ្តើមរៀនមេរៀនដំបូង",
        completed: completedCount >= 1,
        icon: "BookOpen"
      });
    }

    // Milestone 2: Midpoint
    const midIdx = Math.floor(totalCount * 0.5);
    if (midIdx > 0 && midIdx < totalCount) {
      upcomingMilestones.push({
        percentage: 50,
        title: lang === "en" ? "Midpoint Milestone" : "ពាក់កណ្តាលវគ្គសិក្សា",
        lessonTitle: lang === "en" ? lessons[midIdx].title : lessons[midIdx].titleKh,
        completed: completedCount >= midIdx,
        icon: "TrendingUp"
      });
    } else {
      upcomingMilestones.push({
        percentage: 50,
        title: lang === "en" ? "Midpoint Milestone" : "ពាក់កណ្តាលវគ្គសិក្សា",
        lessonTitle: lang === "en" ? "Proceeding with core topics" : "រៀនបន្តនូវប្រធានបទស្នូល",
        completed: completedCount >= Math.max(1, Math.floor(totalCount / 2)),
        icon: "TrendingUp"
      });
    }

    // Milestone 3: Three-quarter point
    const threeQuarterIdx = Math.floor(totalCount * 0.75);
    if (threeQuarterIdx > 0 && threeQuarterIdx < totalCount) {
      upcomingMilestones.push({
        percentage: 75,
        title: lang === "en" ? "Advanced Mastery" : "កម្រិតខ្ពស់ជំនាញ",
        lessonTitle: lang === "en" ? lessons[threeQuarterIdx].title : lessons[threeQuarterIdx].titleKh,
        completed: completedCount >= threeQuarterIdx,
        icon: "Sparkles"
      });
    } else {
      upcomingMilestones.push({
        percentage: 75,
        title: lang === "en" ? "Advanced Mastery" : "កម្រិតខ្ពស់ជំនាញ",
        lessonTitle: lang === "en" ? "Deep dive analytical lectures" : "វគ្គបង្រៀនស៊ីជម្រៅចុងក្រោយ",
        completed: completedCount >= Math.max(1, Math.floor(totalCount * 0.75)),
        icon: "Sparkles"
      });
    }

    // Milestone 4: 100% Graduation
    upcomingMilestones.push({
      percentage: 100,
      title: lang === "en" ? "Certified Graduation" : "បញ្ចប់វគ្គនិងទាញយកវិញ្ញាបនបត្រ",
      lessonTitle: lang === "en" ? "Official Academy Certification" : "វិញ្ញាបនបត្រផ្លូវការពីសាលា",
      completed: completedCount === totalCount || computedProgressPercentage >= 100,
      icon: "Award"
    });

    return {
      completedCount,
      totalCount,
      totalTimeSpentSec: completedSeconds,
      estimatedTimeLeftSec: remainingSeconds,
      completedTimeFormatted: formatSecondsToFriendly(completedSeconds),
      remainingTimeFormatted: formatSecondsToFriendly(remainingSeconds),
      upcomingMilestones
    };
  }, [lessons, activeLessonId, selectedCourseDetail, lang, computedProgressPercentage]);

  // Filter lessons based on Student Search Box
  const filteredLessons = useMemo(() => {
    if (!lessonSearchText.trim()) return lessons;
    const cleanSearch = lessonSearchText.toLowerCase();
    return lessons.filter((les) => {
      return (
        (les.title || "").toLowerCase().includes(cleanSearch) ||
        (les.titleKh || "").toLowerCase().includes(cleanSearch) ||
        (les.duration || "").toLowerCase().includes(cleanSearch)
      );
    });
  }, [lessons, lessonSearchText]);

  // Auto trigger next lesson
  const triggerAutoNextVideoPlay = () => {
    if (!autoPlayNext) return;
    const currentIndex = lessons.findIndex((l) => l.id === activeLessonId);
    if (currentIndex !== -1 && currentIndex < lessons.length - 1) {
      setActiveLessonId(lessons[currentIndex + 1].id);
    }
  };

  // Trigger real-time Telegram notification alerts when learning milestones are reached
  useEffect(() => {
    if (!token || !currentUser || !selectedCourseDetail || !learningStats.totalCount) return;
    
    const courseId = selectedCourseDetail.id;
    const courseTitle = selectedCourseDetail.title;
    
    // Check milestones
    learningStats.upcomingMilestones.forEach((m) => {
      if (m.completed) {
        const milestoneKey = `${courseId}-${m.percentage}`;
        
        let notifiedList: string[] = [];
        try {
          const saved = localStorage.getItem("notifiedMilestones");
          if (saved) notifiedList = JSON.parse(saved);
        } catch (e) {
          notifiedList = [];
        }
        
        if (!notifiedList.includes(milestoneKey)) {
          // Trigger API call!
          fetch("/api/student/milestone", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              courseTitle,
              milestoneTitle: m.title,
              percentage: m.percentage,
              completedCount: learningStats.completedCount,
              totalCount: learningStats.totalCount
            })
          })
          .then((res) => {
            if (res.ok) {
              notifiedList.push(milestoneKey);
              localStorage.setItem("notifiedMilestones", JSON.stringify(notifiedList));
            }
          })
          .catch((err) => console.error("Failed to notify milestone milestone:", err));
        }
      }
    });
  }, [
    token,
    currentUser,
    selectedCourseDetail,
    learningStats.upcomingMilestones,
    learningStats.completedCount,
    learningStats.totalCount
  ]);

  // Claim academic certificate handler
  const claimSchoolCertificate = () => {
    if (!selectedCourseDetail || !currentUser) return;
    setClaimCertParams({
      studentName: currentUser.name,
      courseTitle: lang === "en" ? selectedCourseDetail.title : selectedCourseDetail.titleKh,
      dateString: new Date().toLocaleDateString(lang === "en" ? "en-US" : "km-KH", { year: "numeric", month: "long", day: "numeric" }),
      certificateId: `ABA-CERT-${Date.now().toString().slice(-6)}`,
      instructorName: selectedCourseDetail.instructor
    });
    setClaimCertModalOpen(true);
  };

  // Contact support submission
  const processContactSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/contact/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: contactForm.name,
          courseTitle: contactForm.course,
          message: contactForm.msg
        })
      });
      if (res.ok) {
        setContactSuccess(lang === "en" ? "Message filed successfully into teacher support inbox!" : "សាររបស់អ្នកត្រូវបានផ្ញើជូនគ្រូសម្របសម្រួលរួចរាល់!");
        setContactForm({ name: "", course: "General Question", msg: "" });
        setTimeout(() => setContactSuccess(""), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin Gemini Course Materials generation Integration
  const triggerAICourseGenerator = async () => {
    if (!aiTopicInput.trim() || aiGeneratorLoading) return;
    setAiGeneratorLoading(true);

    try {
      const res = await fetch("/api/ai/generate-course-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ topic: aiTopicInput })
      });

      const data = await res.json();
      if (res.ok) {
        setNewCourseForm({
          title: data.title || "",
          titleKh: data.titleKh || "",
          description: data.description || "",
          descriptionKh: data.descriptionKh || "",
          price: "49",
          discount: "10",
          category: "Programming",
          categoryKh: "សរសេរកូដ",
          duration: "12h 30m",
          thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"
        });
        setAiTopicInput("");
      } else {
        alert(data.error || "Gemini course engine declined response.");
      }
    } catch (e) {
      alert("Error contacting Gemini services route.");
    } finally {
      setAiGeneratorLoading(false);
    }
  };

  // Admin Register Course Creation CMS
  const executeRegisterCourseCms = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/courses/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newCourseForm)
      });
      if (res.ok) {
        setShowCourseModal(false);
        setNewCourseForm({
          title: "", titleKh: "", description: "", descriptionKh: "",
          price: "", discount: "", category: "Programming", categoryKh: "សរសេរកូដ",
          duration: "10h", thumbnail: ""
        });
        fetchCourses();
        fetchAdminDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin delete course
  const executeDeleteCourseCms = async (courseId: string) => {
    if (!window.confirm("Are you sure you want to delete this course completely? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCourses();
        fetchAdminDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Google Sheets database credentials update
  const executeSaveSheetsSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSheetsError("");
    setSheetsSuccess("");
    setSheetsSyncLoading(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          googleSheetsId,
          googleServiceAccountEmail,
          googlePrivateKey,
          telegramBotToken,
          telegramChatId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setSheetsError(data.error || "Failed to update platform integrations.");
      } else {
        setSheetsSuccess("Integration settings updated successfully!");
        setPlatformSettings(data.settings);
      }
    } catch (err: any) {
      setSheetsError(`Failed to save settings: ${err.message}`);
    } finally {
      setSheetsSyncLoading(false);
    }
  };

  // Live test sheets connection & workspace provisioning
  const executeTestSheetsConnection = async () => {
    setSheetsError("");
    setSheetsSuccess("");
    setSheetsSyncLoading(true);

    try {
      const res = await fetch("/api/admin/sheets/test", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setSheetsError(data.error || "Connection test failed. Verify Spreadsheet ID and Service Account permissions.");
      } else {
        setSheetsSuccess(data.message || "Connected & provisioned Google Sheets successfully!");
      }
    } catch (err: any) {
      setSheetsError(`Network or credentials failure: ${err.message}`);
    } finally {
      setSheetsSyncLoading(false);
    }
  };

  // Mirrored Export of current local DB to Google Sheets
  const executeExportToSheets = async () => {
    setSheetsError("");
    setSheetsSuccess("");
    setSheetsSyncLoading(true);

    try {
      const res = await fetch("/api/admin/sheets/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setSheetsError(data.error || "Database mirroring failed. Verify sheets credentials and ID.");
      } else {
        setSheetsSuccess("Database successfully mirrored! All worksheets are now fully matching local data.");
      }
    } catch (err: any) {
      setSheetsError(`Mirroring failure: ${err.message}`);
    } finally {
      setSheetsSyncLoading(false);
    }
  };

  // Full merge/import of courses from Google Sheets Courses worksheet
  const executeImportFromSheets = async () => {
    if (!window.confirm("Import courses from Google Sheets? This will merge and update standard course indices.")) return;
    setSheetsError("");
    setSheetsSuccess("");
    setSheetsSyncLoading(true);

    try {
      const res = await fetch("/api/admin/sheets/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setSheetsError(data.error || "Course import failed. Verify the 'Courses' sheet structure and standard headings.");
      } else {
        setSheetsSuccess(data.message || "Courses successfully imported and loaded!");
        fetchCourses();
        fetchAdminDetails();
      }
    } catch (err: any) {
      setSheetsError(`Import failure: ${err.message}`);
    } finally {
      setSheetsSyncLoading(false);
    }
  };

  // Add lesson to course
  const executeAddCourseLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    try {
      const res = await fetch(`/api/courses/${selectedCourseId}/lessons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newLessonForm)
      });
      if (res.ok) {
        setShowLessonModal(false);
        setNewLessonForm({
          title: "", titleKh: "", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration: "10:00", isPreview: false
        });
        fetchCourseDetails(selectedCourseId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete individual lesson
  const executeDeleteLesson = async (lessonId: string) => {
    if (!window.confirm("Delete this lesson from curriculum?")) return;
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok && selectedCourseId) {
        fetchCourseDetails(selectedCourseId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Approve payment transactions directly from admin CMS
  const executeApprovePaymentAdmin = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/payments/${id}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAdminDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete user from platform completely
  const executeDeleteUserAdmin = async (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot delete your own session account.");
      return;
    }
    if (!window.confirm(`Are you absolutely sure you want to permanently delete the user account: "${userName}"? This will clean up their purchase histories and cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAdminDetails();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to remove user account.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle banning status for student / teacher
  const executeToggleBanUserStatus = async (userId: string, currentBanState: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ isBanned: !currentBanState })
      });
      if (res.ok) {
        fetchAdminDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Change user role from Admin UI
  const executeUpdateUserRoleAdmin = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        fetchAdminDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Export Admin Users List to CSV file for offline reporting
  const handleExportUsersCSV = async () => {
    if (!adminUsers || adminUsers.length === 0) {
      alert(lang === "en" ? "No user records found to export." : "គ្មានទិន្នន័យអ្នកប្រើប្រាស់សម្រាប់ទាញយកទេ។");
      return;
    }

    setIsExportingCsv(true);

    const triggerClientCsvDownload = () => {
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

      const rows = adminUsers.map((user) => {
        const userCompletedOrders = adminOrders.filter(
          (o) => o.userId === user.id && o.paymentStatus === "completed"
        );
        const userTotalSpent = userCompletedOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
        return [
          user.id,
          user.name,
          user.email,
          user.role.toUpperCase(),
          user.isBanned ? "Banned / Restricted" : "Active",
          user.phone || "N/A",
          userCompletedOrders.length,
          userTotalSpent.toFixed(2)
        ];
      });

      const csvLines = [
        headers.map(escapeCsv).join(","),
        ...rows.map((row) => row.map(escapeCsv).join(","))
      ];

      // UTF-8 BOM so Excel and spreadsheet applications open UTF-8/Khmer scripts without mojibake
      const blob = new Blob(["\uFEFF" + csvLines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const todayStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `pro_san_users_${todayStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setCsvExportSuccess(true);
      setTimeout(() => setCsvExportSuccess(false), 3500);
    };

    try {
      const res = await fetch("/api/admin/users/export-csv", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const todayStr = new Date().toISOString().slice(0, 10);
        link.href = url;
        link.download = `pro_san_users_${todayStr}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setCsvExportSuccess(true);
        setTimeout(() => setCsvExportSuccess(false), 3500);

        // Refresh audit logs so this export action reflects in compliance logs
        fetchAdminDetails();
      } else {
        triggerClientCsvDownload();
      }
    } catch (err) {
      console.error("Export users CSV network failure, using client fallback", err);
      triggerClientCsvDownload();
    } finally {
      setIsExportingCsv(false);
    }
  };

  // Filter and Search computed properties
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch = 
        c.title.toLowerCase().includes(searchText.toLowerCase()) ||
        c.titleKh.toLowerCase().includes(searchText.toLowerCase()) ||
        c.category.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesCategory = selectedCategory === "All" || c.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [courses, searchText, selectedCategory]);

  const favoritedCoursesList = useMemo(() => {
    return courses.filter((c) => favoriteCourseIds.includes(c.id));
  }, [courses, favoriteCourseIds]);

  const filteredAuditLogs = useMemo(() => {
    const cleanSearch = auditSearch.trim().toLowerCase();
    return adminAuditLogs.filter((log) => {
      const isCritical = isCriticalAuditAction(log.action);
      const severityTerm = isCritical ? "critical high danger" : "informational info low";
      const archiveTerm = log.isArchived ? "archived archive" : "active unarchived";
      const payloadStr = log.payload ? JSON.stringify(log.payload).toLowerCase() : "";
      const matchesSearch = 
        !cleanSearch ||
        (log.userName || "").toLowerCase().includes(cleanSearch) ||
        (log.details || "").toLowerCase().includes(cleanSearch) ||
        (log.id || "").toLowerCase().includes(cleanSearch) ||
        (log.userId || "").toLowerCase().includes(cleanSearch) ||
        (log.userEmail || "").toLowerCase().includes(cleanSearch) ||
        (log.action || "").toLowerCase().includes(cleanSearch) ||
        severityTerm.includes(cleanSearch) ||
        archiveTerm.includes(cleanSearch) ||
        payloadStr.includes(cleanSearch);
      
      const matchesAction = 
        auditActionFilter === "ALL" ||
        (auditActionFilter === "ACTIVE_ONLY" && !log.isArchived) ||
        (auditActionFilter === "ARCHIVED_ONLY" && !!log.isArchived) ||
        (auditActionFilter === "CRITICAL_ONLY" && isCritical) ||
        (auditActionFilter === "INFO_ONLY" && !isCritical) ||
        log.action === auditActionFilter;

      return matchesSearch && matchesAction;
    });
  }, [adminAuditLogs, auditSearch, auditActionFilter]);

  // Derived state for selection across visible filtered logs
  const allVisibleAuditLogsSelected = useMemo(() => {
    if (filteredAuditLogs.length === 0) return false;
    return filteredAuditLogs.every((l) => selectedAuditLogIds.includes(l.id));
  }, [filteredAuditLogs, selectedAuditLogIds]);

  const someVisibleAuditLogsSelected = useMemo(() => {
    if (filteredAuditLogs.length === 0) return false;
    return filteredAuditLogs.some((l) => selectedAuditLogIds.includes(l.id));
  }, [filteredAuditLogs, selectedAuditLogIds]);

  // Toggle selection for an individual audit log row
  const handleToggleSelectAuditLog = (logId: string, isChecked: boolean) => {
    setSelectedAuditLogIds((prev) =>
      isChecked ? (prev.includes(logId) ? prev : [...prev, logId]) : prev.filter((id) => id !== logId)
    );
  };

  // Toggle select-all or deselect-all for visible audit logs
  const handleSelectAllVisibleAuditLogs = (isChecked: boolean) => {
    if (isChecked) {
      const visibleIds = filteredAuditLogs.map((l) => l.id);
      setSelectedAuditLogIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    } else {
      const visibleIdSet = new Set(filteredAuditLogs.map((l) => l.id));
      setSelectedAuditLogIds((prev) => prev.filter((id) => !visibleIdSet.has(id)));
    }
  };

  // Batch Action: Copy Selected IDs to clipboard
  const handleCopySelectedAuditLogIds = () => {
    if (selectedAuditLogIds.length === 0) return;
    const idsFormatted = selectedAuditLogIds.join("\n");
    navigator.clipboard.writeText(idsFormatted);
    setBatchActionFeedback({
      type: "copy",
      message: `Copied ${selectedAuditLogIds.length} audit log ID${selectedAuditLogIds.length > 1 ? "s" : ""} to clipboard!`
    });
    setIsBatchDropdownOpen(false);
    setTimeout(() => {
      setBatchActionFeedback((curr) => (curr?.type === "copy" ? null : curr));
    }, 3500);
  };

  // Batch or Single Action: Archive Selected Logs (or unarchive)
  const handleArchiveSelectedAuditLogs = async (archive = true, specificLogIds?: string[]) => {
    const targetIds = specificLogIds && specificLogIds.length > 0 ? specificLogIds : [...selectedAuditLogIds];
    if (targetIds.length === 0) return;
    setIsArchivingLogs(true);

    try {
      const res = await fetch("/api/admin/audit-logs/archive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ logIds: targetIds, archive })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.auditLogs) {
          setAdminAuditLogs(data.auditLogs);
        } else {
          setAdminAuditLogs((prev) =>
            prev.map((log) => (targetIds.includes(log.id) ? { ...log, isArchived: archive } : log))
          );
        }
      } else {
        // Client-side fallback update
        setAdminAuditLogs((prev) =>
          prev.map((log) => (targetIds.includes(log.id) ? { ...log, isArchived: archive } : log))
        );
      }

      setBatchActionFeedback({
        type: "archive",
        message: `Successfully ${archive ? "archived" : "restored"} ${targetIds.length} audit log${targetIds.length > 1 ? "s" : ""}.`
      });
      if (!specificLogIds) {
        setSelectedAuditLogIds([]);
      }
    } catch (err) {
      console.error("Archive batch logs error", err);
      // Client fallback
      setAdminAuditLogs((prev) =>
        prev.map((log) => (targetIds.includes(log.id) ? { ...log, isArchived: archive } : log))
      );
      setBatchActionFeedback({
        type: "archive",
        message: `${archive ? "Archived" : "Restored"} ${targetIds.length} audit log${targetIds.length > 1 ? "s" : ""}.`
      });
      if (!specificLogIds) {
        setSelectedAuditLogIds([]);
      }
    } finally {
      setIsArchivingLogs(false);
      setIsBatchDropdownOpen(false);
      setTimeout(() => {
        setBatchActionFeedback((curr) => (curr?.type === "archive" ? null : curr));
      }, 3500);
    }
  };

  // Batch Action: Export Selected Audit Logs to CSV
  const handleExportSelectedAuditLogsCSV = async () => {
    if (selectedAuditLogIds.length === 0) return;
    setIsExportingAuditCsv(true);

    const selectedLogs = adminAuditLogs.filter((log) => selectedAuditLogIds.includes(log.id));
    if (selectedLogs.length === 0) {
      setIsExportingAuditCsv(false);
      return;
    }

    const triggerClientCsvDownload = () => {
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

      const rows = selectedLogs.map((log) => [
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

      const csvLines = [
        headers.map(escapeCsv).join(","),
        ...rows.map((row) => row.map(escapeCsv).join(","))
      ];

      const blob = new Blob(["\uFEFF" + csvLines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const todayStr = new Date().toISOString().slice(0, 10);
      link.setAttribute("download", `pro_san_selected_audit_logs_${todayStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    try {
      const res = await fetch("/api/admin/audit-logs/export-csv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ logIds: selectedAuditLogIds })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const todayStr = new Date().toISOString().slice(0, 10);
        link.download = `pro_san_selected_audit_logs_${todayStr}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        triggerClientCsvDownload();
      }
    } catch (err) {
      console.warn("Audit logs CSV network export error, using fallback client generation", err);
      triggerClientCsvDownload();
    } finally {
      setIsExportingAuditCsv(false);
      setIsBatchDropdownOpen(false);
      setBatchActionFeedback({
        type: "export",
        message: `Successfully exported ${selectedLogs.length} selected audit log${selectedLogs.length > 1 ? "s" : ""} to CSV!`
      });
      setTimeout(() => {
        setBatchActionFeedback((curr) => (curr?.type === "export" ? null : curr));
      }, 3500);
    }
  };

  const auditSummaryStats = useMemo(() => {
    let criticalCount = 0;
    let informationalCount = 0;
    let archivedCount = 0;
    let activeCount = 0;

    adminAuditLogs.forEach((log) => {
      if (log.isArchived) {
        archivedCount++;
      } else {
        activeCount++;
      }
      if (isCriticalAuditAction(log.action)) {
        criticalCount++;
      } else {
        informationalCount++;
      }
    });

    const totalCount = adminAuditLogs.length;
    const criticalPercentage = totalCount ? Math.round((criticalCount / totalCount) * 100) : 0;
    const infoPercentage = totalCount ? Math.round((informationalCount / totalCount) * 100) : 0;
    const activePercentage = totalCount ? Math.round((activeCount / totalCount) * 100) : 0;
    const archivedPercentage = totalCount ? 100 - activePercentage : 0;

    return {
      criticalCount,
      informationalCount,
      archivedCount,
      activeCount,
      criticalPercentage,
      infoPercentage,
      activePercentage,
      archivedPercentage,
      totalCount
    };
  }, [adminAuditLogs]);

  return (
    <div id="full-app-root" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-50 flex flex-col font-sans select-none overflow-x-hidden antialiased transition-colors duration-200">
      
      {/* -------------------------------------------------------------
          HEADER & NAVIGATION BAR
         ------------------------------------------------------------- */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm px-4 md:px-8 py-4 flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center gap-6">
          {/* Logo brand */}
          <div 
            onClick={() => setView("home")} 
            className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-102"
          >
            <div className="bg-slate-900 dark:bg-slate-800 text-white p-2.5 rounded-xl flex items-center justify-center shadow-md">
              <BookOpen className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <span className="font-extrabold text-lg md:text-xl tracking-tight text-slate-900 dark:text-white block font-sans">
                {lang === "en" ? "PRO SAN" : "ប្រូសាន"}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest block font-mono">
                {lang === "en" ? "BILINGUAL LMS ACADEMY" : "ប្រព័ន្ធសិក្សាឌីជីថល"}
              </span>
            </div>
          </div>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-400">
            <button onClick={() => setView("home")} className={`hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ${view === "home" ? "text-slate-950 dark:text-white underline underline-offset-4" : ""}`}>
              {t("home")}
            </button>
            <button onClick={() => setView("courses")} className={`hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ${view === "courses" ? "text-slate-950 dark:text-white underline underline-offset-4" : ""}`}>
              {t("courses")}
            </button>
            <button onClick={() => setView("about")} className={`hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ${view === "about" ? "text-slate-950 dark:text-white underline underline-offset-4" : ""}`}>
              {t("about")}
            </button>
            <button onClick={() => setView("contact")} className={`hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ${view === "contact" ? "text-slate-950 dark:text-white underline underline-offset-4" : ""}`}>
              {t("contact")}
            </button>
          </nav>
        </div>

        {/* Buttons / language toggler bar */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher Toggle */}
          <button
            id="theme-toggler"
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-center p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Bilingual Switcher */}
          <button
            id="lang-switcher"
            onClick={() => setLang(lang === "en" ? "km" : "en")}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Globe className="w-4 h-4 text-slate-600 dark:text-slate-400 animate-spin-slow" />
            <span>{lang === "en" ? "ភាសាខ្មែរ" : "English"}</span>
          </button>

          {/* User profile actions bar */}
          {token && currentUser ? (
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-slate-800">
                <img 
                  src={currentUser.avatar || proSanImage} 
                  alt={currentUser.name} 
                  className="w-8 h-8 rounded-full object-cover border border-blue-400/40 shadow-xs"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[110px] truncate hidden lg:inline">
                  {currentUser.name}
                </span>
              </div>

              {currentUser.role === "admin" && (
                <button
                  onClick={() => { setView("admin"); fetchAdminDetails(); }}
                  className="flex items-center gap-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-800 hover:text-yellow-900 text-xs font-bold py-2 px-3.5 rounded-xl border border-yellow-500/20 transition-all cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{t("adminDashboard")}</span>
                </button>
              )}
              
              <button
                onClick={() => { setView("student"); fetchMyCourses(); }}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-200"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>{t("studentDashboard")}</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 p-2 rounded-xl transition-all cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4 tracking-normal" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setAuthMode("login"); setShowAuthModal(true); }}
              className="hidden md:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-md cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{t("login")}</span>
            </button>
          )}

          {/* Mobile hamburger button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden text-slate-800 p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Dropdown Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-4 text-slate-700 text-sm font-semibold shadow-inner"
          >
            <button onClick={() => { setView("home"); setMobileMenuOpen(false); }} className="text-left py-2 border-b border-slate-50 cursor-pointer">{t("home")}</button>
            <button onClick={() => { setView("courses"); setMobileMenuOpen(false); }} className="text-left py-2 border-b border-slate-50 cursor-pointer">{t("courses")}</button>
            <button onClick={() => { setView("about"); setMobileMenuOpen(false); }} className="text-left py-2 border-b border-slate-50 cursor-pointer">{t("about")}</button>
            <button onClick={() => { setView("contact"); setMobileMenuOpen(false); }} className="text-left py-2 border-b border-slate-50 cursor-pointer">{t("contact")}</button>
            
            {token && currentUser ? (
              <div className="flex flex-col gap-2 pt-2">
                {currentUser.role === "admin" && (
                  <button onClick={() => { setView("admin"); fetchAdminDetails(); setMobileMenuOpen(false); }} className="flex items-center gap-2 text-left bg-yellow-50 py-2.5 px-3 rounded-lg text-yellow-800 cursor-pointer">
                    <Activity className="w-4 h-4" />
                    <span>{t("adminDashboard")}</span>
                  </button>
                )}
                <button onClick={() => { setView("student"); fetchMyCourses(); setMobileMenuOpen(false); }} className="flex items-center gap-2 text-left bg-blue-50 py-2.5 px-3 rounded-lg text-blue-800 cursor-pointer">
                  <Tv className="w-4 h-4" />
                  <span>{t("studentDashboard")}</span>
                </button>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="flex items-center gap-2 text-left text-red-600 py-2.5 px-3 rounded-lg cursor-pointer">
                  <LogOut className="w-4 h-4" />
                  <span>{t("logout")}</span>
                </button>
              </div>
            ) : (
              <button onClick={() => { setAuthMode("login"); setShowAuthModal(true); setMobileMenuOpen(false); }} className="flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl cursor-pointer">
                <LogIn className="w-4 h-4" />
                <span>{t("login")}</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------------------------------------------------------------
          MAIN ROUTED CONTENT BLOCKS
         ------------------------------------------------------------- */}
      <main className="flex-1">

        {/* =============================================================
            VIEW: HOME
           ============================================================= */}
        {view === "home" && (
          <div id="home-view-container" className="space-y-16 pb-20">
            {/* Hero Section Container */}
            <section className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white py-20 px-6 md:px-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
              
              <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10">
                <div className="flex-1 space-y-6 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-full text-yellow-400 text-xs font-bold tracking-wide uppercase">
                    <Sparkles className="w-3.5 h-3.5 animate-bounce" />
                    <span>{lang === "en" ? "First Class Khmer LMS platform" : "ថ្នាក់រៀនបច្ចេកវិទ្យាកំពូលដំបូងគេបង្អស់"}</span>
                  </div>
                  
                  <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight font-sans leading-tight">
                    {t("heroTitle")}
                  </h1>
                  
                  <p className="text-slate-300 text-base md:text-md leading-relaxed font-sans font-light">
                    {t("heroSlogan")}
                  </p>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
                    <button
                      onClick={() => setView("courses")}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-7 rounded-2xl shadow-xl transition-all hover:scale-103 cursor-pointer"
                    >
                      <span>{t("startLearning")}</span>
                      <ArrowRight className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => { setAuthMode("register"); setShowAuthModal(true); }}
                      className="bg-transparent hover:bg-white/10 text-white border border-white/30 font-bold py-3.5 px-6 rounded-2xl transition-all cursor-pointer"
                    >
                      {t("register")}
                    </button>
                  </div>
                </div>

                {/* Simulated high quality dashboard mock representation */}
                <div className="flex-1 w-full max-w-md relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur opacity-30 animate-pulse"></div>
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-3xl overflow-hidden relative">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                        <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      </div>
                      <span className="text-slate-500 uppercase tracking-widest font-bold">Cambodian LMS Console v3.1</span>
                    </div>

                    <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center relative border border-slate-800">
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-3 flex justify-between items-center text-xs text-white">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>06:45 Web Architecture Basics</span>
                        </div>
                        <span className="text-[10px] bg-blue-600 px-1.5 py-0.5 rounded uppercase font-bold">HD PLAYING</span>
                      </div>
                      <div className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-md cursor-pointer animate-pulse">
                        <Star className="w-5 h-5 text-yellow-300" />
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="bg-slate-950 p-3 rounded-lg flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">{lang === "en" ? "Interactive Student Support" : "ប្រព័ន្ធប្រឹក្សាវៃឆ្លាត"}</span>
                        <span className="text-emerald-400 font-bold">● ACTIVE ONLINE</span>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-lg flex items-center justify-between text-xs font-mono text-slate-400">
                        <span>LMS API Status</span>
                        <span className="text-cyan-400">SYS_SECURE</span>
                      </div>
                    </div>

                    {/* Instructor badge inside hero display */}
                    <div className="mt-3 bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img 
                          src={proSanImage} 
                          alt="Pro San" 
                          className="w-12 h-14 object-cover rounded-lg border border-blue-500/50 shadow-md"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" title="Active"></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-white text-xs font-bold truncate">Pro San</h4>
                          <span className="bg-blue-600/30 text-blue-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-500/30">Verified</span>
                        </div>
                        <p className="text-slate-400 text-[11px] truncate">{lang === "en" ? "Academy Director & Lead Instructor" : "ស្ថាបនិក និងគ្រូបង្រៀនចម្បង"}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span className="flex items-center text-amber-400 font-bold"><Star className="w-3 h-3 fill-amber-400 inline mr-0.5" /> 4.9</span>
                          <span>•</span>
                          <span>15k+ Students</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Statistics Row Section */}
            <section className="max-w-6xl mx-auto px-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 shadow-sm">
                <div className="space-y-1 text-center md:text-left border-r border-slate-100 last:border-none pr-4">
                  <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-sans">15k+</h3>
                  <p className="text-slate-500 text-xs md:text-sm font-semibold font-sans">{t("statStudents")}</p>
                </div>
                <div className="space-y-1 text-center md:text-left md:border-r border-slate-100 last:border-none pr-4">
                  <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-sans">120+</h3>
                  <p className="text-slate-500 text-xs md:text-sm font-semibold font-sans">{t("statCourses")}</p>
                </div>
                <div className="space-y-1 text-center md:text-left border-r border-slate-100 last:border-none pr-4">
                  <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-sans">400h+</h3>
                  <p className="text-slate-500 text-xs md:text-sm font-semibold font-sans">{t("statDuration")}</p>
                </div>
                <div className="space-y-1 text-center md:text-left last:border-none">
                  <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-sans">35+</h3>
                  <p className="text-slate-500 text-xs md:text-sm font-semibold font-sans">{t("statInstructors")}</p>
                </div>
              </div>
            </section>

            {/* Categories Section */}
            <section className="max-w-6xl mx-auto px-6 space-y-8">
              <div className="text-center md:text-left space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                  {t("categoriesTitle")}
                </h2>
                <div className="w-12 h-1 bg-slate-900 hidden md:block"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div onClick={() => { setSelectedCategory("AI Development"); setView("courses"); }} className="bg-white border border-slate-200 hover:border-slate-400 p-6 rounded-2xl shadow-sm transition-all hover:scale-102 cursor-pointer flex items-center gap-4 dark:bg-slate-900 dark:border-slate-800">
                  <div className="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 p-4 rounded-xl">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{lang === "en" ? "BUILD SOFTWARE WITH AI" : "បង្កើតសូហ្វវែរជាមួយ AI"}</h4>
                    <span className="text-xs text-slate-400 mt-1 block">{lang === "en" ? "AI coding workflows, Cursor & full-stack apps" : "ស្ទាត់ជំនាញបង្កើតសូហ្វវែរជាមួយ AI"}</span>
                  </div>
                </div>

                <div onClick={() => { setSelectedCategory("Account Security"); setView("courses"); }} className="bg-white border border-slate-200 hover:border-slate-400 p-6 rounded-2xl shadow-sm transition-all hover:scale-102 cursor-pointer flex items-center gap-4 dark:bg-slate-900 dark:border-slate-800">
                  <div className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 p-4 rounded-xl">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{lang === "en" ? "SCAN ACCOUNT PRIME" : "ស្កេនគណនី PRIME"}</h4>
                    <span className="text-xs text-slate-400 mt-1 block">{lang === "en" ? "Prime diagnostics, 2FA & account audits" : "ស្កេនពិនិត្យ និងការពារសុវត្ថិភាពគណនី Prime"}</span>
                  </div>
                </div>

                <div onClick={() => { setSelectedCategory("Online Business"); setView("courses"); }} className="bg-white border border-slate-200 hover:border-slate-400 p-6 rounded-2xl shadow-sm transition-all hover:scale-102 cursor-pointer flex items-center gap-4 dark:bg-slate-900 dark:border-slate-800">
                  <div className="bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 p-4 rounded-xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{lang === "en" ? "MMO (Make Money Online)" : "រកប្រាក់តាមអនឡាញ MMO"}</h4>
                    <span className="text-xs text-slate-400 mt-1 block">{lang === "en" ? "Affiliate, funnels & digital monetization" : "យុទ្ធសាស្ត្ររកចំណូល និងពង្រីកទីផ្សារឌីជីថល"}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Featured & Popular Courses */}
            <section className="max-w-6xl mx-auto px-6 space-y-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-2 text-center md:text-left">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                    {lang === "en" ? "Top Popular Courses" : "វគ្គសិក្សាមានការគាំទ្រខ្ពស់"}
                  </h2>
                  <p className="text-slate-500 text-sm">{lang === "en" ? "Unlock industry-level career skills directly." : "ស្វែងរកអាជីពដែលត្រូវនឹងទេពកោសល្យរបស់អ្នក។"}</p>
                </div>
                <button
                  onClick={() => setView("courses")}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
                >
                  <span>{t("exploreCourses")}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Course grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {courses.slice(0, 3).map((item, idx) => {
                  const hasDiscount = item.discount > 0;
                  const currentPrice = hasDiscount 
                    ? Math.round(item.price * (1 - item.discount / 100)) 
                    : item.price;
                  
                  return (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: idx * 0.05 }}
                      onClick={() => { setSelectedCourseId(item.id); setView("course-detail"); }}
                      className="bg-white border border-slate-200/80 hover:border-slate-400 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col hover:scale-101"
                    >
                      <div className="aspect-video relative overflow-hidden bg-slate-100 group">
                        <img 
                          src={item.thumbnail} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                          {lang === "en" ? item.category : item.categoryKh}
                        </div>
                        {item.isFeatured ? (
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                              <Tv className="w-2.5 h-2.5" /> HD
                            </span>
                            <span className="bg-yellow-500 text-slate-950 text-[10px] font-extrabold px-2 py-1 rounded-md uppercase tracking-wider">
                              {t("featured")}
                            </span>
                          </div>
                        ) : (
                          <div className="absolute top-3 right-3 flex items-center gap-1 bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded shadow tracking-wider">
                            <Tv className="w-3 h-3 text-cyan-200" />
                            <span>1080p HD</span>
                          </div>
                        )}

                        {/* HD PLAY Overlay on Hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 z-10">
                          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl border border-white/80 transform scale-90 group-hover:scale-100 transition-transform">
                            <Play className="w-5 h-5 fill-white translate-x-0.5" />
                          </div>
                          <span className="bg-slate-950/90 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border border-white/20 tracking-wider">
                            HD PLAY
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col gap-3">
                        <h3 className="font-extrabold text-sm md:text-base text-slate-900 leading-snug">
                          {lang === "en" ? item.title : item.titleKh}
                        </h3>
                        <p className="text-slate-500 text-xs line-clamp-2">
                          {lang === "en" ? item.description : item.descriptionKh}
                        </p>

                        <div className="flex items-center gap-1 px-1.5 py-1 bg-slate-50 rounded-lg text-slate-500 text-[10px] font-semibold w-fit">
                          <Star className="w-3.5 h-3.5 text-amber-500 inline fill-amber-500" />
                          <span className="text-slate-800 font-extrabold">{item.rating}</span>
                          <span className="text-slate-400 font-normal">({item.reviewsCount} reviews)</span>
                        </div>

                        <div className="border-t border-slate-100 pt-4 mt-auto flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-bold font-mono">BY: {item.instructor}</span>
                          
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              {hasDiscount && (
                                <span className="text-slate-400 line-through text-xs font-mono font-bold">${item.price}</span>
                              )}
                              <span className="text-slate-950 font-extrabold text-md md:text-lg font-mono">${currentPrice}</span>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCourseId(item.id);
                                handleInitiateCheckout(item.id, "ABA Pay");
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all shadow hover:shadow-md cursor-pointer flex items-center gap-1"
                              title="Buy Now"
                            >
                              <span>{lang === "en" ? "Buy Now" : "ទិញឥឡូវ"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Instructor Spotlight: Pro San */}
            <section id="instructor-spotlight-section" className="max-w-6xl mx-auto px-6">
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white rounded-3xl p-8 md:p-12 border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                  {/* Instructor Portrait with Badges */}
                  <div className="relative shrink-0">
                    <div className="relative w-48 h-64 md:w-56 md:h-72 rounded-2xl overflow-hidden shadow-2xl border-2 border-blue-500/40 bg-slate-800">
                      <img 
                        src={proSanImage} 
                        alt="Pro San - Lead Instructor" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-3 text-center">
                        <span className="text-xs font-black text-white tracking-wide block">PRO SAN</span>
                        <span className="text-[10px] text-blue-400 uppercase tracking-widest font-mono">Lead Architect</span>
                      </div>
                    </div>

                    <div className="absolute -bottom-3 -right-3 bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg border border-blue-400/30 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-yellow-300" />
                      <span>Certified Instructor</span>
                    </div>
                  </div>

                  {/* Instructor Bio and Highlights */}
                  <div className="flex-1 space-y-5 text-center md:text-left">
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        <span>{lang === "en" ? "Meet Your Instructor" : "ស្គាល់គ្រូបង្រៀនរបស់អ្នក"}</span>
                      </div>
                      <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
                        {lang === "en" ? "Learn Directly from Pro San" : "រៀនសូត្រផ្ទាល់ជាមួយលោកគ្រូ Pro San"}
                      </h2>
                      <p className="text-blue-300 text-sm font-semibold">
                        {lang === "en" 
                          ? "Senior Software Architect & Founder of PRO SAN Academy" 
                          : "ស្ថាបត្យករផ្នែកទន់ជាន់ខ្ពស់ និងជាស្ថាបនិកសាលា PRO SAN"}
                      </p>
                    </div>

                    <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-2xl font-light">
                      {lang === "en"
                        ? "With over 8 years of engineering experience architecting scalable cloud and web solutions, Pro San designs production-ready curricula tailored specifically for Cambodian students. Learn modern full-stack development, best coding practices, and high-standard architecture."
                        : "ជាមួយបទពិសោធន៍ជាង ៨ ឆ្នាំក្នុងការស្ថាបនាប្រព័ន្ធបច្ចេកវិទ្យា និងគេហទំព័រខ្នាតធំ លោកគ្រូ Pro San បានរៀបចំមេរៀន និងកម្មវិធីសិក្សាជាក់ស្តែងសម្រាប់សិស្សកម្ពុជា ដើម្បីស្ទាត់ជំនាញកូដ Full-Stack និងស្ថាបត្យកម្មកម្រិតស្តង់ដារ។"}
                    </p>

                    {/* Stats Pill Row */}
                    <div className="grid grid-cols-3 gap-3 max-w-md pt-1 mx-auto md:mx-0">
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                        <span className="text-lg md:text-xl font-black text-white block">15k+</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{lang === "en" ? "Students" : "សិស្សានុសិស្ស"}</span>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                        <span className="text-lg md:text-xl font-black text-amber-400 block">4.9 ★</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{lang === "en" ? "Rating" : "ការវាយតម្លៃ"}</span>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                        <span className="text-lg md:text-xl font-black text-emerald-400 block">8+ Yrs</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{lang === "en" ? "Experience" : "បទពិសោធន៍"}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
                      <button
                        onClick={() => setView("courses")}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-900/40 text-xs md:text-sm cursor-pointer"
                      >
                        <span>{lang === "en" ? "Browse Pro San's Courses" : "ចូលមើលវគ្គសិក្សារបស់ Pro San"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setView("contact")}
                        className="bg-transparent hover:bg-white/10 text-white border border-white/20 font-bold py-3 px-5 rounded-xl transition-all text-xs md:text-sm cursor-pointer"
                      >
                        {lang === "en" ? "Send Message" : "ផ្ញើសារសួរនាំ"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Testimonials */}
            <section className="bg-slate-100 py-16 px-6">
              <div className="max-w-6xl mx-auto space-y-12">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {lang === "en" ? "Cambodia's Student Testimonials" : "មតិយោបល់របស់សិស្សានុសិស្ស"}
                  </h2>
                  <p className="text-slate-500 text-xs md:text-sm">{lang === "en" ? "Reviews from programming and tech alumni." : "សម្លេងពិតៗពីសិស្សដែលទទួលបានជោគជ័យក្នុងការងារ។"}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                    <p className="text-slate-600 text-xs md:text-sm italic leading-relaxed">
                      "Since finishing the mastering React & TypeScript series, I was verified passed and instantly hired as a Frontend Architect at a reputable firm in Phnom Penh. Recommended 100%!"
                    </p>
                    <div className="flex items-center gap-3 border-t border-slate-50 pt-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100" className="object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">Vireak Both</h4>
                        <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Frontend Engineer</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                    <p className="text-slate-600 text-xs md:text-sm italic leading-relaxed">
                      "I love the Khmer translations. Reading complex modular Express APIs became so natural. Having domestic bank ABA instant QR and support queue directly is incredibly comfortable."
                    </p>
                    <div className="flex items-center gap-3 border-t border-slate-50 pt-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100" className="object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">Phon Sophal</h4>
                        <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Software student</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                    <p className="text-slate-600 text-xs md:text-sm italic leading-relaxed">
                      "The AI Learning Counselor helps give custom course advice whenever I'm stuck with technical setups. Love the watermark support and the print/visual certificates."
                    </p>
                    <div className="flex items-center gap-3 border-t border-slate-50 pt-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" className="object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">Kanha Thida</h4>
                        <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider font-bold">UI/UX Alum</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* =============================================================
            VIEW: COURSES (SEARCH AND FILTERS)
           ============================================================= */}
        {view === "courses" && (
          <div id="courses-view-container" className="max-w-6xl mx-auto px-6 py-12 space-y-8">
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                {t("exploreCourses")}
              </h1>
              <div className="w-12 h-1 bg-slate-950 hidden md:block"></div>
            </div>

            {/* Filter and search bars */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search Bar Input Container */}
              <div className="relative w-full md:max-w-md">
                <Search className="w-4 h-4 text-slate-450 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder={lang === "en" ? "Filter by keywords (e.g. Node, React)..." : "ស្វែងរកតាមពាក្យគន្លឹះ..."}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 focus:bg-white text-xs border border-slate-250 focus:border-slate-400 focus:outline-none rounded-xl transition-colors"
                />
              </div>

              {/* Categorization Selection Tab items */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {["All", "AI Development", "Account Security", "Online Business"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      selectedCategory === cat 
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" 
                        : "bg-slate-50 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {cat === "All" 
                      ? (lang === "en" ? "All" : "ទាំងអស់") 
                      : cat === "AI Development"
                      ? (lang === "en" ? "AI Development" : "បច្ចេកវិទ្យា AI")
                      : cat === "Account Security"
                      ? (lang === "en" ? "Account Security" : "សុវត្ថិភាពគណនី")
                      : (lang === "en" ? "MMO & Business" : "រកប្រាក់តាមអនឡាញ MMO")}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {filteredCourses.map((item, idx) => {
                  const hasDiscount = item.discount > 0;
                  const currentPrice = hasDiscount 
                    ? Math.round(item.price * (1 - item.discount / 100)) 
                    : item.price;
                  
                  return (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.4) }}
                      onClick={() => { setSelectedCourseId(item.id); setView("course-detail"); }}
                      className="bg-white border border-slate-200/80 hover:border-slate-400 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col hover:scale-101"
                    >
                      <div className="aspect-video relative overflow-hidden bg-slate-100 group">
                        <img 
                          src={item.thumbnail} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                          {lang === "en" ? item.category : item.categoryKh}
                        </div>
                        {item.isFeatured ? (
                          <div className="absolute top-3 right-12 flex items-center gap-1.5">
                            <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                              <Tv className="w-2.5 h-2.5" /> HD
                            </span>
                            <span className="bg-yellow-500 text-slate-950 text-[10px] font-extrabold px-2 py-1 rounded-md uppercase tracking-wider">
                              {t("featured")}
                            </span>
                          </div>
                        ) : (
                          <div className="absolute top-3 right-12 flex items-center gap-1 bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded shadow tracking-wider">
                            <Tv className="w-3 h-3 text-cyan-200" />
                            <span>1080p HD</span>
                          </div>
                        )}

                        {/* HD PLAY Overlay on Hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 z-10 pointer-events-none">
                          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl border border-white/80 transform scale-90 group-hover:scale-100 transition-transform">
                            <Play className="w-5 h-5 fill-white translate-x-0.5" />
                          </div>
                          <span className="bg-slate-950/90 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border border-white/20 tracking-wider">
                            HD PLAY
                          </span>
                        </div>

                        {/* Favorite button absolute positioned */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.id);
                          }}
                          className={`absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md shadow-md border cursor-pointer transition-all duration-200 z-10 ${
                            favoriteCourseIds.includes(item.id)
                              ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-450 scale-110"
                              : "bg-white/85 dark:bg-slate-900/85 hover:bg-white dark:hover:bg-slate-800 text-rose-600 dark:text-rose-450 border-slate-200/50 dark:border-slate-800"
                          }`}
                          title={favoriteCourseIds.includes(item.id) ? "Remove from Favorites" : "Add to Favorites"}
                        >
                          <Heart className={`w-4 h-4 ${favoriteCourseIds.includes(item.id) ? "fill-current" : ""}`} />
                        </button>
                      </div>

                      <div className="p-5 flex-1 flex flex-col gap-3">
                        <h3 className="font-extrabold text-sm md:text-base text-slate-900 leading-snug">
                          {lang === "en" ? item.title : item.titleKh}
                        </h3>
                        <p className="text-slate-500 text-xs line-clamp-2">
                          {lang === "en" ? item.description : item.descriptionKh}
                        </p>

                        <div className="flex items-center gap-1 px-1.5 py-1 bg-slate-50 rounded-lg text-slate-500 text-[10px] font-semibold w-fit">
                          <Star className="w-3.5 h-3.5 text-amber-500 inline fill-amber-500" />
                          <span className="text-slate-800 font-extrabold">{item.rating}</span>
                          <span className="text-slate-400 font-normal">({item.reviewsCount} reviews)</span>
                        </div>

                        <div className="border-t border-slate-100 pt-4 mt-auto flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-bold font-mono">BY: {item.instructor}</span>
                          
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              {hasDiscount && (
                                <span className="text-slate-400 line-through text-xs font-mono font-bold">${item.price}</span>
                              )}
                              <span className="text-slate-950 font-extrabold text-md md:text-lg font-mono">${currentPrice}</span>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCourseId(item.id);
                                handleInitiateCheckout(item.id, "ABA Pay");
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all shadow hover:shadow-md cursor-pointer flex items-center gap-1"
                              title="Buy Now"
                            >
                              <span>{lang === "en" ? "Buy Now" : "ទិញឥឡូវ"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-12 bg-white rounded-3xl border border-slate-100 space-y-4">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-md font-bold text-slate-900">No Custom Courses Matches Found</h3>
                <p className="text-xs text-slate-500">Please refine your search keywords or try different classifications.</p>
              </div>
            )}
          </div>
        )}

        {/* =============================================================
            VIEW: COURSE DETAILS (TRAILER & INDEX)
           ============================================================= */}
        {view === "course-detail" && selectedCourseDetail && (
          <div id="course-details-view" className="max-w-6xl mx-auto px-6 py-12 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* Left description columns */}
              <div className="lg:col-span-2 space-y-6">
                <button 
                  onClick={() => setView("courses")}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg w-fit transition-colors cursor-pointer"
                >
                  ← {lang === "en" ? "Back to All Courses" : "ត្រឡប់ទៅវគ្គសិក្សាទាំងអស់"}
                </button>

                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  {lang === "en" ? selectedCourseDetail.title : selectedCourseDetail.titleKh}
                </h1>

                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 border-b border-slate-100 pb-4">
                  <span className="bg-blue-50 text-blue-800 px-2.5 py-1 rounded">
                    {lang === "en" ? selectedCourseDetail.category : selectedCourseDetail.categoryKh}
                  </span>
                  <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {selectedCourseDetail.rating}/5</span>
                  <span>{selectedCourseDetail.duration} Duration</span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-md md:text-lg font-extrabold text-slate-900 font-sans">{t("whatYouWillLearn")}</h3>
                  <p className="text-slate-600 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                    {lang === "en" ? selectedCourseDetail.description : selectedCourseDetail.descriptionKh}
                  </p>
                </div>

                {/* Course Instructor Profile Card */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4 shadow-2xs">
                  <img 
                    src={proSanImage} 
                    alt={selectedCourseDetail.instructor || "Pro San"} 
                    className="w-16 h-20 md:w-20 md:h-24 object-cover rounded-xl border-2 border-blue-500/40 shadow-xs shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {lang === "en" ? "Lead Instructor" : "គ្រូសម្របសម្រួល"}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verified
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm md:text-base">
                      {selectedCourseDetail.instructor || "Pro San"}
                    </h4>
                    <p className="text-slate-500 text-xs font-medium">
                      {selectedCourseDetail.instructorTitle || "Senior Software Architect & Founder"}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                      <span className="text-amber-500 font-bold flex items-center"><Star className="w-3 h-3 fill-amber-500 inline mr-0.5" /> 4.9 Rating</span>
                      <span>•</span>
                      <span>15k+ Students Taught</span>
                    </div>
                  </div>
                </div>

                {/* Lessons Accordion Index list */}
                <div className="space-y-4">
                  <h3 className="text-md md:text-lg font-extrabold text-slate-900 font-sans">{t("lessonsList")}</h3>
                  {lessons.length > 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                      {lessons.map((les) => (
                        <div key={les.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                              <Video className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-bold text-xs md:text-sm text-slate-900">
                                {lang === "en" ? les.title : les.titleKh}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-mono tracking-wider block font-bold mt-0.5">{les.duration} Streaming</span>
                            </div>
                          </div>
                          
                          {les.isPreview ? (
                            <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Preview free</span>
                          ) : (
                            <span className="text-[10px] uppercase font-bold text-slate-400"><Lock className="w-3.5 h-3.5 inline mr-1" /> locked</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 border border-slate-100 rounded-xl font-mono text-xs">
                      Curriculum scheduling pending updates from instructor.
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar checkout trigger details */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-slate-250 rounded-3xl p-6 shadow-xl sticky top-24 space-y-6">
                  <div 
                    onClick={() => {
                      const previewLesson = lessons.find(l => l.isPreview) || lessons[0];
                      setHdPreviewModal({
                        isOpen: true,
                        videoUrl: previewLesson?.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4",
                        title: `${lang === "en" ? selectedCourseDetail.title : selectedCourseDetail.titleKh} (HD 1080p Preview)`,
                        poster: selectedCourseDetail.thumbnail
                      });
                    }}
                    className="aspect-video bg-slate-100 rounded-2xl overflow-hidden shadow-inner relative group cursor-pointer"
                    title={lang === "en" ? "Click to play HD video preview" : "ចុចដើម្បីទស្សនាវីដេអូកម្រិត HD"}
                  >
                    <img 
                      src={selectedCourseDetail.thumbnail} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      referrerPolicy="no-referrer"
                    />
                    {/* HD Quality Tag */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-md border border-blue-400/30">
                      <Tv className="w-3 h-3 text-cyan-200" />
                      <span>1080p HD</span>
                    </div>

                    {/* HD PLAY Center Overlay */}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all flex flex-col items-center justify-center gap-2">
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-16 h-16 rounded-full bg-blue-500/40 animate-ping pointer-events-none"></div>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl border-2 border-white group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 fill-white translate-x-0.5" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md text-white text-xs font-black px-3.5 py-1 rounded-full border border-white/20 shadow-lg group-hover:border-blue-400">
                        <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black">HD</span>
                        <span>PLAY PREVIEW</span>
                      </div>
                      <span className="text-[10px] text-slate-300 font-mono drop-shadow">1080p Stream • High Bitrate</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-bold uppercase block tracking-widest leading-none">Course Special Standard Invoice</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-950 font-mono">
                        ${Math.round(selectedCourseDetail.price * (1 - selectedCourseDetail.discount / 100))}
                      </span>
                      {selectedCourseDetail.discount > 0 && (
                        <span className="text-slate-400 line-through font-mono text-xs font-bold">${selectedCourseDetail.price}</span>
                      )}
                      {selectedCourseDetail.discount > 0 && (
                        <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-md font-bold font-mono">-{selectedCourseDetail.discount}% OFF</span>
                      )}
                    </div>
                  </div>

                  {/* Buy / Study Actions buttons */}
                  {myCourses.find((c) => c.id === selectedCourseDetail.id) ? (
                    <div className="space-y-2">
                      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-center text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>{t("unlockedTag")}</span>
                      </div>
                      <button
                        onClick={() => { setView("student"); fetchMyCourses(); }}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer text-center"
                      >
                        {lang === "en" ? "Enter Student Watch Area" : "ចូលរៀនភ្លាមៗ"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Direct Buy Now Link */}
                      <a
                        id="buy-now-aba-link"
                        href={ABA_PAYWAY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          if (token) {
                            handleInitiateCheckout(selectedCourseDetail.id, "ABA Pay");
                          }
                        }}
                        className="w-full bg-gradient-to-r from-[#002d56] via-[#00386b] to-[#00a2db] hover:from-[#001c36] hover:to-[#008bc0] text-white font-black text-sm py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-101 transition-all cursor-pointer flex items-center justify-center gap-2 border border-cyan-400/40 group text-center"
                      >
                        <CreditCard className="w-4 h-4 text-cyan-300 group-hover:scale-110 transition-transform" />
                        <span className="tracking-wide">
                          {lang === "en" ? "Buy Now" : "ទិញឥឡូវនេះ"}
                        </span>
                        <ExternalLink className="w-4 h-4 text-cyan-200 group-hover:translate-x-0.5 transition-transform" />
                      </a>

                      {/* Scan QR / Select other Domestic & International Payment Methods */}
                      <button
                        id="buy-course-trigger"
                        onClick={() => handleInitiateCheckout(selectedCourseDetail.id)}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <QrCode className="w-3.5 h-3.5 text-slate-600" />
                        <span>{lang === "en" ? "Scan QR / Invoice Checkout" : "ស្កេន QR / វិក្កយបត្រទូទាត់"}</span>
                      </button>

                      {/* Fast ABA PayWay notice */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 font-mono">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>ABA: <strong>{ABA_ACCOUNT_NO}</strong></span>
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(ABA_ACCOUNT_NO);
                            setCopiedAbaAccount(true);
                            setTimeout(() => setCopiedAbaAccount(false), 2000);
                          }}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-sans text-[10px] cursor-pointer"
                        >
                          {copiedAbaAccount ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedAbaAccount ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-4 space-y-3 text-xs leading-relaxed text-slate-500">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-slate-700" />
                      <span>Cambodian multi-bank gateway compliant</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-slate-700" />
                      <span>Permanent validated certificates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tv className="w-4 h-4 text-slate-700 dark:text-slate-305" />
                      <span>Full HD unlisted player support</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Student Reviews & Ratings Section */}
            <div id="course-reviews-section" className="border-t border-slate-200 dark:border-slate-800 pt-10 space-y-8 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span>{lang === "en" ? "Student Reviews & Ratings" : "មតិយោបល់ និងការវាយតម្លៃ"}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {lang === "en" 
                      ? "Hear genuine reviews from certified student developers about this academy curriculum content." 
                      : "ស្តាប់ការវាយតម្លៃពិតប្រាកដពីសិស្សដែលបានសិក្សាវគ្គសិក្សានេះ។"}
                  </p>
                </div>

                {/* Rating Stat display card */}
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="text-center">
                    <span className="text-2xl font-black text-slate-900 dark:text-white block leading-none">{selectedCourseDetail.rating || "5.0"}</span>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase mt-0.5">{lang === "en" ? "Rating" : "ពិន្ទុ"}</span>
                  </div>
                  <div className="h-6 w-[1px] bg-slate-250 dark:bg-slate-850" />
                  <div>
                    <div className="flex items-center text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={`w-3 h-3 ${s <= Math.round(selectedCourseDetail.rating || 5) ? "fill-amber-500" : "text-slate-300 dark:text-slate-700"}`} 
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                      {selectedCourseDetail.reviewsCount || 0} {lang === "en" ? "total reviews" : "ការវាយតម្លៃសរុប"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1 & 2: Reviews List */}
                <div className="lg:col-span-2 space-y-4">
                  {courseReviews.length === 0 ? (
                    <div className="text-center p-10 bg-white dark:bg-slate-900/50 border border-slate-150 dark:border-slate-850 rounded-2xl shadow-sm text-slate-500">
                      <Star className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{lang === "en" ? "No student reviews left for this course yet." : "មិនទាន់មានការវាយតម្លៃសម្រាប់វគ្គសិក្សានេះទេ។"}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-505 mt-1">{lang === "en" ? "Be the first one to share your learning experience!" : "ក្លាយជាអ្នកដំបូងគេក្នុងការចែករំលែកបទពិសោធន៍សិក្សារបស់អ្នក!"}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {courseReviews.map((rev) => (
                        <div key={rev.id} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-3 transition-all hover:shadow-md">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden border border-slate-200 dark:border-slate-750">
                                <img 
                                  src={rev.userAvatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`} 
                                  className="object-cover w-full h-full"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div>
                                <span className="font-bold text-xs text-slate-900 dark:text-white block leading-tight">{rev.userName}</span>
                                <span className="text-[8.5px] text-slate-400 dark:text-slate-500 font-mono">
                                  {new Date(rev.createdAt).toLocaleString(lang === "en" ? "en-US" : "km-KH", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric"
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Stars rating */}
                            <div className="flex items-center text-amber-500 gap-0.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-slate-800">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span className="text-xs font-black font-mono leading-none">{rev.rating}.0</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                            {rev.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Column 3: Leave a Review Form */}
                <div className="lg:col-span-1">
                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-5">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-xs md:text-sm text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                        {lang === "en" ? "Leave Your Review" : "សរសេរការវាយតម្លៃរបស់អ្នក"}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {lang === "en" ? "Share your rating and feedback to help other students." : "ចែករំលែកការវាយតម្លៃរបស់អ្នកដើម្បីជួយសិស្សដទៃទៀត។"}
                      </p>
                    </div>

                    {/* Show login prompt if they are not logged in */}
                    {!token ? (
                      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-center space-y-3">
                        <Lock className="w-5 h-5 text-slate-400 mx-auto" />
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                          {lang === "en" ? "You must be signed in to submit a review." : "អ្នកត្រូវតែចូលគណនីមុននឹងអាចសរសេរការវាយតម្លៃបាន។"}
                        </p>
                        <button
                          onClick={() => { setShowAuthModal(true); setAuthMode("login"); }}
                          className="text-[10px] bg-slate-900 dark:bg-slate-800 hover:bg-slate-755 text-white font-bold px-3 py-2 rounded-lg w-full cursor-pointer transition-all"
                        >
                          {lang === "en" ? "Sign In Now" : "ចូលគណនីឥឡូវនេះ"}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Rating stars select button group */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono block">
                            {lang === "en" ? "Select Star Rating" : "ជ្រើសរើសផ្កាយវាយតម្លៃ"}
                          </label>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((starValue) => {
                              const isSelected = starValue <= reviewRating;
                              return (
                                <button
                                  key={starValue}
                                  type="button"
                                  onClick={() => setReviewRating(starValue)}
                                  className="p-1 rounded hover:scale-115 transition-transform cursor-pointer group"
                                  title={`${starValue} Stars`}
                                >
                                  <Star 
                                    className={`w-6 h-6 transition-colors ${
                                      isSelected
                                        ? "text-amber-500 fill-amber-500" 
                                        : "text-slate-350 dark:text-slate-700 hover:text-amber-400"
                                    }`} 
                                  />
                                </button>
                              );
                            })}
                            <span className="text-xs font-black font-mono text-slate-600 dark:text-slate-300 ml-1.5">
                              {reviewRating}.0 / 5.0
                            </span>
                          </div>
                        </div>

                        {/* Comment text area */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono block">
                            {lang === "en" ? "Review Comment" : "មតិយោបល់របស់អ្នក"}
                          </label>
                          <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            rows={4}
                            placeholder={lang === "en" ? "What did you like or dislike about this course curriculum and instructor style?" : "តើអ្នកពេញចិត្តអ្វីខ្លះចំពោះវគ្គសិក្សាមេរៀន និងស្ទីលបង្រៀនរបស់គ្រូ?"}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-605 outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 resize-none"
                            maxLength={1000}
                          />
                        </div>

                        {/* Error and Success Feedback labels */}
                        {reviewSubmitError && (
                          <div className="bg-red-50 dark:bg-red-950/30 border border-red-150 dark:border-red-900/40 text-red-700 dark:text-red-400 p-2.5 rounded-xl text-[10px] leading-relaxed">
                            {reviewSubmitError}
                          </div>
                        )}
                        {reviewSubmitSuccess && (
                          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-150 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400 p-2.5 rounded-xl text-[10px] leading-relaxed">
                            {reviewSubmitSuccess}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => executeSubmitReview(selectedCourseDetail.id)}
                          disabled={isSubmittingReview}
                          className="w-full bg-slate-950 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>
                            {isSubmittingReview
                              ? (lang === "en" ? "Submitting..." : "កំពុងបញ្ជូន...")
                              : (lang === "en" ? "Submit Review" : "បញ្ជូនការវាយតម្លៃ")}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* =============================================================
            VIEW: ABOUT ACADEMY
           ============================================================= */}
        {view === "about" && (
          <div id="about-us-view" className="max-w-4xl mx-auto px-6 py-16 space-y-12">
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                {lang === "en" ? "Bilingual Digital Learning Standards" : "ស្ដង់ដារអប់រំឌីជីថលទ្វេភាសាកម្ពុជា"}
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-sans max-w-xl mx-auto leading-relaxed">
                Empowering the next generation of Cambodian developers and IT professionals with highly optimized client/server web architectures, responsive interfaces, and Google Sheets database synchronizations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs md:text-sm pl-2">
              <div className="space-y-3">
                <h3 className="font-extrabold text-slate-900 text-md">{lang === "en" ? "Interactive LMS Vision" : "ចក្ខុវិស័យរបស់យើង"}</h3>
                <p className="text-slate-600 leading-relaxed">
                  We believe standard digital learning should be accessible, visually pixel-perfect, secure and highly localized. By offering both English instructions and natural Khmer terminology translations side-by-side, we break educational boundaries for engineers and designers nationwide.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-extrabold text-slate-900 text-md">{lang === "en" ? "Domestic Merchant Ecosystem" : "ប្រព័ន្ធទូទាត់ទូទាំងប្រទេស"}</h3>
                <p className="text-slate-600 leading-relaxed">
                  Integrating multi-bank payment networks directly (including ABA Pay, Wing Bank, Acleda QR, and international options Stripe or PayPal) guarantees that seamless student registration is always responsive and verified securely.
                </p>
              </div>
            </div>

            {/* Leadership & Founder Spotlight: Pro San */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-xs">
              <div className="relative shrink-0">
                <img 
                  src={proSanImage} 
                  alt="Pro San - Academy Founder & Lead Instructor" 
                  className="w-32 h-40 md:w-36 md:h-44 object-cover rounded-2xl border-2 border-blue-500/50 shadow-md"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-white flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> Founder
                </span>
              </div>
              <div className="space-y-2 text-center md:text-left">
                <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {lang === "en" ? "Academy Founder & Lead Instructor" : "ស្ថាបនិក និងគ្រូបង្រៀនចម្បង"}
                </span>
                <h3 className="text-xl md:text-2xl font-black text-slate-900">Pro San</h3>
                <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                  {lang === "en"
                    ? "Dedicated to cultivating high-impact software engineering talent throughout Cambodia through bilingual, production-grade technical education, practical code reviews, and hands-on architectural mentorship."
                    : "ប្តេជ្ញាចិត្តក្នុងការបណ្តុះបណ្តាលធនធានមនុស្សផ្នែកបច្ចេកវិទ្យា និងវិស្វកម្មផ្នែកទន់នៅកម្ពុជា តាមរយៈការអប់រំបែបអនុវត្តជាក់ស្តែងទ្វេភាសា ការត្រួតពិនិត្យកូដ និងស្ថាបត្យកម្មកម្រិតអន្តរជាតិ។"}
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-blue-600" /> Senior Architect</span>
                  <span>•</span>
                  <span>15k+ Students Taught</span>
                  <span>•</span>
                  <span>Phnom Penh, Cambodia</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
              <div className="space-y-2">
                <h3 className="text-md font-bold">{lang === "en" ? "Seeking Technical Career Counseling?" : "ត្រូវការការប្រឹក្សាបន្ថែមអំពីការសិក្សា?"}</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-lg">{lang === "en" ? "Chat directly with our custom Gemini-powered academy virtual assistant to explore suitable courses." : "ជជែកជាមួយប្រព័ន្ធអ្នកប្រឹក្សាវៃឆ្លាត (AI) របស់យើងដើម្បីទទួលបានការណែនាំពីវគ្គសិក្សាដែលស័ក្តិសម។"}</p>
              </div>
              <button onClick={() => {
                const element = document.getElementById("ai-assistant-toggle");
                if (element) {
                  (element as HTMLElement).click();
                }
              }} className="bg-white hover:bg-slate-100 text-slate-900 font-bold px-5 py-2.5 rounded-xl text-xs whitespace-nowrap cursor-pointer">
                Talk to Assistant
              </button>
            </div>
          </div>
        )}

        {/* =============================================================
            VIEW: CONTACT TEACHERS Support Inbox
           ============================================================= */}
        {view === "contact" && (
          <div id="contact-us-view" className="max-w-4xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Contact details */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                  {t("contact")}
                </h1>
                <p className="text-slate-500 text-xs md:text-sm">We're glad to address your curriculum inquiries directly.</p>
              </div>

              <div className="space-y-4 text-xs md:text-sm text-slate-700">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-900" />
                  <span>Norodom Boulevard, Phnom Penh, Cambodia</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-slate-900" />
                  <span>+855 12 345 678</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-900" />
                  <span>support@lms-cambodia.com</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl text-xs leading-relaxed text-slate-500 space-y-2">
                <span className="font-bold text-slate-800 uppercase block tracking-wider">Teacher Support Queue</span>
                <p>All questions are dispatched instantly into the instructor's inbox for timely code reviews and technical feedback.</p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white border border-slate-205 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm md:text-base mb-4">Send support question directly</h3>
              
              <form onSubmit={processContactSubmission} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-605 font-bold mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-605 font-bold mb-1">Subject / Associated Course</label>
                  <select
                    value={contactForm.course}
                    onChange={(e) => setContactForm({ ...contactForm, course: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 transition-all cursor-pointer"
                  >
                    <option value="General Question">General / Enrollment Question</option>
                    <option value="Mastering React & TypeScript">Mastering React & TypeScript</option>
                    <option value="Node.js & Express Backend">Node.js & Express Backend</option>
                    <option value="UI/UX Design foundations">UI/UX Design foundations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-605 font-bold mb-1">Detailed Message</label>
                  <textarea
                    rows={4}
                    required
                    value={contactForm.msg}
                    onChange={(e) => setContactForm({ ...contactForm, msg: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 transition-all"
                    placeholder="Provide context regarding code issues or billing inquiries..."
                  />
                </div>

                {contactSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-emerald-800 text-xs">
                    {contactSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Dispatch Message
                </button>
              </form>
            </div>

          </div>
        )}

        {/* =============================================================
            VIEW: INSTANT INVOICE INTERACTIVE CHECKOUT & QR PAY
           ============================================================= */}
        {view === "checkout" && checkoutInfo && (
          <div id="checkout-view" className="max-w-4xl mx-auto px-6 py-12 space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 leading-none">
                {t("checkoutTitle")}
              </h1>
              <p className="text-slate-500 text-xs md:text-sm">Complete domestic banking authentication in standard layout.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              
              {/* Left gateway details selection */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm leading-tight border-b border-slate-100 pb-2">
                    {t("selectGateway")}
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    {["ABA Pay", "Wing Pay", "ACLEDA Pay", "TrueMoney", "PayPal", "Stripe"].map((g) => (
                      <button
                        key={g}
                        onClick={() => performGatewaySelectionChange(g)}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                          paymentGateway === g 
                            ? "border-blue-500 bg-blue-50/50 text-blue-800" 
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                        <span>{g}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md space-y-4">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block font-bold leading-none">Transaction Invoice details</span>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-300 block">{lang === "en" ? "Purchase Amount" : "តម្លៃត្រូវទូទាត់"}</span>
                    <span className="text-3xl font-black block font-mono text-yellow-400">${checkoutInfo.order?.amount} USD</span>
                  </div>
                  <div className="text-[10px] text-slate-400 space-y-1 font-mono">
                    <p>Reference Code: {checkoutInfo.order?.transactionId}</p>
                    <p>Status Indicator: PENDING_CONFIRMATION</p>
                  </div>
                </div>
              </div>

              {/* Right interactive scan area */}
              <div className="bg-white border border-slate-250 p-6 md:p-8 rounded-3xl shadow-xl space-y-5 text-center flex flex-col justify-center items-center">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-center gap-2">
                    {paymentGateway === "ABA Pay" && (
                      <span className="bg-[#002d56] text-cyan-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-cyan-400/30">
                        ABA Mobile Pay
                      </span>
                    )}
                    <h3 className="font-extrabold text-slate-900 text-sm md:text-base leading-snug">
                      {paymentGateway === "ABA Pay" ? "ABA Pay Direct Checkout" : `${paymentGateway} Integrated Scan`}
                    </h3>
                  </div>
                  <p className="text-slate-500 text-xs font-medium max-w-sm mx-auto leading-relaxed">
                    {paymentGateway === "ABA Pay" 
                      ? (lang === "en" ? "Click 'Buy Now' to open ABA Mobile, or scan the KHQR code below." : "ចុច 'Buy Now' ដើម្បីបើក ABA Mobile ឬស្កេន KHQR ខាងក្រោម។")
                      : t("paySubtitle")}
                  </p>
                </div>

                {/* ABA Direct Link Button */}
                {paymentGateway === "ABA Pay" && (
                  <a
                    id="aba-checkout-direct"
                    href={checkoutInfo.paywayUrl || ABA_PAYWAY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full max-w-sm bg-gradient-to-r from-[#002d56] via-[#00386b] to-[#00a2db] hover:from-[#001c36] hover:to-[#008bc0] text-white text-xs font-black py-3.5 px-5 rounded-2xl shadow-lg hover:shadow-xl hover:scale-101 transition-all cursor-pointer flex items-center justify-center gap-2 border border-cyan-400/40 group"
                  >
                    <CreditCard className="w-4 h-4 text-cyan-300 group-hover:scale-110 transition-transform" />
                    <span className="tracking-wide">
                      {lang === "en" ? "Buy Now via ABA Link" : "ទិញឥឡូវនេះតាម ABA Link"}
                    </span>
                    <ExternalLink className="w-4 h-4 text-cyan-200 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                )}

                {/* QR Code display */}
                {checkoutInfo.qrcode ? (
                  <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-inner w-48 h-48 flex flex-col items-center justify-center relative">
                    <img 
                      src={checkoutInfo.qrcode} 
                      alt="Payment QR Code" 
                      className="w-full h-full object-contain" 
                    />
                    {paymentGateway === "ABA Pay" && (
                      <span className="absolute -bottom-2.5 bg-[#002d56] text-cyan-200 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-cyan-400/40 shadow">
                        ABA Pay KHQR
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-8 bg-slate-50 border border-slate-100 rounded-xl w-48 h-48 flex flex-col items-center justify-center gap-2 text-slate-400 leading-tight">
                    <Lock className="w-8 h-8 text-slate-300" />
                    <span className="text-[10px] font-mono">CC GATEWAY SECURE INTEGRATED PROXIES</span>
                  </div>
                )}

                {/* ABA Account Breakdown Box */}
                {paymentGateway === "ABA Pay" && (
                  <div className="w-full max-w-sm bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">ABA Account:</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                        <span className="text-sm text-[#002d56]">{checkoutInfo.abaAccount || ABA_ACCOUNT_NO}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(checkoutInfo.abaAccount || ABA_ACCOUNT_NO);
                            setCopiedAbaAccount(true);
                            setTimeout(() => setCopiedAbaAccount(false), 2000);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 cursor-pointer"
                          title="Copy Account Number"
                        >
                          {copiedAbaAccount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Merchant Code:</span>
                      <span className="font-mono font-semibold text-slate-700">{checkoutInfo.abaMerchantCode || ABA_MERCHANT_CODE}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Merchant Name:</span>
                      <span className="font-bold text-slate-800">{checkoutInfo.abaMerchantName || "PRO SAN / ABA PAY"}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate pt-1.5 border-t border-slate-200 flex items-center justify-between">
                      <span className="truncate max-w-[200px]">{checkoutInfo.paywayUrl || ABA_PAYWAY_URL}</span>
                      <a
                        href={checkoutInfo.paywayUrl || ABA_PAYWAY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-0.5 ml-1 shrink-0"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                )}

                {verificationFeedback && (
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-emerald-800 text-xs w-full max-w-sm animate-bounce">
                    {verificationFeedback}
                  </div>
                )}

                <button
                  id="confirm-payment-btn"
                  onClick={handleVerifyManualPayment}
                  className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3.5 px-6 rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>{t("verifyPayment")}</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* =============================================================
            VIEW: STUDENT STUDY LEARNING AREA (WATCH VIDEO LESSON)
           ============================================================= */}
        {view === "student" && (
          <div id="student-dashboard" className="max-w-6xl mx-auto px-6 py-12 space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                  {t("myCourses")}
                </h1>
                <p className="text-slate-500 text-xs md:text-sm">Track your progress, stream instructions classes, and claim verified credentials completions.</p>
              </div>

              {/* Claims certified completed condition info block */}
              {lessons.length > 0 && selectedCourseDetail && (
                <div onClick={claimSchoolCertificate} className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-sans font-bold text-xs p-3.5 rounded-2xl flex items-center gap-2 shadow-lg transition-transform hover:scale-102 cursor-pointer select-none">
                  <Award className="w-5 h-5 text-slate-950 animate-bounce" />
                  <span>{t("certificateClaim")} ({computedProgressPercentage}% {lang === "en" ? "Ready" : "រួចរាល់"})</span>
                </div>
              )}
            </div>

            {/* Student Dashboard Tabs Switcher Bar */}
            <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 pb-0.5" id="student-tab-switcher">
              <button
                onClick={() => setStudentTab("enrolled")}
                className={`pb-3 px-4 font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer ${
                  studentTab === "enrolled"
                    ? "border-slate-900 dark:border-slate-100 text-slate-950 dark:text-white font-extrabold"
                    : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                {lang === "en" ? `My Enrolled Courses (${myCourses.length})` : `វគ្គសិក្សាកំពុងរៀន (${myCourses.length})`}
              </button>
              <button
                onClick={() => setStudentTab("favorites")}
                className={`pb-3 px-4 font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  studentTab === "favorites"
                    ? "border-slate-900 dark:border-slate-100 text-slate-950 dark:text-white font-extrabold"
                    : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${favoriteCourseIds.length > 0 ? "text-rose-500 fill-rose-500 animate-pulse" : "text-slate-400"}`} />
                <span>{lang === "en" ? `Saved Favorites (${favoriteCourseIds.length})` : `វគ្គសិក្សាពេញចិត្ត (${favoriteCourseIds.length})`}</span>
              </button>
            </div>

            {studentTab === "favorites" ? (
              favoritedCoursesList.length > 0 ? (
                <div id="student-dashboard-favorites" className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight uppercase font-mono">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                      <span>{lang === "en" ? "My Saved Course Catalog Favorites" : "វគ្គសិក្សាដែលបានរក្សាក្នុងបញ្ជីពេញចិត្ត"}</span>
                    </h2>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-full font-bold">
                      {favoritedCoursesList.length} {lang === "en" ? "Items" : "មុខវិជ្ជា"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {favoritedCoursesList.map((item, idx) => {
                      const isEnrolled = myCourses.some((c) => c.id === item.id);
                      const hasDiscount = item.discount > 0;
                      const currentPrice = hasDiscount 
                        ? Math.round(item.price * (1 - item.discount / 100)) 
                        : item.price;

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-all duration-200"
                        >
                          <div className="aspect-video relative overflow-hidden bg-slate-150 dark:bg-slate-800">
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                              {lang === "en" ? item.category : item.categoryKh}
                            </div>
                            
                            {/* Favorite toggle right inside the custom grid card */}
                            <button
                              onClick={() => toggleFavorite(item.id)}
                              className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center backdrop-blur-md shadow-md border border-rose-400 cursor-pointer transition-all scale-110"
                              title="Remove from Saved Favorites"
                            >
                              <Heart className="w-4 h-4 fill-white animate-pulse" />
                            </button>
                          </div>

                          <div className="p-5 flex-1 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              {isEnrolled ? (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold font-mono tracking-wider border border-emerald-150 dark:border-emerald-800/50">
                                  {lang === "en" ? "ENROLLED" : "កំពុងរៀន"}
                                </span>
                              ) : (
                                <span className="text-[10px] bg-slate-55 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold font-mono tracking-wider border border-slate-200/50 dark:border-slate-800">
                                  {lang === "en" ? "NOT ENROLLED" : "មិនទាន់ចុះឈ្មោះ"}
                                </span>
                              )}
                            </div>

                            <h3 className="font-extrabold text-xs md:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                              {lang === "en" ? item.title : item.titleKh}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-2">
                              {lang === "en" ? item.description : item.descriptionKh}
                            </p>

                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-auto flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-bold font-mono uppercase">BY: {item.instructor}</span>
                                <div className="flex items-center gap-1.5 font-mono">
                                  {hasDiscount && (
                                    <span className="text-slate-405 line-through text-[10.5px] font-bold">${item.price}</span>
                                  )}
                                  <span className="text-slate-950 dark:text-slate-100 font-extrabold text-xs md:text-sm">${currentPrice}</span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setSelectedCourseId(item.id); setView("course-detail"); }}
                                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-[10.5px] font-bold py-2 px-3 rounded-xl transition-all cursor-pointer text-center"
                                >
                                  {lang === "en" ? "View Details" : "ព័ត៌មានលម្អិត"}
                                </button>
                                {isEnrolled ? (
                                  <button
                                    onClick={() => {
                                      setSelectedCourseId(item.id);
                                      const found = myCourses.find((c) => c.id === item.id);
                                      if (found) setSelectedCourseDetail(found);
                                      setStudentTab("enrolled");
                                    }}
                                    className="flex-1 bg-slate-950 hover:bg-slate-850 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 text-[10.5px] font-bold py-2 px-3 rounded-xl transition-all cursor-pointer text-center"
                                  >
                                    {lang === "en" ? "Study Now" : "សិក្សាឥឡូវនេះ"}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedCourseId(item.id);
                                      setView("course-detail");
                                    }}
                                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white text-[10.5px] font-bold py-2 px-3 rounded-xl transition-all cursor-pointer text-center"
                                  >
                                    {lang === "en" ? "Register" : "ចុះឈ្មោះរៀន"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div id="student-favorites-empty" className="text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 max-w-xl mx-auto space-y-6 shadow-sm my-4">
                  <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/40 rounded-full flex items-center justify-center mx-auto text-rose-500">
                    <Heart className="w-6 h-6 fill-current text-rose-500 text-center animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{lang === "en" ? "Your Favorites list is currently empty" : "មិនទាន់មានវគ្គសិក្សាក្នុងបញ្ជីពេញចិត្តទេ"}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      {lang === "en" ? "Browse our masterclasses catalog to find rich academic resources and tap the heart icon on any course card to bookmark it here!" : "ចូលលម្អិតវគ្គសិក្សា និងចុចលើរូបបេះដូងដើម្បីរក្សាទុកវគ្គសិក្សាដែលអ្នកពេញចិត្តនៅទីនេះ! "}
                    </p>
                  </div>
                  <button
                    onClick={() => setView("courses")}
                    className="bg-slate-900 hover:bg-slate-850 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 text-xs font-bold py-3 px-6 rounded-2xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2 mx-auto justify-center"
                  >
                    <span>{lang === "en" ? "Browse Courses" : "ស្វែងរកវគ្គសិក្សា"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            ) : (
              <>
                {/* Learning Path & Progress Graph */}
            {selectedCourseDetail && lessons.length > 0 && (
              <div id="learning-path-visualizer" className="bg-gradient-to-br from-slate-900 to-slate-950 dark:from-slate-950 dark:to-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 font-mono tracking-widest uppercase block">Interactive Masterclass Timeline</span>
                    <h2 className="text-lg md:text-xl font-extrabold flex items-center gap-2 font-sans tracking-tight">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      <span>{lang === "en" ? "Your Academic Learning Path" : "គំនូសថ្នាលសិក្សាផ្ទាល់ខ្លួន"}</span>
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      {lang === "en" ? `Currently learning: "${selectedCourseDetail.title}"` : `វគ្គសិក្សាកំពុងរៀន៖ "${selectedCourseDetail.titleKh}"`}
                    </p>
                  </div>

                  {/* Summary indicators */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                    <div className="bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700/50">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">{lang === "en" ? "Study Time Spent" : "ពេលវេលាសិក្សាសរុប"}</span>
                      <span className="text-sm font-black text-emerald-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        {learningStats.completedTimeFormatted}
                      </span>
                    </div>
                    <div className="bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700/50">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">{lang === "en" ? "Completed Tasks" : "មេរៀនបានបញ្ចប់"}</span>
                      <span className="text-sm font-black text-amber-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {learningStats.completedCount} / {learningStats.totalCount} {lang === "en" ? "Lessons" : "មេរៀន"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar with percentage */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-400 font-semibold font-sans">
                    <span>{lang === "en" ? "Overall Curriculum Completion" : "ភាគរយនៃការរៀនសរុប"}</span>
                    <span className="text-yellow-400 font-mono font-bold text-sm">{computedProgressPercentage}% {lang === "en" ? "Done" : "រួចរាល់"}</span>
                  </div>
                  <div className="w-full bg-slate-800/60 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-700/30">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700 shadow-inner flex items-center justify-end px-1.5" 
                      style={{ width: `${computedProgressPercentage}%` }}
                    >
                      {computedProgressPercentage > 8 && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Interactive Node Graph representation */}
                <div className="space-y-3">
                  <span className="text-[10px] text-slate-400 font-bold tracking-wider font-mono uppercase block">{lang === "en" ? "Upcoming Milestones & Achievements Graph" : "សមិទ្ធផលសិក្សានិងគោលដៅបន្ទាប់"}</span>
                  
                  {/* Dynamic Nodes timeline scale */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                    <div className="hidden sm:block absolute top-[28px] left-[10%] right-[10%] h-0.5 bg-slate-800/30 z-0 border-dashed border border-slate-700/50" />
                    
                    {learningStats.upcomingMilestones.map((milestone, idx) => {
                      const IconComponent = milestone.icon === "BookOpen" ? BookOpen 
                        : milestone.icon === "TrendingUp" ? TrendingUp
                        : milestone.icon === "Sparkles" ? Sparkles
                        : Award;
                      
                      return (
                        <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex sm:flex-col items-center gap-3.5 sm:text-center relative z-10 transition-all hover:border-slate-700">
                          {/* Circle dot representation with background indicator */}
                          <div 
                            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border ${
                              milestone.completed 
                                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20" 
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>

                          <div className="space-y-1 text-left sm:text-center min-w-0">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center sm:justify-center gap-1">
                              {milestone.completed ? (
                                <span className="text-emerald-400 flex items-center gap-0.5"><Check className="w-2.5 h-2.5" /> {lang === "en" ? "UNLOCKED" : "បានបើក"}</span>
                              ) : (
                                <span className="text-slate-400">{lang === "en" ? "LOCKED" : "ចាក់សោ"}</span>
                              )}
                              <span>• {milestone.percentage}%</span>
                            </span>
                            <h4 className="font-extrabold text-[11px] text-white tracking-tight line-clamp-1 truncate leading-snug">{milestone.title}</h4>
                            <p className="text-[10px] text-slate-400 line-clamp-1 truncate leading-relaxed">{milestone.lessonTitle}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {myCourses.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Course Selector Tabs and Player list */}
                <div className="lg:col-span-1 space-y-4">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block font-bold">Your Unlocked Inventory</span>
                  <div className="space-y-2.5">
                    {myCourses.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => { setSelectedCourseId(c.id); setSelectedCourseDetail(c); }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                          selectedCourseId === c.id 
                            ? "border-slate-800 bg-white shadow-md font-bold" 
                            : "border-slate-200 hover:bg-slate-100 bg-white/70"
                        }`}
                      >
                        <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                          <img src={c.thumbnail} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <h4 className="text-xs md:text-sm text-slate-900 leading-tight">
                            {lang === "en" ? c.title : c.titleKh}
                          </h4>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">{c.duration} Curriculum</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sub-Lesson player progress tracker widget */}
                  {selectedCourseDetail && (
                    <div className="bg-white border border-slate-150 p-4 rounded-2xl text-xs space-y-3 shadow-sm">
                      <div className="flex justify-between items-center text-slate-700">
                        <span>{t("progress")}</span>
                        <span className="font-bold">{computedProgressPercentage}% Finished</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-500" 
                          style={{ width: `${computedProgressPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Main streaming area viewport */}
                <div className="lg:col-span-2 space-y-6 bg-white border border-slate-200 rounded-3xl p-4 md:p-6 shadow-sm">
                  {selectedCourseDetail && lessons.length > 0 ? (
                    <div className="space-y-6">
                      <h3 className="font-extrabold text-slate-900 text-sm md:text-base">
                        {t("nowPlaying")}: <span className="text-blue-600 font-sans">{lang === "en" ? lessons.find((l) => l.id === activeLessonId)?.title : lessons.find((l) => l.id === activeLessonId)?.titleKh}</span>
                      </h3>

                      {/* Secured video containers */}
                      <VideoPlayer
                        videoUrl={lessons.find((l) => l.id === activeLessonId)?.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4"}
                        watermarkText={currentUser ? currentUser.email : "Sabai LMS student"}
                        onEnded={triggerAICourseGenerator}
                        title={lessons.find((l) => l.id === activeLessonId)?.title || ""}
                        currentLang={lang}
                        poster={selectedCourseDetail.thumbnail}
                      />

                      {/* Options bar auto play etc */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-slate-600">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={autoPlayNext} 
                            onChange={(e) => setAutoPlayNext(e.target.checked)}
                            className="accent-slate-900 cursor-pointer"
                          />
                          <span>{t("autoNext")}</span>
                        </label>
                        <span className="text-slate-400 text-[10px] font-mono">{t("watermarkDisclaimer")}</span>
                      </div>

                      {/* Individual course lessons tabs selector index */}
                      <div className="space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <Video className="w-4 h-4 text-slate-505" />
                            <span>{lang === "en" ? `LMS WATCHLIST INDEX (${filteredLessons.length}/${lessons.length})` : `មាតិកាវគ្គសិក្សា (${filteredLessons.length}/${lessons.length})`}</span>
                          </h4>
                          
                          {/* Search input to filter lessons */}
                          <div className="relative w-full md:w-64">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={lessonSearchText}
                              onChange={(e) => setLessonSearchText(e.target.value)}
                              placeholder={lang === "en" ? "Filter lessons by name..." : "ស្វែងរកមេរៀនតាមឈ្មោះ..."}
                              className="w-full bg-slate-50 dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700"
                            />
                            {lessonSearchText && (
                              <button
                                onClick={() => setLessonSearchText("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {filteredLessons.length === 0 ? (
                          <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                            <Video className="w-6 h-6 text-slate-350 dark:text-slate-700 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 font-medium font-sans">
                              {lang === "en" ? "No lessons match your search criteria." : "រកមិនឃើញមេរៀនដែលត្រូវនឹងការស្វែងរករបស់អ្នកទេ។"}
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {filteredLessons.map((les) => (
                              <div
                                key={les.id}
                                onClick={() => setActiveLessonId(les.id)}
                                className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                                  activeLessonId === les.id 
                                    ? "border-slate-950 bg-slate-950 text-white font-bold" 
                                    : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Video className="w-4 h-4 shrink-0" />
                                  <span className="text-xs line-clamp-1">{lang === "en" ? les.title : les.titleKh}</span>
                                </div>
                                <span className="text-[9px] font-mono opacity-80">{les.duration}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-12 space-y-4">
                      <Tv className="w-10 h-10 text-slate-300 mx-auto" />
                      <h4 className="font-extrabold text-slate-900 text-sm">Please select a course on the sidebar tab to begin streaming.</h4>
                      <p className="text-slate-400 text-xs">Curriculums materials will mount here.</p>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="text-center bg-white border border-slate-200 rounded-3xl p-12 max-w-xl mx-auto space-y-6">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-md font-bold text-slate-900">Your Student Learning Inventory is Empty</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Browse our certified courses catalog to find rich masterclasses, complete local Bank Scan payments, and start streaming!
                </p>
                <button
                  onClick={() => setView("courses")}
                  className="bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold py-3 px-6 rounded-2xl shadow-md transition-all cursor-pointer"
                >
                  {lang === "en" ? "Explore Courses Catalog" : "ស្វែងរកវគ្គសិក្សា"}
                </button>
              </div>
            )}
          </>
        )}
          </div>
        )}

        {/* =============================================================
            VIEW: ADMIN DASHBOARD AND CMS PLATFORM CONTROLS
           ============================================================= */}
        {view === "admin" && (
          <div id="admin-view-panel" className="max-w-6xl mx-auto px-6 py-12 space-y-12">
            
            {/* Header statistics columns widget */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                  {t("overview")}
                </h1>
                <p className="text-slate-500 text-xs md:text-sm">Manage users registers, course listings, and verify payment scans.</p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                {/* Export Users CSV button */}
                <button
                  id="admin-header-export-users-csv-btn"
                  onClick={handleExportUsersCSV}
                  disabled={isExportingCsv}
                  className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold py-3 px-4 rounded-2xl border border-slate-200 shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer disabled:opacity-50"
                  title="Export full user roster to CSV for offline reporting"
                >
                  {isExportingCsv ? (
                    <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
                  ) : csvExportSuccess ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Download className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>{csvExportSuccess ? "CSV Exported!" : t("exportUsersCsv")}</span>
                </button>

                {/* Course creating action modal trigger */}
                <button
                  onClick={() => setShowCourseModal(true)}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 px-5 rounded-2xl shadow-lg transition-transform hover:scale-102 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>{t("addCourse")}</span>
                </button>
              </div>
            </div>

            {/* Analytics Grid */}
            {adminAnalytics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white border border-slate-250 p-5 rounded-3xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t("totalUsers")}</span>
                  <p className="text-2xl md:text-3xl font-semibold text-slate-950">{adminAnalytics.totalUsers || 0}</p>
                </div>
                <div className="bg-white border border-slate-250 p-5 rounded-3xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t("totalSales")}</span>
                  <p className="text-2xl md:text-3xl font-semibold text-slate-950">{adminAnalytics.totalSalesCount || 0}</p>
                </div>
                <div className="bg-white border border-slate-250 p-5 rounded-3xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t("totalRevenue")}</span>
                  <p className="text-2xl md:text-3xl font-semibold text-slate-950">${adminAnalytics.totalRevenue || 0} USD</p>
                </div>
                <div className="bg-white border border-slate-250 p-5 rounded-3xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t("activeStudents")}</span>
                  <p className="text-2xl md:text-3xl font-semibold text-slate-950">{adminAnalytics.activeStudents || 0}</p>
                </div>
              </div>
            )}

            {/* Audit Log Severity Summary Widget */}
            <div id="admin-audit-summary-widget" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest block font-mono">LMS Compliance Integrity</span>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-505 dark:text-slate-400" />
                    <span>Audit Events Severity Overview</span>
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-bold">
                  Total Synced Events: {auditSummaryStats.totalCount}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Critical section */}
                <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 p-4 rounded-2xl flex items-start gap-3.5">
                  <div className="p-2.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl shrink-0 mt-0.5 justify-center flex items-center">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-850 dark:text-red-300">Critical Actions</span>
                      <span className="text-[10px] font-mono font-bold text-red-500">{auditSummaryStats.criticalPercentage}%</span>
                    </div>
                    <p className="text-xl font-extrabold text-red-950 dark:text-red-250 leading-none">{auditSummaryStats.criticalCount} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 font-sans">Events</span></p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-405 leading-relaxed">Includes delete permissions and administrative operations: course deletions, user deletes, and ban updates.</p>
                  </div>
                </div>

                {/* Informational section */}
                <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl flex items-start gap-3.5">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl shrink-0 mt-0.5 justify-center flex items-center">
                    <Info className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-705 dark:text-slate-300">Informational Logs</span>
                      <span className="text-[10px] font-mono font-bold text-slate-550">{auditSummaryStats.infoPercentage}%</span>
                    </div>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">{auditSummaryStats.informationalCount} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 font-sans">Events</span></p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-405 leading-relaxed">System logs, routine setups, and active flows: course creation, lesson setup revisions, payment verification clicks.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Tabs Sections CMS panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-xs">
              
              {/* CMS Course manager listing */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-900 text-sm leading-none border-b border-slate-100 pb-3 block">
                    {t("manageCourses")}
                  </h3>

                  <div className="divide-y divide-slate-100 overflow-x-auto min-w-[500px]">
                    {courses.map((c, idx) => (
                      <motion.div 
                        key={c.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.3) }}
                        className="py-4 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <img src={c.thumbnail} className="w-10 h-10 object-cover rounded-lg" referrerPolicy="no-referrer" />
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs md:text-sm">{lang === "en" ? c.title : c.titleKh}</h4>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">{c.duration} - {c.category} - ${c.price}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => { setSelectedCourseId(c.id); setShowLessonModal(true); }}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold px-2.5 py-1.5 rounded-lg text-[10px] cursor-pointer"
                          >
                            + Lesson
                          </button>
                          <button
                            onClick={() => executeDeleteCourseCms(c.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-bold p-1.5 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Approve transactions billing panel */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-900 text-sm leading-none border-b border-slate-100 pb-3 block">
                    {t("managePayments")}
                  </h3>

                  <div className="divide-y divide-slate-100 overflow-x-auto min-w-[500px]">
                    {adminOrders.map((ord, idx) => (
                      <motion.div 
                        key={ord.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.3) }}
                        className="py-4 flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{ord.userName} ({ord.userEmail})</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">Course: {ord.courseTitle} - ID: {ord.transactionId}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold font-sans text-slate-800">${ord.amount}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            ord.paymentStatus === "completed" 
                              ? "bg-emerald-50 text-emerald-800" 
                              : "bg-amber-50 text-amber-800"
                          }`}>
                            {ord.paymentStatus}
                          </span>

                          {ord.paymentStatus === "pending" && (
                            <button
                              onClick={() => executeApprovePaymentAdmin(ord.id)}
                              className="bg-slate-950 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] cursor-pointer"
                            >
                              Approve Pay
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Users and platform environments config columns */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Users Role editor */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      <h3 className="font-extrabold text-slate-900 text-sm leading-none block">
                        {t("manageUsers")}
                      </h3>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {adminUsers.length}
                      </span>
                    </div>

                    <button
                      id="export-users-card-csv-btn"
                      onClick={handleExportUsersCSV}
                      disabled={isExportingCsv}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer disabled:opacity-50"
                      title="Export current user list to CSV file for offline reporting"
                    >
                      {isExportingCsv ? (
                        <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin" />
                      ) : csvExportSuccess ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Download className="w-3 h-3 text-emerald-600" />
                      )}
                      <span>{csvExportSuccess ? "Exported!" : "Export CSV"}</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                    {adminUsers.map((usr, idx) => (
                      <motion.div 
                        key={usr.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.3) }}
                        className="py-3 flex items-center justify-between gap-2 border-b border-slate-50 last:border-none"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shrink-0">
                            <img src={usr.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate leading-tight flex items-center gap-1">
                              <span>{usr.name}</span>
                              {usr.isBanned && (
                                <span className="bg-red-100 text-red-800 text-[8px] font-extrabold px-1 py-0.2 rounded font-mono uppercase">Banned</span>
                              )}
                            </p>
                            <span className="text-[9px] text-slate-400 block font-sans truncate">{usr.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 select-none">
                          <select
                            value={usr.role}
                            onChange={(e) => executeUpdateUserRoleAdmin(usr.id, e.target.value)}
                            className="bg-slate-50 hover:bg-slate-150 border border-slate-200 py-0.5 px-1 rounded text-[9px] font-bold text-slate-800 outline-none focus:ring-1 focus:ring-slate-500 transition-colors cursor-pointer"
                            disabled={usr.id === currentUser?.id}
                          >
                            <option value="student">STUDENT</option>
                            <option value="teacher">TEACHER</option>
                            <option value="admin">ADMIN</option>
                          </select>

                          <button
                            onClick={() => executeToggleBanUserStatus(usr.id, !!usr.isBanned)}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              usr.isBanned 
                                ? "bg-red-100 text-red-700 hover:bg-red-200" 
                                : "bg-slate-50 hover:bg-slate-150 text-slate-400 hover:text-slate-600"
                            }`}
                            title={usr.isBanned ? "Lift Ban" : "Restrict / Ban User"}
                            disabled={usr.id === currentUser?.id || usr.id === "u-1"}
                          >
                            <Shield className="w-3 h-3" />
                          </button>

                          {usr.id !== currentUser?.id && usr.id !== "u-1" && (
                            <button
                              onClick={() => executeDeleteUserAdmin(usr.id, usr.name)}
                              className="p-1 rounded bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete Account Permanently"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Settings sync database indicator */}
                <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-md space-y-4 text-[11px] select-none">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold block">Integrations Settings</span>
                    <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${sheetsSyncLoading ? "animate-spin" : "animate-spin-slow"}`} />
                  </div>

                  {sheetsError && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="bg-red-950/80 border border-red-800/40 text-red-350 p-2.5 rounded-xl text-[10px] leading-relaxed">
                      ❌ {sheetsError}
                    </motion.div>
                  )}

                  {sheetsSuccess && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-950/80 border border-emerald-800/40 text-emerald-350 p-2.5 rounded-xl text-[10px] leading-relaxed">
                      ✅ {sheetsSuccess}
                    </motion.div>
                  )}

                  <form onSubmit={executeSaveSheetsSettings} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold block text-[9.5px] tracking-wider uppercase">GOOGLE SPREADSHEET ID</label>
                      <input
                        type="text"
                        value={googleSheetsId}
                        onChange={(e) => setGoogleSheetsId(e.target.value)}
                        placeholder="e.g. 1aBCDeFghIjKLmNoPQrsT..."
                        className="w-full bg-slate-850 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono placeholder-slate-600 text-[10.5px] focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                        disabled={sheetsSyncLoading}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold block text-[9.5px] tracking-wider uppercase">SERVICE ACCOUNT EMAIL</label>
                      <input
                        type="email"
                        value={googleServiceAccountEmail}
                        onChange={(e) => setGoogleServiceAccountEmail(e.target.value)}
                        placeholder="service-account@project.iam.gserviceaccount.com"
                        className="w-full bg-slate-850 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono placeholder-slate-600 text-[10.5px] focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                        disabled={sheetsSyncLoading}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold block text-[9.5px] tracking-wider uppercase">PRIVATE KEY (or BASE64:...)</label>
                      <textarea
                        value={googlePrivateKey}
                        onChange={(e) => setGooglePrivateKey(e.target.value)}
                        placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBAQ..."
                        rows={3}
                        className="w-full bg-slate-850 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono placeholder-slate-600 text-[9.5px] focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none h-16 leading-normal"
                        disabled={sheetsSyncLoading}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                      <div className="space-y-1">
                        <label className="text-slate-400 font-bold block text-[9px] tracking-wider uppercase">TELEGRAM BOT TOKEN</label>
                        <input
                          type="text"
                          value={telegramBotToken}
                          onChange={(e) => setTelegramBotToken(e.target.value)}
                          placeholder="Token"
                          className="w-full bg-slate-850 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono placeholder-slate-600 focus:outline-none text-[10px]"
                          disabled={sheetsSyncLoading}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400 font-bold block text-[9px] tracking-wider uppercase">TELEGRAM CHAT ID</label>
                        <input
                          type="text"
                          value={telegramChatId}
                          onChange={(e) => setTelegramChatId(e.target.value)}
                          placeholder="Chat ID"
                          className="w-full bg-slate-850 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono placeholder-slate-600 focus:outline-none text-[10px]"
                          disabled={sheetsSyncLoading}
                        />
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        type="submit"
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded-xl transition-all cursor-pointer text-[10.5px] shadow"
                        disabled={sheetsSyncLoading}
                      >
                        {sheetsSyncLoading ? "Updating Config..." : "Save Configuration"}
                      </button>
                    </div>
                  </form>

                  {platformSettings?.googleSheetsId && (
                    <div className="border-t border-slate-850 pt-3 mt-3 grid grid-cols-1 gap-2 select-none text-[10px]">
                      <button
                        onClick={executeTestSheetsConnection}
                        className="bg-slate-850 hover:bg-slate-800 text-cyan-400 font-semibold py-2 px-3 rounded-xl text-center cursor-pointer border border-cyan-950 transition-colors"
                        disabled={sheetsSyncLoading}
                      >
                        ⚡ Test Sheets & Provision
                      </button>

                      <button
                        onClick={executeExportToSheets}
                        className="bg-slate-850 hover:bg-slate-800 text-emerald-400 font-semibold py-2 px-3 rounded-xl text-center cursor-pointer border border-emerald-950 transition-colors"
                        disabled={sheetsSyncLoading}
                      >
                        📤 Export Database to Sheet
                      </button>

                      <button
                        onClick={executeImportFromSheets}
                        className="bg-slate-850 hover:bg-slate-800 text-amber-400 font-semibold py-2 px-3 rounded-xl text-center cursor-pointer border border-amber-950 transition-colors"
                        disabled={sheetsSyncLoading}
                      >
                        📥 Import Courses from Sheet
                      </button>
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Platform Audit Trail System Component */}
            <div id="admin-audit-log-terminal" className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <header id="admin-audit-log-terminal-header" className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                {/* Header Top Row: Title, Description & Action Controls */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  <div className="space-y-1 shrink-0">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <Activity className="w-4.5 h-4.5 text-slate-500" />
                      <span>Compliance Audit Log System</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Track and display real-time events for administrative actions, safety triggers, database synchronizations, and order checkouts.</p>
                  </div>

                  <div className="flex items-center gap-2 relative shrink-0 flex-wrap">
                    {/* Critical Severity Filter Button */}
                    <button
                      id="audit-filter-critical-btn"
                      type="button"
                      aria-label="Filter audit log table to show Critical severity events only"
                      onClick={() => setAuditActionFilter(auditActionFilter === "CRITICAL_ONLY" ? "ALL" : "CRITICAL_ONLY")}
                      className={`flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-2 rounded-2xl border transition-all cursor-pointer select-none ${
                        auditActionFilter === "CRITICAL_ONLY"
                          ? "bg-red-600 text-white border-red-700 shadow-xs ring-2 ring-red-300 dark:ring-red-900"
                          : "bg-white hover:bg-red-50/80 text-red-700 border-slate-200 hover:border-red-200 dark:bg-slate-900 dark:text-red-400 dark:border-slate-800"
                      }`}
                      title={
                        auditActionFilter === "CRITICAL_ONLY"
                          ? "Showing Critical severity events only. Click to reset filter."
                          : `Filter audit log table to show Critical severity events only (${auditSummaryStats.criticalCount} events)`
                      }
                    >
                      <ShieldAlert className={`w-3.5 h-3.5 ${auditActionFilter === "CRITICAL_ONLY" ? "text-white" : "text-red-600 dark:text-red-400"}`} />
                      <span className="whitespace-nowrap">Critical Severity Only</span>
                      <span
                        className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded-full ${
                          auditActionFilter === "CRITICAL_ONLY"
                            ? "bg-white/25 text-white"
                            : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        }`}
                      >
                        {auditSummaryStats.criticalCount}
                      </span>
                    </button>

                    {/* Live Monitor Toggle */}
                    <button
                      id="audit-live-monitor-toggle"
                      type="button"
                      role="switch"
                      aria-checked={isLiveMonitorActive}
                      onClick={() => setIsLiveMonitorActive((prev) => !prev)}
                      className={`flex items-center gap-2 text-[11px] font-bold px-3 py-2 rounded-2xl border transition-all cursor-pointer select-none ${
                        isLiveMonitorActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 shadow-xs"
                          : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
                      }`}
                      title={
                        isLiveMonitorActive
                          ? "Live Monitor is ACTIVE — automatically polling every 10 seconds. Click to pause."
                          : "Click to enable Live Monitor (polls for new logs every 10 seconds)"
                      }
                    >
                      <span className="relative flex h-2 w-2">
                        {isLiveMonitorActive && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveMonitorActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}></span>
                      </span>
                      <span className="whitespace-nowrap">Live Monitor</span>
                      {/* Switch pill badge */}
                      <div
                        className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${
                          isLiveMonitorActive ? "bg-emerald-500 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
                        }`}
                      >
                        <div className="w-3 h-3 rounded-full bg-white shadow-xs transition-transform" />
                      </div>
                      {isLiveMonitorActive && (
                        <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                          {isPollingLogs ? "Syncing..." : "10s"}
                        </span>
                      )}
                    </button>

                    {/* Batch Actions Dropdown in Header */}
                    <div className="relative" ref={batchDropdownRef}>
                      <button
                        id="audit-batch-actions-btn"
                        type="button"
                        onClick={() => setIsBatchDropdownOpen((prev) => !prev)}
                        className={`flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-2 rounded-2xl border transition-all cursor-pointer ${
                          selectedAuditLogIds.length > 0
                            ? "bg-slate-900 text-white border-slate-800 hover:bg-slate-800 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                        title={
                          selectedAuditLogIds.length > 0
                            ? `${selectedAuditLogIds.length} logs selected for batch operations`
                            : "Batch actions (select logs below to enable actions)"
                        }
                      >
                        <CheckSquare className={`w-3.5 h-3.5 ${selectedAuditLogIds.length > 0 ? "text-cyan-400" : "text-slate-400"}`} />
                        <span>Batch Actions</span>
                        {selectedAuditLogIds.length > 0 && (
                          <span className="bg-cyan-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full leading-none">
                            {selectedAuditLogIds.length}
                          </span>
                        )}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isBatchDropdownOpen ? "rotate-180" : ""}`} />
                      </button>

                      {/* Batch Actions Dropdown Menu */}
                      {isBatchDropdownOpen && (
                        <div
                          id="audit-batch-actions-dropdown"
                          className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 space-y-1 text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150"
                        >
                          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span>Batch Controls</span>
                            <span className="font-bold text-cyan-600 dark:text-cyan-400">
                              {selectedAuditLogIds.length} Selected
                            </span>
                          </div>

                          {/* Action 1: Copy Selected IDs */}
                          <button
                            id="batch-action-copy-ids"
                            type="button"
                            onClick={handleCopySelectedAuditLogIds}
                            disabled={selectedAuditLogIds.length === 0}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-cyan-50 hover:text-cyan-800 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-300 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Copy className="w-4 h-4 text-cyan-600 shrink-0" />
                            <div>
                              <div className="leading-tight">Copy Selected IDs</div>
                              <div className="text-[9px] font-normal text-slate-400 dark:text-slate-500">Copy IDs to system clipboard</div>
                            </div>
                          </button>

                          {/* Action 2: Archive Selected */}
                          <button
                            id="batch-action-archive-logs"
                            type="button"
                            onClick={() => handleArchiveSelectedAuditLogs(true)}
                            disabled={selectedAuditLogIds.length === 0 || isArchivingLogs}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 hover:text-amber-800 dark:hover:bg-amber-950/40 dark:hover:text-amber-300 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isArchivingLogs ? (
                              <RefreshCw className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
                            ) : (
                              <Archive className="w-4 h-4 text-amber-600 shrink-0" />
                            )}
                            <div>
                              <div className="leading-tight">Archive Selected</div>
                              <div className="text-[9px] font-normal text-slate-400 dark:text-slate-500">Set status to Archived (Amber pill)</div>
                            </div>
                          </button>

                          {/* Action 3: Restore to Active */}
                          <button
                            id="batch-action-unarchive-logs"
                            type="button"
                            onClick={() => handleArchiveSelectedAuditLogs(false)}
                            disabled={selectedAuditLogIds.length === 0 || isArchivingLogs}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-800 dark:hover:bg-blue-950/40 dark:hover:text-blue-300 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <RefreshCw className={`w-4 h-4 text-blue-600 shrink-0 ${isArchivingLogs ? "animate-spin" : ""}`} />
                            <div>
                              <div className="leading-tight">Restore to Active</div>
                              <div className="text-[9px] font-normal text-slate-400 dark:text-slate-500">Restore status to Active (Blue pill)</div>
                            </div>
                          </button>

                          {/* Action 4: Export Selected Logs to CSV */}
                          <button
                            id="batch-action-export-csv"
                            type="button"
                            onClick={handleExportSelectedAuditLogsCSV}
                            disabled={selectedAuditLogIds.length === 0 || isExportingAuditCsv}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isExportingAuditCsv ? (
                              <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
                            ) : (
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                            <div>
                              <div className="leading-tight">Export Selected Logs to CSV</div>
                              <div className="text-[9px] font-normal text-slate-400 dark:text-slate-500">Download only the chosen audit logs</div>
                            </div>
                          </button>

                          {/* Quick Selection Helpers */}
                          <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1 space-y-1">
                            {selectedAuditLogIds.length < filteredAuditLogs.length && filteredAuditLogs.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleSelectAllVisibleAuditLogs(true)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                              >
                                <Check className="w-3 h-3 text-slate-400" />
                                <span>Select All Filtered ({filteredAuditLogs.length})</span>
                              </button>
                            )}

                            {selectedAuditLogIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAuditLogIds([]);
                                  setIsBatchDropdownOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[11px] font-semibold text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer transition-colors"
                              >
                                <X className="w-3 h-3 text-slate-400" />
                                <span>Clear Selection</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      id="admin-audit-refresh-logs-btn"
                      onClick={() => {
                        fetchAdminDetails();
                        pollAuditLogs();
                      }}
                      className="flex items-center gap-1.5 text-[10px] bg-slate-50 hover:bg-slate-100 font-bold px-3 py-2 rounded-2xl border border-slate-200 transition-colors cursor-pointer text-slate-700"
                      title="Manually refresh audit logs"
                    >
                      <RefreshCw className={`w-3 h-3 text-slate-400 ${isPollingLogs ? "animate-spin text-emerald-500" : ""}`} />
                      <span>Refresh Logs</span>
                    </button>
                  </div>
                </div>

                {/* Header Secondary Row: Severity Color-Coding Legend, Summary Counters & Search */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
                  {/* Audit Log Severity Color-Coding Legend */}
                  <div
                    id="admin-audit-severity-legend"
                    role="region"
                    aria-label="Audit Log Severity Color Legend"
                    className="flex flex-wrap items-center gap-2.5 px-3.5 py-1.5 bg-slate-50/90 dark:bg-slate-850/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs shadow-2xs shrink-0"
                  >
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span>Severity Legend:</span>
                    </span>

                    {/* Critical Severity Legend Item */}
                    <div
                      id="audit-legend-critical"
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-800/80 text-red-800 dark:text-red-300 cursor-default"
                      title="Critical Severity: Destructive or high-impact actions (User deletion, role modification, account bans)"
                    >
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <span className="font-extrabold text-[10.5px] font-mono">Critical</span>
                      <span className="text-[9.5px] text-red-600/90 dark:text-red-400 font-sans hidden sm:inline">(Delete, Ban, Role)</span>
                    </div>

                    {/* Informational Severity Legend Item */}
                    <div
                      id="audit-legend-informational"
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-default"
                      title="Informational Severity: Routine operational activities (Course creation, content updates, database synchronization)"
                    >
                      <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0"></span>
                      <span className="font-extrabold text-[10.5px] font-mono">Informational</span>
                      <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-sans hidden sm:inline">(Standard Ops)</span>
                    </div>

                    {/* State Color Coding */}
                    <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700 text-[10px]">
                      <span className="text-slate-400 dark:text-slate-500 font-mono text-[9px] uppercase font-semibold">Status:</span>
                      <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300 font-medium" title="Active (Operational / Unarchived Log)">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Active
                      </span>
                      <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 font-medium" title="Archived (Historical Log Record)">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Archived
                      </span>
                    </div>
                  </div>

                  {/* Right side: Log State Summary Bar & Search */}
                  <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-start lg:justify-end">
                    {/* Active vs Archived Log State Summary Bar */}
                    <div
                      id="admin-audit-summary-bar"
                      className="flex flex-wrap items-center gap-2.5 px-3 py-1 bg-slate-50 dark:bg-slate-850/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs shadow-2xs shrink-0"
                      aria-label="Summary count of Active versus Archived audit logs"
                    >
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Log State:
                      </span>

                      {/* Active Count Pill */}
                      <button
                        type="button"
                        id="audit-summary-active-count"
                        onClick={() => setAuditActionFilter(auditActionFilter === "ACTIVE_ONLY" ? "ALL" : "ACTIVE_ONLY")}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                          auditActionFilter === "ACTIVE_ONLY"
                            ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                            : "bg-blue-50 text-blue-800 border-blue-200/80 hover:bg-blue-100/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                        }`}
                        title={`Click to filter: ${auditSummaryStats.activeCount} Active logs`}
                      >
                        <span className={`w-2 h-2 rounded-full shadow-xs ${auditActionFilter === "ACTIVE_ONLY" ? "bg-white" : "bg-blue-500"}`} />
                        <span>{auditSummaryStats.activeCount}</span>
                        <span className={`text-[10px] font-sans font-semibold ${auditActionFilter === "ACTIVE_ONLY" ? "text-blue-100" : "text-blue-600 dark:text-blue-400"}`}>Active</span>
                      </button>

                      <span className="text-slate-300 dark:text-slate-700 font-mono text-[11px] font-bold">vs</span>

                      {/* Archived Count Pill */}
                      <button
                        type="button"
                        id="audit-summary-archived-count"
                        onClick={() => setAuditActionFilter(auditActionFilter === "ARCHIVED_ONLY" ? "ALL" : "ARCHIVED_ONLY")}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                          auditActionFilter === "ARCHIVED_ONLY"
                            ? "bg-amber-600 text-white border-amber-700 shadow-xs"
                            : "bg-amber-50 text-amber-900 border-amber-200/80 hover:bg-amber-100/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                        }`}
                        title={`Click to filter: ${auditSummaryStats.archivedCount} Archived logs`}
                      >
                        <span className={`w-2 h-2 rounded-full shadow-xs ${auditActionFilter === "ARCHIVED_ONLY" ? "bg-white" : "bg-amber-500"}`} />
                        <span>{auditSummaryStats.archivedCount}</span>
                        <span className={`text-[10px] font-sans font-semibold ${auditActionFilter === "ARCHIVED_ONLY" ? "text-amber-100" : "text-amber-700 dark:text-amber-400"}`}>Archived</span>
                      </button>

                      <span className="text-slate-300 dark:text-slate-700 font-mono text-[11px] font-bold">vs</span>

                      {/* Critical Count Pill */}
                      <button
                        type="button"
                        id="audit-summary-critical-count"
                        onClick={() => setAuditActionFilter(auditActionFilter === "CRITICAL_ONLY" ? "ALL" : "CRITICAL_ONLY")}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                          auditActionFilter === "CRITICAL_ONLY"
                            ? "bg-red-600 text-white border-red-700 shadow-xs"
                            : "bg-red-50 text-red-800 border-red-200/80 hover:bg-red-100/80 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800"
                        }`}
                        title={`Click to filter: ${auditSummaryStats.criticalCount} Critical logs`}
                      >
                        <span className={`w-2 h-2 rounded-full shadow-xs ${auditActionFilter === "CRITICAL_ONLY" ? "bg-white" : "bg-red-500"}`} />
                        <span>{auditSummaryStats.criticalCount}</span>
                        <span className={`text-[10px] font-sans font-semibold ${auditActionFilter === "CRITICAL_ONLY" ? "text-red-100" : "text-red-700 dark:text-red-400"}`}>Critical</span>
                      </button>

                      {/* Visual ratio progress indicator */}
                      <div className="hidden sm:flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
                        <div
                          className="w-16 sm:w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner"
                          title={`${auditSummaryStats.activePercentage}% Active (${auditSummaryStats.activeCount}), ${auditSummaryStats.archivedPercentage}% Archived (${auditSummaryStats.archivedCount})`}
                        >
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${auditSummaryStats.activePercentage}%` }}
                          />
                          <div
                            className="h-full bg-amber-500 transition-all duration-300"
                            style={{ width: `${auditSummaryStats.archivedPercentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500">
                          {auditSummaryStats.totalCount} total
                        </span>
                      </div>
                    </div>

                    {/* Instant Search Input in Terminal Header */}
                    <div className="w-full sm:w-56 md:w-64 relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="audit-log-search-input"
                        type="text"
                        value={auditSearch}
                        onChange={(e) => setAuditSearch(e.target.value)}
                        placeholder="Search logs by user, details, ID..."
                        aria-label="Filter audit logs by username, details, or ID"
                        className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-2xl pl-10 pr-9 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/30 transition-all shadow-2xs"
                      />
                      {auditSearch && (
                        <button
                          id="audit-log-search-clear-btn"
                          type="button"
                          onClick={() => setAuditSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 cursor-pointer transition-colors"
                          title="Clear search"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </header>

              {/* Batch action confirmation message */}
              {batchActionFeedback && (
                <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{batchActionFeedback.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBatchActionFeedback(null)}
                    className="text-emerald-600 hover:text-emerald-900 cursor-pointer p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Filters & summary status toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 flex-wrap">
                  <span className="font-mono text-[11px] bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                    Showing <span className="font-extrabold text-slate-900 dark:text-white">{filteredAuditLogs.length}</span> of {adminAuditLogs.length} logs
                  </span>
                  {isLiveMonitorActive && (
                    <span
                      id="audit-live-monitor-status-pill"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 text-[11px] font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Live Monitor Active (every 10s)</span>
                      {lastPollTime && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                          • Last: {lastPollTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      )}
                    </span>
                  )}
                  {auditSearch && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-50 text-cyan-800 border border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800 text-[11px]">
                      <span>Filtering by: &ldquo;{auditSearch}&rdquo;</span>
                      <button
                        type="button"
                        onClick={() => setAuditSearch("")}
                        className="hover:text-cyan-950 dark:hover:text-cyan-100 cursor-pointer p-0.5"
                        title="Clear filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {auditActionFilter !== "ALL" && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium border ${
                      auditActionFilter === "CRITICAL_ONLY"
                        ? "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800"
                        : auditActionFilter === "ACTIVE_ONLY"
                        ? "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                        : auditActionFilter === "ARCHIVED_ONLY"
                        ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                        : "bg-slate-100 text-slate-800 border-slate-250 dark:bg-slate-800 dark:text-slate-200"
                    }`}>
                      <span>
                        Severity / Filter:{" "}
                        <strong className="font-mono font-bold">
                          {auditActionFilter === "CRITICAL_ONLY"
                            ? "Critical Only"
                            : auditActionFilter === "ACTIVE_ONLY"
                            ? "Active Only"
                            : auditActionFilter === "ARCHIVED_ONLY"
                            ? "Archived Only"
                            : auditActionFilter}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setAuditActionFilter("ALL")}
                        className="hover:text-slate-950 dark:hover:text-white cursor-pointer p-0.5"
                        title="Clear filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {/* Status Indicator Quick Toggle Pills */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-850 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      id="filter-pill-active"
                      onClick={() => setAuditActionFilter(auditActionFilter === "ACTIVE_ONLY" ? "ALL" : "ACTIVE_ONLY")}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        auditActionFilter === "ACTIVE_ONLY"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-blue-50/80 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300"
                      }`}
                      title="Filter Active logs only"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${auditActionFilter === "ACTIVE_ONLY" ? "bg-white" : "bg-blue-500"}`} />
                      <span>Active ({auditSummaryStats.activeCount})</span>
                    </button>
                    <button
                      type="button"
                      id="filter-pill-archived"
                      onClick={() => setAuditActionFilter(auditActionFilter === "ARCHIVED_ONLY" ? "ALL" : "ARCHIVED_ONLY")}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        auditActionFilter === "ARCHIVED_ONLY"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "bg-amber-50/80 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300"
                      }`}
                      title="Filter Archived logs only"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${auditActionFilter === "ARCHIVED_ONLY" ? "bg-white" : "bg-amber-500"}`} />
                      <span>Archived ({auditSummaryStats.archivedCount})</span>
                    </button>
                    <button
                      type="button"
                      id="filter-pill-critical"
                      onClick={() => setAuditActionFilter(auditActionFilter === "CRITICAL_ONLY" ? "ALL" : "CRITICAL_ONLY")}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        auditActionFilter === "CRITICAL_ONLY"
                          ? "bg-red-600 text-white shadow-xs"
                          : "bg-red-50/80 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-300"
                      }`}
                      title="Filter Critical logs only"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${auditActionFilter === "CRITICAL_ONLY" ? "bg-white" : "bg-red-500"}`} />
                      <span>Critical ({auditSummaryStats.criticalCount})</span>
                    </button>
                  </div>

                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event:</span>
                  <select
                    value={auditActionFilter}
                    onChange={(e) => setAuditActionFilter(e.target.value)}
                    className="bg-white border border-slate-250 py-1 px-2.5 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-slate-400 transition-colors cursor-pointer"
                  >
                    <option value="ALL">ALL EVENTS</option>
                    <option value="ACTIVE_ONLY">ACTIVE LOGS ONLY (BLUE)</option>
                    <option value="ARCHIVED_ONLY">ARCHIVED LOGS ONLY (AMBER)</option>
                    <option value="CRITICAL_ONLY">CRITICAL SEVERITY ONLY</option>
                    <option value="INFO_ONLY">INFORMATIONAL ONLY</option>
                    <option value="COURSE_CREATE">COURSE CREATION</option>
                    <option value="COURSE_DELETE">COURSE DELETION</option>
                    <option value="PAYMENT_APPROVE">PAYMENT APPROVED</option>
                    <option value="USER_ROLE_UPDATE">ROLE CHANGED</option>
                    <option value="USER_BAN_UPDATE">USER RESTRICT / BAN</option>
                    <option value="USER_DELETE">USER ELIMINATED</option>
                    <option value="SETTING_UPDATE">SETTINGS UPDATED</option>
                    <option value="SHEETS_EXPORT">GOOGLE SHEETS EXPORT</option>
                    <option value="SHEETS_IMPORT">GOOGLE SHEETS IMPORT</option>
                  </select>
                </div>
              </div>

              {/* Grid Logs Table list */}
              {filteredAuditLogs.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <Activity className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium font-sans">
                    {auditSearch
                      ? `No audit logs matching "${auditSearch}" for the selected criteria.`
                      : "No system log actions synchronized for the current criteria."}
                  </p>
                  {auditSearch && (
                    <button
                      type="button"
                      id="clear-audit-search-empty-btn"
                      onClick={() => setAuditSearch("")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Clear Search</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-150 dark:border-slate-800">
                  <div className="max-h-[30rem] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800/90 backdrop-blur-sm z-10">
                        <tr className="text-slate-400 dark:text-slate-400 font-sans text-[10px] uppercase tracking-wider border-b border-slate-150 dark:border-slate-800">
                          <th className="py-2.5 px-3 font-extrabold w-10 text-center">
                            <input
                              type="checkbox"
                              id="audit-log-select-all"
                              aria-label="Select all visible audit logs"
                              checked={allVisibleAuditLogsSelected}
                              ref={(input) => {
                                if (input) {
                                  input.indeterminate = someVisibleAuditLogsSelected && !allVisibleAuditLogsSelected;
                                }
                              }}
                              onChange={(e) => handleSelectAllVisibleAuditLogs(e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer accent-cyan-600"
                            />
                          </th>
                          <th className="py-2.5 px-4 font-extrabold">Timestamp</th>
                          <th className="py-2.5 px-4 font-extrabold">Executive Owner</th>
                          <th className="py-2.5 px-4 font-extrabold">Event Code & Status</th>
                          <th className="py-2.5 px-4 font-extrabold font-sans">Payload Log Detail</th>
                          <th className="py-2.5 px-4 font-extrabold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-[11px] font-sans">
                        {filteredAuditLogs.map((log, index) => {
                          const isExpanded = !!expandedLogIds[log.id];
                          const isCritical = isCriticalAuditAction(log.action);
                          const isSelected = selectedAuditLogIds.includes(log.id);
                          const detailsInfo = getAuditLogDetailsInfo(log);
                          const formattedJson = JSON.stringify(detailsInfo.fullPayload, null, 2);
                          const isCopied = copiedLogId === log.id;

                          // Badge coloration
                          let badgeColor = "bg-slate-150 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
                          if (log.action === "COURSE_CREATE") badgeColor = "bg-cyan-50 text-cyan-800 border-cyan-150 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800";
                          if (log.action === "COURSE_UPDATE") badgeColor = "bg-sky-50 text-sky-800 border-sky-150 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800";
                          if (log.action === "COURSE_DELETE") badgeColor = "bg-red-50 text-red-800 border-red-150 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800";
                          if (log.action === "PAYMENT_APPROVE") badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-150 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
                          if (log.action === "USER_ROLE_UPDATE") badgeColor = "bg-indigo-50 text-indigo-800 border-indigo-150 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800";
                          if (log.action === "USER_BAN_UPDATE") badgeColor = "bg-orange-50 text-orange-850 border-orange-150 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800";
                          if (log.action === "USER_DELETE") badgeColor = "bg-red-100 text-red-950 border-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-700";
                          if (log.action === "SETTING_UPDATE") badgeColor = "bg-slate-100 text-slate-800 border-slate-350 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700";
                          if (log.action.includes("SHEETS")) badgeColor = "bg-teal-50 text-teal-850 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800";
                          if (log.action.includes("LESSON")) badgeColor = "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800";

                          const displayTime = new Date(log.timestamp).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                          });

                          return (
                            <React.Fragment key={log.id}>
                              <motion.tr
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  duration: 0.24,
                                  delay: Math.min(index * 0.035, 0.45),
                                  ease: "easeOut"
                                }}
                                className={`transition-colors ${
                                  isExpanded 
                                    ? "bg-cyan-50/40 dark:bg-slate-850/90" 
                                    : isSelected
                                      ? "bg-cyan-50/30 dark:bg-cyan-950/30 hover:bg-cyan-50/50"
                                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                                }`}
                              >
                                {/* Checkbox cell */}
                                <td className="py-3 px-3 text-center whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    id={`checkbox-audit-log-${log.id}`}
                                    aria-label={`Select audit log ${log.id}`}
                                    checked={isSelected}
                                    onChange={(e) => handleToggleSelectAuditLog(log.id, e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer accent-cyan-600"
                                  />
                                </td>
                                <td className="py-3 px-4 font-mono text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                  {displayTime}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-slate-900 dark:text-white block leading-tight">{log.userName}</span>
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-sans leading-none">{log.userEmail}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                                    {/* Visual Indicator Status Pill: dynamically changes based on 'Archived' (amber) or 'Active' (blue) */}
                                    <button
                                      type="button"
                                      id={`audit-status-pill-${log.id}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleArchiveSelectedAuditLogs(!log.isArchived, [log.id]);
                                      }}
                                      className={`inline-flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border shadow-xs shrink-0 transition-all cursor-pointer ${
                                        log.isArchived
                                          ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100/80 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800"
                                          : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                                      }`}
                                      title={log.isArchived ? "Status: Archived (Amber) - Click to toggle" : "Status: Active (Blue) - Click to toggle"}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                          log.isArchived
                                            ? "bg-amber-500 dark:bg-amber-400"
                                            : "bg-blue-500 dark:bg-blue-400"
                                        }`}
                                      />
                                      <span>{log.isArchived ? "Archived" : "Active"}</span>
                                    </button>

                                    {isCritical ? (
                                      <span
                                        className="inline-flex items-center gap-1 font-mono text-[8.5px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800 shadow-xs shrink-0"
                                        title="Critical Severity (Role modification, account deletion, or ban)"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400 animate-pulse inline-block shrink-0" />
                                        Critical
                                      </span>
                                    ) : (
                                      <span
                                        className="inline-flex items-center gap-1 font-mono text-[8.5px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 shadow-xs shrink-0"
                                        title="Informational Severity (Standard system action or database synchronization)"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 inline-block shrink-0" />
                                        Info
                                      </span>
                                    )}
                                    <span className={`inline-block font-mono text-[8.5px] px-2 py-0.5 rounded font-extrabold border ${badgeColor}`}>
                                      {log.action}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                  <div>{log.details}</div>
                                  {detailsInfo.ids.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                      {detailsInfo.ids.map((idItem) => (
                                        <span
                                          key={idItem.label}
                                          className={`inline-flex items-center text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${idItem.colorClass}`}
                                        >
                                          {idItem.label}: {idItem.value}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    id={`btn-view-details-${log.id}`}
                                    onClick={() => toggleLogDetails(log.id)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                                      isExpanded
                                        ? "bg-cyan-600 text-white shadow-sm ring-2 ring-cyan-500/30"
                                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                                    }`}
                                    title={isExpanded ? "Hide Details" : "View Details (JSON payload & object changes)"}
                                    aria-expanded={isExpanded}
                                  >
                                    <Code className={`w-3 h-3 ${isExpanded ? "text-white" : "text-cyan-500"}`} />
                                    <span>{isExpanded ? "Hide" : "View Details"}</span>
                                    <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                                  </button>
                                </td>
                              </motion.tr>

                              {/* Expandable Details Sub-row */}
                              {isExpanded && (
                                <tr className="bg-slate-50/95 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
                                  <td colSpan={6} className="p-0">
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.25, ease: "easeOut" }}
                                      className="p-4 sm:p-5 space-y-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60"
                                    >
                                      {/* Header Bar */}
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                                        <div className="space-y-0.5">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                              Audit Action Payload
                                            </span>
                                            {/* Dynamic Status Indicator Pill */}
                                            <button
                                              type="button"
                                              onClick={() => handleArchiveSelectedAuditLogs(!log.isArchived, [log.id])}
                                              className={`inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border shadow-xs transition-all cursor-pointer ${
                                                log.isArchived
                                                  ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100/80 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800"
                                                  : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                                              }`}
                                              title={`Status: ${log.isArchived ? "Archived (Amber)" : "Active (Blue)"} - Click to toggle`}
                                            >
                                              <span
                                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                  log.isArchived
                                                    ? "bg-amber-500 dark:bg-amber-400"
                                                    : "bg-blue-500 dark:bg-blue-400"
                                                }`}
                                              />
                                              <span>{log.isArchived ? "Archived" : "Active"}</span>
                                            </button>
                                            {isCritical ? (
                                              <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                Critical Action
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                Informational Event
                                              </span>
                                            )}
                                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                              Event ID: {log.id}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Full JSON payload, object ID references, and field-level modifications for this action.
                                          </p>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => handleCopyPayload(log.id, formattedJson)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                                              isCopied
                                                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                                                : "bg-white dark:bg-slate-800 border-slate-250 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                            }`}
                                          >
                                            {isCopied ? (
                                              <>
                                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                <span>Copied JSON!</span>
                                              </>
                                            ) : (
                                              <>
                                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                                <span>Copy JSON</span>
                                              </>
                                            )}
                                          </button>
                                        </div>
                                      </div>

                                      {/* Detected Object ID references & specific transitions */}
                                      {(detailsInfo.ids.length > 0 || detailsInfo.changes.length > 0) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          {detailsInfo.ids.length > 0 && (
                                            <div className="bg-white dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                                Target Object Identifiers
                                              </span>
                                              <div className="flex flex-wrap gap-2">
                                                {detailsInfo.ids.map((item) => (
                                                  <div
                                                    key={item.label}
                                                    className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border flex items-center gap-1.5 ${item.colorClass}`}
                                                  >
                                                    <span className="opacity-75">{item.label}:</span>
                                                    <span className="font-extrabold select-all">{item.value}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {detailsInfo.changes.length > 0 && (
                                            <div className="bg-white dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                                Specific State Changes
                                              </span>
                                              <div className="space-y-1.5">
                                                {detailsInfo.changes.map((change, cIdx) => (
                                                  <div
                                                    key={cIdx}
                                                    className="flex items-center gap-2 text-[11px] font-mono font-semibold text-slate-800 dark:text-slate-200"
                                                  >
                                                    <span className="text-slate-400 font-sans text-[10px] uppercase font-bold">{change.field}:</span>
                                                    {change.from !== undefined && (
                                                      <>
                                                        <span className="px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 line-through text-[10px]">
                                                          {String(change.from)}
                                                        </span>
                                                        <ArrowRight className="w-3 h-3 text-slate-400" />
                                                      </>
                                                    )}
                                                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                                                      {String(change.to)}
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Full JSON Payload code inspector */}
                                      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
                                        <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                                          <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block"></span>
                                            <span className="text-slate-300 font-bold">EVENT_PAYLOAD.json</span>
                                          </div>
                                          <span className="text-slate-500">
                                            {Object.keys(detailsInfo.fullPayload).length} Top-level fields
                                          </span>
                                        </div>
                                        <pre className="p-4 text-[11px] leading-relaxed font-mono text-emerald-400 dark:text-emerald-300 overflow-x-auto max-h-72 selection:bg-cyan-900 selection:text-white">
                                          <code>{formattedJson}</code>
                                        </pre>
                                      </div>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* -------------------------------------------------------------
          FOOTER COMPONENT SUMMARY
         ------------------------------------------------------------- */}
      <footer className="bg-slate-950 text-white py-12 px-6 border-t border-slate-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-900 pb-8 text-xs">
          <div className="text-center md:text-left space-y-2">
            <h3 className="font-extrabold text-sm tracking-wide">PRO SAN</h3>
            <p className="text-slate-400 max-w-sm">Professional fully-integrated e-learning platform with automated database sync, watermark stream securities, and dual Khmer-English translations.</p>
          </div>

          <div className="flex gap-6 text-slate-400 font-semibold font-sans">
            <button onClick={() => setView("about")} className="hover:text-white transition-colors cursor-pointer">{t("about")}</button>
            <button onClick={() => setView("contact")} className="hover:text-white transition-colors cursor-pointer">{t("contact")}</button>
            <button onClick={() => setView("faq")} className="hover:text-white transition-colors cursor-pointer">{t("faq")}</button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 pt-6 text-[10px] text-slate-500 font-mono">
          <span>&copy; 2026 Sabaicode Ltd. Normalized and verified securely.</span>
          <span className="uppercase tracking-widest text-slate-600 font-bold">PRO SAN LMS</span>
        </div>
      </footer>

      {/* -------------------------------------------------------------
          MODAL: ACCOUNT SIGN-IN / REGISTER DUAL modal
         ------------------------------------------------------------- */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative border border-slate-200"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <BookOpen className="w-8 h-8 text-slate-900 mx-auto mb-2" />
                <h3 className="text-lg md:text-xl font-extrabold font-sans text-slate-900">
                  {authMode === "login" ? t("login") : t("register")}
                </h3>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold mt-1 block">{t("verificationText")}</span>
              </div>

              <form onSubmit={executeAuth} className="space-y-4 text-xs">
                {authMode === "register" && (
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">{t("name")}</label>
                    <input
                      type="text"
                      required
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-600 font-bold mb-1">{t("email")}</label>
                  <input
                    type="email"
                    required
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">{t("password")}</label>
                  <input
                    type="password"
                    required
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                {authMode === "register" && (
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">{t("phone")}</label>
                    <input
                      type="text"
                      value={authForm.phone}
                      onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>
                )}

                {authError && (
                  <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-red-800 text-xs text-center font-semibold">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all cursor-pointer"
                >
                  {authMode === "login" ? t("login") : t("register")}
                </button>
              </form>

              <button
                onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}
                className="w-full text-center text-slate-500 hover:text-slate-900 text-xs font-semibold mt-4 transition-colors cursor-pointer"
              >
                {authMode === "login" ? t("dontHaveAccount") : t("alreadyHaveAccount")}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* -------------------------------------------------------------
          MODAL: ADMIN CREATE COURSE WITH AI GEMINI GENERATOR
         ------------------------------------------------------------- */}
      <AnimatePresence>
        {showCourseModal && (
          <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative border border-slate-200 max-h-[90vh] overflow-y-auto my-8"
            >
              <button
                onClick={() => setShowCourseModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <Plus className="w-8 h-8 text-slate-900 mx-auto mb-2" />
                <h3 className="text-lg md:text-xl font-extrabold font-sans text-slate-900">
                  {t("addCourse")}
                </h3>
                <span className="text-[10px] font-mono text-slate-400 font-bold block mt-1">CMS List Masterclass Creator</span>
              </div>

              {/* Secure Server-Side Gemini Course Content Generator bar */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 mb-6">
                <div className="flex items-center gap-1 text-cyan-600">
                  <Sparkles className="w-4 h-4 animate-spin-slow" />
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider">{t("aiCourseGen")}</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t("aiTopicPlaceholder")}
                    value={aiTopicInput}
                    onChange={(e) => setAiTopicInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white text-xs border border-slate-220 focus:outline-none focus:ring-1 focus:ring-slate-900 rounded-xl"
                  />
                  <button
                    onClick={triggerAICourseGenerator}
                    disabled={aiGeneratorLoading}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap cursor-pointer flex items-center justify-center gap-1"
                  >
                    {aiGeneratorLoading ? "Thinking..." : t("generateWithAI")}
                  </button>
                </div>
              </div>

              {/* Standard Forms */}
              <form onSubmit={executeRegisterCourseCms} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Course Title (EN)</label>
                    <input
                      type="text" required
                      value={newCourseForm.title}
                      onChange={(e) => setNewCourseForm({ ...newCourseForm, title: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Course Title (KH)</label>
                    <input
                      type="text" required
                      value={newCourseForm.titleKh}
                      onChange={(e) => setNewCourseForm({ ...newCourseForm, titleKh: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Course Description (EN)</label>
                    <textarea ram-row={2} required
                      value={newCourseForm.description}
                      onChange={(e) => setNewCourseForm({ ...newCourseForm, description: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Course Description (KH)</label>
                    <textarea ram-row={2} required
                      value={newCourseForm.descriptionKh}
                      onChange={(e) => setNewCourseForm({ ...newCourseForm, descriptionKh: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Price ($)</label>
                    <input
                      type="number" required
                      value={newCourseForm.price}
                      onChange={(e) => setNewCourseForm({ ...newCourseForm, price: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Discount (%)</label>
                    <input
                      type="number"
                      value={newCourseForm.discount}
                      onChange={(e) => setNewCourseForm({ ...newCourseForm, discount: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Duration (e.g. 10h)</label>
                    <input
                      type="text"
                      value={newCourseForm.duration}
                      onChange={(e) => setNewCourseForm({ ...newCourseForm, duration: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Thumbnail URL</label>
                  <input
                    type="text"
                    value={newCourseForm.thumbnail}
                    onChange={(e) => setNewCourseForm({ ...newCourseForm, thumbnail: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all cursor-pointer mt-2"
                >
                  Create Masterclass course
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* -------------------------------------------------------------
          MODAL: ADMIN CMS LESSON INJECTOR
         ------------------------------------------------------------- */}
      <AnimatePresence>
        {showLessonModal && (
          <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative border border-slate-200"
            >
              <button
                onClick={() => setShowLessonModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <Video className="w-8 h-8 text-slate-900 mx-auto mb-2" />
                <h3 className="text-lg md:text-xl font-extrabold font-sans text-slate-900">
                  Add Video Lesson
                </h3>
                <span className="text-[10px] font-mono text-slate-400 block tracking-wider uppercase mt-1">Append Curriculum curriculum materials</span>
              </div>

              <form onSubmit={executeAddCourseLesson} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Lesson Title (EN)</label>
                  <input
                    type="text" required
                    value={newLessonForm.title}
                    onChange={(e) => setNewLessonForm({ ...newLessonForm, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Lesson Title (KH)</label>
                  <input
                    type="text" required
                    value={newLessonForm.titleKh}
                    onChange={(e) => setNewLessonForm({ ...newLessonForm, titleKh: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Direct Video Stream URL</label>
                  <input
                    type="text" required
                    value={newLessonForm.videoUrl}
                    onChange={(e) => setNewLessonForm({ ...newLessonForm, videoUrl: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Duration (e.g. 12:45)</label>
                    <input
                      type="text"
                      value={newLessonForm.duration}
                      onChange={(e) => setNewLessonForm({ ...newLessonForm, duration: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer font-bold font-sans">
                      <input
                        type="checkbox"
                        checked={newLessonForm.isPreview}
                        onChange={(e) => setNewLessonForm({ ...newLessonForm, isPreview: e.target.checked })}
                        className="accent-slate-900 cursor-pointer"
                      />
                      <span>Preview Free</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all cursor-pointer mt-2"
                >
                  Append video lesson
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating AI chat counselors support widget container */}
      <AIAssistant currentLang={lang} />

      {/* Completion credentials visualizer modal */}
      {claimCertParams && (
        <VerificationModal
          isOpen={claimCertModalOpen}
          onClose={() => setClaimCertModalOpen(false)}
          params={claimCertParams}
          currentLang={lang}
        />
      )}

      {/* HD Video Player Preview Modal */}
      {hdPreviewModal && hdPreviewModal.isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
          onClick={() => setHdPreviewModal(null)}
        >
          <div 
            className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl space-y-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with HD Badge and Close button */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 bg-blue-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded tracking-wider">
                  <Tv className="w-3.5 h-3.5" />
                  <span>1080p HD PLAY</span>
                </span>
                <h3 className="font-bold text-sm text-slate-200 truncate max-w-md">
                  {hdPreviewModal.title}
                </h3>
              </div>
              <button 
                onClick={() => setHdPreviewModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player in HD */}
            <div className="p-2 md:p-4 bg-black">
              <VideoPlayer
                videoUrl={hdPreviewModal.videoUrl}
                watermarkText={currentUser ? currentUser.email : "Sabai LMS HD Student"}
                onEnded={() => {}}
                title={hdPreviewModal.title}
                currentLang={lang}
                poster={hdPreviewModal.poster}
              />
            </div>

            {/* Bottom info bar */}
            <div className="p-4 bg-slate-900/50 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Crystal Clear 1080p High-Bitrate Stream</span>
              </span>
              <button
                onClick={() => {
                  setHdPreviewModal(null);
                  if (selectedCourseDetail) {
                    setView("course-detail");
                  }
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 rounded-xl transition-all cursor-pointer text-xs"
              >
                {lang === "en" ? "View Full Curriculum" : "មើលមេរៀនពេញលេញ"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
