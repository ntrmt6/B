// Lazy-loaded StoreChatModal for better code splitting
import React, { useState, useRef, useEffect, useMemo, useCallback, CSSProperties } from 'react';
import { X, Phone, Video, Info, ImageIcon, Smile, Send, Edit2, Trash2, Check, MessageCircle, ShoppingBag, HelpCircle, Sparkles, LogIn, ChevronDown, Users, Bot, Loader2, RotateCcw } from 'lucide-react';
import { User as UserType, WebsiteConfig, ChatMessage, ThemeConfig } from '../../types';
import { toast } from 'react-hot-toast';
import { getGuestSessionId } from '../../utils/guestSession';
import { AiChatArea, AiChatMessage } from './AiChatArea';
import { buildWhatsAppLink, buildMessengerLink, hexToRgb } from './chatHelpers';

const AI_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const AI_HISTORY_WINDOW = 10; // Sliding window: only send last N messages to backend

// Quick reply suggestions
const quickReplies = [
    { id: 'know', label: 'মূল্য', message: 'আপনার পণ্যের মূল্য কত?' },
    { id: 'demo', label: 'ডেমো', message: 'আমি একটি ডেমো দেখতে চাই' },
    { id: 'feature', label: 'আসল ছবি', message: 'আপনার পণ্যের আসল ছবি দেখতে চাই' },
];

export interface StoreChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenantId?: string;
    websiteConfig?: WebsiteConfig;
    themeConfig?: ThemeConfig;
    user?: UserType | null;
    messages?: ChatMessage[];
    onSendMessage?: (text: string, replyTarget?: { customerEmail?: string; guestSessionId?: string }) => void;
    context?: 'customer' | 'admin';
    onEditMessage?: (id: string, text: string) => void;
    onDeleteMessage?: (id: string) => void;
    canDeleteAll?: boolean;
    onLoginClick?: () => void;
}

export const StoreChatModal: React.FC<StoreChatModalProps> = ({ 
    isOpen, onClose, tenantId, websiteConfig, themeConfig, user, messages = [], 
    onSendMessage, context = 'customer', onEditMessage, onDeleteMessage, canDeleteAll = false,
    onLoginClick 
}) => {
    type CustomerChannel = 'ai' | 'live' | 'whatsapp' | 'messenger';
    const [draft, setDraft] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editingDraft, setEditingDraft] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [customerChannel, setCustomerChannel] = useState<CustomerChannel>('live');
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isCustomerView = context !== 'admin';
    const [selectedConversation, setSelectedConversation] = useState<string>('all');
    const [showConvoDropdown, setShowConvoDropdown] = useState(false);
    const convoDropdownRef = useRef<HTMLDivElement>(null);
    const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([]);
    const [aiLoading, setAiLoading] = useState(false);
    const aiMessagesEndRef = useRef<HTMLDivElement>(null);
    const baseWhatsAppLink = isCustomerView ? buildWhatsAppLink(websiteConfig?.chatSupportWhatsapp || websiteConfig?.whatsappNumber) : null;
    const messengerLink = isCustomerView ? buildMessengerLink(websiteConfig?.chatSupportMessenger) : null;
    const chatEnabled = isCustomerView ? (websiteConfig?.chatEnabled ?? true) : true;
    const whatsappFallbackLink = websiteConfig?.chatWhatsAppFallback ? baseWhatsAppLink : null;
    const storeName = websiteConfig?.websiteName || 'Our Store';
    const supportHours = websiteConfig?.chatSupportHours ? `${websiteConfig.chatSupportHours.from} — ${websiteConfig.chatSupportHours.to}` : null;
    const normalizedUserEmail = user?.email?.toLowerCase();
    const guestSessionId = useMemo(() => (isCustomerView ? getGuestSessionId() : ''), [isCustomerView, tenantId]);
    const guestBadge = guestSessionId ? guestSessionId.slice(-8).toUpperCase() : '';
    const isLiveChannel = !isCustomerView || customerChannel === 'live';
    const isAiChannel = isCustomerView && customerChannel === 'ai';

    // Build unique conversation list for admin dropdown
    interface ConversationEntry {
        key: string; // unique identifier: email or guestSessionId
        label: string; // display name
        customerEmail?: string;
        guestSessionId?: string;
        lastTimestamp: number;
        unreadCount: number;
    }
    const conversations = useMemo<ConversationEntry[]>(() => {
        if (isCustomerView) return [];
        const map = new Map<string, ConversationEntry>();
        for (const msg of messages) {
            if (msg.sender !== 'customer') continue;
            const email = msg.customerEmail?.toLowerCase() || msg.authorEmail?.toLowerCase();
            const gSid = msg.guestSessionId;
            const key = email || gSid || '';
            if (!key) continue;
            const existing = map.get(key);
            const name = msg.customerName || msg.authorName || (gSid ? `Guest ${gSid.slice(-6).toUpperCase()}` : email || 'Unknown');
            if (existing) {
                if (msg.timestamp > existing.lastTimestamp) {
                    existing.lastTimestamp = msg.timestamp;
                    existing.label = name;
                }
                existing.unreadCount++;
            } else {
                map.set(key, {
                    key,
                    label: name,
                    customerEmail: email,
                    guestSessionId: gSid,
                    lastTimestamp: msg.timestamp,
                    unreadCount: 1,
                });
            }
        }
        return Array.from(map.values()).sort((a, b) => b.lastTimestamp - a.lastTimestamp);
    }, [messages, isCustomerView]);

    // Filter messages: customers only see their own conversation, admins see selected or all
    const displayMessages = useMemo(() => {
        const isGreetingMessage = (msg: ChatMessage) => msg.id.startsWith('greeting-');

        if (!isCustomerView) {
            // Admin: filter by selected conversation
            if (selectedConversation === 'all') return messages;
            const selected = conversations.find(c => c.key === selectedConversation);
            if (!selected) return messages;
            return messages.filter(msg => {
                if (isGreetingMessage(msg)) return false;
                const msgEmail = msg.customerEmail?.toLowerCase() || (msg.sender === 'customer' ? msg.authorEmail?.toLowerCase() : undefined);
                const msgGSid = msg.guestSessionId;
                // Show messages belonging to this conversation (both customer and admin replies)
                if (selected.customerEmail && msgEmail === selected.customerEmail) return true;
                if (selected.guestSessionId && msgGSid === selected.guestSessionId) return true;
                // Also show admin replies targeted at this conversation
                if (msg.sender === 'admin') {
                    if (selected.customerEmail && msg.customerEmail?.toLowerCase() === selected.customerEmail) return true;
                    if (selected.guestSessionId && msg.guestSessionId === selected.guestSessionId) return true;
                }
                return false;
            });
        }

        // Customer view
        if (!normalizedUserEmail && !guestSessionId) {
            return messages.filter(isGreetingMessage);
        }

        // Customer sees only their own conversation using login email or guest session id.
        // IMPORTANT: only compare customerEmail when the current user actually has an email,
        // otherwise undefined === undefined would match all guest messages.
        return messages.filter(msg =>
            isGreetingMessage(msg) ||
            (!!normalizedUserEmail && msg.customerEmail?.toLowerCase() === normalizedUserEmail) ||
            (!!normalizedUserEmail && msg.sender === 'customer' && msg.authorEmail?.toLowerCase() === normalizedUserEmail) ||
            (!!guestSessionId && msg.guestSessionId === guestSessionId)
        );
    }, [messages, isCustomerView, normalizedUserEmail, guestSessionId, selectedConversation, conversations]);
    const chatContactName = websiteConfig?.websiteName || 'Support Team';
    const statusLine = websiteConfig?.chatGreeting || (supportHours ? `Typically replies ${supportHours}` : 'Active now');
    const chatInitial = chatContactName.charAt(0).toUpperCase();
    
    const chatShellStyle = useMemo(() => {
        const fallbackAccent = themeConfig?.primaryColor || '#16a34a';
        const accentHex = websiteConfig?.chatAccentColor || fallbackAccent;
        const accentRgb = hexToRgb(accentHex);
        const fallbackSurface = themeConfig?.surfaceColor || '#f5f6f7';
        const surfaceColor = websiteConfig?.chatSurfaceColor || `rgba(${hexToRgb(fallbackSurface)}, 0.96)`;
        const borderColor = websiteConfig?.chatBorderColor || `rgba(${accentRgb}, 0.18)`;
        const shadowColor = websiteConfig?.chatShadowColor || `rgba(${accentRgb}, 0.28)`;
        return {
            '--chat-accent': accentHex,
            '--chat-accent-rgb': accentRgb,
            '--chat-surface': surfaceColor,
            '--chat-border': borderColor,
            '--chat-shadow': shadowColor
        } as CSSProperties;
    }, [themeConfig?.primaryColor, themeConfig?.surfaceColor, websiteConfig?.chatAccentColor, websiteConfig?.chatSurfaceColor, websiteConfig?.chatBorderColor, websiteConfig?.chatShadowColor]);
    
    const composerPlaceholder = isCustomerView
        ? (user ? 'আপনার প্রশ্ন লিখুন...' : `গেস্ট মেসেজ লিখুন (${guestBadge || 'Guest'})...`)
        : (selectedConversation !== 'all'
            ? `Reply to ${conversations.find(c => c.key === selectedConversation)?.label || 'customer'}...`
            : 'Select a conversation to reply...');

    const handleCustomerChannelSelect = useCallback((channel: CustomerChannel) => {
        if (!isCustomerView) return;
        setCustomerChannel(channel);
        if (channel === 'whatsapp' && baseWhatsAppLink && typeof window !== 'undefined') {
            window.open(baseWhatsAppLink, '_blank', 'noopener,noreferrer');
        }
        if (channel === 'messenger' && messengerLink && typeof window !== 'undefined') {
            window.open(messengerLink, '_blank', 'noopener,noreferrer');
        }
    }, [isCustomerView, baseWhatsAppLink, messengerLink]);
    
    const openWhatsApp = useCallback(() => {
        if (!baseWhatsAppLink || typeof window === 'undefined') return;
        window.open(baseWhatsAppLink, '_blank', 'noopener,noreferrer');
    }, [baseWhatsAppLink]);
    
    const showChatInfo = useCallback(() => {
        toast.custom(() => (
            <div className="max-w-sm rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-xl text-sm text-gray-700">
                <p className="font-semibold text-gray-900 mb-2">How live chat works</p>
                <ul className="list-disc pl-4 space-y-1">
                    <li>Messages sync in real-time between customer and admin.</li>
                    <li>Tap and hold on your own replies to edit or delete them.</li>
                    <li>Use the call or video icons to jump into WhatsApp if you need faster support.</li>
                </ul>
            </div>
        ), { duration: 6000 });
    }, []);
    
    const canSend = Boolean(draft.trim() && ((chatEnabled || !isCustomerView) && isLiveChannel || isAiChannel));

    useEffect(() => {
        if (!isOpen) return;
        const timeout = setTimeout(() => {
            if (isAiChannel) {
                aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            } else {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }, 80);
        return () => clearTimeout(timeout);
    }, [isOpen, messages.length, aiMessages.length, isAiChannel]);

    useEffect(() => {
        if (!showEmojiPicker) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiPicker]);

    useEffect(() => {
        if (!showConvoDropdown) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (convoDropdownRef.current && !convoDropdownRef.current.contains(event.target as Node)) {
                setShowConvoDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showConvoDropdown]);

    useEffect(() => {
        if (!editingMessageId) return;
        const targetExists = displayMessages.some((message) => message.id === editingMessageId);
        if (!targetExists) {
            setEditingMessageId(null);
            setEditingDraft('');
        }
    }, [displayMessages, editingMessageId]);

    const handleClearAiChat = useCallback(() => {
        setAiMessages([]);
    }, []);

    const handleAiSend = useCallback(async (text: string) => {
        if (!text.trim() || !tenantId || aiLoading) return;
        const userMsg: AiChatMessage = { role: 'user', text };
        setAiMessages(prev => [...prev, userMsg]);
        setAiLoading(true);
        setTimeout(() => { aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 10);

        try {
            // Sliding window: only send last N messages as history
            const history = aiMessages.slice(-AI_HISTORY_WINDOW).map(m => ({ role: m.role, text: m.text }));
            const res = await fetch(`${AI_API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, shopId: tenantId, history }),
            });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            const modelMsg: AiChatMessage = {
                role: 'model',
                text: data.reply || 'Sorry, no response received.',
                ...(data.image ? { image: data.image } : {}),
                ...(data.image_card ? { image_card: data.image_card } : {}),
                ...(data.checkout_action ? { checkout_action: data.checkout_action } : {}),
            };
            setAiMessages(prev => [...prev, modelMsg]);
        } catch (err) {
            console.error('[AI Chat] Error:', err);
            setAiMessages(prev => [...prev, { role: 'model', text: 'দুঃখিত, AI সার্ভিসে সমস্যা হচ্ছে। পরে আবার চেষ্টা করুন।' }]);
        } finally {
            setAiLoading(false);
            setTimeout(() => { aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 10);
        }
    }, [tenantId, aiMessages, aiLoading]);

    const handleSend = useCallback(() => {
        const text = draft.trim();
        if (!text) return;
        // AI channel
        if (isAiChannel) {
            setDraft('');
            handleAiSend(text);
            return;
        }
        if (!onSendMessage || (!chatEnabled && isCustomerView) || !isLiveChannel) return;
        // For admin view, pass the selected conversation as replyTarget
        if (!isCustomerView && selectedConversation !== 'all') {
            const selected = conversations.find(c => c.key === selectedConversation);
            if (selected) {
                onSendMessage(text, { customerEmail: selected.customerEmail, guestSessionId: selected.guestSessionId });
                setDraft('');
                setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 10);
                return;
            }
        }
        onSendMessage(text);
        setDraft('');
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 10);
    }, [draft, onSendMessage, chatEnabled, isCustomerView, isLiveChannel, isAiChannel, handleAiSend, selectedConversation, conversations]);

    const handleQuickReply = useCallback((message: string) => {
        if (!onSendMessage || (!chatEnabled && isCustomerView) || !isLiveChannel) return;
        if (!isCustomerView && selectedConversation !== 'all') {
            const selected = conversations.find(c => c.key === selectedConversation);
            if (selected) {
                onSendMessage(message, { customerEmail: selected.customerEmail, guestSessionId: selected.guestSessionId });
                setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 10);
                return;
            }
        }
        onSendMessage(message);
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 10);
    }, [onSendMessage, chatEnabled, isCustomerView, isLiveChannel, selectedConversation, conversations]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    const handleEmojiClick = (emoji: string) => {
        setDraft(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const startEditing = (message: ChatMessage) => {
        setEditingMessageId(message.id);
        setEditingDraft(message.text);
    };

    const cancelEditing = () => {
        setEditingMessageId(null);
        setEditingDraft('');
    };

    const saveEditing = () => {
        if (!editingMessageId || !onEditMessage) return;
        const trimmed = editingDraft.trim();
        if (!trimmed) return;
        onEditMessage(editingMessageId, trimmed);
        setEditingMessageId(null);
        setEditingDraft('');
    };

    const handleDelete = (id: string) => {
        onDeleteMessage?.(id);
        if (editingMessageId === id) {
            cancelEditing();
        }
    };

    if (!isOpen) return null;

    const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😡', '👍', '👎', '❤️', '💔', '🎉', '🎊', '✨', '⭐', '🔥', '💯', '😴', '😷', '🤝', '🤮', '🤢', '🤮', '😈', '👿', '💀', '☠️', '👫', '💥', '✅', '❌', '🙌', '🤝', '👏', '🎁', '🎈', '🎀', '🌈', '🌟', '💖', '💙', '💗', '💓', '💞', '🚀', '⚡', '🌺', '🌸', '🌼', '🍕', '🍔', '🍟', '🌮', '🍰', '🍪', '☕', '🍺', '🍻', '🥂', '🍾'];

    return (
        <div className={isCustomerView
            ? 'fixed z-[150] bottom-24 right-3 left-3 md:left-auto md:right-8 md:w-[380px] transition-all duration-300'
            : 'fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] px-0 sm:px-4 transition-all duration-300'}>
            <div
                className={`live-chat-shell bg-white w-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 ${isCustomerView ? 'rounded-[24px] h-[min(75vh,560px)] border border-sky-100' : 'sm:max-w-[380px] rounded-t-[28px] sm:rounded-[28px] h-[80vh] sm:h-[520px]'}`}
                style={chatShellStyle}
            >
                {/* Header - Crystal Blue gradient */}
                <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 60%, #0284C7 100%)' }}>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/30">
                                {chatInitial}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
                        </div>
                        <div>
                            <p className="text-white font-semibold text-[15px]">{chatContactName}</p>
                            <p className="text-white/80 text-xs">{statusLine}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {isAiChannel && aiMessages.length > 0 && (
                            <button
                                onClick={handleClearAiChat}
                                className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                                aria-label="Clear AI chat and start fresh conversation"
                                title="Start fresh conversation"
                            >
                                <RotateCcw size={18} strokeWidth={2.5} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                            aria-label="Close chat"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Admin conversation selector */}
                {!isCustomerView && conversations.length > 0 && (
                    <div className="relative px-3 py-2.5 bg-white border-b border-gray-100" ref={convoDropdownRef}>
                        {/* Trigger button */}
                        <button
                            type="button"
                            onClick={() => setShowConvoDropdown(v => !v)}
                            className="w-full flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 hover:bg-sky-50 hover:border-sky-200 transition-all duration-150 group"
                        >
                            {selectedConversation === 'all' ? (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-sm">
                                    <Users size={14} className="text-white" />
                                </div>
                            ) : (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                    {(conversations.find(c => c.key === selectedConversation)?.label || '?').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0 text-left">
                                <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
                                    {selectedConversation === 'all'
                                        ? 'All Conversations'
                                        : (conversations.find(c => c.key === selectedConversation)?.label || selectedConversation)}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate leading-tight">
                                    {selectedConversation === 'all'
                                        ? `${conversations.length} active thread${conversations.length !== 1 ? 's' : ''}`
                                        : (() => {
                                            const c = conversations.find(cv => cv.key === selectedConversation);
                                            return c?.customerEmail || (c?.guestSessionId ? `Guest ···${c.guestSessionId.slice(-6).toUpperCase()}` : '');
                                        })()}
                                </p>
                            </div>
                            {selectedConversation !== 'all' && (
                                <span className="flex-shrink-0 min-w-[20px] h-5 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center px-1.5">
                                    {conversations.find(c => c.key === selectedConversation)?.unreadCount ?? ''}
                                </span>
                            )}
                            <ChevronDown
                                size={14}
                                className={`flex-shrink-0 text-gray-400 group-hover:text-sky-500 transition-transform duration-200 ${showConvoDropdown ? 'rotate-180 text-sky-500' : ''}`}
                            />
                        </button>

                        {/* Dropdown panel */}
                        {showConvoDropdown && (
                            <div className="absolute left-3 right-3 z-50 mt-1.5 rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                {/* All conversations row */}
                                <button
                                    type="button"
                                    onClick={() => { setSelectedConversation('all'); setShowConvoDropdown(false); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-sky-50 transition-colors ${selectedConversation === 'all' ? 'bg-sky-50' : ''}`}
                                >
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-sm">
                                        <Users size={14} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-xs font-semibold text-gray-800">All Conversations</p>
                                        <p className="text-[10px] text-gray-400">{conversations.length} active thread{conversations.length !== 1 ? 's' : ''}</p>
                                    </div>
                                    {selectedConversation === 'all' && (
                                        <Check size={13} className="flex-shrink-0 text-sky-500" />
                                    )}
                                </button>

                                {/* Divider */}
                                <div className="mx-3 border-t border-gray-100" />

                                {/* Individual conversations */}
                                <div className="max-h-[200px] overflow-y-auto overscroll-contain">
                                    {conversations.map((c, idx) => {
                                        const isSelected = selectedConversation === c.key;
                                        const initial = c.label.charAt(0).toUpperCase();
                                        const avatarColors = [
                                            'from-violet-400 to-indigo-500',
                                            'from-rose-400 to-pink-500',
                                            'from-amber-400 to-orange-500',
                                            'from-emerald-400 to-teal-500',
                                            'from-cyan-400 to-sky-500',
                                        ];
                                        const avatarGradient = avatarColors[idx % avatarColors.length];
                                        const timeAgo = (() => {
                                            const diff = Date.now() - c.lastTimestamp;
                                            if (diff < 60_000) return 'just now';
                                            if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
                                            if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
                                            return `${Math.floor(diff / 86_400_000)}d ago`;
                                        })();
                                        return (
                                            <button
                                                key={c.key}
                                                type="button"
                                                onClick={() => { setSelectedConversation(c.key); setShowConvoDropdown(false); }}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-sky-50 transition-colors ${isSelected ? 'bg-sky-50' : ''}`}
                                            >
                                                <div className={`flex-shrink-0 relative w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                                                    {initial}
                                                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" />
                                                </div>
                                                <div className="flex-1 min-w-0 text-left">
                                                    <div className="flex items-center gap-1">
                                                        <p className={`text-xs font-semibold truncate ${isSelected ? 'text-sky-700' : 'text-gray-800'}`}>{c.label}</p>
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 truncate">
                                                        {c.customerEmail || (c.guestSessionId ? `Guest ···${c.guestSessionId.slice(-6).toUpperCase()}` : '')}
                                                    </p>
                                                </div>
                                                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                                                    <span className="text-[9px] text-gray-400">{timeAgo}</span>
                                                    <span className={`min-w-[18px] h-[18px] rounded-full text-[9px] font-bold flex items-center justify-center px-1 ${isSelected ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                        {c.unreadCount}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isCustomerView && (
                    <div className="px-4 py-3 bg-white border-b border-gray-100">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                                type="button"
                                onClick={() => handleCustomerChannelSelect('ai')}
                                className={`rounded-xl px-2 py-2 text-xs font-semibold transition flex items-center justify-center gap-1 ${customerChannel === 'ai' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                <Bot size={13} /> AI
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCustomerChannelSelect('live')}
                                className={`rounded-xl px-2 py-2 text-xs font-semibold transition ${customerChannel === 'live' ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Live Chat
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCustomerChannelSelect('whatsapp')}
                                className={`rounded-xl px-2 py-2 text-xs font-semibold transition ${customerChannel === 'whatsapp' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                WhatsApp
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCustomerChannelSelect('messenger')}
                                className={`rounded-xl px-2 py-2 text-xs font-semibold transition ${customerChannel === 'messenger' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Messenger
                            </button>
                        </div>
                        {!user && guestBadge && customerChannel !== 'ai' && (
                            <p className="mt-2 text-[11px] text-gray-500">Guest ID: <span className="font-semibold text-gray-700">{guestBadge}</span></p>
                        )}
                    </div>
                )}

                {!chatEnabled && isCustomerView && (
                    <div className="bg-amber-50 text-amber-700 text-sm px-5 py-3 border-b border-amber-100">
                        {websiteConfig?.chatOfflineMessage || 'Our agents are currently offline. Please try again later or use the fallback options below.'}
                    </div>
                )}

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto px-4 py-5 bg-gradient-to-b from-sky-50/40 to-white">
                    {isAiChannel ? (
                        <AiChatArea
                            aiMessages={aiMessages}
                            aiLoading={aiLoading}
                            aiMessagesEndRef={aiMessagesEndRef}
                            onAiSend={handleAiSend}
                        />
                    ) : isCustomerView && !isLiveChannel ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="w-full rounded-2xl border border-gray-200 bg-white p-5 text-center space-y-3 shadow-sm">
                                <p className="text-base font-semibold text-gray-900">
                                    {customerChannel === 'whatsapp' ? 'WhatsApp Support' : 'Messenger Support'}
                                </p>
                                <p className="text-sm text-gray-600">
                                    এই চ্যানেলে দ্রুত সহায়তা পেতে নিচের বাটনে ক্লিক করুন।
                                </p>
                                {customerChannel === 'whatsapp' && baseWhatsAppLink && (
                                    <a href={baseWhatsAppLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-white font-semibold" style={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' }}>
                                        <MessageCircle size={16} /> Open WhatsApp
                                    </a>
                                )}
                                {customerChannel === 'messenger' && messengerLink && (
                                    <a href={messengerLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-white font-semibold" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' }}>
                                        <MessageCircle size={16} /> Open Messenger
                                    </a>
                                )}
                                {customerChannel === 'whatsapp' && !baseWhatsAppLink && (
                                    <p className="text-xs text-amber-600">WhatsApp number is not configured yet.</p>
                                )}
                                {customerChannel === 'messenger' && !messengerLink && (
                                    <p className="text-xs text-amber-600">Messenger link is not configured yet.</p>
                                )}
                            </div>
                        </div>
                    ) : displayMessages.length === 0 ? (
                        /* Welcome Message */
                        <div className="space-y-4">
                            <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-5 max-w-[90%]">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl"></span>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-[15px] mb-1">স্বাগতম!</p>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            আমরা আপনাকে সাহায্য করতে এখানে আছি। কিছু জিজ্ঞাসা করুন!
                                        </p>
                                    </div>
                                </div>

                                {/* Quick Reply Buttons */}
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                                    {quickReplies.map((reply) => (
                                        <button
                                            key={reply.id}
                                            onClick={() => handleQuickReply(reply.message)}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-sky-200 bg-white text-sm font-medium text-sky-700 hover:bg-sky-50 hover:border-sky-400 transition-all duration-200 active:scale-95"
                                        >
                                            {reply.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {displayMessages.map((message) => {
                                const isCustomer = message.sender === 'customer';
                                const isOwnMessage = normalizedUserEmail
                                    ? message.authorEmail?.toLowerCase() === normalizedUserEmail
                                    : Boolean(guestSessionId && message.sender === 'customer' && message.guestSessionId === guestSessionId);
                                const isSuperAdminMessage = message.authorRole === 'super_admin';
                                const alignRight = isCustomerView ? isCustomer : isSuperAdminMessage;
                                const rawDisplayName = isOwnMessage ? 'You' : (message.authorName || (message.sender === 'admin' ? 'Support Team' : message.customerName || 'Customer'));
                                const displayName = !isCustomerView && isSuperAdminMessage ? 'Super Admin' : rawDisplayName;
                                const canEdit = Boolean(isOwnMessage && onEditMessage);
                                const canDelete = Boolean(onDeleteMessage && (isOwnMessage || (!isCustomerView && canDeleteAll)));
                                const isEditing = editingMessageId === message.id;
                                const showNameTag = !isCustomerView && (!isSuperAdminMessage || isCustomer);
                                const shouldShowAvatar = !alignRight;
                                const avatarInitial = (message.authorName || message.customerName || 'A').charAt(0).toUpperCase();

                                return (
                                    <div key={message.id} className={`flex ${alignRight ? 'justify-end' : 'justify-start'} gap-2`}>
                                        {shouldShowAvatar && (
                                            <div className="flex-shrink-0 pt-1">
                                                <div className="h-8 w-8 rounded-full text-white text-xs font-semibold flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)' }}>
                                                    {avatarInitial}
                                                </div>
                                            </div>
                                        )}
                                        <div className={`max-w-[75%] ${alignRight ? 'order-first' : ''}`}>
                                            {showNameTag && (
                                                <span className="text-[11px] font-medium text-gray-500 px-1 mb-1 block">
                                                    {displayName}
                                                </span>
                                            )}
                                            <div
                                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                                    alignRight
                                                        ? 'text-white rounded-br-md'
                                                        : 'bg-white border border-sky-100 text-gray-800 rounded-bl-md'
                                                }`}
                                                style={alignRight ? { background: 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 70%, #0284C7 100%)' } : {}}
                                            >
                                                {isEditing ? (
                                                    <div className="space-y-2">
                                                        <textarea
                                                            value={editingDraft}
                                                            onChange={(e) => setEditingDraft(e.target.value)}
                                                            className="w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-800 p-2 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                            rows={2}
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <button type="button" onClick={cancelEditing} className="text-xs font-semibold text-gray-500 hover:text-gray-700">Cancel</button>
                                                            <button type="button" onClick={saveEditing} className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"><Check size={14} /> Save</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="whitespace-pre-line break-words">{message.text}</p>
                                                )}
                                                {(canEdit || canDelete) && !isEditing && (
                                                    <div className={`mt-2 flex justify-end gap-2 text-xs ${alignRight ? 'text-white/70' : 'text-gray-400'}`}>
                                                        {canEdit && (
                                                            <button type="button" onClick={() => startEditing(message)} className={`hover:${alignRight ? 'text-white' : 'text-gray-600'}`} aria-label="Edit message">
                                                                <Edit2 size={13} />
                                                            </button>
                                                        )}
                                                        {canDelete && (
                                                            <button type="button" onClick={() => handleDelete(message.id)} className={`hover:${alignRight ? 'text-white' : 'text-gray-600'}`} aria-label="Delete message">
                                                                <Trash2 size={13} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`text-[10px] text-gray-400 mt-1 px-1 ${alignRight ? 'text-right' : 'text-left'}`}>
                                                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {message.editedAt ? ' • Edited' : ''}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                    {displayMessages.length === 0 && <div ref={messagesEndRef} />}
                </div>

                {/* Input Area */}
                <div className="px-4 pb-4 pt-3 bg-white border-t border-gray-100">
                    {isAiChannel ? (
                        <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2 border border-gray-200 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 transition-all duration-200">
                            <input
                                type="text"
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="AI সহকারীকে জিজ্ঞাসা করুন..."
                                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                                disabled={aiLoading}
                            />
                            <button
                                onClick={handleSend}
                                className="p-2.5 rounded-full transition-all duration-200 active:scale-95"
                                style={canSend && !aiLoading ? { background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 60%, #6D28D9 100%)', boxShadow: '0 4px 12px rgba(124,58,237,0.35)' } : { background: '#E5E7EB', color: '#9CA3AF', cursor: 'not-allowed' }}
                                aria-label="Send message"
                                disabled={!canSend || aiLoading}
                            >
                                {aiLoading
                                    ? <Loader2 size={18} className="animate-spin text-gray-400" />
                                    : <Send size={18} className={canSend ? 'text-white -rotate-45' : 'text-gray-400'} />}
                            </button>
                        </div>
                    ) : (isCustomerView && !isLiveChannel) ? (
                        <p className="text-xs text-gray-500 text-center">Live Chat সিলেক্ট করলে এখান থেকে মেসেজ পাঠাতে পারবেন।</p>
                    ) : chatEnabled || !isCustomerView ? (
                        <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2 border border-gray-200 focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-100 transition-all duration-200">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className={`p-1.5 rounded-full text-gray-400 hover:text-sky-500 hover:bg-sky-50 transition ${showEmojiPicker ? 'text-sky-500 bg-sky-50' : ''}`}
                                    aria-label="Add emoji"
                                >
                                    <Smile size={20} />
                                </button>
                                {showEmojiPicker && (
                                    <div ref={emojiPickerRef} className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-2xl shadow-2xl p-3 z-50 grid grid-cols-8 gap-1 w-72">
                                        {emojis.map((emoji, idx) => (
                                            <button key={`${emoji}-${idx}`} onClick={() => handleEmojiClick(emoji)} className="text-xl hover:bg-gray-100 p-1.5 rounded-lg transition hover:scale-110" title={emoji}>{emoji}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <input
                                type="text"
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={composerPlaceholder}
                                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                            />
                            <button
                                onClick={handleSend}
                                className="p-2.5 rounded-full transition-all duration-200 active:scale-95"
                                style={canSend ? { background: 'linear-gradient(135deg, #FB923C 0%, #F97316 60%, #EA580C 100%)', boxShadow: '0 4px 12px rgba(249,115,22,0.35)' } : { background: '#E5E7EB', color: '#9CA3AF', cursor: 'not-allowed' }}
                                aria-label="Send message"
                                disabled={!canSend}
                            >
                                <Send size={18} className={canSend ? 'text-white -rotate-45' : 'text-gray-400'} />
                            </button>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-600 space-y-3">
                            <p>Need urgent help? You can still reach us via the options below:</p>
                            {whatsappFallbackLink && (
                                <a href={whatsappFallbackLink} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-green-500 text-green-700 py-2 font-semibold">
                                    <MessageCircle size={16} /> Chat on WhatsApp
                                </a>
                            )}
                            <p className="text-xs text-gray-400">Leave your message and we will respond once we are online.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StoreChatModal;