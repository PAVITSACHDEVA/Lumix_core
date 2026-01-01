import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  FileStack, 
  RotateCw, 
  Tag, 
  Unlock, 
  Type, 
  History, 
  UploadCloud, 
  X, 
  Download, 
  Check, 
  Sliders, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';

/**
 * PDF SQUEEZE PRO - App.jsx
 * High-performance PDF utility suite using window.PDFLib for 100% client-side processing.
 * Features: Compression, Merging, Rotation, Metadata editing, Security unlocking, and Watermarking.
 */

export default function App() {
  const [activeTab, setActiveTab] = useState('optimize');
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);

  // Settings State
  const [prefix, setPrefix] = useState('squeezed_');
  const [mergeName, setMergeName] = useState('combined_result.pdf');
  const [wmText, setWmText] = useState('DRAFT COPY');
  const [wmOpacity, setWmOpacity] = useState(0.4);
  const [rotateAngle, setRotateAngle] = useState(90);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaAuthor, setMetaAuthor] = useState('');

  const fileInputRef = useRef(null);

  // Helper to access PDFLib from global scope
  const getPDFLib = () => {
    if (window.PDFLib) return window.PDFLib;
    console.warn("PDFLib not found in window. Ensure script is loaded in the environment.");
    return null;
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileSelection = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
    if (selectedFiles.length === 0) return;
    setFiles(prev => [...prev, ...selectedFiles]);
    showToast(`Added ${selectedFiles.length} files`);
    e.target.value = null; // Reset for same-file selection
  };

  const processBatch = async () => {
    const lib = getPDFLib();
    if (!lib || files.length === 0) {
      showToast("Please add files first", "error");
      return;
    }
    
    setIsProcessing(true);
    setProgress(10);
    setStatusText("Initializing Engine...");

    try {
      const { PDFDocument, rgb, degrees, StandardFonts } = lib;
      let processedResults = [];

      if (activeTab === 'merge') {
        setStatusText("Merging documents...");
        const mergedPdf = await PDFDocument.create();
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setStatusText(`Merging ${file.name}...`);
          setProgress(10 + (i / files.length) * 80);
          const bytes = await file.arrayBuffer();
          const pdf = await PDFDocument.load(bytes);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        const pdfBytes = await mergedPdf.save();
        processedResults.push(generateResultObject(mergeName, pdfBytes, files.reduce((a, b) => a + b.size, 0), 'MERGE'));
      } 
      else {
        // Individual file processing
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setStatusText(`Processing ${file.name}...`);
          setProgress(10 + (i / files.length) * 80);
          
          const bytes = await file.arrayBuffer();
          let pdfDoc;

          // Handle Unlock specifically (strips encryption flags)
          if (activeTab === 'unlock') {
            pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
          } else {
            pdfDoc = await PDFDocument.load(bytes);
          }

          if (activeTab === 'rotate') {
            pdfDoc.getPages().forEach(p => p.setRotation(degrees(parseInt(rotateAngle))));
          } else if (activeTab === 'watermark') {
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            pdfDoc.getPages().forEach(page => {
              const { width, height } = page.getSize();
              page.drawText(wmText, {
                x: width / 4, y: height / 2, size: 50, font,
                rotate: degrees(45), opacity: parseFloat(wmOpacity),
                color: rgb(0.5, 0.5, 0.5),
              });
            });
          } else if (activeTab === 'metadata') {
            pdfDoc.setTitle(metaTitle || "Untitled Document");
            pdfDoc.setAuthor(metaAuthor || "PDF Squeeze User");
            pdfDoc.setProducer("PDF Squeeze Pro Engine v3.0");
          } else if (activeTab === 'optimize') {
            // Optimization: Remove unnecessary metadata and structure
            pdfDoc.setKeywords([]);
            pdfDoc.setSubject('');
            pdfDoc.setProducer('PDF Squeeze Pro');
          }

          // Object stream compression is key for reducing size in 'optimize' mode
          const pdfBytes = await pdfDoc.save({ 
            useObjectStreams: activeTab === 'optimize', 
            addDefaultPage: false,
            updateFieldAppearances: false
          });

          processedResults.push(generateResultObject(
            activeTab === 'optimize' ? `${prefix}${file.name}` : file.name, 
            pdfBytes, 
            file.size, 
            activeTab.toUpperCase()
          ));
        }
      }

      setProgress(100);
      setResults(processedResults);
      setHistory(prev => [...processedResults, ...prev]);
      showToast("Completed successfully!");
    } catch (e) {
      console.error(e);
      showToast("Processing failed. File may be encrypted or corrupted.", "error");
    } finally {
      setIsProcessing(false);
      setFiles([]);
    }
  };

  const generateResultObject = (name, bytes, originalSize, type) => {
    const finalName = name.toLowerCase().endsWith('.pdf') ? name : `${name}.pdf`;
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: finalName,
      url: URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })),
      originalSize: (originalSize / 1024 / 1024).toFixed(2),
      newSize: (bytes.length / 1024 / 1024).toFixed(2),
      saving: (100 - (bytes.length / originalSize * 100)).toFixed(1),
      type,
      timestamp: new Date().toLocaleTimeString()
    };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full flex items-center gap-3 z-50 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-8" />
          <h2 className="text-2xl font-black mb-2 italic tracking-tighter uppercase">Processing...</h2>
          <p className="text-slate-400 text-[10px] tracking-[0.3em] uppercase mb-8">{statusText}</p>
          <div className="w-full max-w-md bg-slate-800 rounded-full h-1 overflow-hidden">
            <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-indigo-400 via-white to-cyan-400 bg-clip-text text-transparent italic uppercase leading-none">
            PDF SQUEEZE PRO
          </h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">Professional Utility Suite v3.0</p>
        </div>

        <nav className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800 backdrop-blur overflow-x-auto max-w-full no-scrollbar">
          {[
            { id: 'optimize', icon: <Zap size={14}/>, label: 'Crush' },
            { id: 'merge', icon: <FileStack size={14}/>, label: 'Merge' },
            { id: 'rotate', icon: <RotateCw size={14}/>, label: 'Rotate' },
            { id: 'metadata', icon: <Tag size={14}/>, label: 'Meta' },
            { id: 'unlock', icon: <Unlock size={14}/>, label: 'Unlock' },
            { id: 'watermark', icon: <Type size={14}/>, label: 'Stamp' },
            { id: 'history', icon: <History size={14}/>, label: 'Logs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setResults([]); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Layout Grid */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Column */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl sticky top-8">
            <div className="flex items-center gap-2 mb-6 text-slate-500 font-black uppercase tracking-widest text-[10px]">
              <Sliders size={14} className="text-indigo-400" />
              <span>Configuration</span>
            </div>
            
            <div className="space-y-5">
              {activeTab === 'optimize' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-2 uppercase tracking-widest">Filename Prefix</label>
                  <input type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-colors" />
                </div>
              )}
              {activeTab === 'rotate' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-2 uppercase tracking-widest">Rotation</label>
                  <select value={rotateAngle} onChange={(e) => setRotateAngle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none cursor-pointer">
                    <option value="90">90° Clockwise</option>
                    <option value="180">180° Flip</option>
                    <option value="270">270° Clockwise</option>
                  </select>
                </div>
              )}
              {activeTab === 'metadata' && (
                <div className="space-y-4">
                  <input type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="New Title" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                  <input type="text" value={metaAuthor} onChange={(e) => setMetaAuthor(e.target.value)} placeholder="Author" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                </div>
              )}
              {activeTab === 'watermark' && (
                <div className="space-y-4">
                  <input type="text" value={wmText} onChange={(e) => setWmText(e.target.value)} placeholder="Stamp Text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 mb-2 uppercase tracking-widest">Opacity ({wmOpacity})</label>
                    <input type="range" min="0.1" max="1" step="0.1" value={wmOpacity} onChange={(e) => setWmOpacity(e.target.value)} className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                  </div>
                </div>
              )}
              {activeTab === 'merge' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-2 uppercase tracking-widest">Merged Filename</label>
                  <input type="text" value={mergeName} onChange={(e) => setMergeName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-colors" />
                </div>
              )}
              {activeTab === 'unlock' && (
                <div className="bg-slate-950/50 p-4 rounded-xl border border-indigo-500/20">
                  <p className="text-[10px] text-indigo-300 font-bold uppercase leading-relaxed italic">Encryption Removal Mode Active</p>
                </div>
              )}
            </div>

            {activeTab !== 'history' && (
              <button
                disabled={files.length === 0 || isProcessing}
                onClick={processBatch}
                className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 disabled:cursor-not-allowed text-white font-black py-5 rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <Play size={18} fill="currentColor" />
                RUN {activeTab.toUpperCase()}
              </button>
            )}
          </section>
        </div>

        {/* File Queue & Results Column */}
        <div className="lg:col-span-8 space-y-8">
          {activeTab !== 'history' ? (
            <>
              {/* Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-900 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-[3rem] p-12 md:p-20 text-center transition-all cursor-pointer group"
              >
                <input type="file" multiple accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileSelection} />
                <div className="bg-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-600 group-hover:scale-110 transition-all shadow-xl text-slate-400 group-hover:text-white">
                  <UploadCloud size={28} />
                </div>
                <h2 className="text-2xl font-black mb-2 italic tracking-tight uppercase">Import Source</h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Privacy First: Processing stays local</p>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {files.map((file, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-left-4 fade-in duration-300">
                      <div className="flex items-center gap-3 truncate">
                        <div className="bg-slate-800 p-2 rounded-lg text-indigo-400"><FileText size={14} /></div>
                        <div className="truncate">
                          <p className="text-xs font-bold truncate max-w-[150px]">{file.name}</p>
                          <p className="text-[9px] text-slate-500 uppercase font-black">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, i) => i !== idx)); }} className="text-slate-700 hover:text-rose-500 p-2 transition-colors"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Results */}
              {results.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-900">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] ml-4 italic">Task Completed</h3>
                    <button onClick={() => setResults([])} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-300">Clear</button>
                  </div>
                  {results.map((res) => (
                    <div key={res.id} className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-in zoom-in-95 duration-500">
                      <div className="flex items-center gap-5">
                        <div className="bg-emerald-500 p-4 rounded-2xl text-slate-950 shadow-lg shadow-emerald-500/20"><Check size={24} /></div>
                        <div>
                          <h4 className="font-black text-base italic uppercase">{res.name}</h4>
                          <div className="flex gap-4 mt-1">
                            <p className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest">{res.newSize} MB</p>
                            {parseFloat(res.saving) > 0 && <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">-{res.saving}% Reduced</p>}
                          </div>
                        </div>
                      </div>
                      <a href={res.url} download={res.name} className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 text-xs transition-all shadow-lg active:scale-95 group">
                        <Download size={14} className="group-hover:translate-y-0.5 transition-transform" /> DOWNLOAD
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
               <div className="flex items-center justify-between mb-6 px-4">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Audit Logs</h3>
                 {history.length > 0 && (
                   <button onClick={() => setHistory([])} className="text-[10px] font-black text-rose-500/70 uppercase tracking-widest hover:text-rose-400 transition-colors">Clear</button>
                 )}
               </div>
               {history.length === 0 && (
                 <div className="py-32 text-center bg-slate-900/50 border border-slate-800 rounded-[3rem] opacity-30">
                    <History size={48} className="mx-auto mb-4" />
                    <p className="font-black uppercase text-[10px] tracking-widest">No previous actions</p>
                 </div>
               )}
               {history.map((item) => (
                <div key={item.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex justify-between items-center hover:bg-slate-800/50 transition-all animate-in fade-in duration-300">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-800 rounded-xl text-indigo-400">
                      {item.type === 'MERGE' ? <FileStack size={16} /> : <FileText size={16} />}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase italic tracking-tight">{item.name}</p>
                      <p className="text-[9px] font-bold text-slate-600 uppercase mt-1 tracking-tighter">{item.type} • {item.newSize} MB • {item.timestamp}</p>
                    </div>
                  </div>
                  <a href={item.url} download={item.name} className="p-3 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all"><Download size={16} /></a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <footer className="max-w-6xl mx-auto mt-20 pt-10 border-t border-slate-900 text-center pb-12">
        <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.6em] mb-2 italic">PDF SQUEEZE PRO ENGINE v3.0 • SECURE LOCAL PROCESSING</p>
        <p className="text-[8px] text-slate-800 uppercase tracking-widest">Zero-server architecture. Your data never leaves your computer.</p>
      </footer>
    </div>
  );
}