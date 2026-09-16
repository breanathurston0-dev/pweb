import React, { useState } from "react";
import {
  Lightbulb,
  Code2,
  Cpu,
  Rocket,
  CheckCircle2,
  Check,
  Terminal,
  Play,
  Copy,
  Sparkles,
  Bot,
  Laptop,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Layers,
  Send,
  Coffee
} from "lucide-react";

interface BuildSoftwareWithAiShowcaseProps {
  lang: "en" | "km";
  onEnroll?: () => void;
  onPreviewLesson?: () => void;
}

export const BuildSoftwareWithAiShowcase: React.FC<BuildSoftwareWithAiShowcaseProps> = ({
  lang,
  onEnroll,
  onPreviewLesson
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [checkedPlan, setCheckedPlan] = useState<{ [key: string]: boolean }>({
    "plan-1": true,
    "plan-2": true,
    "plan-3": true,
    "plan-4": false,
    "plan-5": false,
  });

  const [aiChatInput, setAiChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "ai" | "user"; text: string }>>([
    {
      sender: "ai",
      text: "Here's a simple Flask web app that returns a hello message. You can run it with: python app.py. Would you like me to add a frontend or database next?"
    }
  ]);
  const [isSimulatingRun, setIsSimulatingRun] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const steps = [
    {
      number: "1",
      title: lang === "en" ? "Learn the Basics" : "រៀនមូលដ្ឋានគ្រឹះ",
      icon: Lightbulb,
      color: "from-amber-500 to-orange-500",
      bgLight: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
      desc: lang === "en" 
        ? "Master Python & modern JavaScript fundamentals, VS Code workspace configuration, git version control, and data structures before coding with AI."
        : "យល់ដឹងច្បាស់ពីគ្រឹះ Python & JavaScript ការដំឡើង VS Code, Git Version Control និងទម្រង់ទិន្នន័យចាំបាច់។",
      skills: ["Python 3.11+", "JavaScript / TypeScript", "VS Code Setup", "Git & GitHub"]
    },
    {
      number: "2",
      title: lang === "en" ? "Use AI Assistants" : "ប្រើប្រាស់ជំនួយការ AI",
      icon: Code2,
      color: "from-blue-500 to-cyan-500",
      bgLight: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      desc: lang === "en"
        ? "Harness ChatGPT, GitHub Copilot, Gemini & Cursor for real-time code generation, intelligent refactoring, automated bug detection, and documentation."
        : "ប្រើប្រាស់ ChatGPT, GitHub Copilot, Gemini & Cursor ក្នុងការ generate កូដ ដោះស្រាយ bug ដោយស្វ័យប្រវត្តិ និងបង្កើតឯកសារបច្ចេកទេស។",
      skills: ["Prompt Engineering", "GitHub Copilot", "ChatGPT Plus / Gemini", "Cursor AI Workflows"]
    },
    {
      number: "3",
      title: lang === "en" ? "Build Your Project" : "បង្កើតគម្រោងជាក់ស្តែង",
      icon: Cpu,
      color: "from-emerald-500 to-teal-500",
      bgLight: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      desc: lang === "en"
        ? "Construct full-stack web applications: Python Flask / Node APIs, responsive UI frontends, persistent relational databases, and custom AI chat intelligence."
        : "បង្កើត Full-Stack Web App ទាំងមូល៖ Python Flask / Node APIs, Responsive UI, Database រឹងមាំ និងបង្កប់ AI Chat Assistant ឆ្លាតវៃ។",
      skills: ["REST APIs (Flask/FastAPI)", "Frontend Integrations", "Database Architecture", "AI API Connectors"]
    },
    {
      number: "4",
      title: lang === "en" ? "Deploy & Grow" : "ដាក់ដំណើរការ & ពង្រីក",
      icon: Rocket,
      color: "from-purple-500 to-indigo-500",
      bgLight: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      desc: lang === "en"
        ? "Automate testing, containerize applications, and ship production builds securely to Vercel, Render, or Cloud Run with custom domains and analytics."
        : "ធ្វើតេស្តកូដដោយស្វ័យប្រវត្តិ និង Deploy ទៅកាន់ Production លើ Vercel, Render ឬ Cloud Run ជាមួយ Custom Domain និងប្រព័ន្ធត្រួតពិនិត្យ។",
      skills: ["Vercel & Render", "Automated Testing", "Cloud Run / Docker", "Production Scaling"]
    }
  ];

  const whatYoullLearn = [
    {
      en: "Write and improve code with AI (e.g., ChatGPT, Copilot)",
      km: "សរសេរ និងកែលម្អកូដជាមួយ AI (ដូចជា ChatGPT, GitHub Copilot)"
    },
    {
      en: "Build real applications (web apps, APIs, full-stack systems)",
      km: "បង្កើតកម្មវិធីជាក់ស្តែង (Web Apps, REST APIs, Full-stack Systems)"
    },
    {
      en: "Use AI for debugging, automated testing and documentation",
      km: "ប្រើ AI ក្នុងការកែកំហុសកូដ (Debugging) ធ្វើតេស្ត និងសរសេរ Documentation"
    },
    {
      en: "Integrate AI tools into your daily development workflow",
      km: "បញ្ជ្រាបឧបករណ៍ AI ទៅក្នុងទម្លាប់នៃការសរសេរកូដប្រចាំថ្ងៃរបស់អ្នក"
    },
    {
      en: "Deploy and share your software with the world",
      km: "ដាក់ឱ្យដំណើរការលើ Cloud (Deploy) និងចែករំលែកសូហ្វវែររបស់អ្នកជាសកល"
    }
  ];

  const popularTools = [
    {
      name: "ChatGPT",
      company: "OpenAI",
      color: "from-emerald-500 to-teal-600",
      desc: lang === "en" ? "Architecture, logic & code explanation" : "រៀបចំស្ថាបត្យកម្មកូដ និងពន្យល់កូដ"
    },
    {
      name: "GitHub Copilot",
      company: "GitHub / Microsoft",
      color: "from-indigo-500 to-blue-600",
      desc: lang === "en" ? "Inline real-time code completion" : "បំពេញកូដស្វ័យប្រវត្តិក្នុ្នង editor"
    },
    {
      name: "VS Code",
      company: "Microsoft",
      color: "from-cyan-500 to-blue-600",
      desc: lang === "en" ? "Modern IDE environment & extensions" : "កម្មវិធីសរសេរកូដស្តង់ដារអន្តរជាតិ"
    },
    {
      name: "Vercel / Render",
      company: "Cloud Hosting",
      color: "from-purple-500 to-pink-600",
      desc: lang === "en" ? "Instant 1-click cloud deployment" : "ដាក់ឱ្យដំណើរការលើ Cloud ត្រឹមតែ 1-Click"
    }
  ];

  const learningPlanItems = [
    { id: "plan-1", en: "Learn Python / JavaScript", km: "រៀនមូលដ្ឋានគ្រឹះ Python / JavaScript" },
    { id: "plan-2", en: "Explore AI tools (ChatGPT, Copilot)", km: "ស្វែងយល់ឧបករណ៍ AI (ChatGPT, Copilot)" },
    { id: "plan-3", en: "Build a small project (Web API)", km: "បង្កើតគម្រោងតូចដំបូង (Web API)" },
    { id: "plan-4", en: "Add AI features & assistant chat", km: "បញ្ចូលមុខងារ AI & Assistant Chat" },
    { id: "plan-5", en: "Deploy it! (Vercel / Render)", km: "ដាក់ដំណើរការជាសាធារណៈ (Vercel / Render)" },
  ];

  const flaskCodeSnippet = `from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/hello")
def hello():
    return {"message": "Hello from AI!"}

if __name__ == "__main__":
    app.run(debug=True)`;

  const togglePlanItem = (id: string) => {
    setCheckedPlan(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(flaskCodeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRunSimulatedApp = () => {
    setIsSimulatingRun(true);
    setTerminalOutput("Starting development server...\n$ python app.py\n * Serving Flask app 'app'\n * Debug mode: on\n * Running on http://127.0.0.1:5000\n * Route GET /api/hello -> 200 OK: {\"message\": \"Hello from AI!\"}\nAI System Ready!");
    setTimeout(() => {
      setIsSimulatingRun(false);
    }, 600);
  };

  const handleSendAiMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiChatInput.trim()) return;

    const userText = aiChatInput.trim();
    setAiChatInput("");
    setChatMessages(prev => [...prev, { sender: "user", text: userText }]);

    setTimeout(() => {
      let aiReply = "Great question! In Module 3 of this course, you will connect this Flask API with a modern React frontend and integrate LLM streaming so your users get real-time AI responses!";
      if (userText.toLowerCase().includes("database") || userText.toLowerCase().includes("sql")) {
        aiReply = "To add a database, you can use SQLite or PostgreSQL with SQLAlchemy ORM. The course covers complete database migrations with AI-generated models!";
      } else if (userText.toLowerCase().includes("deploy") || userText.toLowerCase().includes("render")) {
        aiReply = "You can deploy this in 3 minutes to Render or Vercel using a simple requirements.txt and Procfile. We do this step-by-step in Step 4!";
      }
      setChatMessages(prev => [...prev, { sender: "ai", text: aiReply }]);
    }, 700);
  };

  return (
    <div id="build-software-ai-showcase" className="space-y-10 my-8">
      {/* 1. High-Impact Visual Hero Poster Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border border-slate-800 shadow-2xl p-6 sm:p-10">
        {/* Background glow effects */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Badges & Quotes */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              {lang === "en" ? "Official Course Blueprint" : "គំរូវគ្គសិក្សាផ្លូវការ"}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-800/60 text-slate-300 border border-slate-700">
              {lang === "en" ? "4 Guided Modules" : "៤ ម៉ូឌុលពេញលេញ"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-handwriting font-bold text-amber-300 text-xs sm:text-sm tracking-wide transform -rotate-1">
                "Small Steps Build Big Software"
              </div>
              <div className="text-[10px] text-cyan-300 font-mono">Code + AI = Big Ideas</div>
            </div>
          </div>
        </div>

        {/* Header Title & Slogan */}
        <div className="relative z-10 max-w-3xl space-y-3 mb-10">
          <div className="text-xs font-bold font-mono tracking-widest text-cyan-400 uppercase">
            {lang === "en" ? "Learning" : "រៀនសូត្រ"}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            <span>to Build Software </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300">
              with AI
            </span>
          </h2>
          <p className="text-base sm:text-xl font-medium text-slate-300">
            {lang === "en"
              ? "Better tools. Faster development. A smarter future."
              : "ឧបករណ៍ទំនើបជាងមុន • អភិវឌ្ឍន៍រហ័សជាងមុន • អនាគតឆ្លាតវៃជាងមុន"}
          </p>
        </div>

        {/* The 4 Guided Steps Pipeline (Matching the 4 top cards in image) */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;
            return (
              <div
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`relative rounded-2xl p-4 sm:p-5 transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-slate-800/90 border-cyan-400 shadow-lg shadow-cyan-500/10 scale-102"
                    : "bg-slate-900/60 hover:bg-slate-800/50 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${step.color} text-white shadow-md`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Step 0{step.number}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm sm:text-base text-white mb-1">
                  {step.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                  {step.desc}
                </p>

                {isSelected && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyan-400 rounded-full" />
                )}
              </div>
            );
          })}
        </div>

        {/* Active Step Highlight Card */}
        <div className="relative z-10 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-5 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                  Active Module Deep Dive
                </span>
                <span className="text-xs font-bold text-white">
                  Step {steps[activeStep].number}: {steps[activeStep].title}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {steps[activeStep].desc}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {steps[activeStep].skills.map((skill, sIdx) => (
                <span key={sIdx} className="text-[11px] font-medium bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Laptop Simulator & Developer Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 7 Cols: Laptop Simulator (app.py + AI Assistant chat) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Laptop className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                {lang === "en" ? "Interactive Developer Workspace" : "Workspace សរសេរកូដជាក់ស្តែង"}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
              app.py + AI Assistant
            </span>
          </div>

          {/* Laptop frame mockup */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-3 sm:p-4 shadow-2xl text-slate-200">
            {/* Window bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 mb-3 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                <span className="ml-2 text-slate-300 font-bold">Python Flask & AI Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-[11px]"
                  title="Copy code"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? "Copied!" : "Copy"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRunSimulatedApp}
                  disabled={isSimulatingRun}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>{isSimulatingRun ? "Running..." : "Run app.py"}</span>
                </button>
              </div>
            </div>

            {/* Split Screen: Left Code, Right AI Assistant */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[290px]">
              
              {/* Code Editor view */}
              <div className="bg-slate-900/90 rounded-xl p-3 font-mono text-xs border border-slate-800 overflow-x-auto">
                <div className="text-[10px] text-slate-500 mb-2 border-b border-slate-800 pb-1 flex items-center justify-between">
                  <span>📄 app.py</span>
                  <span className="text-cyan-400">Flask 3.0</span>
                </div>
                <pre className="text-slate-300 leading-relaxed font-mono whitespace-pre text-[11.5px]">
                  <code>{flaskCodeSnippet}</code>
                </pre>
              </div>

              {/* AI Assistant Chat Panel */}
              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 border-b border-slate-800 pb-2 mb-2">
                    <div className="w-5 h-5 rounded-md bg-cyan-500/20 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <span>AI Assistant</span>
                    <span className="ml-auto text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                      Online
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                    {chatMessages.map((msg, mIdx) => (
                      <div
                        key={mIdx}
                        className={`p-2.5 rounded-xl ${
                          msg.sender === "ai"
                            ? "bg-slate-800/80 text-slate-200 border border-slate-700/60 text-[11px] leading-relaxed"
                            : "bg-cyan-950/60 text-cyan-200 border border-cyan-800/50 text-[11px] text-right"
                        }`}
                      >
                        {msg.text}
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSendAiMessage} className="mt-3 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={aiChatInput}
                    onChange={(e) => setAiChatInput(e.target.value)}
                    placeholder={lang === "en" ? "Ask anything (e.g. add database)..." : "សួរអ្វីក៏បាន (ឧ. បន្ថែម database)..."}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                  />
                  <button
                    type="submit"
                    className="bg-cyan-600 hover:bg-cyan-500 text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                    title="Send to AI Assistant"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Simulated Terminal Output */}
            {terminalOutput && (
              <div className="mt-3 bg-black/80 rounded-xl p-3 border border-emerald-900/50 font-mono text-[10.5px] text-emerald-400 space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-[10px] border-b border-slate-800 pb-1">
                  <span className="flex items-center gap-1"><Terminal className="w-3 h-3 text-emerald-500" /> Terminal Console</span>
                  <button onClick={() => setTerminalOutput(null)} className="hover:text-slate-300">Clear</button>
                </div>
                <pre className="whitespace-pre-wrap leading-tight">{terminalOutput}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Cols: "My Learning Plan" Notebook & Popular Tools */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Spiral Notebook "My Learning Plan" */}
          <div className="bg-amber-50/70 dark:bg-slate-900 border-2 border-amber-200/80 dark:border-slate-700 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            {/* Top spiral visual markers */}
            <div className="flex items-center justify-between border-b-2 border-dashed border-amber-300 dark:border-slate-700 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {lang === "en" ? "My Learning Plan" : "ផែនការសិក្សារបស់ខ្ញុំ"}
                </h4>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                {Object.values(checkedPlan).filter(Boolean).length} / {learningPlanItems.length} Done
              </span>
            </div>

            {/* Checklist items */}
            <div className="space-y-3 font-sans">
              {learningPlanItems.map((item) => {
                const isChecked = checkedPlan[item.id];
                return (
                  <label
                    key={item.id}
                    onClick={() => togglePlanItem(item.id)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-amber-100/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer select-none"
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        isChecked
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800"
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-3" />}
                    </div>
                    <span
                      className={`text-xs sm:text-sm font-medium transition-all ${
                        isChecked
                          ? "line-through text-slate-400 dark:text-slate-500"
                          : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {lang === "en" ? item.en : item.km}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Bottom smile mark */}
            <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono text-[11px]">Keep progressing every day!</span>
              <span className="text-base font-bold text-amber-600 dark:text-amber-400">:)</span>
            </div>
          </div>

          {/* Book Stack on Desk Visual */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                {lang === "en" ? "Curriculum Reference Stack" : "គន្ថនិទ្ទេសសំខាន់ៗ"}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-amber-600 font-bold">
                <Coffee className="w-3.5 h-3.5" /> Build The Future
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold font-mono shadow-xs flex items-center justify-between">
                <span>📘 Python</span>
                <span className="text-[10px] font-normal opacity-80">Fundamentals & Scripts</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold font-mono shadow-xs flex items-center justify-between">
                <span>📗 Web Development</span>
                <span className="text-[10px] font-normal opacity-80">Full-Stack & APIs</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold font-mono shadow-xs flex items-center justify-between">
                <span>📙 AI & Machine Learning</span>
                <span className="text-[10px] font-normal opacity-80">LLMs & Code Assist</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold font-mono shadow-xs flex items-center justify-between">
                <span>📕 Clean Code</span>
                <span className="text-[10px] font-normal opacity-80">Refactoring & Standards</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. "What You'll Learn" & "Popular Tools" Detailed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
        
        {/* Left 7 Cols: What You'll Learn (matching image bullet points) */}
        <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
              Core Competencies
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {lang === "en" ? "What You'll Learn" : "អ្វីដែលអ្នកនឹងទទួលបានពីវគ្គសិក្សានេះ"}
            </h3>
          </div>

          <div className="space-y-4">
            {whatYoullLearn.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3.5">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-3.5 h-3.5 stroke-3" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 leading-snug">
                  {lang === "en" ? item.en : item.km}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
            {onEnroll && (
              <button
                type="button"
                onClick={onEnroll}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-102 cursor-pointer flex items-center gap-2"
              >
                <span>{lang === "en" ? "Enroll in This Masterclass" : "ចុះឈ្មោះចូលរៀនវគ្គនេះ"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {onPreviewLesson && (
              <button
                type="button"
                onClick={onPreviewLesson}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{lang === "en" ? "Watch Free Lesson 1 Preview" : "ទស្សនាមេរៀនទី១ ឥតគិតថ្លៃ"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Popular Tools badges */}
        <div className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Tooling Ecosystem
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {lang === "en" ? "Popular Tools" : "ឧបករណ៍ពេញនិយមដែលត្រូវរៀន"}
            </h3>
          </div>

          <div className="space-y-3">
            {popularTools.map((tool, tIdx) => (
              <div
                key={tIdx}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${tool.color} text-white flex items-center justify-center font-bold font-mono text-sm shadow-sm shrink-0`}>
                  {tool.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                      {tool.name}
                    </h5>
                    <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                      {tool.company}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    {tool.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-800/50 text-cyan-950 dark:text-cyan-200 text-xs leading-relaxed font-medium">
            💡 {lang === "en"
              ? "All students get guided template repositories, pre-configured AI prompt libraries, and step-by-step video tutorials."
              : "សិស្សទាំងអស់ទទួលបាន template repositories គំរូ, កម្រង prompt ជំនួយ និងវីដេអូបង្រៀនមួយជំហានម្តងៗ។"}
          </div>
        </div>

      </div>
    </div>
  );
};
