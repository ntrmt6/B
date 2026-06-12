"use client";

import React, { useState } from 'react';
import { 
  Search, Menu, ShoppingCart, ChevronLeft, 
  Star, MessageCircle, Truck, 
  Minus, Plus, Percent
} from 'lucide-react';

export default function ProductDetails() {
  const [selectedColor, setSelectedColor] = useState('Black');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('Specification');

  const product = {
    name: "Xundd XDOT-065 Folding",
    code: "AGL32525",
    price: "1,250",
    colors: ['Black', 'Green', 'White'],
    specs: [
      { label: "Interface", value: "Type-C charging" },
      { label: "Model", value: "XDOT-065" },
      { label: "Control Button", value: "HD digital display" },
      { label: "Capacity", value: "3600mAh" },
      { label: "Speed", value: "5-speed adjustment" },
      { label: "Others Info", value: "Lanyard included, 180° folding, turbine blades, Compact foldable size" }
    ]
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans pb-24">
      {/* Top Header */}
      <nav className="bg-[#111] p-3 sticky top-0 z-50 flex items-center justify-between gap-4">
        <Menu className="text-white" size={24} />
        <div className="flex-1 relative">
          <input type="text" placeholder="Search product..." className="w-full bg-white rounded-full py-2 px-4 text-xs outline-none" />
          <div className="absolute right-1 top-1 bg-orange-500 p-1 rounded-full text-white"><Search size={14} /></div>
        </div>
        <div className="relative p-2 bg-zinc-800 rounded-full text-white">
          <ShoppingCart size={20} />
          <span className="absolute -top-1 -right-1 bg-orange-500 text-[9px] px-1.5 rounded-full border-2 border-[#111]">0</span>
        </div>
      </nav>

      {/* Breadcrumb & Gallery */}
      <div className="p-4 flex items-center gap-2 text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
        <span>Home</span> <ChevronLeft size={10} className="rotate-180"/> <span>Charger Fan</span>
      </div>

      <div className="px-4 flex flex-col items-center">
        <div className="w-full aspect-square bg-zinc-50 rounded-3xl border border-zinc-100 flex items-center justify-center p-10 mb-4 relative">
            <div className="w-40 h-40 bg-zinc-200 animate-pulse rounded-full"></div>
            <div className="absolute bottom-4 flex gap-2">
                {[1,2,3].map(i => <div key={i} className="w-12 h-12 border border-zinc-200 rounded-xl bg-white"></div>)}
            </div>
        </div>
      </div>

      {/* Product Basic Info */}
      <div className="px-5 mt-6">
        <h1 className="text-xl font-black text-zinc-900 uppercase leading-tight mb-2">{product.name}</h1>
        <p className="text-[10px] font-bold text-zinc-400 mb-4">Code: {product.code}</p>

        {/* Color Selector */}
        <div className="bg-zinc-50 p-4 rounded-2xl mb-6">
          <p className="text-[11px] font-black text-zinc-800 uppercase mb-3 tracking-widest">Color:</p>
          <div className="flex gap-3">
            {product.colors.map(color => (
              <button 
                key={color} 
                onClick={() => setSelectedColor(color)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 text-[10px] font-black uppercase transition-all ${selectedColor === color ? 'border-orange-500 bg-white shadow-sm' : 'border-zinc-200 text-zinc-400'}`}
              >
                <div className={`w-3 h-3 rounded-full ${color === 'Black' ? 'bg-zinc-800' : color === 'Green' ? 'bg-green-200' : 'bg-white border'}`}></div>
                {color}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div className="mb-6">
           <p className="text-[11px] font-black text-zinc-800 uppercase mb-3 tracking-widest">Select Quantity:</p>
           <div className="flex items-center bg-zinc-100 w-32 rounded-full p-1">
             <button onClick={() => quantity > 1 && setQuantity(quantity-1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-full"><Minus size={14}/></button>
             <span className="flex-1 text-center font-black text-sm">{quantity}</span>
             <button onClick={() => setQuantity(quantity+1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-full"><Plus size={14}/></button>
           </div>
        </div>

        {/* Info Bars */}
        <div className="space-y-2 mb-8">
           <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100 text-[11px] font-bold">
             <div className="flex items-center gap-2 text-zinc-800"><Percent size={14} className="text-orange-500" /> EMI Available</div>
             <button className="text-zinc-900 border-b border-zinc-900">View Plans</button>
           </div>
           <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-100 text-[11px] font-black text-green-700">
             <MessageCircle size={16} fill="currentColor"/> WhatsApp
           </div>
           <div className="flex items-center justify-between p-3 bg-white border border-zinc-100 rounded-xl text-[11px] font-bold">
             <div className="flex items-center gap-2 text-zinc-800"><Truck size={16} className="text-zinc-400"/> Delivery Timescale:</div>
             <span className="text-zinc-900 font-black">3-5 Days</span>
           </div>
        </div>

        {/* Tabs & Specification Table */}
        <div className="flex gap-2 mb-6">
           {['Specification', 'Description'].map(t => (
             <button 
               key={t}
               onClick={() => setActiveTab(t)}
               className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${activeTab === t ? 'bg-orange-500 text-white shadow-lg' : 'bg-zinc-100 text-zinc-400'}`}
             >
               {t}
             </button>
           ))}
        </div>

        <div className="border border-zinc-100 rounded-2xl overflow-hidden mb-10">
            <table className="w-full text-left border-collapse">
              <tbody>
                  {product.specs.map((spec, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                      <td className="p-4 text-[11px] font-bold text-zinc-400 border-r border-zinc-100 w-1/3">{spec.label}</td>
                      <td className="p-4 text-[11px] font-black text-zinc-900">{spec.value}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-3 border-t border-zinc-100 flex gap-3 z-50">
        <button className="flex-1 bg-orange-500 text-white font-black py-3.5 rounded-full uppercase text-xs tracking-widest shadow-xl shadow-orange-500/20">Shop Now</button>
        <button className="flex-1 bg-white border border-zinc-200 text-zinc-900 font-black py-3.5 rounded-full uppercase text-xs tracking-widest flex items-center justify-center gap-2">
           <ShoppingCart size={16}/> Add To Cart
        </button>
      </div>
    </div>
  );
}
