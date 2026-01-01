
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Bot, Loader2, X, MessageSquareCode } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  onClose: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isProcessing, onClose }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <motion.div 
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="absolute right-0 top-0 bottom-0 w-full md:w-96 glass border-l border-white/10 z-[70] flex flex-col shadow-2xl"
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <MessageSquareCode className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-none">Architect Chat</h3>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">AI Pair Programmer</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 && !isProcessing && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 opacity-40">
            <Sparkles className="w-12 h-12 text-blue-500 mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Project Context Loaded</p>
            <p className="text-sm text-slate-500 mt-2">Ask me to fix a bug, add a feature, or change the styling.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
              msg.role === 'user' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' 
              : 'bg-white/5 border border-white/10 text-slate-200'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                {msg.role === 'user' ? <User className="w-3 h-3 opacity-50" /> : <Bot className="w-3 h-3 text-blue-400" />}
                <span className="text-[9px] font-black uppercase tracking-tighter opacity-50">
                  {msg.role === 'user' ? 'You' : 'Mahi Architect'}
                </span>
              </div>
              <p className="leading-relaxed font-medium">{msg.text}</p>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              <span className="text-xs text-blue-400 font-bold uppercase tracking-widest animate-pulse">Synthesizing...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-slate-900/60">
        <div className="relative">
          <input 
            type="text"
            placeholder="E.g. Add a dark mode toggle..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-slate-600"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white rounded-lg transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[9px] text-slate-500 text-center mt-3 uppercase tracking-widest font-black">Changes are applied immediately to code & preview</p>
      </form>
    </motion.div>
  );
};
