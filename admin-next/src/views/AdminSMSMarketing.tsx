import React, { useState, useEffect, useCallback } from 'react';
import { 
  Phone, Send, History, Search, RefreshCw, Users, Building2, 
  Briefcase, Check, X, MessageSquare, Mic, Loader2, AlertCircle,
  ChevronRight, Clock, CheckCircle, XCircle, Info, Settings, Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import { dueListService } from '../services/DueListService';
import { DueEntity, EntityType } from '../types';
import { getAuthHeader } from '../services/authService';

interface AdminSMSMarketingProps {
  tenantId: string;
  onBack?: () => void;
}

interface SMSBalance {
  smsBalance: number;
  minuteBalance: number;
}

interface SelectedContact {
  id: string;
  name: string;
  phone: string;
  type: EntityType;
}

interface SMSHistoryItem {
  _id: string;
  recipients: string[];
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'partial';
  sentCount: number;
  failedCount: number;
  createdAt: string;
  type: 'sms' | 'voice';
}

interface SMSConfigData {
  provider: 'greenweb' | 'ssl_wireless' | 'bulksmsbd' | 'custom';
  apiKey: string;
  apiToken: string;
  apiUrl: string;
  userId: string;
  senderId: string;
  voiceSupported: boolean;
  isActive: boolean;
}

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return window.location.origin;
    }
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';
};

const AdminSMSMarketing: React.FC<AdminSMSMarketingProps> = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState<EntityType>('Customer');
  const [contacts, setContacts] = useState<DueEntity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<SelectedContact[]>([]);
  const [manualPhone, setManualPhone] = useState('');
  const [countryCode] = useState('+88');
  const [message, setMessage] = useState('');
  const [shopSignature, setShopSignature] = useState('');
  const [balance, setBalance] = useState<SMSBalance>({ smsBalance: 0, minuteBalance: 0 });
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [smsHistory, setSmsHistory] = useState<SMSHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [entityCounts, setEntityCounts] = useState({ Customer: 0, Supplier: 0, Employee: 0 });
  
  // SMS Config states
  const [showSMSConfig, setShowSMSConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [smsConfig, setSmsConfig] = useState<SMSConfigData>({
    provider: 'greenweb',
    apiKey: '',
    apiToken: '',
    apiUrl: '',
    userId: '',
    senderId: '',
    voiceSupported: false,
    isActive: false,
  });

  useEffect(() => { if (tenantId) dueListService.setTenantId(tenantId); }, [tenantId]);

  const fetchSMSConfig = useCallback(async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/sms/config`, {
        headers: { 'X-Tenant-Id': tenantId, ...getAuthHeader() }
      });
      if (response.ok) {
        const config = await response.json();
        setSmsConfig(config);
      }
    } catch (error) {
      console.error('Error fetching SMS config:', error);
    }
  }, [tenantId]);

  const saveSMSConfig = async () => {
    setSavingConfig(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/sms/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': tenantId, ...getAuthHeader() },
        body: JSON.stringify(smsConfig),
      });
      if (response.ok) {
        toast.success('SMS configuration saved successfully');
        setShowSMSConfig(false);
        fetchBalance();
      } else {
        const result = await response.json();
        toast.error(result.error || 'Failed to save configuration');
      }
    } catch (error) {
      toast.error('Failed to save SMS configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const allData = await dueListService.getEntities();
      setEntityCounts({
        Customer: allData.filter((e: DueEntity) => e.type === 'Customer').length,
        Supplier: allData.filter((e: DueEntity) => e.type === 'Supplier').length,
        Employee: allData.filter((e: DueEntity) => e.type === 'Employee').length,
      });
      const data = await dueListService.getEntities(activeTab, searchQuery || undefined);
      setContacts(data);
    } catch (error) { toast.error('Failed to fetch contacts'); }
    finally { setLoading(false); }
  }, [activeTab, searchQuery]);

  const fetchBalance = useCallback(async () => {
    setLoadingBalance(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/sms/balance`, {
        headers: { 'X-Tenant-Id': tenantId, ...getAuthHeader() }
      });
      if (response.ok) setBalance(await response.json());
    } catch (error) { console.error('Error fetching SMS balance:', error); }
    finally { setLoadingBalance(false); }
  }, [tenantId]);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/sms/history`, {
        headers: { 'X-Tenant-Id': tenantId, ...getAuthHeader() }
      });
      if (response.ok) setSmsHistory(await response.json());
    } catch (error) { console.error('Error fetching SMS history:', error); }
    finally { setLoadingHistory(false); }
  }, [tenantId]);

  useEffect(() => {
    const fetchSignature = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/tenants/${tenantId}/config`, {
          headers: { 'X-Tenant-Id': tenantId, ...getAuthHeader() }
        });
        if (response.ok) {
          const config = await response.json();
          setShopSignature(`\n- ${config.websiteName || 'Shop'}${config.phones?.[0] ? `(${config.phones[0]})` : ''}`);
        }
      } catch { setShopSignature('\n- Shop'); }
    };
    fetchSignature();
  }, [tenantId]);

  useEffect(() => { fetchContacts(); fetchBalance(); fetchSMSConfig(); }, [fetchContacts, fetchBalance, fetchSMSConfig]);
  useEffect(() => { const timer = setTimeout(fetchContacts, 300); return () => clearTimeout(timer); }, [searchQuery, activeTab]);

  const formatPhone = (phone: string): string => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.startsWith('88') ? cleaned.substring(2) : cleaned;
  };

  const displayPhone = (phone: string): string => {
    const formatted = formatPhone(phone);
    return formatted.startsWith('0') ? `+88 ${formatted}` : `+88 0${formatted}`;
  };

  const addContact = (contact: DueEntity) => {
    if (selectedContacts.some(c => c.id === contact._id)) { toast.error('Contact already added'); return; }
    setSelectedContacts(prev => [...prev, { id: contact._id || '', name: contact.name, phone: contact.phone, type: contact.type }]);
    toast.success(`Added ${contact.name}`);
  };

  const removeContact = (id: string) => setSelectedContacts(prev => prev.filter(c => c.id !== id));

  const selectAll = () => {
    const newContacts = contacts.filter(c => !selectedContacts.some(sc => sc.id === c._id))
      .map(c => ({ id: c._id || '', name: c.name, phone: c.phone, type: c.type }));
    if (newContacts.length === 0) { toast.error('All contacts already selected'); return; }
    setSelectedContacts(prev => [...prev, ...newContacts]);
    toast.success(`Added ${newContacts.length} contacts`);
  };

  const addManualPhone = () => {
    if (!manualPhone) { toast.error('Please enter a phone number'); return; }
    const formatted = formatPhone(manualPhone);
    if (formatted.length < 10 || formatted.length > 11) { toast.error('Invalid phone number'); return; }
    const fullPhone = formatted.startsWith('0') ? formatted : `0${formatted}`;
    if (selectedContacts.some(c => formatPhone(c.phone) === formatted)) { toast.error('Phone number already added'); return; }
    setSelectedContacts(prev => [...prev, { id: `manual-${Date.now()}`, name: 'Manual Entry', phone: fullPhone, type: 'Customer' }]);
    setManualPhone('');
    toast.success('Phone number added');
  };

  const messageLength = message.length + shopSignature.length;
  const smsCount = Math.ceil(messageLength / 160) || 0;

  const sendSMS = async () => {
    if (selectedContacts.length === 0) { toast.error('Please select at least one recipient'); return; }
    if (!message.trim()) { toast.error('Please write a message'); return; }
    if (balance.smsBalance < selectedContacts.length * smsCount) { toast.error('Insufficient SMS balance'); return; }
    setSending(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': tenantId, ...getAuthHeader() },
        body: JSON.stringify({ recipients: selectedContacts.map(c => ({ phone: formatPhone(c.phone), name: c.name })), message: message + shopSignature, type: 'sms' })
      });
      const result = await response.json();
      if (response.ok) { toast.success(`SMS sent to ${result.sentCount} recipients`); setSelectedContacts([]); setMessage(''); fetchBalance(); if (showHistory) fetchHistory(); }
      else toast.error(result.error || 'Failed to send SMS');
    } catch { toast.error('Failed to send SMS'); }
    finally { setSending(false); }
  };

  const sendVoiceMessage = async () => {
    if (selectedContacts.length === 0) { toast.error('Please select at least one recipient'); return; }
    if (!message.trim()) { toast.error('Please write a message'); return; }
    if (balance.minuteBalance < selectedContacts.length) { toast.error('Insufficient minute balance'); return; }
    setSending(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/sms/send-voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': tenantId, ...getAuthHeader() },
        body: JSON.stringify({ recipients: selectedContacts.map(c => ({ phone: formatPhone(c.phone), name: c.name })), message: message + shopSignature, type: 'voice' })
      });
      const result = await response.json();
      if (response.ok) { toast.success(`Voice message sent to ${result.sentCount} recipients`); setSelectedContacts([]); setMessage(''); fetchBalance(); if (showHistory) fetchHistory(); }
      else toast.error(result.error || 'Failed to send voice message');
    } catch { toast.error('Failed to send voice message'); }
    finally { setSending(false); }
  };

  // SMS Config Modal
  const SMSConfigModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Settings size={20} className="text-blue-600" />Bulk SMS API Configuration
          </h2>
          <button onClick={() => setShowSMSConfig(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
            <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">Configure your bulk SMS API credentials to send SMS and voice messages. Settings are saved per tenant.</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMS Provider</label>
            <select
              value={smsConfig.provider}
              onChange={(e) => setSmsConfig(prev => ({ ...prev, provider: e.target.value as SMSConfigData['provider'] }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="greenweb">GreenWeb SMS</option>
              <option value="ssl_wireless">SSL Wireless</option>
              <option value="bulksmsbd">BulkSMSBD</option>
              <option value="custom">Custom API</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input
                type="password"
                value={smsConfig.apiKey}
                onChange={(e) => setSmsConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Enter API Key"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
              <input
                type="password"
                value={smsConfig.apiToken}
                onChange={(e) => setSmsConfig(prev => ({ ...prev, apiToken: e.target.value }))}
                placeholder="Enter API Token"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {smsConfig.provider === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom API URL</label>
              <input
                type="text"
                value={smsConfig.apiUrl}
                onChange={(e) => setSmsConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                placeholder="https://api.example.com/sms/send"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID (optional)</label>
              <input
                type="text"
                value={smsConfig.userId}
                onChange={(e) => setSmsConfig(prev => ({ ...prev, userId: e.target.value }))}
                placeholder="Enter User ID"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sender ID</label>
              <input
                type="text"
                value={smsConfig.senderId}
                onChange={(e) => setSmsConfig(prev => ({ ...prev, senderId: e.target.value }))}
                placeholder="e.g., 8809617624588"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={smsConfig.voiceSupported}
                onChange={(e) => setSmsConfig(prev => ({ ...prev, voiceSupported: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Voice messages supported</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={smsConfig.isActive}
                onChange={(e) => setSmsConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable SMS</span>
            </label>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-3">
          <button
            onClick={() => setShowSMSConfig(false)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={saveSMSConfig}
            disabled={savingConfig}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
          >
            {savingConfig ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );

  const HistoryModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><History size={20} className="text-blue-600" />SMS History</h2>
          <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-full transition"><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loadingHistory ? <div className="flex items-center justify-center py-12"><Loader2 size={32} className="animate-spin text-blue-600" /></div> :
           smsHistory.length === 0 ? <div className="text-center py-12"><MessageSquare size={48} className="mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No SMS history yet</p></div> :
            <div className="space-y-3">{smsHistory.map(item => (
              <div key={item._id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.type === 'voice' ? <Mic size={16} className="text-purple-600" /> : <MessageSquare size={16} className="text-blue-600" />}
                    <span className="text-sm font-medium text-gray-700">{item.type === 'voice' ? 'Voice Message' : 'SMS'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'sent' ? 'bg-green-100 text-green-700' : item.status === 'failed' ? 'bg-red-100 text-red-700' : item.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                      {item.status === 'sent' ? 'Sent' : item.status === 'failed' ? 'Failed' : item.status === 'partial' ? 'Partial' : 'Pending'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} />{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.message}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Users size={12} />{item.recipients.length} recipients</span>
                  <span className="flex items-center gap-1 text-green-600"><CheckCircle size={12} />{item.sentCount} sent</span>
                  {item.failedCount > 0 && <span className="flex items-center gap-1 text-red-600"><XCircle size={12} />{item.failedCount} failed</span>}
                </div>
              </div>
            ))}</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div><h1 className="text-xl sm:text-2xl font-bold text-gray-900">Marketing</h1><p className="text-sm text-gray-500 mt-1">Send SMS and voice messages to your contacts</p></div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setShowSMSConfig(true); fetchSMSConfig(); }} 
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              <Settings size={18} />SMS Settings
            </button>
            <button onClick={() => { setShowHistory(true); fetchHistory(); }} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm font-medium"><History size={18} />SMS History</button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-200">
              {(['Customer', 'Supplier', 'Employee'] as EntityType[]).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 px-3 py-3 text-sm font-medium transition relative ${activeTab === tab ? 'text-gray-900 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-700'}`}>
                  <div className="flex items-center justify-center gap-1.5">
                    {tab === 'Customer' && <Users size={16} />}{tab === 'Supplier' && <Building2 size={16} />}{tab === 'Employee' && <Briefcase size={16} />}
                    <span>{tab}</span><sup className="text-xs text-gray-400">({entityCounts[tab]})</sup>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input type="text" placeholder="Search by name or phone number" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <button onClick={selectAll} className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm font-medium whitespace-nowrap">Select All</button>
                <button onClick={fetchContacts} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition" title="Refresh"><RefreshCw size={18} className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} /></button>
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-blue-600" /></div> :
               contacts.length === 0 ? <div className="text-center py-12"><Users size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-gray-500 text-sm">No contacts found</p></div> :
                contacts.map(contact => (
                  <div key={contact._id} className={`flex items-center justify-between p-3 border-b border-gray-50 hover:bg-gray-50 transition ${selectedContacts.some(c => c.id === contact._id) ? 'bg-orange-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${contact.type === 'Customer' ? 'bg-blue-100 text-blue-700' : contact.type === 'Supplier' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{contact.name.charAt(0).toUpperCase()}</div>
                      <div><p className="font-medium text-gray-900 text-sm">{contact.name}</p><p className="text-xs text-gray-500">{displayPhone(contact.phone)}</p></div>
                    </div>
                    <button onClick={() => addContact(contact)} disabled={selectedContacts.some(c => c.id === contact._id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${selectedContacts.some(c => c.id === contact._id) ? 'bg-green-100 text-green-700 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                      {selectedContacts.some(c => c.id === contact._id) ? <Check size={16} /> : 'Add'}
                    </button>
                  </div>
                ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 bg-white rounded-xl border border-blue-200 p-4">
                <div className="flex items-center justify-between"><span className="text-sm text-gray-600">MINUTE BALANCE</span>{loadingBalance ? <Loader2 size={16} className="animate-spin text-blue-600" /> : <span className="text-lg font-bold text-blue-600">{balance.minuteBalance}</span>}</div>
                <a href="#" onClick={e => { e.preventDefault(); toast('Contact admin to buy minutes'); }} className="flex items-center gap-1 text-orange-500 hover:text-orange-600 text-sm font-medium mt-2">Buy Minutes <ChevronRight size={14} /></a>
              </div>
              <div className="flex-1 bg-white rounded-xl border border-green-200 p-4">
                <div className="flex items-center justify-between"><span className="text-sm text-gray-600 flex items-center gap-1"><MessageSquare size={14} /> SMS BALANCE</span>{loadingBalance ? <Loader2 size={16} className="animate-spin text-green-600" /> : <span className="text-lg font-bold text-green-600">{balance.smsBalance}</span>}</div>
                <a href="#" onClick={e => { e.preventDefault(); toast('Contact admin to buy SMS'); }} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 bg-blue-50 px-3 py-1 rounded-lg w-fit">Buy SMS <ChevronRight size={14} /></a>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number<span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"><span className="text-lg">🇧🇩</span><span className="text-gray-700">{countryCode}</span></div>
                <input type="text" value={manualPhone} onChange={e => setManualPhone(e.target.value.replace(/\D/g, ''))} placeholder="XXXXXXXXXX" className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" maxLength={11} />
                <button onClick={addManualPhone} className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"><Phone size={18} /></button>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">SMS Sending to ({selectedContacts.length})</label>
              {selectedContacts.length === 0 ? <div className="flex items-center justify-center py-4 sm:py-6 border-2 border-dashed border-gray-200 rounded-lg"><p className="text-sm text-gray-400">Select contacts from the list</p></div> :
                <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto">{selectedContacts.map(contact => (
                  <div key={contact.id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                    <span>{contact.name}</span><button onClick={() => removeContact(contact.id)} className="p-0.5 hover:bg-blue-100 rounded-full"><X size={14} /></button>
                  </div>
                ))}</div>}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Write your message</label>
              <div className="relative">
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your message here" rows={5} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
                <p className="absolute bottom-3 right-3 text-xs text-gray-400">{shopSignature.trim()}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">{messageLength} Character | {smsCount} SMS (160 Character/SMS)</p>
                {balance.smsBalance < selectedContacts.length * smsCount && selectedContacts.length > 0 && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />Insufficient balance</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={sendSMS} disabled={sending || selectedContacts.length === 0 || !message.trim()} className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}Send SMS
              </button>
              <button onClick={sendVoiceMessage} disabled={sending || selectedContacts.length === 0 || !message.trim()} className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />}Send Voice Message
              </button>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
              <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">SMS will be sent through bulk SMS gateway. Standard SMS charges apply. Voice messages are converted to speech and delivered as phone calls.</p>
            </div>
          </div>
        </div>
      </div>
      {showHistory && <HistoryModal />}
      {showSMSConfig && <SMSConfigModal />}
    </div>
  );
};

export default AdminSMSMarketing;
