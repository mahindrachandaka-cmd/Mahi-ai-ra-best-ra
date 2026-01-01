
import React from 'react';
import Editor from '@monaco-editor/react';
import { FileContent } from '../types';

interface CodeEditorProps {
  file: FileContent | null;
  onChange: (newContent: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ file, onChange }) => {
  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-900/50 p-6 text-center">
        <svg className="w-12 h-12 md:w-16 md:h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-xs md:text-sm font-medium">Select a file from the explorer to begin synthesis</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <div className="flex items-center px-4 py-2 bg-slate-900 border-b border-white/5 space-x-2 shrink-0">
        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold mono">{file.language.toUpperCase()}</span>
        <span className="text-[10px] text-slate-400 font-mono truncate">{file.path}</span>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          theme="vs-dark"
          path={file.path}
          defaultLanguage={file.language}
          defaultValue={file.content}
          value={file.content}
          onChange={(val) => onChange(val || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'JetBrains Mono',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12 },
            lineNumbersMinChars: 3,
            wordWrap: "on",
            bracketPairColorization: { enabled: true },
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true
          }}
        />
      </div>
    </div>
  );
};
