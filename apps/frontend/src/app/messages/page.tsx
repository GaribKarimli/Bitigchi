"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, User as UserIcon, Image as ImageIcon, Search } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function MessagesPage() {
  const [activeChat, setActiveChat] = useState<number | null>(1);
  const [input, setInput] = useState("");

  const contacts = [
    { id: 1, name: "ProTrader99", lastMessage: "Did you see AAPL breakout?", time: "2m ago", unread: 2 },
    { id: 2, name: "BearSlayer", lastMessage: "I told you NVDA would drop.", time: "1h ago", unread: 0 },
    { id: 3, name: "CryptoWhale", lastMessage: "Check out this chart.", time: "1d ago", unread: 0 },
  ];

  const messages = [
    { id: 1, senderId: 1, text: "Hey! What's your target for TSLA this week?", time: "10:30 AM" },
    { id: 2, senderId: "me", text: "I'm looking at $240 resistance.", time: "10:32 AM" },
    { id: 3, senderId: 1, text: "Did you see AAPL breakout?", time: "10:35 AM" },
  ];

  return (
    <div className="min-h-screen pt-16 bg-[#0a0a0f] flex justify-center">
      <Navbar />
      
      <div className="w-full max-w-6xl h-[calc(100vh-64px)] flex border-x border-white/5">
        
        {/* Sidebar */}
        <div className="w-80 border-r border-white/5 bg-black/20 flex flex-col hidden md:flex">
          <div className="p-4 border-b border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Messages</h2>
            <div className="relative">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
               <input 
                 type="text" 
                 placeholder="Search messages..." 
                 className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-[#00d4ff]/50"
               />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {contacts.map(contact => (
              <button 
                key={contact.id}
                onClick={() => setActiveChat(contact.id)}
                className={`w-full p-4 flex items-center gap-3 border-b border-white/5 transition-colors ${activeChat === contact.id ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10 relative">
                  <UserIcon size={18} className="text-white/70" />
                  {contact.unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#00d4ff] text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                      {contact.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-bold text-white">{contact.name}</h4>
                    <span className="text-[10px] text-white/40">{contact.time}</span>
                  </div>
                  <p className="text-xs text-white/60 truncate">{contact.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-black/40">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-black/50 backdrop-blur-md">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
              <UserIcon size={16} className="text-white/70" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">ProTrader99</h3>
              <p className="text-[10px] text-green-400">Online</p>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {messages.map(msg => (
               <div key={msg.id} className={`flex ${msg.senderId === "me" ? "justify-end" : "justify-start"}`}>
                 <div className={`max-w-[70%] text-sm p-3 rounded-2xl ${
                   msg.senderId === "me" 
                   ? "bg-[#00d4ff] text-black font-medium rounded-tr-none" 
                   : "bg-white/5 text-white/90 rounded-tl-none border border-white/5"
                 }`}>
                    {msg.text}
                    <div className={`text-[9px] mt-1 text-right ${msg.senderId === "me" ? "text-black/60" : "text-white/40"}`}>
                      {msg.time}
                    </div>
                 </div>
               </div>
             ))}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/5 bg-black/50">
             <div className="flex items-center gap-2">
                <button className="p-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                  <ImageIcon size={18} />
                </button>
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message @ProTrader99..." 
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-[#00d4ff]/50"
                />
                <button 
                  disabled={!input.trim()}
                  className="p-2.5 rounded-xl bg-[#00d4ff] text-black disabled:opacity-30 disabled:bg-white/10 disabled:text-white"
                >
                  <Send size={18} />
                </button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
