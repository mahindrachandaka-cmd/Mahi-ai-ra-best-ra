
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Code2, 
  Monitor, 
  Smartphone, 
  Download, 
  Layers, 
  Cpu, 
  Sparkles,
  Zap,
  Terminal,
  Settings,
  Folder,
  FileText,
  FileCode,
  ChevronRight,
  RefreshCcw,
  Menu,
  X,
  Play,
  ShoppingCart,
  Trash2,
  CheckCircle,
  Archive,
  History,
  Clock,
  LayoutGrid,
  Search,
  AlertTriangle,
  MessageSquare,
  Wand2
} from 'lucide-react';
import JSZip from 'jszip';
import { generateAppCode, updateAppCode } from './services/geminiService';
import { AppProject, FileContent, AgentRole, AgentStatus, UserProfile, ChatMessage } from './types';
import { CodeEditor } from './components/Editor';
import { Preview } from './components/Preview';
import { AgentOverlay } from './components/AgentOverlay';
import { ChatPanel } from './components/ChatPanel';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeProject, setActiveProject] = useState<AppProject | null>(null);
  const [savedProjects, setSavedProjects] = useState<AppProject[]>([]);
  const [activeFile, setActiveFile] = useState<FileContent | null>(null);
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'ai' | 'cart'>('editor');
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile'>('desktop');
  const [showAgents, setShowAgents] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [genError, setGenError] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentStatus[]>(Object.values(AgentRole).map(role => ({
    role, status: 'idle', message: ''
  })));
  
  const [user] = useState<UserProfile>({
    uid: '123',
    displayName: 'Mahi Developer',
    email: 'hello@mahi.ai',
    plan: 'Ultra',
    credits: 9999
  });

  useEffect(() => {
    const stored = localStorage.getItem('mahi_vault_v3');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setSavedProjects(parsed);
      } catch (e) {
        console.error("Vault access failed", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mahi_vault_v3', JSON.stringify(savedProjects));
  }, [savedProjects]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setShowAgents(true);
    setGenError(null);
    setIsMobileMenuOpen(false);
    setChatMessages([]);
    
    const updateAgentStatus = (role: AgentRole, status: AgentStatus['status']) => {
      setAgents(prev => prev.map(a => a.role === role ? { ...a, status } : a));
    };

    try {
      setAgents(Object.values(AgentRole).map(role => ({ role, status: 'idle', message: '' })));
      
      updateAgentStatus(AgentRole.UI_DESIGNER, 'working');
      await new Promise(r => setTimeout(r, 400));
      updateAgentStatus(AgentRole.UI_DESIGNER, 'completed');
      
      updateAgentStatus(AgentRole.FRONTEND, 'working');
      updateAgentStatus(AgentRole.BACKEND, 'working');
      
      const files = await generateAppCode(prompt);
      
      updateAgentStatus(AgentRole.FRONTEND, 'completed');
      updateAgentStatus(AgentRole.BACKEND, 'completed');
      updateAgentStatus(AgentRole.DATABASE, 'completed');
      updateAgentStatus(AgentRole.REVIEWER, 'completed');
      
      const newProject: AppProject = {
        id: `proj_${Date.now()}`,
        name: prompt.length > 20 ? prompt.substring(0, 20).trim() + "..." : prompt.trim(),
        prompt,
        files,
        createdAt: Date.now()
      };
      
      setSavedProjects(prev => [newProject, ...prev]);
      setActiveProject(newProject);
      setActiveFile(files[0] || null);
      setViewMode('preview');
      
      setTimeout(() => {
        setShowAgents(false);
        setIsGenerating(false);
      }, 1000);
    } catch (error: any) {
      setGenError(error.message || "Synthesis failure.");
      setIsGenerating(false);
    }
  };

  const handleChatRequest = async (text: string) => {
    if (!activeProject || isGenerating) return;
    
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);
    setShowAgents(true);
    
    const updateAgentStatus = (role: AgentRole, status: AgentStatus['status']) => {
      setAgents(prev => prev.map(a => a.role === role ? { ...a, status } : a));
    };

    try {
      setAgents(Object.values(AgentRole).map(role => ({ role, status: 'idle', message: '' })));
      updateAgentStatus(AgentRole.FRONTEND, 'working');
      updateAgentStatus(AgentRole.REVIEWER, 'working');
      
      const updatedFiles = await updateAppCode(activeProject.files, text);
      
      const updatedProject = { ...activeProject, files: updatedFiles };
      setActiveProject(updatedProject);
      setSavedProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProject : p));
      
      // Update active file if it exists in the new file set
      if (activeFile) {
        const matching = updatedFiles.find(f => f.path === activeFile.path);
        if (matching) setActiveFile(matching);
      }

      setChatMessages(prev => [...prev, {
        id: `msg_bot_${Date.now()}`,
        role: 'assistant',
        text: "I've updated the source code with your requested changes. You can see the results in the preview.",
        timestamp: Date.now()
      }]);

      updateAgentStatus(AgentRole.FRONTEND, 'completed');
      updateAgentStatus(AgentRole.REVIEWER, 'completed');
      
      setTimeout(() => {
        setShowAgents(false);
        setIsGenerating(false);
      }, 1000);
    } catch (error: any) {
      setChatMessages(prev => [...prev, {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        text: `Error refining project: ${error.message}`,
        timestamp: Date.now()
      }]);
      setIsGenerating(false);
      setShowAgents(false);
    }
  };

  const handleFileChange = useCallback((newContent: string) => {
    if (!activeProject || !activeFile) return;
    const updatedFiles = activeProject.files.map(f => 
      f.path === activeFile.path ? { ...f, content: newContent } : f
    );
    const updatedProject = { ...activeProject, files: updatedFiles };
    setActiveProject(updatedProject);
    setActiveFile({ ...activeFile, content: newContent });
    setSavedProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProject : p));
  }, [activeProject, activeFile]);

  const downloadProject = useCallback(async () => {
    if (!activeProject) return;
    try {
      const zip = new JSZip();
      activeProject.files.forEach(file => { zip.file(file.path, file.content); });
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${activeProject.name.replace(/\s+/g, '_').toLowerCase()}_mahi_dev.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) { alert("Archive generation failed."); }
  }, [activeProject]);

  const deleteProject = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Permanently delete this project?")) {
      setSavedProjects(prev => prev.filter(p => p.id !== id));
      if (activeProject?.id === id) {
        setActiveProject(null);
        setActiveFile(null);
        setViewMode('editor');
      }
    }
  };

  const loadProject = (project: AppProject) => {
    setActiveProject(project);
    setActiveFile(project.files[0] || null);
    setViewMode('preview');
    setIsMobileMenuOpen(false);
    setChatMessages([]);
    setGenError(null);
    setIsGenerating(false);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#020617] text-slate-100 font-sans selection:bg-blue-500/30">
      <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/5 glass z-[60] shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 md:hidden text-slate-400">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg cursor-pointer" onClick={() => { setActiveProject(null); setViewMode('editor'); setGenError(null); setIsGenerating(false); }}>
            <Zap className="w-6 h-6 text-white fill-current" />
          </div>
          <h1 className="font-black text-xl tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent hidden sm:block">Mahi AI Dev</h1>
        </div>

        <div className="flex-1 max-w-xl px-4">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Synthesize a new vision..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm outline-none focus:border-blue-500/50 transition-all pr-10"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg p-1.5 transition-all"
            >
              {isGenerating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={() => { setViewMode('cart'); setGenError(null); }} className={`relative p-2 rounded-xl border ${viewMode === 'cart' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white transition-all'}`}>
            <ShoppingCart className="w-5 h-5" />
            {savedProjects.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{savedProjects.length}</span>}
          </button>
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.displayName}`} alt="avatar" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <aside className={`fixed md:relative inset-y-0 left-0 w-72 bg-slate-950/95 border-r border-white/5 flex flex-col z-50 transition-transform duration-300 transform shrink-0 backdrop-blur-xl ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
            <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest"><Folder className="w-4 h-4" /> Explorer</div>
            {activeProject && <button onClick={downloadProject} className="p-1 hover:bg-blue-500/20 rounded transition-colors" title="Export Project"><Download className="w-4 h-4 text-blue-400" /></button>}
          </div>
          <div className="flex-1 overflow-y-auto py-2 space-y-0.5 scrollbar-hide">
            {activeProject ? (
              activeProject.files.map((file) => (
                <button key={file.path} onClick={() => { setActiveFile(file); setViewMode('editor'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm transition-all group ${activeFile?.path === file.path ? 'bg-blue-600/10 text-blue-400 border-r-2 border-blue-500' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>
                  <FileText className={`w-4 h-4 shrink-0 ${activeFile?.path === file.path ? 'text-blue-400' : 'text-slate-600'}`} />
                  <span className="truncate mono text-[13px] font-medium">{file.name}</span>
                </button>
              ))
            ) : (
              <div className="px-6 py-12 text-center text-slate-800 flex flex-col items-center gap-4">
                <Archive className="w-10 h-10 opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Workspace Standby</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-white/5 bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Cpu className="w-4 h-4 text-blue-500" /></div>
              <div className="overflow-hidden">
                <div className="text-[10px] font-black text-slate-500 uppercase">Gemini 3 Flash</div>
                <div className="text-[11px] text-emerald-500 font-mono truncate">Engine Optimized</div>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1 flex flex-col min-w-0 relative">
          <div className="h-14 flex items-center justify-between px-4 border-b border-white/5 bg-slate-900/60 shrink-0">
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
              <button onClick={() => setViewMode('editor')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'editor' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-300'}`}><Code2 className="w-4 h-4" /> <span className="hidden sm:inline">Editor</span></button>
              <button onClick={() => setViewMode('preview')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'preview' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-300'}`}><Monitor className="w-4 h-4" /> <span className="hidden sm:inline">Preview</span></button>
            </div>
            <div className="flex items-center gap-2">
              {activeProject && (
                <button onClick={() => setIsChatOpen(!isChatOpen)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all border ${isChatOpen ? 'bg-blue-500 text-white border-blue-400' : 'bg-slate-800 text-blue-400 border-blue-500/20 hover:bg-slate-700'}`}>
                   <MessageSquare className="w-4 h-4" /> {isChatOpen ? 'Hide Chat' : 'Ask AI Agent'}
                </button>
              )}
              <button onClick={downloadProject} disabled={!activeProject} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-tight shadow-lg transition-all border border-emerald-400/20 active:scale-95"><Download className="w-4 h-4" /> Export</button>
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden">
            {viewMode === 'editor' && <CodeEditor file={activeFile} onChange={handleFileChange} />}
            {viewMode === 'preview' && <Preview files={activeProject?.files || []} viewMode={deviceType} />}
            
            <AnimatePresence>
              {isChatOpen && activeProject && (
                <ChatPanel 
                  messages={chatMessages} 
                  isProcessing={isGenerating} 
                  onSendMessage={handleChatRequest} 
                  onClose={() => setIsChatOpen(false)} 
                />
              )}
            </AnimatePresence>

            {viewMode === 'cart' && (
              <div className="h-full p-6 md:p-10 overflow-y-auto bg-[#020617] scrollbar-hide">
                <div className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-4xl font-black text-white flex items-center gap-4">
                      <History className="text-blue-500 w-10 h-10" />
                      Project Library
                    </h2>
                    <p className="text-slate-400 mt-2 text-sm">Persistently stored in your browser's Mahi Vault.</p>
                  </div>
                  <button onClick={() => { setActiveProject(null); setViewMode('editor'); }} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl transition-all active:scale-95 border border-blue-400/20">
                    <Plus className="w-5 h-5" /> New Project
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {savedProjects.length === 0 ? (
                    <div className="col-span-full py-40 text-center glass rounded-[3rem] border-white/5 border-dashed border-2 opacity-50">
                      <Archive className="w-20 h-20 text-slate-800 mx-auto mb-8" />
                      <h3 className="text-2xl font-black text-slate-500 uppercase tracking-tighter">Archive Empty</h3>
                    </div>
                  ) : (
                    savedProjects.map(project => (
                      <motion.div 
                        key={project.id} 
                        layoutId={project.id} 
                        onClick={() => loadProject(project)} 
                        className={`group relative p-8 rounded-[2.5rem] border transition-all cursor-pointer overflow-hidden ${activeProject?.id === project.id ? 'bg-blue-600/10 border-blue-500/50 shadow-2xl' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                      >
                        <div className="flex justify-between mb-8">
                          <div className={`p-5 rounded-[1.5rem] ${activeProject?.id === project.id ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                            <FileCode className="w-8 h-8" />
                          </div>
                          <button 
                            onClick={(e) => deleteProject(project.id, e)} 
                            className="p-3 text-slate-500 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 bg-white/5 rounded-2xl hover:bg-red-500/10"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <h3 className="font-black text-xl mb-1 truncate text-white leading-tight">{project.name}</h3>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mb-8 italic opacity-60">"{project.prompt}"</p>
                        <div className="flex items-center justify-between border-t border-white/5 pt-6">
                          <span className="text-xs font-bold text-slate-400">{project.files.length} Modules</span>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-xl text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-lg">
                            <CheckCircle className="w-3.5 h-3.5" /> Ready
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            <AnimatePresence>
              {genError && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-[100]">
                  <div className="bg-red-500/10 border border-red-500/50 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-6">
                    <AlertTriangle className="w-16 h-16 text-red-500 animate-pulse" />
                    <div className="text-center">
                      <h4 className="text-xl font-black text-red-400 mb-2 uppercase tracking-widest">Synthesis Blocked</h4>
                      <p className="text-sm text-slate-300 leading-relaxed italic font-medium">"{genError}"</p>
                    </div>
                    <div className="flex gap-4 w-full">
                       <button onClick={handleGenerate} className="flex-[2] bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 border border-red-400/20">Retry Sync</button>
                       <button onClick={() => { setGenError(null); setIsGenerating(false); setShowAgents(false); }} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-white/10">Dismiss</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <AgentOverlay agents={agents} isVisible={showAgents} />
        </section>
      </main>

      <AnimatePresence>
        {!activeProject && !isGenerating && viewMode !== 'cart' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617] px-4 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
            <div className="max-w-2xl w-full text-center relative z-10 px-4">
               <motion.div animate={{ y: [0, -20, 0], rotateZ: [6, 12, 6] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center mx-auto mb-14 shadow-2xl border border-white/20">
                <Zap className="w-16 h-16 text-white fill-current" />
               </motion.div>
               <h2 className="text-7xl md:text-9xl font-black mb-10 tracking-tighter bg-gradient-to-b from-white via-white to-slate-600 bg-clip-text text-transparent leading-[0.8]">Mahi AI Dev</h2>
               <p className="text-lg md:text-2xl text-slate-400 mb-16 font-medium opacity-80 leading-relaxed max-w-lg mx-auto">Native Full-stack Synthesis powered by <span className="text-white font-bold">Gemini 3 Flash</span>.</p>
               <div className="flex flex-col gap-6">
                  <textarea placeholder="Describe your architectural vision..." className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-10 text-xl md:text-2xl font-medium outline-none focus:border-blue-500/40 transition-all min-h-[220px] shadow-2xl focus:bg-white/[0.08] scrollbar-hide text-white placeholder:text-slate-700" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                  <div className="flex flex-col sm:flex-row gap-5">
                     <button onClick={handleGenerate} className="flex-[2.5] bg-blue-600 hover:bg-blue-500 text-white py-7 rounded-[2rem] font-black text-2xl shadow-2xl transition-all active:scale-95 border border-blue-400/20 flex items-center justify-center gap-5 shadow-blue-600/20"><Zap className="w-7 h-7 fill-current" /> Launch Engine</button>
                     <button onClick={() => setViewMode('cart')} className="flex-1 px-8 bg-white/5 border border-white/10 text-white rounded-[2rem] hover:bg-white/10 flex items-center justify-center gap-4 font-black uppercase tracking-widest text-xs shadow-xl transition-all border-white/10"><LayoutGrid className="w-6 h-6 text-slate-500" /> Vault {savedProjects.length > 0 && `(${savedProjects.length})`}</button>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="h-10 bg-[#020617] border-t border-white/5 px-4 md:px-6 flex items-center justify-between text-[10px] text-slate-600 uppercase font-black tracking-[0.3em] shrink-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" /> <span className="text-slate-400">Gemini Synthesis Node Active</span></div>
          <span className="hidden md:inline">Ready to Host</span>
        </div>
        <div className="text-slate-700">Mahi AI Dev Core &copy; 2025</div>
      </footer>
    </div>
  );
};

export default App;
