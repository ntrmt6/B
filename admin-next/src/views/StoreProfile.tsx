
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { User, Order, WebsiteConfig, Product } from '../types';
import { getStoredToken } from '../services/authService';

// Lazy load heavy layout components from individual files
const StoreHeader = lazy(() => import('../components/StoreHeader').then(m => ({ default: m.StoreHeader })));
const StoreFooter = lazy(() => import('../components/store/StoreFooter').then(m => ({ default: m.StoreFooter })));
const TrackOrderModal = lazy(() => import('../components/store/TrackOrderModal').then(m => ({ default: m.TrackOrderModal })));

// Skeleton loaders removed for faster initial render
import { User as UserIcon, Mail, Phone, MapPin, Package, CheckCircle, Clock, Truck, XCircle, Camera } from 'lucide-react';

interface StoreProfileProps {
  user: User;
  onUpdateProfile: (updatedUser: User) => void;
  orders: Order[];
  onHome: () => void;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  logo?: string | null;
  websiteConfig?: WebsiteConfig;
  tenantId?: string;
   searchValue?: string;
   onSearchChange?: (value: string) => void;
   onImageSearchClick?: () => void;
   onOpenChat?: () => void;
   cart?: number[];
   onToggleCart?: (id: number) => void;
   onCheckoutFromCart?: (productId: number) => void;
   productCatalog?: Product[];
   onCartOpenRef?: (openFn: () => void) => void;
}

const StoreProfile = ({ 
  user, 
  onUpdateProfile, 
  orders, 
  onHome, 
  onLoginClick, 
  onLogoutClick,
  logo,
   websiteConfig,
   tenantId,
   searchValue,
   onSearchChange,
   onImageSearchClick,
   onOpenChat,
   cart,
   onToggleCart,
   onCheckoutFromCart,
   productCatalog,
   onCartOpenRef
}: StoreProfileProps) => {
  const [activeTab, setActiveTab] = useState<'info' | 'orders'>('info');
  const crystalOrange = 'text-[#FF8A00]';
  const crystalBlue = 'text-[#1E90FF]';
  const navButtonClass = (tab: 'info' | 'orders') =>
    `w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition mb-1 ${
      activeTab === tab
        ? 'bg-[#1E90FF]/10 text-[#1E90FF] font-semibold'
        : 'text-gray-600 hover:bg-gray-50'
    }`;
  const editableInputClass = (editable: boolean) =>
    `w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#1E90FF] transition ${
      editable ? 'border-gray-300 bg-white' : 'border-transparent bg-gray-50'
    }`;
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    address: user.address || ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string>(user.image || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);
  const [isEditing, setIsEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Filter orders for this user - simulating match by name since we don't have proper Auth IDs in all mock data
  const myOrders = orders.filter(o => 
    o.customer.toLowerCase() === user.name.toLowerCase() || 
    (o.email && o.email.toLowerCase() === user.email.toLowerCase())
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('tenantId', tenantId || '');
      const token = getStoredToken();
      const uploadRes = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formDataUpload,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.imageUrl) throw new Error('Upload failed');
      await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ image: uploadData.imageUrl }),
      });
      setProfileImage(uploadData.imageUrl);
      onUpdateProfile({ ...user, image: uploadData.imageUrl });
      import('react-hot-toast').then(m => m.toast.success('Profile image updated!'));
    } catch {
      import('react-hot-toast').then(m => m.toast.error('Failed to upload image'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...user,
      ...formData
    });
    setIsEditing(false);
    setSuccessMsg('Profile updated successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
      <Suspense fallback={null}>
        <StoreHeader 
          onHomeClick={onHome}
          ImageSearchClick={onImageSearchClick}
          onTrackOrder={() => setIsTrackOrderOpen(true)}
          user={user}
          onLoginClick={onLoginClick}
          onLogoutClick={onLogoutClick}
          onProfileClick={() => {}} // Already on profile
          logo={logo}
          websiteConfig={websiteConfig}
              searchValue={searchValue}
              onSearchChange={onSearchChange}
              cart={cart}
              onToggleCart={onToggleCart}
              onCheckoutFromCart={onCheckoutFromCart}
              productCatalog={productCatalog}
              onCartOpenRef={onCartOpenRef}
        />
      </Suspense>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">My Account</h1>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 flex-shrink-0">
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 text-center bg-[#FFF4E8] border-b border-[#FF8A00]/20">
                     <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                     <div
                       onClick={() => fileInputRef.current?.click()}
                       className={`w-20 h-20 bg-white rounded-full mx-auto mb-3 flex items-center justify-center ${crystalOrange} shadow-sm cursor-pointer relative group overflow-hidden`}
                     >
                        {profileImage ? (
                          <img src={profileImage} alt="Profile" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <UserIcon size={32} />
                        )}
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {uploadingImage ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Camera size={18} className="text-white" />
                          )}
                        </div>
                     </div>
                     <h3 className="text-slate-800 font-semibold truncate">{user.name}</h3>
                     <p className="text-slate-500 text-xs truncate">{user.email}</p>
                  </div>
                  <nav className="p-2">
                      <button 
                        onClick={() => setActiveTab('info')}
                        className={navButtonClass('info')}
                      >
                         <UserIcon size={18} /> Personal Info
                      </button>
                      <button 
                        onClick={() => setActiveTab('orders')}
                        className={navButtonClass('orders')}
                      >
                         <Package size={18} /> My Orders
                      </button>
                  </nav>
               </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
               
               {/* PERSONAL INFO TAB */}
               {activeTab === 'info' && (
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 animate-in fade-in">
                    <div className="flex justify-between items-center mb-6">
                       <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
                        {!isEditing && (
                          <button 
                            onClick={() => setIsEditing(true)}
                            className={`font-medium hover:underline text-sm ${crystalBlue}`}
                          >
                            Edit Details
                          </button>
                       )}
                    </div>

                    {successMsg && (
                      <div className="bg-green-50 text-green-600 px-4 py-2 rounded-lg mb-4 text-sm font-medium flex items-center gap-2">
                         <CheckCircle size={16} /> {successMsg}
                      </div>
                    )}

                    <form onSubmit={handleSubmit}>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                          <div className="space-y-1">
                              <label className="text-sm font-medium text-gray-500">Full Name</label>
                              <div className="relative">
                                 <UserIcon size={18} className="absolute left-3 top-3 text-gray-400" />
                                 <input 
                                   type="text" 
                                   className={editableInputClass(isEditing)}
                                   value={formData.name}
                                   onChange={e => setFormData({...formData, name: e.target.value})}
                                   readOnly={!isEditing}
                                />
                             </div>
                          </div>
                          
                          <div className="space-y-1">
                              <label className="text-sm font-medium text-gray-500">Email Address</label>
                              <div className="relative">
                                 <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                                 <input 
                                   type="email" 
                                   className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-transparent bg-gray-50 text-gray-500 cursor-not-allowed"
                                  value={formData.email}
                                  readOnly
                                  title="Email cannot be changed"
                                />
                             </div>
                          </div>

                          <div className="space-y-1">
                              <label className="text-sm font-medium text-gray-500">Phone Number</label>
                              <div className="relative">
                                 <Phone size={18} className="absolute left-3 top-3 text-gray-400" />
                                 <input 
                                   type="tel" 
                                   className={editableInputClass(isEditing)}
                                   value={formData.phone}
                                   onChange={e => setFormData({...formData, phone: e.target.value})}
                                   readOnly={!isEditing}
                                  placeholder={isEditing ? "Enter phone number" : "Not set"}
                                />
                             </div>
                          </div>

                          <div className="space-y-1 md:col-span-2">
                              <label className="text-sm font-medium text-gray-500">Address</label>
                              <div className="relative">
                                 <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
                                 <textarea 
                                   className={`${editableInputClass(isEditing)} resize-none h-24`}
                                   value={formData.address}
                                   onChange={e => setFormData({...formData, address: e.target.value})}
                                   readOnly={!isEditing}
                                  placeholder={isEditing ? "Enter delivery address" : "Not set"}
                                />
                             </div>
                          </div>
                       </div>

                       {isEditing && (
                          <div className="mt-8 flex gap-3 justify-end">
                              <button 
                                type="button" 
                                onClick={() => { setIsEditing(false); setFormData({name: user.name, email: user.email, phone: user.phone||'', address: user.address||''}); }}
                                className="px-6 py-2 rounded-lg border border-[#1E90FF]/30 text-[#1E90FF] font-medium hover:bg-[#1E90FF]/10 transition"
                              >
                                Cancel
                              </button>
                              <button 
                                type="submit" 
                                className="px-3 sm:px-4 lg:px-6 py-2 rounded-lg bg-[#FF8A00] text-white font-semibold hover:bg-[#e67b00] transition-colors"
                              >
                                Save Changes
                              </button>
                          </div>
                       )}
                    </form>
                 </div>
               )}

               {/* ORDERS TAB */}
               {activeTab === 'orders' && (
                 <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8 animate-in fade-in">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Order History</h2>
                    
                    {myOrders.length > 0 ? (
                       <div className="space-y-4">
                          {myOrders.map(order => (
                             <div key={order.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 pb-4 border-b border-gray-50">
                                   <div>
                                      <div className="flex items-center gap-3">
                                         <span className="font-bold text-gray-800">{order.id}</span>
                                         <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                             order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                             order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                             'bg-[#1E90FF]/10 text-[#1E90FF]'
                                          }`}>
                                             {order.status}
                                          </span>
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1">{order.date}</p>
                                   </div>
                                   <div className="text-right">
                                      <p className="font-bold text-gray-800">৳ {order.amount.toLocaleString()}</p>
                                      <p className="text-xs text-gray-500">Total Amount</p>
                                   </div>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                       {order.status === 'Delivered' && <><CheckCircle size={16} className="text-green-500"/> Delivered</>}
                                       {order.status === 'Pending' && <><Clock size={16} className="text-[#1E90FF]"/> Processing</>}
                                       {order.status === 'Shipped' && <><Truck size={16} className="text-blue-500"/> On the way</>}
                                    </div>
                                    <button className={`text-sm font-medium hover:underline ${crystalBlue}`}>View Details</button>
                                 </div>
                              </div>
                          ))}
                       </div>
                    ) : (
                       <div className="text-center py-12">
                          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                             <Package size={32} className="text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-800 mb-2">No orders yet</h3>
                          <p className="text-gray-500 mb-6">Looks like you haven't placed any orders yet.</p>
                           <button onClick={onHome} className="bg-[#FF8A00] text-white px-3 sm:px-4 lg:px-6 py-2 rounded-full font-semibold hover:bg-[#e67b00] transition-colors">
                              Start Shopping
                           </button>
                       </div>
                    )}
                 </div>
               )}

            </div>
          </div>
        </div>
      </main>

      <Suspense fallback={null}>
        <StoreFooter websiteConfig={websiteConfig} logo={logo} tenantId={tenantId} onOpenChat={onOpenChat} />
      </Suspense>

      {isTrackOrderOpen && (
        <Suspense fallback={null}>
          <TrackOrderModal onClose={() => setIsTrackOrderOpen(false)} orders={orders} />
        </Suspense>
      )}
    </div>
  );
};

export default StoreProfile;
