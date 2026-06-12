"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, Save, Trash2, User, Mail, Phone, MapPin, 
  Briefcase, GraduationCap, Award, Layout, 
  Printer, Grid, Globe, Link as LinkIcon
} from 'lucide-react';

const API = 'https://nflpro.live/api';

export default function ModernCVMaker() {
  const [loading, setLoading] = useState(false);
  const [cv, setCv] = useState({
    full_name: '', designation: '', email: '', phone: '', address: '', summary: '', skills: '',
    experience: [{ role: '', company: '', year: '', desc: '' }],
    certificates: [{ name: '', institute: '', year: '' }]
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    if (editId) loadSingleCv(editId);
  }, []);

  const loadSingleCv = async (id) => {
    try {
      const res = await fetch(`${API}/cv_data`);
      const data = await res.json();
      const target = data.find(c => c.id == id);
      if (target) {
        setCv({
          ...target,
          experience: JSON.parse(target.experience || '[]'),
          certificates: JSON.parse(target.certificates || '[]')
        });
      }
    } catch (e) { console.error(e); }
  };

  const updateField = (field, value) => setCv({ ...cv, [field]: value });
  const updateArray = (key, index, field, value) => {
    const arr = [...cv[key]];
    arr[index][field] = value;
    setCv({ ...cv, [key]: arr });
  };
  const addItem = (key, template) => setCv({ ...cv, [key]: [...cv[key], template] });
  const removeItem = (key, index) => setCv({ ...cv, [key]: cv[key].filter((_, i) => i !== index) });

  const handleSave = async () => {
    setLoading(true);
    const payload = {
      ...cv,
      user_id: 999,
      experience: JSON.stringify(cv.experience),
      certificates: JSON.stringify(cv.certificates)
    };
    try {
      await fetch(`${API}/cv_data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      alert("CV Saved to System Next Cloud!");
      window.location.href = '/cv/library';
    } catch (e) { alert("Save Failed"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 flex flex-col font-sans">
      {/* Dynamic Navigation */}
      <nav className="bg-black/50 backdrop-blur-xl border-b border-zinc-900 p-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-6">
            <h1 className="text-white font-black tracking-tighter uppercase ml-2 text-sm italic">System Next <span className="text-orange-500">Pro</span></h1>
            <a href="/cv/library" className="text-zinc-600 hover:text-orange-500 text-[10px] font-black flex items-center gap-1.5 transition-all"><Grid size={14}/> LIBRARY</a>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-1.5 rounded text-[10px] font-black flex items-center gap-2 transition-all">
            <Printer size={14}/> PRINT PDF
          </button>
          <button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-1.5 rounded text-[10px] font-black flex items-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all">
            <Save size={14}/> {loading ? 'SAVING...' : 'PUBLISH CV'}
          </button>
        </div>
      </nav>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        {/* Editor Panel */}
        <div className="p-8 space-y-10 overflow-y-auto h-[calc(100vh-60px)] custom-scrollbar">
          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-orange-500 tracking-[3px] uppercase">01. Identity</h4>
            <div className="grid grid-cols-2 gap-4">
              <input value={cv.full_name} onChange={e => updateField('full_name', e.target.value)} placeholder="FULL NAME" className="bg-[#0a0a0a] border border-zinc-900 p-3 rounded text-xs outline-none focus:border-orange-500 transition-all" />
              <input value={cv.designation} onChange={e => updateField('designation', e.target.value)} placeholder="PROFESSIONAL TITLE" className="bg-[#0a0a0a] border border-zinc-900 p-3 rounded text-xs outline-none focus:border-orange-500 transition-all" />
              <input value={cv.email} onChange={e => updateField('email', e.target.value)} placeholder="EMAIL" className="bg-[#0a0a0a] border border-zinc-900 p-3 rounded text-xs outline-none focus:border-orange-500" />
              <input value={cv.phone} onChange={e => updateField('phone', e.target.value)} placeholder="PHONE" className="bg-[#0a0a0a] border border-zinc-900 p-3 rounded text-xs outline-none focus:border-orange-500" />
              <textarea value={cv.summary} onChange={e => updateField('summary', e.target.value)} placeholder="TELL YOUR STORY..." rows={3} className="w-full bg-[#0a0a0a] border border-zinc-900 p-3 rounded text-xs outline-none resize-none focus:border-orange-500 col-span-2" />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-black text-orange-500 tracking-[3px] uppercase">02. Career Track</h4>
              <button onClick={() => addItem('experience', {role:'', company:'', year:'', desc:''})} className="text-[10px] font-black text-blue-500 hover:text-blue-400">+ ADD EXPERIENCE</button>
            </div>
            {cv.experience.map((exp, i) => (
              <div key={i} className="p-5 bg-[#0a0a0a] border border-zinc-900 rounded-lg relative space-y-3 group hover:border-zinc-700 transition-all">
                <div className="grid grid-cols-2 gap-3">
                  <input value={exp.role} placeholder="ROLE" className="bg-transparent border-b border-zinc-900 text-xs py-1 focus:border-orange-500 outline-none" onChange={e => updateArray('experience', i, 'role', e.target.value)} />
                  <input value={exp.company} placeholder="COMPANY" className="bg-transparent border-b border-zinc-900 text-xs py-1 focus:border-orange-500 outline-none" onChange={e => updateArray('experience', i, 'company', e.target.value)} />
                </div>
                <button onClick={() => removeItem('experience', i)} className="absolute top-2 right-2 text-zinc-800 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
              </div>
            ))}
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-orange-500 tracking-[3px] uppercase">03. Toolkit (Skills)</h4>
            <input value={cv.skills} onChange={e => updateField('skills', e.target.value)} placeholder="REACT, TYPESCRIPT, NEXT.JS, AWS..." className="w-full bg-[#0a0a0a] border border-zinc-900 p-3 rounded text-xs outline-none focus:border-orange-500" />
          </section>
        </div>

        {/* MODERN PREVIEW PANEL */}
        <div className="bg-[#111] p-12 hidden lg:block overflow-y-auto h-[calc(100vh-60px)]">
          <div id="print-area" className="bg-white text-zinc-900 w-full max-w-[700px] mx-auto min-h-[900px] shadow-2xl p-0 flex flex-col font-sans relative">
            
            {/* Minimalist Top Bar */}
            <div className="h-2 bg-orange-500 w-full"></div>

            <div className="p-12 flex flex-col flex-1">
              {/* Header Section */}
              <header className="mb-12">
                <h1 className="text-5xl font-black text-zinc-900 tracking-tighter uppercase mb-2 leading-none">{cv.full_name || 'NAME SURNAME'}</h1>
                <div className="flex items-center gap-4">
                  <span className="bg-zinc-900 text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest">{cv.designation || 'PROFESSIONAL TITLE'}</span>
                  <div className="h-[1px] flex-1 bg-zinc-200"></div>
                </div>
              </header>

              <div className="grid grid-cols-12 gap-12">
                {/* Right Column (Experience & Profile) */}
                <div className="col-span-8 space-y-12">
                  <section>
                    <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[4px] mb-4">Background</h2>
                    <p className="text-[12px] leading-relaxed text-zinc-700 font-medium">{cv.summary || 'Describe your professional journey and key impact...'}</p>
                  </section>

                  <section>
                    <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[4px] mb-6">Work History</h2>
                    <div className="space-y-8">
                      {cv.experience.map((exp, i) => (
                        <div key={i} className="group relative">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="text-[14px] font-black text-zinc-900 uppercase">{exp.role || 'Position'}</h3>
                          </div>
                          <p className="text-[11px] text-orange-600 font-black uppercase tracking-wider mb-2">{exp.company || 'Organization Name'}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Left Column (Contact & Skills) */}
                <div className="col-span-4 space-y-12">
                  <section>
                    <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[4px] mb-4">Connect</h2>
                    <div className="space-y-3 text-[10px] font-bold text-zinc-900 uppercase">
                      <div className="flex items-center gap-2"><Mail size={12} className="text-orange-500"/> {cv.email}</div>
                      <div className="flex items-center gap-2"><Phone size={12} className="text-orange-500"/> {cv.phone}</div>
                      <div className="flex items-center gap-2"><MapPin size={12} className="text-orange-500"/> {cv.address}</div>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[4px] mb-4">Expertise</h2>
                    <div className="flex flex-col gap-3">
                      {cv.skills.split(',').map((s, i) => s.trim() && (
                        <div key={i} className="flex items-center justify-between border-b border-zinc-100 pb-1">
                          <span className="text-[10px] font-black text-zinc-900 uppercase tracking-tight">{s.trim()}</span>
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              {/* Footer */}
              <footer className="mt-auto pt-12 border-t border-zinc-100 flex justify-between items-center">
                <p className="text-[8px] font-black text-zinc-300 uppercase tracking-[2px]">System Next IT Engine</p>
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-zinc-900"></div>
                  <div className="w-2 h-2 bg-orange-500"></div>
                  <div className="w-2 h-2 bg-zinc-200"></div>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          nav, .lg\\:w-1\\/2 { display: none !important; }
          .hidden.lg\\:block { display: block !important; width: 100% !important; padding: 0 !important; }
          #print-area { box-shadow: none !important; border: none !important; width: 100% !important; max-width: none !important; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #ff8c00; border-radius: 10px; }
      `}</style>
    </div>
  );
}
