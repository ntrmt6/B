
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Save, 
  Trash2, 
  ChevronRight, 
  Terminal, 
  Code2, 
  FileCode, 
  Type, 
  Monitor,
  Download,
  X
} from 'lucide-react';

const DEFAULT_HTML = '<!-- SYSTEM_NEXT_IT -->\n<section class="main">\n  <h1>INTEL_WORKSPACE</h1>\n  <p>Status: Ready</p>\n  <button id="test-btn">Click Me</button>\n</section>';
const DEFAULT_CSS = '/* KERNEL_STYLE */\nbody {\n  background: #000;\n  color: #ff5500;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  margin: 0;\n  font-family: "Courier New", monospace;\n}\n.main {\n  border: 1px solid #222;\n  padding: 40px;\n  border-radius: 4px;\n  text-align: center;\n}\nbutton {\n  margin-top: 20px;\n  padding: 10px 20px;\n  background: #ff5500;\n  border: none;\n  color: black;\n  font-weight: bold;\n  cursor: pointer;\n}';
const DEFAULT_JS = '// LOGIC\nconsole.log("Kernel_Initialized");\n\ndocument.getElementById("test-btn").addEventListener("click", () => {\n  console.log("Button clicked at: " + new Date().toLocaleTimeString());\n});';

export default function SystemNextIDE() {
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [js, setJs] = useState(DEFAULT_JS);
  
  const [activeTab, setActiveTab] = useState('html');
  const [srcDoc, setSrcDoc] = useState('');
  const [status, setStatus] = useState('READY');
  const [isSaving, setIsSaving] = useState(false);
  const [fileName, setFileName] = useState('project.html');
  const [logs, setLogs] = useState([]);
  const [showConsole, setShowConsole] = useState(true);

  // Load from localStorage
  useEffect(() => {
    const savedHtml = localStorage.getItem('ide_html');
    const savedCss = localStorage.getItem('ide_css');
    const savedJs = localStorage.getItem('ide_js');
    
    if (savedHtml !== null) setHtml(savedHtml);
    if (savedCss !== null) setCss(savedCss);
    if (savedJs !== null) setJs(savedJs);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('ide_html', html);
    localStorage.setItem('ide_css', css);
    localStorage.setItem('ide_js', js);
  }, [html, css, js]);

  const runCode = useCallback(() => {
    const combined = `
      <html>
        <head>
          <style>${css}</style>
          <script>
            const originalLog = console.log;
            console.log = (...args) => {
              window.parent.postMessage({ type: 'log', content: args.map(a => 
                typeof a === 'object' ? JSON.stringify(a) : String(a)
              ).join(' ') }, '*');
              originalLog.apply(console, args);
            };
            window.onerror = (msg, url, line) => {
              window.parent.postMessage({ type: 'error', content: \`Error: \${msg} at line \${line}\` }, '*');
            };
          </script>
        </head>
        <body>
          ${html}
          <script>${js}<\/script>
        </body>
      </html>
    `;
    setSrcDoc(combined);
    setStatus('RUNNING');
    setTimeout(() => setStatus('READY'), 800);
  }, [html, css, js]);

  // Debounced auto-run
  useEffect(() => {
    const timer = setTimeout(() => {
      runCode();
    }, 1000);
    return () => clearTimeout(timer);
  }, [html, css, js, runCode]);

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'log') {
        setLogs(prev => [...prev, { type: 'info', text: event.data.content, time: new Date().toLocaleTimeString() }].slice(-50));
      } else if (event.data.type === 'error') {
        setLogs(prev => [...prev, { type: 'error', text: event.data.content, time: new Date().toLocaleTimeString() }].slice(-50));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const downloadFile = () => {
    const combined = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${fileName}</title>
  <style>${css}</style>
</head>
<body>
  ${html}
  <script>${js}</script>
</body>
</html>`;

    const blob = new Blob([combined], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.html') ? fileName : `${fileName}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setIsSaving(false);
    setStatus('DOWNLOADED');
    setTimeout(() => setStatus('READY'), 2000);
  };

  const clearProject = () => {
    if (confirm('Are you sure you want to clear all code?')) {
      setHtml(DEFAULT_HTML);
      setCss(DEFAULT_CSS);
      setJs(DEFAULT_JS);
      setLogs([]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-zinc-400 font-mono overflow-hidden">
      {/* --- TOP BAR --- */}
      <header className="flex items-center justify-between px-4 h-12 bg-black border-b border-zinc-900 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-600"></div>
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-orange-600 animate-ping opacity-75"></div>
            </div>
            <span className="text-xs font-black text-white tracking-[0.2em] uppercase">SystemNext_IDE v2.0</span>
          </div>
          <div className="h-4 w-[1px] bg-zinc-800"></div>
          <div className="flex items-center gap-2">
             <span className="text-[10px] text-zinc-600 font-bold uppercase">Status:</span>
             <span className={`text-[10px] font-bold ${status === 'RUNNING' ? 'text-green-500' : 'text-zinc-400'}`}>{status}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={clearProject}
            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
            title="Reset Project"
          >
            <Trash2 size={16} />
          </button>

          {isSaving ? (
            <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
              <input 
                type="text" 
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-[10px] px-2 h-8 text-zinc-200 outline-none focus:border-orange-600 w-32"
                autoFocus
              />
              <button 
                onClick={downloadFile}
                className="px-3 h-8 bg-green-600 text-black text-[10px] font-black uppercase flex items-center gap-1"
              >
                <Download size={12} />
                Confirm
              </button>
              <button 
                onClick={() => setIsSaving(false)}
                className="p-2 text-zinc-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsSaving(true)} 
              className="flex items-center gap-2 px-4 h-8 text-[10px] font-bold text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 transition-all uppercase"
            >
              <Save size={14} />
              Save_Local
            </button>
          )}
          
          <button 
            onClick={runCode} 
            className="flex items-center gap-2 px-5 h-8 bg-orange-600 text-black text-[10px] font-black hover:bg-orange-500 transition-all uppercase"
          >
            <Play size={14} fill="currentColor" />
            Execute
          </button>
        </div>
      </header>

      {/* --- WORKSPACE --- */}
      <main className="flex-1 flex overflow-hidden">
        {/* LEFT: EDITOR */}
        <section className="flex-1 flex flex-col border-r border-zinc-900 bg-black min-w-0">
          <div className="flex bg-zinc-950 border-b border-zinc-900">
            {[
              { id: 'html', icon: Code2, label: 'HTML' },
              { id: 'css', icon: Type, label: 'CSS' },
              { id: 'js', icon: FileCode, label: 'JS' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase transition-all border-r border-zinc-900 ${activeTab === tab.id ? 'text-orange-500 bg-black border-b-2 border-b-orange-600' : 'text-zinc-700 hover:text-zinc-500'}`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 relative overflow-hidden">
            <EditorArea active={activeTab === 'html'} value={html} onChange={setHtml} />
            <EditorArea active={activeTab === 'css'} value={css} onChange={setCss} />
            <EditorArea active={activeTab === 'js'} value={js} onChange={setJs} />
          </div>
        </section>

        {/* RIGHT: PREVIEW & CONSOLE */}
        <section className="flex-1 flex flex-col bg-[#050505] min-w-0">
          {/* PREVIEW */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="h-8 flex items-center px-4 border-b border-zinc-900 bg-zinc-950/50 justify-between shrink-0">
               <div className="flex items-center gap-2">
                 <Monitor size={12} className="text-zinc-600" />
                 <span className="text-[9px] font-bold text-zinc-600 tracking-[0.2em] uppercase">Visual_Output_Buffer</span>
               </div>
               <span className="text-[8px] text-zinc-800 tracking-tighter font-bold">PREVIEW_LAYER_01</span>
            </div>
            <div className="flex-1 bg-white m-3 rounded-sm overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.7)]">
              <iframe srcDoc={srcDoc} className="w-full h-full border-none" sandbox="allow-scripts" />
            </div>
          </div>

          {/* CONSOLE */}
          <div className={`flex flex-col border-t border-zinc-900 bg-black transition-all duration-300 ${showConsole ? 'h-1/3' : 'h-8'}`}>
            <div 
              className="h-8 flex items-center px-4 bg-zinc-950/80 justify-between shrink-0 cursor-pointer hover:bg-zinc-900 transition-colors"
              onClick={() => setShowConsole(!showConsole)}
            >
              <div className="flex items-center gap-2">
                <Terminal size={12} className={logs.length > 0 ? 'text-orange-500' : 'text-zinc-600'} />
                <span className="text-[9px] font-bold text-zinc-600 tracking-[0.2em] uppercase">System_Logs</span>
                {logs.length > 0 && (
                  <span className="bg-orange-600 text-black text-[8px] px-1.5 py-0.5 rounded-full font-black">
                    {logs.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); setLogs([]); }}
                  className="text-[8px] font-bold text-zinc-700 hover:text-zinc-400 uppercase"
                >
                  Clear
                </button>
                <ChevronRight size={12} className={`text-zinc-700 transform transition-transform ${showConsole ? 'rotate-90' : ''}`} />
              </div>
            </div>
            {showConsole && (
              <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] bg-black">
                {logs.length === 0 ? (
                  <div className="text-zinc-800 italic">No output...</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={`mb-1 flex gap-3 ${log.type === 'error' ? 'text-red-500' : 'text-zinc-400'}`}>
                      <span className="text-zinc-700 shrink-0">[{log.time}]</span>
                      <span className="break-all whitespace-pre-wrap">{log.text}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function EditorArea({ active, value, onChange }) {
  const lines = value.split('\n').length;
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);

  const syncScroll = (e) => {
    if (gutterRef.current) gutterRef.current.scrollTop = e.target.scrollTop;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      // Reset cursor position (need to do this after render)
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className={`absolute inset-0 flex transition-all duration-300 ${active ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
      {/* LINE NUMBERS */}
      <div 
        ref={gutterRef} 
        className="w-12 bg-zinc-950 text-zinc-800 text-right pr-4 pt-5 select-none overflow-hidden border-r border-zinc-900/40 text-[11px] font-mono leading-6"
      >
        {Array.from({ length: Math.max(lines, 50) }).map((_, i) => (
          <div key={i} className="h-6">{(i + 1).toString().padStart(2, '0')}</div>
        ))}
      </div>
      
      {/* SOURCE CODE */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        onKeyDown={handleKeyDown}
        spellCheck="false"
        autoComplete="off"
        className="flex-1 bg-black p-5 pt-5 text-zinc-300 font-mono text-[13px] leading-6 resize-none outline-none overflow-y-auto whitespace-pre selection:bg-orange-600/30"
      />
    </div>
  );
}


