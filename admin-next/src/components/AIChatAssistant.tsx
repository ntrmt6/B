import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Send, Sparkles, 
  Loader2, ChevronDown, Lightbulb, TrendingUp,
  ShoppingBag, Target, Maximize2, Minimize2,
  ThumbsUp, ThumbsDown, Plus, Trash2,
  FileText, Upload, AtSign, Slash, Grid,
  File, Paperclip, Command, Image as ImageIcon,
  Scan, Tag, Palette, Edit3, Wand2,
  Mic, MicOff, Volume2, VolumeX,
  Package, ClipboardList, BarChart3
} from 'lucide-react';
import { getAuthHeader } from '../services/authService';
import { getApiUrl } from '../utils/appHelpers';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// SN Intelligence Icon
const SNIntelligenceIcon = ({ className = "" }: { className?: string }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M10 12H22M10 17.3333H17.3333" stroke="url(#paint0_linear_sn)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M26 2L26.2947 2.79661C26.6813 3.84117 26.8745 4.36345 27.2555 4.74445C27.6366 5.12545 28.1589 5.31871 29.2034 5.70523L30 6L29.2034 6.29477C28.1589 6.68129 27.6366 6.87456 27.2555 7.25555C26.8745 7.63655 26.6813 8.15883 26.2947 9.20339L26 10L25.7053 9.20339C25.3187 8.15883 25.1255 7.63655 24.7445 7.25555C24.3634 6.87456 23.8411 6.68129 22.7966 6.29477L22 6L22.7966 5.70523C23.8411 5.31871 24.3634 5.12545 24.7445 4.74445C25.1255 4.36345 25.3187 3.84117 25.7053 2.79661L26 2Z" stroke="url(#paint1_linear_sn)" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M18.6257 4.02468C17.7677 4.00841 16.8912 4 16 4C14.0279 4 12.1269 4.0412 10.3416 4.11759C7.0876 4.2568 5.4606 4.32641 4.17343 5.62327C2.88625 6.92012 2.83043 8.50244 2.71879 11.6671C2.68461 12.6357 2.66667 13.6389 2.66667 14.6667C2.66667 15.6944 2.68461 16.6976 2.71879 17.6663C2.83043 20.8309 2.88625 22.4132 4.17343 23.71C5.4606 25.0069 7.08759 25.0765 10.3416 25.2157C10.4495 25.2204 10.5579 25.2248 10.6667 25.2292V28.3601C10.6667 28.8976 11.1024 29.3333 11.6399 29.3333C11.8723 29.3333 12.097 29.2501 12.2734 29.0989L15.1793 26.6071C15.91 25.9807 16.2752 25.6675 16.7093 25.5021C17.1435 25.3368 17.6376 25.3273 18.6257 25.3087C19.6664 25.2889 20.6797 25.2576 21.6583 25.2157C24.9124 25.0765 26.5395 25.0069 27.8265 23.7101C29.1137 22.4132 29.1696 20.8309 29.2812 17.6663C29.3153 16.6976 29.3333 15.6944 29.3333 14.6667C29.3333 13.9884 29.3255 13.3207 29.3104 12.6667" stroke="url(#paint2_linear_sn)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="paint0_linear_sn" x1="10" y1="14.6667" x2="22" y2="14.6667" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8"/>
        <stop offset="1" stopColor="#1E90FF"/>
      </linearGradient>
      <linearGradient id="paint1_linear_sn" x1="26" y1="2" x2="26" y2="10" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF6A00"/>
        <stop offset="1" stopColor="#FF9F1C"/>
      </linearGradient>
      <linearGradient id="paint2_linear_sn" x1="2.66667" y1="16.6667" x2="29.3333" y2="16.6667" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8"/>
        <stop offset="1" stopColor="#1E90FF"/>
      </linearGradient>
    </defs>
  </svg>
);

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  topics?: string[];
  feedback?: 'up' | 'down' | null;
  attachments?: { name: string; type: string; url?: string; }[];
  imagePreview?: string;
  imageOptions?: boolean;
  chartData?: ChartData;
  navigation?: { section: string; action: string };
  toolAction?: { type: string; url: string; label: string; sectionId?: string };
}

interface ChartData {
  stockStatus?: Array<{ name: string; value: number; percentage: number }>;
  categoryDistribution?: Array<{ category: string; products: number; stock: number; value: number }>;
  topProducts?: Array<{ name: string; stock: number; value: number }>;
  statusDistribution?: Array<{ name: string; value: number }>;
  revenueBreakdown?: Array<{ status: string; revenue: number }>;
}

interface AIChatAssistantProps {
  tenantId?: string;
  shopName?: string;
  onNavigate?: (section: string) => void;
}

interface InputAction {
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  onClick: () => void;
}

interface ImageAnalysis {
  file: File;
  preview: string;
  analyzing: boolean;
}

const SUGGESTED_QUESTIONS = [
  { icon: Package, text: "Show me my inventory report", category: "inventory" },
  { icon: ClipboardList, text: "What are my recent orders?", category: "orders" },
  { icon: TrendingUp, text: "Analyze my store performance for the last 7 days", category: "analytics" },
  { icon: Wand2, text: "Create a hero section for my landing page", category: "builder" },
];

const SKILLS = [
  { id: 'analyze', name: 'Analyze Sales', description: 'Get insights on your sales data' },
  { id: 'report', name: 'Generate Report', description: 'Create a business report' },
  { id: 'suggest', name: 'Product Suggestions', description: 'Get product recommendations' },
  { id: 'optimize', name: 'Optimize Pricing', description: 'Price optimization tips' },
];

const IMAGE_OPTIONS = [
  { id: 'analyze', icon: Scan, label: 'Analyze this image', description: 'Get SN AI insights about the image' },
  { id: 'product', icon: Tag, label: 'Create product listing', description: 'Generate product details from image' },
  { id: 'enhance', icon: Wand2, label: 'Suggest improvements', description: 'Get tips to improve the image' },
  { id: 'describe', icon: Edit3, label: 'Generate description', description: 'Create a description for this image' },
  { id: 'colors', icon: Palette, label: 'Extract colors', description: 'Get color palette from image' },
];

const formatMessage = (content: string) => {
  const lines = content.split('\n');
  
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={idx} className="h-2" />;
    
    if (trimmed.match(/^\d+\.\s/)) {
      const text = trimmed.replace(/^\d+\.\s/, '');
      return (
        <p key={idx} className="text-gray-700 text-[15px] leading-relaxed mb-2">
          {trimmed.charAt(0)}. {text.replace(/\*\*([^*]+)\*\*/g, '$1')}
        </p>
      );
    }
    
    if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      const text = trimmed.replace(/^[•-]\s*/, '');
      return (
        <p key={idx} className="text-gray-700 text-[15px] leading-relaxed mb-1.5 ml-2">
          • {text.replace(/\*\*([^*]+)\*\*/g, '$1')}
        </p>
      );
    }
    
    if (trimmed.match(/^\*\*[^*]+\*\*$/)) {
      return (
        <p key={idx} className="font-semibold text-gray-900 text-[15px] mt-3 mb-2 first:mt-0">
          {trimmed.replace(/\*\*/g, '')}
        </p>
      );
    }
    
    return (
      <p key={idx} className="text-gray-700 text-[15px] leading-relaxed mb-2">
        {trimmed.replace(/\*\*([^*]+)\*\*/g, '$1')}
      </p>
    );
  });
};

const extractTopics = (content: string): string[] => {
  const topics: string[] = [];
  const lower = content.toLowerCase();
  if (lower.includes('sales') || lower.includes('revenue')) topics.push('Sales');
  if (lower.includes('marketing') || lower.includes('advertis')) topics.push('Marketing');
  if (lower.includes('product') || lower.includes('listing')) topics.push('Products');
  if (lower.includes('customer')) topics.push('Customers');
  if (lower.includes('price') || lower.includes('pricing')) topics.push('Pricing');
  if (lower.includes('image') || lower.includes('photo')) topics.push('Images');
  if (topics.length === 0) topics.push('Overview');
  return topics.slice(0, 2);
};

// Chart colors
const CHART_COLORS = ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#10b981'];

// Render chart based on data type
const renderChart = (chartData: ChartData) => {
  if (!chartData) return null;

  // Stock status pie chart
  if (chartData.stockStatus) {
    return (
      <div className="mt-4 bg-white p-4 rounded-xl border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <BarChart3 size={16} className="text-violet-600" />
          Stock Status Distribution
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData.stockStatus}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
              label={(entry) => `${entry.name}: ${entry.value}`}
            >
              {chartData.stockStatus.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Category distribution bar chart
  if (chartData.categoryDistribution) {
    return (
      <div className="mt-4 bg-white p-4 rounded-xl border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <BarChart3 size={16} className="text-violet-600" />
          Category Distribution
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData.categoryDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Bar dataKey="value" fill="#8b5cf6" name="Value (৳)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Top products bar chart
  if (chartData.topProducts) {
    return (
      <div className="mt-4 bg-white p-4 rounded-xl border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <BarChart3 size={16} className="text-violet-600" />
          Top Products by Value
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData.topProducts}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={10} angle={-45} textAnchor="end" height={80} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Bar dataKey="value" fill="#14b8a6" name="Value (৳)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Order status distribution
  if (chartData.statusDistribution) {
    return (
      <div className="mt-4 bg-white p-4 rounded-xl border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <BarChart3 size={16} className="text-violet-600" />
          Order Status Distribution
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData.statusDistribution}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
              label={(entry) => `${entry.name}: ${entry.value}`}
            >
              {chartData.statusDistribution.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
};

export const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ tenantId, shopName, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showSkillsMenu, setShowSkillsMenu] = useState(false);
  const [showMentionsMenu, setShowMentionsMenu] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const chatTitle = messages.find(m => m.role === 'user')?.content.slice(0, 20) || 'SN Assistant';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  // Initialize Speech Recognition and Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'bn-BD';
        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results).map((result: any) => result[0].transcript).join('');
          setInputValue(transcript);
        };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) { alert('Speech recognition not supported. Use Chrome or Edge.'); return; }
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { try { recognitionRef.current.start(); setIsListening(true); } catch (e) { console.error(e); } }
  };

  const speakMessage = (messageId: string, text: string) => {
    const synth = window.speechSynthesis;
    if (!synth) { console.error('No speech synthesis'); return; }
    
    if (speakingMessageId === messageId) {
      synth.cancel();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      return;
    }
    synth.cancel();
    
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/^[•-]\s*/gm, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const hasBangla = /[\u0980-\u09FF]/.test(cleanText);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = hasBangla ? 'bn-BD' : 'en-US';
    utterance.rate = 0.85;
    utterance.pitch = 0.95;
    utterance.volume = 1.0;
    
    const voices = synth.getVoices();
    if (voices.length > 0) {
      let voice = voices.find(v => v.lang.includes('en')) || voices[0];
      if (hasBangla) {
        voice = voices.find(v => v.lang.includes('bn')) || voices.find(v => v.lang.includes('hi')) || voices[0];
      }
      if (voice) utterance.voice = voice;
    }
    
    utterance.onstart = () => { setIsSpeaking(true); setSpeakingMessageId(messageId); };
    utterance.onend = () => { setIsSpeaking(false); setSpeakingMessageId(null); };
    utterance.onerror = (e) => { console.error('Speech error', e); setIsSpeaking(false); setSpeakingMessageId(null); };
    
    synth.speak(utterance);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === '/' && document.activeElement === inputRef.current && inputValue === '') {
        e.preventDefault();
        setShowSkillsMenu(true);
      }
      if (e.key === '@' && document.activeElement === inputRef.current) {
        setShowMentionsMenu(true);
      }
      if (e.key === 'Escape') {
        setShowActionsMenu(false);
        setShowSkillsMenu(false);
        setShowMentionsMenu(false);
        setImageAnalysis(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, inputValue]);

  const handleFeedback = (messageId: string, feedback: 'up' | 'down') => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, feedback: m.feedback === feedback ? null : feedback } : m
    ));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
    setShowActionsMenu(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageAnalysis({
          file,
          preview: event.target?.result as string,
          analyzing: false
        });
      };
      reader.readAsDataURL(file);
    }
    setShowActionsMenu(false);
    if (e.target) e.target.value = '';
  };

  const handleImageOption = async (optionId: string) => {
    if (!imageAnalysis) return;
    
    const option = IMAGE_OPTIONS.find(o => o.id === optionId);
    if (!option) return;

    const imageBase64 = imageAnalysis.preview;

    // Add user message with image
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: option.label,
      timestamp: new Date(),
      imagePreview: imageAnalysis.preview,
      attachments: [{ name: imageAnalysis.file.name, type: imageAnalysis.file.type, url: imageAnalysis.preview }]
    };
    
    setMessages(prev => [...prev, userMessage]);
    setImageAnalysis(null);
    setIsLoading(true);

    try {
      // Map frontend option IDs to backend action names
      const actionMap: Record<string, string> = {
        'analyze': 'analyze',
        'product': 'product',
        'enhance': 'enhance',
        'describe': 'description',
        'colors': 'colors'
      };

      const response = await fetch(`${getApiUrl()}/ai-assistant/analyze-image`, {
        method: 'POST',
        headers: { 
          ...getAuthHeader(), 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          image: imageBase64,
          action: actionMap[optionId] || 'analyze',
          tenantId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "I couldn't analyze this image. Please try again.",
        timestamp: new Date(),
        topics: ['Images', option.label.split(' ')[0]],
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Image analysis error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I couldn't analyze this image right now. Please check your connection and try again.",
        timestamp: new Date(),
        topics: ['Error'],
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSkillSelect = (skill: typeof SKILLS[0]) => {
    setInputValue(`/${skill.id} `);
    setShowSkillsMenu(false);
    inputRef.current?.focus();
  };

  const handleMentionSelect = (mention: string) => {
    setInputValue(prev => prev + `@${mention} `);
    setShowMentionsMenu(false);
    inputRef.current?.focus();
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() && attachedFiles.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      attachments: attachedFiles.map(f => ({ name: f.name, type: f.type })),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      const response = await fetch(`${getApiUrl()}/ai-assistant/chat`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          tenantId,
          shopName,
          conversationHistory: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          attachments: attachedFiles.map(f => f.name),
        }),
      });

      if (!response.ok) throw new Error('Failed');

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "Sorry, I couldn't process that.",
        timestamp: new Date(),
        topics: data.analysis?.topics?.map((t: string) => t.charAt(0).toUpperCase() + t.slice(1)) || extractTopics(data.response || ''),
        chartData: data.chartData,
        navigation: data.navigation,
        toolAction: data.toolAction,
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Handle navigation if present
      if (data.navigation && data.navigation.section && onNavigate) {
        // Delay navigation slightly so user can see the message
        setTimeout(() => {
          onNavigate(data.navigation.section);
        }, 1500);
      }
    } catch {
      const fallback: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getFallbackResponse(content),
        timestamp: new Date(),
        topics: extractTopics(content),
      };
      setMessages(prev => [...prev, fallback]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const clearChat = () => {
    setMessages([]);
    setShowDropdown(false);
    setImageAnalysis(null);
  };

  const inputActions: InputAction[] = [
    { icon: ImageIcon, label: 'Upload image', onClick: () => imageInputRef.current?.click() },
    { icon: FileText, label: 'Upload file', onClick: () => fileInputRef.current?.click() },
    { icon: Target, label: 'Target', onClick: () => { setInputValue(prev => prev + '[Target: specific goal] '); setShowActionsMenu(false); inputRef.current?.focus(); } },
    { icon: AtSign, label: 'Mention', shortcut: '@', onClick: () => { setShowMentionsMenu(true); setShowActionsMenu(false); } },
    { icon: Slash, label: 'Skills', shortcut: '/', onClick: () => { setShowSkillsMenu(true); setShowActionsMenu(false); } },
    { icon: Grid, label: 'Generate app', onClick: () => { setInputValue('/generate-app '); setShowActionsMenu(false); inputRef.current?.focus(); } },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_40px_rgba(56,189,248,0.25)] transition-all flex items-center justify-center z-50 hover:scale-105 hover:bg-white/30"
      >
        <SNIntelligenceIcon className="w-8 h-8 sm:w-9 sm:h-9" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse ring-2 ring-white/50" />
      </button>
    );
  }

  return (
    <div className={`fixed z-50 transition-all duration-300 ${isExpanded ? 'inset-0' : 'inset-0 sm:inset-auto sm:right-4 sm:bottom-4 md:right-6 md:bottom-6 sm:w-[400px] md:w-[440px]'}`}>
      <div className={`bg-white flex flex-col ${isExpanded ? 'h-full' : 'h-full sm:h-[620px] sm:max-h-[85vh] sm:rounded-2xl sm:shadow-2xl sm:border sm:border-gray-200'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white sm:rounded-t-2xl">
          <div className="relative">
            <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors">
              <Sparkles size={18} className="text-violet-600" />
              <span className="font-semibold text-gray-900">{messages.length > 0 ? chatTitle + '...' : 'SN Assistant'}</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-1 min-w-[180px] z-10">
                <button onClick={clearChat} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <Plus size={14} /> New conversation
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={clearChat} className="p-2 hover:bg-gray-100 rounded-lg" title="Clear"><Trash2 size={16} className="text-gray-500" /></button>
            <button onClick={() => setIsExpanded(!isExpanded)} className="hidden sm:flex p-2 hover:bg-gray-100 rounded-lg">
              {isExpanded ? <Minimize2 size={16} className="text-gray-500" /> : <Maximize2 size={16} className="text-gray-500" />}
            </button>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={16} className="text-gray-500" /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-white">
          {messages.length === 0 && !imageAnalysis ? (
            <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6">
              <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
                <SNIntelligenceIcon className="w-10 h-10" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-1">Hi there! 👋</h3>
              <p className="text-gray-500 text-sm text-center mb-6 max-w-[280px]">
                I'm your SN business assistant. How can I help you grow your shop today?
              </p>
              <div className="w-full max-w-sm space-y-2">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button key={idx} onClick={() => sendMessage(q.text)} className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-violet-50 transition-all text-left group border border-transparent hover:border-violet-200">
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:bg-violet-100">
                      <q.icon size={18} className="text-violet-600" />
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-violet-700">{q.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id}>
                  {message.role === 'user' ? (
                    <div className="flex flex-col items-end mb-3">
                      {message.imagePreview && (
                        <div className="mb-2 rounded-xl overflow-hidden max-w-[200px] border border-gray-200">
                          <img src={message.imagePreview} alt="Uploaded" className="w-full h-auto" />
                        </div>
                      )}
                      <div className="bg-violet-600 text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[85%]">
                        <p className="text-[15px]">{message.content}</p>
                      </div>
                      {message.attachments && message.attachments.length > 0 && !message.imagePreview && (
                        <div className="flex gap-1 mt-1">
                          {message.attachments.map((att, i) => (
                            <span key={i} className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full flex items-center gap-1">
                              <Paperclip size={10} /> {att.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-2xl p-4 mb-2">
                      <div className="prose prose-sm max-w-none">{formatMessage(message.content)}</div>
                      {message.chartData && renderChart(message.chartData)}
                      {message.navigation && (
                        <div className="mt-3 p-3 bg-violet-50 border border-violet-200 rounded-lg">
                          <p className="text-sm text-violet-700 flex items-center gap-2">
                            <Sparkles size={14} />
                            {message.navigation.action}
                          </p>
                        </div>
                      )}
                      {message.toolAction && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800 font-medium flex items-center gap-2 mb-2">
                            <Sparkles size={14} />
                            ✅ Landing page section created successfully!
                          </p>
                          <a
                            href={message.toolAction.url}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            {message.toolAction.label}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                        <div className="flex gap-2 flex-wrap">
                          {message.topics?.map((topic, i) => (
                            <span key={i} className="px-2.5 py-1 bg-white text-gray-600 text-xs font-medium rounded-full border border-gray-200">{topic}</span>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleFeedback(message.id, 'up')} className={`p-1.5 rounded-lg transition-colors ${message.feedback === 'up' ? 'bg-green-100 text-green-600' : 'hover:bg-gray-200 text-gray-400'}`}>
                            <ThumbsUp size={14} />
                          </button>
                          <button onClick={() => handleFeedback(message.id, 'down')} className={`p-1.5 rounded-lg transition-colors ${message.feedback === 'down' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-200 text-gray-400'}`}>
                            <ThumbsDown size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-center gap-2 text-gray-400 p-4">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Analyzing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Image Analysis Modal */}
        {imageAnalysis && (
          <div className="absolute inset-0 bg-white z-20 flex flex-col sm:rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className="text-violet-600" />
                <span className="font-semibold text-gray-900">Image Uploaded</span>
              </div>
              <button onClick={() => setImageAnalysis(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex justify-center mb-4">
                <div className="rounded-xl overflow-hidden border border-gray-200 max-w-[250px] shadow-sm">
                  <img src={imageAnalysis.preview} alt="Preview" className="w-full h-auto" />
                </div>
              </div>
              
              <p className="text-center text-gray-600 text-sm mb-4">
                What would you like to do with this image?
              </p>
              
              <div className="space-y-2">
                {IMAGE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleImageOption(option.id)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-violet-50 transition-all text-left group border border-transparent hover:border-violet-200"
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:bg-violet-100">
                      <option.icon size={18} className="text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 group-hover:text-violet-700">{option.label}</p>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Attached Files Preview */}
        {attachedFiles.length > 0 && (
          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-2">
            {attachedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-gray-200 text-sm">
                <File size={14} className="text-violet-600" />
                <span className="text-gray-700 max-w-[100px] truncate">{file.name}</span>
                <button onClick={() => removeAttachment(idx)} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-100 bg-white p-3 sm:rounded-b-2xl relative">
          {showActionsMenu && (
            <div className="absolute bottom-full left-3 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[200px] z-20">
              {inputActions.map((action, idx) => (
                <button key={idx} onClick={action.onClick} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <action.icon size={16} className="text-gray-500" />
                    <span>{action.label}</span>
                  </div>
                  {action.shortcut && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{action.shortcut}</span>}
                </button>
              ))}
            </div>
          )}

          {showSkillsMenu && (
            <div className="absolute bottom-full left-3 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[220px] z-20">
              <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase">Skills</div>
              {SKILLS.map((skill) => (
                <button key={skill.id} onClick={() => handleSkillSelect(skill)} className="w-full px-3 py-2 text-left hover:bg-gray-50 flex flex-col">
                  <span className="text-sm font-medium text-gray-800">/{skill.id}</span>
                  <span className="text-xs text-gray-500">{skill.description}</span>
                </button>
              ))}
            </div>
          )}

          {showMentionsMenu && (
            <div className="absolute bottom-full left-3 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[180px] z-20">
              <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase">Mention</div>
              {['Sales Data', 'Products', 'Customers', 'Orders', 'Analytics'].map((item) => (
                <button key={item} onClick={() => handleMentionSelect(item)} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <AtSign size={14} className="text-violet-600" />
                  <span>{item}</span>
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple accept=".pdf,.doc,.docx,.txt,.csv,.xlsx" />
            <input type="file" ref={imageInputRef} onChange={handleImageSelect} className="hidden" accept="image/*" />
            
            <button type="button" onClick={() => { setShowActionsMenu(!showActionsMenu); setShowSkillsMenu(false); setShowMentionsMenu(false); }}
              className={`p-2.5 rounded-full transition-colors ${showActionsMenu ? 'bg-violet-100 text-violet-600' : 'hover:bg-gray-100 text-gray-500'}`}>
              <Plus size={18} />
            </button>
            
            <input ref={inputRef} type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
              placeholder={isListening ? "🎤 Listening..." : "Ask anything..."} 
              className={`flex-1 px-4 py-3 rounded-full text-sm focus:outline-none focus:ring-2 transition-all ${isListening ? 'bg-red-50 ring-red-400' : 'bg-gray-100 focus:ring-violet-500 focus:bg-white'}`} 
              disabled={isLoading} />
            
            <button type="button" onClick={toggleListening}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              title={isListening ? "Stop" : "Voice input"}>
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            
            <button type="button" onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${voiceEnabled ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
              title={voiceEnabled ? "Voice ON" : "Voice OFF"}>
              {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            
            <button type="submit" disabled={(!inputValue.trim() && attachedFiles.length === 0) || isLoading}
              className="w-11 h-11 bg-violet-600 text-white rounded-full flex items-center justify-center hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              <Send size={18} />
            </button>
          </form>
          
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
            <button onClick={() => imageInputRef.current?.click()} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title="Upload image">
              <ImageIcon size={16} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title="Attach file">
              <Paperclip size={16} />
            </button>
            <button onClick={() => setShowMentionsMenu(true)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title="Mention (@)">
              <AtSign size={16} />
            </button>
            <button onClick={() => setShowSkillsMenu(true)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title="Skills (/)">
              <Command size={16} />
            </button>
            <button onClick={() => { setInputValue('/generate-app '); inputRef.current?.focus(); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title="Generate app">
              <Grid size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {(showDropdown || showActionsMenu || showSkillsMenu || showMentionsMenu) && (
        <div className="fixed inset-0 z-[-1]" onClick={() => { setShowDropdown(false); setShowActionsMenu(false); setShowSkillsMenu(false); setShowMentionsMenu(false); }} />
      )}
    </div>
  );
};

function getFallbackResponse(question: string): string {
  const q = question.toLowerCase();
  
  if (q.startsWith('/analyze')) return `**Sales Analysis**\n\nBased on your request, here's a quick analysis:\n\n1. Review your top-performing products\n2. Identify seasonal trends in your data\n3. Compare month-over-month growth\n\nWould you like me to dive deeper into any specific metric?`;
  if (q.startsWith('/report')) return `**Report Generated**\n\nI've prepared an overview for you:\n\n1. Current performance metrics\n2. Key areas for improvement\n3. Recommended actions\n\nWhat specific details would you like in the report?`;
  if (q.startsWith('/generate-app')) return `**App Generation**\n\nI can help you create:\n\n1. A custom landing page for promotions\n2. A product showcase page\n3. A customer feedback form\n\nWhat type of app would you like to generate?`;
  if (q.includes('sales') || q.includes('increase') || q.includes('grow')) return `Here are some growth strategies for your business:\n\n1. Build partnerships with complementary businesses.\n\n2. Build a strong brand that resonates with your audience.\n\n3. Invest in automation to scale operations efficiently.\n\nWant me to dive deeper into any of these growth strategies?`;
  if (q.includes('product') || q.includes('listing')) return `To improve your product listings:\n\n1. Use high-quality images from multiple angles.\n\n2. Write compelling descriptions highlighting benefits.\n\n3. Include customer reviews and ratings.\n\nWould you like specific tips for any of these areas?`;
  if (q.includes('customer') || q.includes('attract')) return `Strategies to attract more customers:\n\n1. Run targeted social media ads.\n\n2. Offer referral incentives.\n\n3. Provide excellent customer service.\n\nWant me to elaborate on any strategy?`;
  
  return `Here are some tips for your business:\n\n1. Focus on customer satisfaction for repeat business.\n\n2. Use social media to increase visibility.\n\n3. Monitor competitors and stay competitive.\n\nWhat specific area would you like help with?`;
}

export default AIChatAssistant;
