import React, { useRef } from "react";
import { X, Award, Download, Share2, ShieldCheck, Printer } from "lucide-react";
import { motion } from "motion/react";

interface CertificateParams {
  studentName: string;
  courseTitle: string;
  dateString: string;
  certificateId: string;
  instructorName: string;
}

export default function CertificationModal({
  isOpen,
  onClose,
  params,
  currentLang
}: {
  isOpen: boolean;
  onClose: () => void;
  params: CertificateParams;
  currentLang: "en" | "km";
}) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    const certDetails = printRef.current?.innerHTML;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>LMS Certificate - ${params.studentName}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;600;700&family=Playfair+Display:ital,wght@0,600;1,400&family=Inter:wght@400;600&display=swap');
              body {
                margin: 0;
                padding: 10px;
                font-family: 'Inter', sans-serif;
                background-color: #ffffff;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
              }
              .cert-container {
                border: 20px solid #0f172a;
                border-image: linear-gradient(to right, #d4af37, #aa7c11) 20;
                padding: 40px;
                width: 800px;
                text-align: center;
                background-color: #fafbfc;
                box-sizing: border-box;
              }
            </style>
          </head>
          <body>
            <div class="cert-container">
              ${certDetails}
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 z-55 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-4xl p-6 md:p-8 shadow-2xl relative border border-slate-200"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <Award className="w-10 h-10 text-amber-500 mx-auto animate-bounce mb-2" />
          <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-slate-900">
            {currentLang === "en" ? "Congratulations on Completion!" : "អបអរសាទរការបញ្ចប់ការសិក្សារួចរាល់!"}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {currentLang === "en"
              ? "Verify your verified accomplishments. Highly secure and verifiable across LinkedIn & portfolios."
              : "វិញ្ញាបនបត្រឌីជីថលផ្លូវការរបស់អ្នកមានសុពលភាពខ្ពស់ និងអាចប្រើប្រាស់ជាសាធារណៈបាន។"}
          </p>
        </div>

        {/* Certificate Blueprint Rendering Card Container */}
        <div className="border-4 border-double border-slate-900 p-1 bg-slate-50 rounded-2xl overflow-x-auto shadow-inner">
          <div
            ref={printRef}
            className="border border-slate-200 p-8 md:p-12 text-center bg-white min-w-[700px] relative rounded-xl"
            style={{ backgroundImage: "radial-gradient(#f1f5f9 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }}
          >
            {/* Elegant Frame Borders */}
            <div className="absolute top-3 left-3 right-3 bottom-3 border-2 border-slate-800 pointer-events-none opacity-40"></div>
            
            {/* Header / Crest */}
            <div className="mb-4">
              <span className="text-xs tracking-[0.2em] text-amber-600 font-mono font-bold uppercase block">
                Official Digital Credential Certify
              </span>
              <h2 className="font-serif italic text-3xl text-slate-900 mt-2">
                SABAICODE E-LEARNING ACADEMY
              </h2>
              <div className="w-16 h-[2px] bg-slate-800 mx-auto mt-3"></div>
            </div>

            <p className="font-serif text-slate-500 italic mt-6 text-sm">
              This credential certifies that the student
            </p>

            <h1 className="text-3xl font-bold font-sans tracking-tight text-amber-600 my-4 uppercase">
              {params.studentName}
            </h1>

            <p className="font-serif text-slate-500 italic text-sm">
              has successfully fulfilled all curriculum requirements and completed the masterclass in
            </p>

            <h3 className="text-xl font-bold font-sans max-w-xl mx-auto my-4 text-slate-900 border-b border-t border-slate-100 py-3">
              {params.courseTitle}
            </h3>

            <p className="text-xs text-slate-400 mt-4 leading-relaxed font-mono">
              Issued with Verified Academic Ingress Permissions on <span className="text-slate-700 font-bold">{params.dateString}</span>
            </p>

            {/* Seals & Signatures */}
            <div className="flex justify-between items-end mt-10 px-8">
              <div className="text-left w-1/3">
                <div className="h-6 font-serif italic text-slate-800 text-xs border-b border-slate-300 pb-1 font-bold">
                  {params.instructorName}
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-1 block">Course Instructor</span>
              </div>

              <div className="flex flex-col items-center justify-center w-1/3">
                <div className="w-14 h-14 border border-amber-600 bg-amber-50/50 rounded-full flex items-center justify-center relative">
                  <ShieldCheck className="w-8 h-8 text-amber-600" />
                </div>
                <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase mt-1 block">Verified ID: {params.certificateId}</span>
              </div>

              <div className="text-right w-1/3">
                <div className="h-6 font-serif italic text-slate-800 text-xs border-b border-slate-300 pb-1 font-bold">
                  Sopheap Mok
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-1 block">Academy Director</span>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons / Controls footer */}
        <div className="mt-6 flex flex-wrap gap-3 justify-end items-center">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            {currentLang === "en" ? "Print / View PDF" : "បោះពុម្ពវិញ្ញាបនបត្រ"}
          </button>
          
          <button
            onClick={() => alert(currentLang === "en" ? "Certificate verification link copied!" : "តំណភា្ជប់វិញ្ញាបនបត្រត្រូវបានចម្លង!")}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            {currentLang === "en" ? "Share Credential" : "ចែករំលែក"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
