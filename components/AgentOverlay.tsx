
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentRole, AgentStatus } from '../types';
import { Code, Layout, Database, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

interface AgentOverlayProps {
  agents: AgentStatus[];
  isVisible: boolean;
}

const getIcon = (role: AgentRole) => {
  switch (role) {
    case AgentRole.UI_DESIGNER: return <Layout className="w-4 h-4 md:w-5 md:h-5" />;
    case AgentRole.FRONTEND: return <Code className="w-4 h-4 md:w-5 md:h-5" />;
    case AgentRole.BACKEND: return <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />;
    case AgentRole.DATABASE: return <Database className="w-4 h-4 md:w-5 md:h-5" />;
    case AgentRole.REVIEWER: return <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />;
  }
};

export const AgentOverlay: React.FC<AgentOverlayProps> = ({ agents, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          className="fixed bottom-16 md:bottom-8 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl"
        >
          <div className="glass rounded-2xl p-4 md:p-6 shadow-2xl border border-blue-500/20 neon-glow overflow-hidden">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-sm md:text-lg font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Synthesizing Agents...
              </h3>
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 md:w-4 md:h-4 text-blue-400 animate-spin" />
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold hidden sm:inline">Active</span>
              </div>
            </div>
            
            <div className="flex md:grid md:grid-cols-5 gap-2 md:gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {agents.map((agent) => (
                <div 
                  key={agent.role}
                  className={`flex flex-col items-center p-2 md:p-3 rounded-xl transition-all duration-500 border shrink-0 w-20 md:w-auto ${
                    agent.status === 'working' ? 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 
                    agent.status === 'completed' ? 'border-emerald-500/50 bg-emerald-500/10' : 
                    'border-white/5 bg-white/5 opacity-40'
                  }`}
                >
                  <div className={`mb-1.5 md:mb-2 p-1.5 md:p-2 rounded-lg ${
                    agent.status === 'working' ? 'text-blue-400' : 
                    agent.status === 'completed' ? 'text-emerald-400' : 
                    'text-slate-500'
                  }`}>
                    {getIcon(agent.role)}
                  </div>
                  <span className="text-[8px] md:text-[10px] font-bold text-center leading-tight uppercase tracking-tighter truncate w-full">
                    {agent.role.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 md:mt-6 h-1 w-full bg-slate-800/50 rounded-full overflow-hidden">
               <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(agents.filter(a => a.status === 'completed').length / agents.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
               />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
