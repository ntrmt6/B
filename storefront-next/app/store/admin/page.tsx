"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, Package, ShoppingBag, Trash2, 
  X, Save, Lock, User as UserIcon, LogOut, Camera
} from 'lucide-react';

const API = 'https://nflpro.live/api';

export default function StoreAdmin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tab, setTab] = useState('orders');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Auth State
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  useEffect(() => {
    const savedAuth = localStorage.getItem('sn_admin_auth');
    if (savedAuth === 'true') setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchData();
  }, [tab, isLoggedIn]);

  const handleLogin = (e) => {
    e.preventDefault();
    // Username: amit | Password: your_choice (Ami eikhane 'next123' disi, apni icche moto change koren)
    if (loginForm.username === 'amit' && loginForm.password === 'systemnextit') {
      setIsLoggedIn(true);
      localStorage.setItem('sn_admin_auth', 'true');
    } else {
      alert("Invalid Credentials!");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/${tab === 'orders' ? 'orders' : 'products'}`);
      const data = await res.json();
      const sortedData = Array.isArray(data) ? data.reverse() : [];
      if (tab === 'orders') setOrders(sortedData); else setProducts(sortedData);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const deleteItem = async (id) => {
    if (!confirm("Confirm Delete?")) return;
    try {
      await fetch(`${API}/${tab === 'orders' ? 'orders' : 'products'}/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) { alert("Delete failed"); }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const product = Object.fromEntries(formData.entries());
    
    try {
      await fetch(`${API}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      setShowAddModal(false);
      fetchData();
    } catch (e) { alert("Failed to add product"); }
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#0f0f12] border border-[#1d1d21] rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="bg-orange-500 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
            <Lock className="text-white" size={24} />
          </div>
          <h2 className="text-white font-black text-xl uppercase tracking-tighter">Admin Access</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">System Next IT Management</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <UserIcon className="absolute left-3 top-3 text-zinc-600" size={16} />
            <input 
              type="text" placeholder="Username" required
              className="w-full bg-black border border-[#1d1d21] p-3 pl-10 rounded-xl text-xs text-white outline-none focus:border-orange-500"
              onChange={e => setLoginForm({...loginForm, username: e.target.value})}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-zinc-600" size={16} />
            <input 
              type="password" placeholder="Password" required
              className="w-full bg-black border border-[#1d1d21] p-3 pl-10 rounded-xl text-xs text-white outline-none focus:border-orange-500"
              onChange={e => setLoginForm({...loginForm, password: e.target.value})}
            />
          </div>
          <button className="w-full bg-orange-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] transition-all active:scale-95">Verify & Enter</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans flex flex-col md:flex-row">
      <div className="w-full md:w-64 bg-[#0a0a0c] border-r border-[#1d1d21] p-6 flex flex-col">
        <h1 className="text-orange-500 font-black tracking-tighter text-lg uppercase mb-10 italic">Next Admin</h1>
        <div className="space-y-2 flex-1">
          <button onClick={() => setTab('orders')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold ${tab === 'orders' ? 'bg-orange-500 text-white' : 'text-zinc-500'}`}><ShoppingBag size={16}/> ORDERS</button>
          <button onClick={() => setTab('products')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold ${tab === 'products' ? 'bg-orange-500 text-white' : 'text-zinc-500'}`}><Package size={16}/> PRODUCTS</button>
        </div>
        <button onClick={() => {localStorage.removeItem('sn_admin_auth'); setIsLoggedIn(false);}} className="flex items-center gap-2 text-zinc-600 text-[10px] font-bold uppercase mt-10 hover:text-red-500"><LogOut size={14}/> Logout Amit</button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">{tab} Panel</h2>
            {tab === 'products' && (
                <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 uppercase"><Plus size={16}/> Add Product</button>
            )}
        </div>

        <div className="bg-[#0f0f12] border border-[#1d1d21] rounded-2xl overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-black text-[10px] font-black text-zinc-500 uppercase p-4">
                    <tr><th className="p-4">ID</th><th className="p-4">Details</th><th className="p-4">Info</th><th className="p-4 text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-[#1d1d21]">
                    {tab === 'orders' ? orders.map(order => (
                        <tr key={order.id} className="hover:bg-zinc-900/50">
                            <td className="p-4 text-[10px] font-mono">#{order.id}</td>
                            <td className="p-4"><div className="text-xs font-bold text-white uppercase">{order.customer_name}</div></td>
                            <td className="p-4 font-black text-orange-500">৳{order.total_amount}</td>
                            <td className="p-4 text-right"><button onClick={() => deleteItem(order.id)} className="text-zinc-700 hover:text-red-500"><Trash2 size={16}/></button></td>
                        </tr>
                    )) : products.map(p => (
                        <tr key={p.id} className="hover:bg-zinc-900/50">
                            <td className="p-4 text-[10px] font-mono">#{p.id}</td>
                            <td className="p-4 flex items-center gap-3">
                                {p.image_url ? <img src={p.image_url} className="w-8 h-8 rounded bg-black object-cover" /> : <div className="w-8 h-8 bg-zinc-900 rounded" />}
                                <div className="text-xs font-bold text-white uppercase">{p.name}</div>
                            </td>
                            <td className="p-4 font-black text-orange-500">৳{p.price}</td>
                            <td className="p-4 text-right"><button onClick={() => deleteItem(p.id)} className="text-zinc-700 hover:text-red-500"><Trash2 size={16}/></button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0f0f12] border border-[#2d2d32] w-full max-w-md rounded-3xl p-8 relative">
                <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-zinc-500"><X size={20}/></button>
                <h2 className="text-white font-black text-xl mb-6 uppercase tracking-tighter italic">New Product</h2>
                <form onSubmit={addProduct} className="space-y-4">
                    <input name="name" placeholder="Product Name" className="w-full bg-black border border-[#1d1d21] p-3 rounded-xl text-xs outline-none focus:border-orange-500" required />
                    <div className="grid grid-cols-2 gap-3">
                        <input name="price" type="number" placeholder="Price (৳)" className="bg-black border border-[#1d1d21] p-3 rounded-xl text-xs outline-none focus:border-orange-500" required />
                        <input name="stock" type="number" placeholder="Stock Qty" className="bg-black border border-[#1d1d21] p-3 rounded-xl text-xs outline-none focus:border-orange-500" required />
                    </div>
                    {/* Image URL Input */}
                    <div className="relative">
                        <Camera className="absolute left-3 top-3 text-zinc-600" size={14} />
                        <input name="image_url" placeholder="Paste Image URL (e.g. https://...)" className="w-full bg-black border border-[#1d1d21] p-3 pl-10 rounded-xl text-xs outline-none focus:border-orange-500" />
                    </div>
                    <textarea name="description" placeholder="Description" className="w-full bg-black border border-[#1d1d21] p-3 rounded-xl text-xs outline-none focus:border-orange-500 resize-none" rows={3}></textarea>
                    <button type="submit" className="w-full bg-orange-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px]">Add Product</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
