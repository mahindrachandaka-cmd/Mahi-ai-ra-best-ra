
import React, { useMemo, useRef } from 'react';
import { Maximize2, Minimize2, ExternalLink, AlertCircle } from 'lucide-react';
import { FileContent } from '../types';

interface PreviewProps {
  files: FileContent[];
  viewMode: 'desktop' | 'mobile';
}

export const Preview: React.FC<PreviewProps> = ({ files, viewMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const srcDoc = useMemo(() => {
    const htmlFile = files.find(f => f.name.endsWith('.html') || f.name.endsWith('.php'));
    const cssFile = files.find(f => f.name.endsWith('.css'));
    const jsFile = files.find(f => f.name.endsWith('.js'));

    if (!htmlFile) return '<html><body style="background:#0f172a;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div>No previewable file found.</div></body></html>';

    let content = htmlFile.content;

    // Basic PHP simulation: Since browsers can't execute PHP, we show a disclaimer or strip PHP tags for UI preview
    if (htmlFile.name.endsWith('.php')) {
      content = content.replace(/<\?php[\s\S]*?\?>/g, '<span style="color: #6366f1; font-weight: bold;">[PHP Logic Injected]</span>');
    }

    // Inject styles if present
    if (cssFile) {
      content = content.replace('</head>', `<style>${cssFile.content}</style></head>`);
    }

    // Inject script if present
    if (jsFile) {
      content = content.replace('</body>', `<script>${jsFile.content}</script></body>`);
    }

    return content;
  }, [files]);

  const isPhp = files.some(f => f.name.endsWith('.php'));

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-950 flex flex-col items-center justify-start p-2 md:p-4 overflow-hidden transition-all duration-500 relative">
      {/* Floating Toolbar for Preview */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        <button 
          onClick={toggleFullScreen}
          className="p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-lg glass border border-white/10 shadow-xl transition-all"
          title="Full Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <div className={`relative bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 border-[6px] md:border-[10px] border-slate-900 ${viewMode === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full h-full'}`}>
        <iframe
          title="App Preview"
          srcDoc={srcDoc}
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-forms allow-modals"
        />
        
        {isPhp && (
          <div className="absolute bottom-4 left-4 right-4 bg-amber-500/90 backdrop-blur-md p-3 rounded-lg flex items-center gap-3 border border-amber-600 shadow-lg animate-in slide-in-from-bottom-2">
            <AlertCircle className="w-5 h-5 text-amber-900 shrink-0" />
            <p className="text-[10px] md:text-xs text-amber-950 font-bold leading-tight">
              PHP detected. Server-side logic is simulated in preview. Deploy to a PHP environment for full functionality.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
