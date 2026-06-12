"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, Menu, ShoppingCart, Smartphone, 
  Home, Grid as GridIcon, Tag, User, 
  ChevronRight, Star, Percent, Headphones
} from 'lucide-react';

const API = 'https://nflpro.live/api';

export default function ProfessionalStore() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API}/products`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-[#F2F4F8] text-zinc-900 font-sans pb-20">
      {/* Header - Fixed & High Density */}
      <nav className="bg-[#111] p-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Menu className="text-white md:hidden" size={24} />
          <h1 className="text-white font-black text-xl italic tracking-tighter">
            System<span className="text-orange-500">Next</span>
          </h1>
          
          <div className="hidden md:flex flex-1 max-w-xl relative">
            <input 
              type="text" 
              placeholder="Search product, brand, and more..." 
              className="w-full bg-white rounded-full py-2 px-5 text-sm outline-none pr-12 shadow-inner"
            />
            <div className="absolute right-1 top-1 bg-orange-500 p-1.5 rounded-full text-white">
              <Search size={16} />
            </div>
          </div>

          <div className="relative p-2 bg-zinc-800 rounded-full text-white">
            <ShoppingCart size={20} />
            <span className="absolute -top-1 -right-1 bg-orange-500 text-[9px] px-1.5 rounded-full border-2 border-[#111]">0</span>
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        <div className="mt-3 md:hidden relative">
          <input 
            type="text" 
            placeholder="Search product, brand, and more..." 
            className="w-full bg-white rounded-lg py-2 px-4 text-xs outline-none"
          />
          <div className="absolute right-2 top-1.5 bg-orange-500 p-1 rounded text-white">
            <Search size={14} />
          </div>
        </div>
      </nav>

      {/* Hero Banner Section */}
      <div className="max-w-7xl mx-auto p-3 mt-2">
        <div className="bg-gradient-to-r from-blue-400 to-blue-200 rounded-2xl p-6 relative overflow-hidden h-48 flex items-center shadow-sm">
          <div className="z-10">
            <p className="text-blue-800 font-black text-xs uppercase tracking-widest mb-1">Great Deals</p>
            <h2 className="text-2xl font-black text-zinc-900 leading-tight">ON AIR CONDITIONER</h2>
            <div className="mt-4 flex items-center gap-2">
                <span className="text-blue-900 text-[10px] font-bold uppercase italic">Upto</span>
                <span className="text-4xl font-black text-blue-900">28%</span>
                <span className="text-blue-900 font-bold uppercase text-xs italic ml-1">Discount</span>
            </div>
          </div>
          <div className="absolute right-4 bottom-4 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
          {/* Static Image Replacement Placeholder */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20"><Home size={100} /></div>
        </div>
      </div>

      {/* Promotional Small Banners */}
      <div className="max-w-7xl mx-auto px-3 grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#1D2132] rounded-xl p-4 h-24 flex items-center shadow-sm">
           <div className="text-white">
             <p className="text-[10px] font-bold text-orange-500 uppercase">Apple Gadgets Care</p>
             <p className="text-[9px] text-zinc-400 mt-1">Professional Repairing Service</p>
           </div>
        </div>
        <div className="bg-[#F8A62D] rounded-xl p-4 h-24 flex items-center shadow-sm">
           <div className="text-zinc-900 font-black">
             <p className="text-[11px] uppercase leading-tight">Panasonic<br/>Mixer Grinder</p>
             <p className="text-[8px] mt-1 bg-white/40 inline-block px-1 rounded">5 Year Warranty</p>
           </div>
        </div>
      </div>

      {/* Featured Categories */}
      <div className="max-w-7xl mx-auto p-3 mb-6">
        <h3 className="text-lg font-black text-zinc-800 mb-4 flex items-center gap-2">Featured <span className="text-orange-500">Categories</span></h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { name: 'Mobile Phone', icon: <Smartphone /> },
            { name: 'Home Appliance', icon: <Home /> },
            { name: 'Gadgets', icon: <Headphones /> },
            { name: 'Tablet', icon: <Smartphone /> },
            { name: 'Offers', icon: <Percent /> },
            { name: 'New In', icon: <Tag /> }
          ].map((cat, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all cursor-pointer">
              <div className="bg-zinc-50 p-3 rounded-full text-zinc-700 mb-2">{cat.icon}</div>
              <p className="text-[10px] font-bold text-zinc-600 uppercase leading-tight">{cat.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="max-w-7xl mx-auto p-3">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-black text-zinc-800 uppercase tracking-tighter">Popular Products</h3>
            <button className="text-orange-500 text-[10px] font-black uppercase flex items-center">View All <ChevronRight size={14}/></button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group border border-transparent hover:border-orange-500/20">
                <div className="aspect-square bg-zinc-50 flex items-center justify-center text-zinc-300">
                    <Smartphone size={40} className="group-hover:scale-110 transition-transform"/>
                </div>
                <div className="p-4">
                    <h4 className="text-xs font-bold text-zinc-800 uppercase truncate leading-tight mb-1">{p.name}</h4>
                    <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => <Star key={i} size={8} className="fill-orange-500 text-orange-500" />)}
                    </div>
                    <div className="flex justify-between items-center mt-3">
                        <span className="text-sm font-black text-zinc-900 tracking-tighter">৳{p.price}</span>
                        <div className="bg-orange-500 text-white p-1.5 rounded-lg"><ShoppingCart size={14}/></div>
                    </div>
                </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation (Mobile Only) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 p-2 flex justify-around items-center md:hidden z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col items-center text-orange-500"><Home size={20}/><span className="text-[9px] font-bold mt-1">Home</span></div>
        <div className="flex flex-col items-center text-zinc-400"><GridIcon size={20}/><span className="text-[9px] font-bold mt-1 uppercase tracking-tight">Category</span></div>
        <div className="flex flex-col items-center text-zinc-400"><Tag size={20}/><span className="text-[9px] font-bold mt-1 uppercase tracking-tight">Offer</span></div>
        <div className="flex flex-col items-center text-zinc-400"><User size={20}/><span className="text-[9px] font-bold mt-1 uppercase tracking-tight">Sign In</span></div>
      </div>
    </div>
  );
}
