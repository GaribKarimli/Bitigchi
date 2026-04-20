"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Maximize2, Minimize2, Sparkles, User, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: "user" | "ai";
  content: string;
  created_at?: string;
}

export default function AIChatWidget({ symbol }: { symbol: string }) {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { 
          role: "ai", 
          content: `Hello! I'm Bitigchi AI, your personal financial analyst. I'm currently monitoring ${symbol}. How can I help you analyze this stock today?` 
        }
      ]);
    }
  }, [isOpen, symbol]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    if (!token) {
      setMessages(prev => [...prev, { role: "ai", content: "Please sign in to your Bitigchi account to use the AI analyst service." }]);
      return;
    }

    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          symbol,
          message: input
        })
      });

      if (!response.ok) throw new Error("AI failed to respond");
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: "ai", content: data.content }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", content: "I'm having trouble connecting to my central brain. Please check your internet or try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50 overflow-hidden"
          style={{ 
             background: "linear-gradient(135deg, #00d4ff, #c9a84c)",
             boxShadow: "0 0 20px rgba(0, 212, 255, 0.4)"
          }}
        >
          <Bot size={28} className="text-white" />
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ 
               opacity: 1, 
               y: 0, 
               scale: 1,
               height: isMinimized ? "60px" : "500px" 
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-[350px] rounded-2xl shadow-2xl z-50 overflow-hidden border border-white/10"
            style={{ 
              background: "rgba(13, 13, 23, 0.95)",
              backdropFilter: "blur(20px)"
            }}
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center">
                   <Sparkles size={16} className="text-[#00d4ff]" />
                </div>
                <div>
                   <h3 className="text-sm font-bold text-white">Bitigchi AI</h3>
                   {!isMinimized && <p className="text-[10px] text-[#00d4ff] animate-pulse">Monitoring {symbol}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                   onClick={() => setIsMinimized(!isMinimized)}
                   className="p-1.5 hover:bg-white/5 rounded-md text-[#6b7280]"
                >
                   {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
                <button 
                   onClick={() => setIsOpen(false)}
                   className="p-1.5 hover:bg-white/5 rounded-md text-[#6b7280]"
                >
                   <X size={14} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="h-[360px] overflow-y-auto p-4 space-y-4 custom-scrollbar">
                   {messages.map((msg, idx) => (
                     <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.role === "user" 
                          ? "bg-[#00d4ff] text-white rounded-tr-none" 
                          : "bg-white/5 text-[#e8e6e3] border border-white/5 rounded-tl-none"
                        }`}>
                          {msg.content}
                        </div>
                     </div>
                   ))}
                   {loading && (
                     <div className="flex justify-start">
                        <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
                           <Loader2 size={14} className="animate-spin text-[#00d4ff]" />
                        </div>
                     </div>
                   )}
                   <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-white/[0.01]">
                   <div className="relative">
                      <input 
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything about this stock..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-10 text-xs text-white placeholder:text-[#4a4a5a] focus:border-[#00d4ff]/50 focus:ring-0 outline-none transition-all"
                      />
                      <button 
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-2 top-1.5 p-1.5 rounded-lg bg-[#00d4ff]/10 text-[#00d4ff] hover:bg-[#00d4ff] hover:text-white transition-all disabled:opacity-30"
                      >
                         <Send size={14} />
                      </button>
                   </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
