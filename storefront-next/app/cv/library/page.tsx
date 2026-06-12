"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Database, FileText, Search, ArrowLeft } from 'lucide-react';

const API = 'https://nflpro.live/api';

export default function CVLibrary() {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadAllCvs(); }, []);

  const loadAllCvs = async () => {
    try {
      const res = await fetch(`${API}/cv_data`);
      const data = await res.json();
      // Reverse to show latest first
      setCvs(Array.isArray(data) ? data.reverse() : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const deleteCv = async (id) => {
    if (!confirm("Are you sure you want to delete this CV permanently?")) return;
    try {
      const res = await fetch(`${API}/cv_data/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Deleted successfully!");
        loadAllCvs();
      }
    } catch (e) { alert("Delete failed"); }
  };

  const filteredCvs = cvs.filter(cv => 
    cv.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    cv.designation?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-300 font-sans p-6">
      <nav className="max-w-7xl mx-auto flex justify-between items-center mb-10 bg-[#0f0f12] p-4 rounded-2xl border border-[#1d1d21]">
        <div className="flex items-center gap-3">
          <a href="/cv" className="text-zinc-500 hover:text-white transition-colors"><ArrowLeft size={20}/></a>
          <h1 className="text-white font-black tracking-tighter uppercase text-lg italic">System Next <span className="text-orange-500">Cloud</span></h1>
        </div>
        <div className="flex gap-4 items-center">
          <div className="hidden md:flex items-center bg-black border border-[#1d1d21] px-3 py-1.5 rounded-lg">
            <Search size={14} className="text-zinc-600 mr-2" />
            <input 
              placeholder="Search CV..." 
              className="bg-transparent outline-none text-xs text-white w-40"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <a href="/cv" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all shadow-lg shadow-orange-500/20">
            Create New
          </a>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          <div className="col-span-full text-center py-20 font-black text-zinc-800 tracking-[10px] animate-pulse">LOADING_DATABASE</div>
        ) : filteredCvs.map((cv) => (
          <div key={cv.id} className="bg-[#0f0f12] border border-[#1d1d21] rounded-2xl overflow-hidden hover:border-orange-500 transition-all group relative">
            <div className="p-5 border-b border-[#1d1d21]">
               <FileText size={24} className="text-orange-500 mb-4" />
               <h3 className="text-white font-bold text-sm uppercase truncate">{cv.full_name || 'NO NAME'}</h3>
               <p className="text-[10px] text-zinc-500 font-black tracking-widest mt-1 truncate">{cv.designation || 'DESIGNATION'}</p>
            </div>
            <div className="p-3 flex gap-2 bg-black/50">
              <button 
                onClick={() => window.location.href = `/cv?edit=${cv.id}`}
                className="flex-1 bg-[#1d1d21] hover:bg-orange-500 text-white text-[10px] font-black py-2 rounded-lg transition-all"
              >
                EDIT
              </button>
              <button 
                onClick={() => deleteCv(cv.id)}
                className="bg-[#1d1d21] hover:bg-red-600 text-white p-2 rounded-lg transition-all"
              >
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
