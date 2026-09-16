import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, User, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
}

export default function AIAssistant({ currentLang }: { currentLang: "en" | "km" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m-init",
      sender: "bot",
      text: currentLang === "en" 
        ? "Hello! I am your AI Academic Advisor. What can I help you learn today? Ask me about web architecture, career recommendations, or course curriculums!"
        : "សួស្តី! ខ្ញុំជាអ្នកប្រឹក្សាវគ្គសិក្សាវៃឆ្លាត (AI)។ តើអ្នកចង់សិក្សាអំពីអ្វីនៅថ្ងៃនេះ? សួរខ្ញុំអំពីសរសេរកូដ រចនាប្លង់ ឬការអភិវឌ្ឍជំនាញ!",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue("");
    
    const newUserMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText })
      });

      const data = await response.json();
      const botText = data.response || "I had trouble processing that request. Please try again.";

      const newBotMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: botText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      
      setMessages((prev) => [...prev, newBotMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: "bot",
        text: currentLang === "en" 
          ? "Deepest apologies. I had scheduling timeouts. Ensure Gemini Secret API Key is configured." 
          : "សូមអភ័យទោស! មានបញ្ហាក្នុងការតភ្ជាប់ប្រព័ន្ធ។ សូមពិនិត្យមើល GEMINI_API_KEY នៅក្នុងប្រព័ន្ធរៀបចំ។",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="ai-assistant-root" className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      <motion.button
        id="ai-assistant-toggle"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-slate-800 transition-colors pointer-events-auto border border-slate-700/50 cursor-pointer"
      >
        <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
        <span className="text-sm font-semibold pr-1 hidden md:inline">
          {currentLang === "en" ? "AI Guidance" : "ប្រឹក្សា (AI)"}
        </span>
      </motion.button>

      {/* Floating Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="ai-assistant-window"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-18 right-0 w-[92vw] sm:w-96 h-[500px] bg-white rounded-2xl shadow-3xl overflow-hidden border border-slate-200 flex flex-col"
          >
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-1.5 rounded-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm leading-tight text-white">
                    {currentLang === "en" ? "Academic AI Support" : "ប្រព័ន្ធប្រឹក្សាវៃឆ្លាត (AI)"}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Active Gemini-3.5-Flash</span>
                  </div>
                </div>
              </div>
              <button 
                id="ai-assistant-close"
                onClick={() => setIsOpen(false)} 
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message Pane */}
            <div 
              ref={scrollRef}
              className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 font-sans text-sm"
              id="ai-message-pane"
            >
              {messages.map((msg) => {
                const isBot = msg.sender === "bot";
                return (
                  <div 
                    key={msg.id} 
                    className={`flex gap-2.5 ${isBot ? "" : "flex-row-reverse"}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${isBot ? "bg-slate-900 text-white" : "bg-blue-600 text-white"}`}>
                      {isBot ? <Sparkles className="w-4 h-4 text-cyan-400" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className="max-w-[75%]">
                      <div className={`p-3 rounded-2xl leading-relaxed text-slate-800 shadow-sm whitespace-pre-wrap ${isBot ? "bg-white border border-slate-100 rounded-tl-none" : "bg-blue-600 text-white rounded-tr-none"}`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1 px-1 font-mono">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                  </div>
                  <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form 
              id="ai-assistant-input-form"
              onSubmit={handleSendMessage} 
              className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
            >
              <input
                id="ai-assistant-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={currentLang === "en" ? "Query curriculum details..." : "សួរសំណួរអំពីមេរៀន..."}
                className="flex-1 px-4 py-2 bg-slate-100 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 rounded-xl transition-all"
              />
              <button
                id="ai-assistant-send-btn"
                type="submit"
                className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
