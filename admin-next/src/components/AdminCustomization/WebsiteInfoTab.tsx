import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  RefreshCw,
  Save,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { WebsiteConfig, SocialLink, FooterLink, FooterLinkField } from './types';
import { SOCIAL_PLATFORM_OPTIONS, FOOTER_LINK_SECTIONS } from './constants';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import { convertFileToWebP } from '../../services/imageUtils';
import toast from 'react-hot-toast';

interface WebsiteInfoTabProps {
  websiteConfiguration: WebsiteConfig;
  setWebsiteConfiguration: React.Dispatch<React.SetStateAction<WebsiteConfig>>;
  logo: string | null;
  onUpdateLogo: (logo: string | null) => void;
  tenantId: string;
  onSave?: (config: WebsiteConfig) => Promise<void>;
}

// Figma-styled Logo Upload Card
const LogoUploadCard: React.FC<{
  title: string;
  imageUrl: string | null;
  onSelect: () => void;
  onRemove: () => void;
}> = ({ title, imageUrl, onSelect, onRemove }) => (
  <div
    style={{
      width: '270px',
      height: '154px',
      border: '1px dashed #bababa',
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative',
    }}
  >
    {/* Title */}
    <p
      style={{
        position: 'absolute',
        top: '11px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: '"Poppins", sans-serif',
        fontWeight: 500,
        fontSize: '12px',
        color: 'black',
        whiteSpace: 'nowrap',
      }}
    >
      {title}
    </p>

    {/* Image Preview */}
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, calc(-50% - 14px))',
        width: '246px',
        height: '68px',
        backgroundColor: 'white',
        borderRadius: '4px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {imageUrl ? (
        <img
          src={normalizeImageUrl(imageUrl)}
          alt=""
          style={{ maxWidth: '204px', maxHeight: '57px', objectFit: 'contain' }}
        />
      ) : (
        <p style={{ color: '#a2a2a2', fontSize: '12px', fontFamily: '"Poppins", sans-serif' }}>
          No image
        </p>
      )}
    </div>

    {/* Select Image Button */}
    <button
      onClick={onSelect}
      style={{
        position: 'absolute',
        bottom: '17px',
        left: '50%',
        transform: 'translateX(calc(-50% - 22.5px))',
        width: '201px',
        height: '32px',
        background: 'linear-gradient(90deg, rgba(56,189,248,0.06) 0%, rgba(30,144,255,0.06) 100%)',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontFamily: '"Poppins", sans-serif',
        fontWeight: 500,
        fontSize: '12px',
      }}
    >
      <span
        style={{
          background: 'linear-gradient(90deg, #38bdf8 0%, #1e90ff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Select Image
      </span>
    </button>

    {/* Delete Button */}
    {imageUrl && (
      <button
        onClick={onRemove}
        style={{
          position: 'absolute',
          bottom: '17px',
          right: '12px',
          width: '32px',
          height: '32px',
          backgroundColor: 'rgba(218,0,0,0.1)',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Trash2 size={20} color="#da0000" />
      </button>
    )}
  </div>
);

// Figma-styled Input Field
const FigmaInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  flex?: boolean;
}> = ({ label, value, onChange, placeholder, type = 'text', flex = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', ...(flex ? { flex: 1, minWidth: 0 } : {}) }}>
    <p
      style={{
        fontFamily: '"Lato", sans-serif',
        fontWeight: 700,
        fontSize: '15px',
        color: 'black',
        margin: 0,
      }}
    >
      {label}
    </p>
    <div
      style={{
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        padding: '10px 12px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          border: 'none',
          background: 'transparent',
          outline: 'none',
          width: '100%',
          fontFamily: '"Poppins", sans-serif',
          fontSize: '16px',
          color: value ? 'black' : '#a2a2a2',
        }}
      />
    </div>
  </div>
);

// Figma-styled Select Field
const FigmaSelect: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  width?: string;
}> = ({ label, value, onChange, options, width }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: width || 'auto' }}>
    <p
      style={{
        fontFamily: '"Lato", sans-serif',
        fontWeight: 700,
        fontSize: '15px',
        color: 'black',
        margin: 0,
      }}
    >
      {label}
    </p>
    <div
      style={{
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        padding: '10px 12px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
      }}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: 'none',
          background: 'transparent',
          outline: 'none',
          width: '100%',
          fontFamily: '"Poppins", sans-serif',
          fontSize: '16px',
          color: 'black',
          cursor: 'pointer',
          appearance: 'none',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown size={24} color="#666" />
    </div>
  </div>
);

// Figma-styled Section Header
const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <p
    style={{
      fontFamily: '"Lato", sans-serif',
      fontWeight: 700,
      fontSize: '22px',
      color: 'black',
      letterSpacing: '0.11px',
      margin: 0,
    }}
  >
    {title}
  </p>
);

// Fully Functional Rich Text Editor with all formatting options
const RichTextEditor: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (editorRef.current && value && !isInitialized) {
      editorRef.current.innerHTML = value;
      setIsInitialized(true);
    }
  }, [value, isInitialized]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCmd = useCallback((command: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleInput();
  }, [handleInput]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertImage', false, imageUrl);
        handleInput();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [handleInput]);

  const handleLink = useCallback(() => {
    const url = prompt('Enter URL:');
    if (url) {
      execCmd('createLink', url);
    }
  }, [execCmd]);

  const toolBtnStyle: React.CSSProperties = {
    padding: '6px 10px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontFamily: '"Lato", sans-serif',
    fontSize: '13px',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '32px',
    height: '32px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      <SectionHeader title={label} />
      <div
        style={{
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          padding: '10px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
          border: '1px solid #e5e7eb',
        }}
      >
        <select
          onChange={(e) => { if (e.target.value) { execCmd('formatBlock', e.target.value); e.target.value = ''; } }}
          style={{ ...toolBtnStyle, width: '90px', padding: '0 8px' }}
        >
          <option value="">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="p">Paragraph</option>
        </select>
        <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db' }} />
        <button type="button" style={toolBtnStyle} onClick={() => execCmd('bold')} title="Bold"><strong>B</strong></button>
        <button type="button" style={toolBtnStyle} onClick={() => execCmd('italic')} title="Italic"><em>I</em></button>
        <button type="button" style={toolBtnStyle} onClick={() => execCmd('underline')} title="Underline"><span style={{ textDecoration: 'underline' }}>U</span></button>
        <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db' }} />
        <button type="button" style={toolBtnStyle} onClick={handleLink} title="Insert Link">🔗</button>
        <button type="button" style={toolBtnStyle} onClick={() => fileInputRef.current?.click()} title="Insert Image">🖼️</button>
        <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db' }} />
        <button type="button" style={toolBtnStyle} onClick={() => execCmd('insertUnorderedList')} title="Bullet List">•</button>
        <button type="button" style={toolBtnStyle} onClick={() => execCmd('insertOrderedList')} title="Numbered List">1.</button>
        <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db' }} />
        <button type="button" style={toolBtnStyle} onClick={() => execCmd('justifyLeft')} title="Align Left">⬅</button>
        <button type="button" style={toolBtnStyle} onClick={() => execCmd('justifyCenter')} title="Align Center">⬌</button>
        <button type="button" style={toolBtnStyle} onClick={() => execCmd('justifyRight')} title="Align Right">➡</button>
        <button type="button" style={toolBtnStyle} onClick={() => execCmd('justifyFull')} title="Justify">☰</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          minHeight: '175px',
          padding: '13px',
          fontFamily: '"Lato", sans-serif',
          fontSize: '14px',
          color: 'black',
          border: '1px solid #e5e7eb',
          outline: 'none',
          overflow: 'auto',
        }}
      />
      <style>{`
        div[data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #a2a2a2;
          pointer-events: none;
        }
      `}</style>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
};

// Figma-styled Checkbox
const FigmaCheckbox: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <div
    style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}
    onClick={() => onChange(!checked)}
  >
    <div
      style={{
        width: '26px',
        height: '26px',
        border: '1.5px solid rgba(12,32,52,0.77)',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: checked ? '#38bdf8' : 'transparent',
      }}
    >
      {checked && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8L6.5 11.5L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
    <p
      style={{
        fontFamily: '"Poppins", sans-serif',
        fontSize: '12px',
        color: '#1d1a1a',
        margin: 0,
      }}
    >
      {label}
    </p>
  </div>
);

// Footer Link Card
const FooterLinkCard: React.FC<{
  title: string;
  description: string;
  links: FooterLink[];
  onAddLink: () => void;
  onRemoveLink: (index: number) => void;
  onUpdateLink: (index: number, key: keyof FooterLink, value: string) => void;
}> = ({ title, description, links, onAddLink, onRemoveLink, onUpdateLink }) => (
  <div
    style={{
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      padding: '12px',
      height: '74px',
      position: 'relative',
      width: '536px',
    }}
  >
    <p style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 500, fontSize: '12px', color: 'black', margin: 0 }}>
      {title}
    </p>
    <p style={{ fontFamily: '"Poppins", sans-serif', fontSize: '8px', color: '#b9b9b9', marginTop: '6px' }}>
      {description}
    </p>
    <p style={{ fontFamily: '"Poppins", sans-serif', fontSize: '8px', color: '#b9b9b9', marginTop: '6px' }}>
      {links.length === 0 ? 'No links yet.' : `${links.length} link(s)`}
    </p>
    <button
      onClick={onAddLink}
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        width: '86px',
        height: '26px',
        background: 'linear-gradient(90deg, #38bdf8 0%, #1e90ff 100%)',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
      }}
    >
      <Plus size={16} color="white" />
      <span style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '12px', color: 'white' }}>
        Add Link
      </span>
    </button>
  </div>
);

export const WebsiteInfoTab: React.FC<WebsiteInfoTabProps> = ({
  websiteConfiguration,
  setWebsiteConfiguration,
  logo,
  onUpdateLogo,
  tenantId,
  onSave
}) => {
  // File Input Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const headerLogoInputRef = useRef<HTMLInputElement>(null);
  const footerLogoInputRef = useRef<HTMLInputElement>(null);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const initialConfigRef = useRef<string>('');
  const [newSocialPlatform, setNewSocialPlatform] = useState<string>('Facebook');
  const [newSocialUrl, setNewSocialUrl] = useState<string>('');
  const [newContactSubject, setNewContactSubject] = useState<string>('');

  // Initialize socialLogins and offers in websiteConfiguration if not present
  useEffect(() => {
    if (!websiteConfiguration.socialLogins) {
      setWebsiteConfiguration(prev => ({
        ...prev,
        socialLogins: [{ type: 'Google', clientId: '' }]
      }));
    }
    if (!websiteConfiguration.offers) {
      setWebsiteConfiguration(prev => ({
        ...prev,
        offers: []
      }));
    }
  }, []);

  // Track changes
  useEffect(() => {
    if (!initialConfigRef.current) {
      initialConfigRef.current = JSON.stringify(websiteConfiguration);
    } else {
      const hasChanged = JSON.stringify(websiteConfiguration) !== initialConfigRef.current;
      setHasChanges(hasChanged);
    }
  }, [websiteConfiguration]);

  // Social login helpers
  const socialLogins = websiteConfiguration.socialLogins || [{ type: 'Google', clientId: '' }];
  const offers = websiteConfiguration.offers || [];

  const updateSocialLogin = (index: number, key: 'type' | 'clientId', value: string) => {
    setWebsiteConfiguration(prev => {
      const updated = [...(prev.socialLogins || [])];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, socialLogins: updated };
    });
  };

  const addSocialLogin = () => {
    setWebsiteConfiguration(prev => ({
      ...prev,
      socialLogins: [...(prev.socialLogins || []), { type: 'Google', clientId: '' }]
    }));
  };

  const removeSocialLogin = (index: number) => {
    setWebsiteConfiguration(prev => ({
      ...prev,
      socialLogins: (prev.socialLogins || []).filter((_, i) => i !== index)
    }));
  };

  const updateOffer = (index: number, key: 'type' | 'discount', value: string) => {
    setWebsiteConfiguration(prev => {
      const updated = [...(prev.offers || [])];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, offers: updated };
    });
  };

  const addOffer = () => {
    setWebsiteConfiguration(prev => ({
      ...prev,
      offers: [...(prev.offers || []), { type: 'Registration', discount: '' }]
    }));
  };

  const removeOffer = (index: number) => {
    setWebsiteConfiguration(prev => ({
      ...prev,
      offers: (prev.offers || []).filter((_, i) => i !== index)
    }));
  };

  // Promo Code state
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: '',
    discountType: 'amount' as 'amount' | 'percentage',
    discountAmount: '',
    discountPercentage: '',
    maxDiscountEnabled: true,
    minPurchaseEnabled: true,
    maxDiscount: '',
    minPurchase: '',
    expiryDate: ''
  });

  const promoCodes = websiteConfiguration.promoCodes || [];

  const resetPromoForm = () => {
    setPromoForm({
      code: '',
      discountType: 'amount',
      discountAmount: '',
      discountPercentage: '',
      maxDiscountEnabled: true,
      minPurchaseEnabled: true,
      maxDiscount: '',
      minPurchase: '',
      expiryDate: ''
    });
  };

  const addPromoCode = () => {
    if (!promoForm.code.trim()) {
      toast.error('Please enter a promo code name');
      return;
    }
    const exists = promoCodes.some(p => p.code.toLowerCase() === promoForm.code.trim().toLowerCase());
    if (exists) {
      toast.error('This promo code already exists');
      return;
    }
    const newPromo = {
      code: promoForm.code.trim().toUpperCase(),
      discountType: promoForm.discountType,
      discountAmount: promoForm.discountType === 'amount' ? Number(promoForm.discountAmount) || 0 : undefined,
      discountPercentage: promoForm.discountType === 'percentage' ? Number(promoForm.discountPercentage) || 0 : undefined,
      maxDiscountEnabled: promoForm.maxDiscountEnabled,
      minPurchaseEnabled: promoForm.minPurchaseEnabled,
      maxDiscount: promoForm.maxDiscountEnabled ? Number(promoForm.maxDiscount) || undefined : undefined,
      minPurchase: promoForm.minPurchaseEnabled ? Number(promoForm.minPurchase) || undefined : undefined,
      expiryDate: promoForm.expiryDate || undefined,
      isActive: true
    };
    setWebsiteConfiguration(prev => {
      const newConfig = { ...prev, promoCodes: [...(prev.promoCodes || []), newPromo] };
      // Auto-save immediately
      if (onSave) {
        onSave(newConfig).then(() => {
          initialConfigRef.current = JSON.stringify(newConfig);
          setHasChanges(false);
        }).catch(() => toast.error('Failed to save promo code'));
      }
      return newConfig;
    });
    resetPromoForm();
    setShowPromoModal(false);
    toast.success('Promo code created & saved!');
  };

  const removePromoCode = (index: number) => {
    setWebsiteConfiguration(prev => {
      const newConfig = { ...prev, promoCodes: (prev.promoCodes || []).filter((_, i) => i !== index) };
      if (onSave) {
        onSave(newConfig).then(() => {
          initialConfigRef.current = JSON.stringify(newConfig);
          setHasChanges(false);
        }).catch(() => toast.error('Failed to save'));
      }
      return newConfig;
    });
    toast.success('Promo code removed');
  };

  const togglePromoCodeActive = (index: number) => {
    setWebsiteConfiguration(prev => {
      const updated = [...(prev.promoCodes || [])];
      updated[index] = { ...updated[index], isActive: !updated[index].isActive };
      const newConfig = { ...prev, promoCodes: updated };
      if (onSave) {
        onSave(newConfig).then(() => {
          initialConfigRef.current = JSON.stringify(newConfig);
          setHasChanges(false);
        }).catch(() => toast.error('Failed to save'));
      }
      return newConfig;
    });
  };

  // Handle save
  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(websiteConfiguration);
      toast.success('Website settings saved successfully!');
      initialConfigRef.current = JSON.stringify(websiteConfiguration);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save website settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }, [onSave, websiteConfiguration]);

  // Keyboard shortcut for save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    imageType: 'logo' | 'favicon' | 'headerLogo' | 'footerLogo'
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      alert('File too large. Max 2MB.');
      event.target.value = '';
      return;
    }

    try {
      const converted = await convertFileToWebP(file, {
        quality: imageType === 'favicon' ? 0.9 : 0.82,
        maxDimension: imageType === 'favicon' ? 512 : 2000
      });

      if (imageType === 'logo') {
        onUpdateLogo(converted);
        setWebsiteConfiguration((prev) => ({ ...prev, headerLogo: converted }));
      } else if (imageType === 'favicon') {
        setWebsiteConfiguration((prev) => ({ ...prev, favicon: converted }));
      } else if (imageType === 'headerLogo') {
        setWebsiteConfiguration((prev) => ({ ...prev, headerLogo: converted }));
      } else if (imageType === 'footerLogo') {
        setWebsiteConfiguration((prev) => ({ ...prev, footerLogo: converted }));
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Failed to process image.');
    } finally {
      event.target.value = '';
    }
  };

  const handleRemoveImage = (imageType: 'logo' | 'favicon' | 'headerLogo' | 'footerLogo'): void => {
    if (imageType === 'logo') {
      onUpdateLogo(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
    } else if (imageType === 'favicon') {
      setWebsiteConfiguration((prev) => ({ ...prev, favicon: null }));
      if (faviconInputRef.current) faviconInputRef.current.value = '';
    } else if (imageType === 'headerLogo') {
      setWebsiteConfiguration((prev) => ({ ...prev, headerLogo: null }));
      if (headerLogoInputRef.current) headerLogoInputRef.current.value = '';
    } else {
      setWebsiteConfiguration((prev) => ({ ...prev, footerLogo: null }));
      if (footerLogoInputRef.current) footerLogoInputRef.current.value = '';
    }
  };

  const addSocialLink = (): void => {
    if (!newSocialUrl.trim()) {
      toast.error('Please enter a URL for the social link');
      return;
    }
    setWebsiteConfiguration((prev) => {
      const newConfig = {
        ...prev,
        socialLinks: [
          ...(prev.socialLinks || []),
          { id: Date.now().toString(), type: newSocialPlatform, platform: newSocialPlatform, url: newSocialUrl }
        ]
      };
      if (onSave) {
        onSave(newConfig).then(() => {
          initialConfigRef.current = JSON.stringify(newConfig);
          setHasChanges(false);
        }).catch(() => toast.error('Failed to save social link'));
      }
      return newConfig;
    });
    // Reset inputs after adding
    setNewSocialUrl('');
    setNewSocialPlatform('Facebook');
    toast.success('Social link added & saved!');
  };

  const updateSocialLink = (index: number, key: keyof SocialLink, value: string): void => {
    setWebsiteConfiguration((prev) => {
      const updated = [...(prev.socialLinks || [])];
      updated[index] = { ...updated[index], [key]: value };
      const newConfig = { ...prev, socialLinks: updated };
      return newConfig;
    });
  };

  const removeSocialLink = (index: number): void => {
    setWebsiteConfiguration((prev) => {
      const newConfig = { ...prev, socialLinks: (prev.socialLinks || []).filter((_, i) => i !== index) };
      if (onSave) {
        onSave(newConfig).then(() => {
          initialConfigRef.current = JSON.stringify(newConfig);
          setHasChanges(false);
        }).catch(() => toast.error('Failed to save'));
      }
      return newConfig;
    });
    toast.success('Social link removed');
  };

  const addFooterLink = (field: FooterLinkField): void => {
    setWebsiteConfiguration((prev) => ({
      ...prev,
      [field]: [
        ...((prev[field] as FooterLink[]) || []),
        { id: Date.now().toString(), label: '', url: '' }
      ]
    }));
  };

  const updateFooterLink = (
    field: FooterLinkField,
    index: number,
    key: keyof FooterLink,
    value: string
  ): void => {
    setWebsiteConfiguration((prev) => {
      const updated = [...((prev[field] as FooterLink[]) || [])];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, [field]: updated };
    });
  };

  const removeFooterLink = (field: FooterLinkField, index: number): void => {
    setWebsiteConfiguration((prev) => ({
      ...prev,
      [field]: ((prev[field] as FooterLink[]) || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="w-full text-gray-900 dark:text-gray-100" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Logo Upload Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <LogoUploadCard
            title="Primary Store Logo (Fallback)"
            imageUrl={logo}
            onSelect={() => logoInputRef.current?.click()}
            onRemove={() => handleRemoveImage('logo')}
          />
          <LogoUploadCard
            title="Header Logo Override"
            imageUrl={websiteConfiguration.headerLogo ?? null}
            onSelect={() => headerLogoInputRef.current?.click()}
            onRemove={() => handleRemoveImage('headerLogo')}
          />
          <LogoUploadCard
            title="Footer Logo Override"
            imageUrl={websiteConfiguration.footerLogo ?? null}
            onSelect={() => footerLogoInputRef.current?.click()}
            onRemove={() => handleRemoveImage('footerLogo')}
          />
          <LogoUploadCard
            title="Favicon (32x32 px)"
            imageUrl={websiteConfiguration.favicon ?? null}
            onSelect={() => faviconInputRef.current?.click()}
            onRemove={() => handleRemoveImage('favicon')}
          />
          <input type="file" ref={logoInputRef} onChange={(e) => handleImageUpload(e, 'logo')} className="hidden" accept="image/*" style={{ display: 'none' }} />
          <input type="file" ref={headerLogoInputRef} onChange={(e) => handleImageUpload(e, 'headerLogo')} className="hidden" accept="image/*" style={{ display: 'none' }} />
          <input type="file" ref={footerLogoInputRef} onChange={(e) => handleImageUpload(e, 'footerLogo')} className="hidden" accept="image/*" style={{ display: 'none' }} />
          <input type="file" ref={faviconInputRef} onChange={(e) => handleImageUpload(e, 'favicon')} className="hidden" accept="image/*" style={{ display: 'none' }} />
        </div>
      </div>

      {/* Input Fields Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Row 1: Announcement & Email */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <FigmaInput
            label="Announcement"
            value={websiteConfiguration.adminNoticeText || ''}
            onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, adminNoticeText: v }))}
            placeholder="Text"
            flex
          />
          <div style={{ width: '304px', maxWidth: '100%', flex: '1 1 260px' }}>
            <FigmaInput
              label="Email"
              value={websiteConfiguration.emails?.[0] || ''}
              onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, emails: [v, ...(p.emails?.slice(1) || [])] }))}
              placeholder="xyz@gmail.com"
              type="email"
            />
          </div>
        </div>

        {/* Row 2: Branding Text & Address */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <FigmaInput
            label="Branding Text"
            value={websiteConfiguration.brandingText || ''}
            onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, brandingText: v }))}
            placeholder="Your Brand Text"
            flex
          />
          <FigmaInput
            label="Address"
            value={websiteConfiguration.addresses?.[0] || ''}
            onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, addresses: [v, ...(p.addresses?.slice(1) || [])] }))}
            placeholder="Your Address"
            flex
          />
        </div>

        {/* Contact Subjects */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '14px', margin: 0 }}>Contact Subjects</p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              value={newContactSubject}
              onChange={(e) => setNewContactSubject(e.target.value)}
              placeholder="e.g. Order Support"
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', flex: 1 }}
            />
            <button
              onClick={() => {
                const v = (newContactSubject || '').trim();
                if (!v) return;
                setWebsiteConfiguration(prev => ({ ...prev, contactSubjects: [...(prev.contactSubjects || []), v] }));
                setNewContactSubject('');
              }}
              style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#0ea5e9', color: 'white', border: 'none' }}
            >
              Add
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(websiteConfiguration.contactSubjects || []).map((s, i) => (
              <div key={i} style={{ background: '#f3f4f6', padding: '6px 10px', borderRadius: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13 }}>{s}</span>
                <button
                  onClick={() => setWebsiteConfiguration(prev => ({ ...prev, contactSubjects: (prev.contactSubjects || []).filter((_, idx) => idx !== i) }))}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>




        {/* Display Added Social Links */}
        {websiteConfiguration.socialLinks && websiteConfiguration.socialLinks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 500, fontSize: '14px', color: 'black', margin: 0 }}>
              Added Social Links
            </p>
            {(websiteConfiguration.socialLinks || [])
              .map((link, index) => {
                const actualIndex = (websiteConfiguration.socialLinks || []).findIndex(l => l.id === link.id);
                return (
                  <div key={link.id || index} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '8px' }}>
                    <FigmaSelect
                      label=""
                      value={link.platform}
                      onChange={(v) => updateSocialLink(actualIndex, 'platform', v)}
                      options={[
                        { value: 'Facebook', label: 'Facebook' },
                        { value: 'Instagram', label: 'Instagram' },
                        { value: 'Twitter', label: 'Twitter' },
                        { value: 'LinkedIn', label: 'LinkedIn' },
                        { value: 'YouTube', label: 'YouTube' },
                        { value: 'TikTok', label: 'TikTok' },
                        { value: 'WhatsApp', label: 'WhatsApp' },
                        { value: 'Telegram', label: 'Telegram' },
                        { value: 'Messenger', label: 'Messenger' },
                        { value: 'Daraz', label: 'Daraz' },
                        { value: 'Other', label: 'Other' },
                      ]}
                      width="180px"
                    />
                    <FigmaInput
                      label=""
                      value={link.url || ''}
                      onChange={(v) => updateSocialLink(actualIndex, 'url', v)}
                      placeholder="Social link URL"
                      flex
                    />
                    <button
                      onClick={() => removeSocialLink(actualIndex)}
                      style={{
                        width: '48px',
                        height: '48px',
                        backgroundColor: 'rgba(218,0,0,0.1)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Trash2 size={20} color="#da0000" />
                    </button>
                  </div>
                );
              })}
          </div>
        )}
        {/* Row 5: Social Link & Add Button */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <FigmaSelect
            label="Platform"
            value={newSocialPlatform}
            onChange={(v) => setNewSocialPlatform(v)}
            options={[
              { value: 'Facebook', label: 'Facebook' },
              { value: 'Instagram', label: 'Instagram' },
              { value: 'Twitter', label: 'Twitter' },
              { value: 'LinkedIn', label: 'LinkedIn' },
              { value: 'YouTube', label: 'YouTube' },
              { value: 'TikTok', label: 'TikTok' },
              { value: 'WhatsApp', label: 'WhatsApp' },
              { value: 'Telegram', label: 'Telegram' },
              { value: 'Messenger', label: 'Messenger' },
              { value: 'Daraz', label: 'Daraz' },
              { value: 'Other', label: 'Other' },
            ]}
            width="200px"
          />
          <FigmaInput
            label="Social Link URL"
            value={newSocialUrl}
            onChange={(v) => setNewSocialUrl(v)}
            placeholder="https://facebook.com/yourpage"
            flex
          />
          <button
            onClick={addSocialLink}
            style={{
              height: '48px',
              minWidth: '150px',
              background: 'linear-gradient(180deg, #ff6a00 0%, #ff9f1c 100%)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Plus size={24} color="white" />
            <span style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '16px', color: 'white' }}>
              Add New Link
            </span>
          </button>
        </div>
      </div>

      {/* Country Settings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <SectionHeader title="Country Settings" />
        <div style={{ display: 'flex', gap: '16px' }}>
          <FigmaSelect
            label="Shop Country"
            value={websiteConfiguration.shopCountry || 'BD'}
            onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, shopCountry: v }))}
            options={[
              { value: 'BD', label: 'Bangladesh (BD)' },
              { value: 'IN', label: 'India (IN)' },
              { value: 'US', label: 'United States (US)' },
              { value: 'UK', label: 'United Kingdom (UK)' },
            ]}
            width="425px"
          />
          <FigmaSelect
            label="Shop Currency"
            value={websiteConfiguration.shopCurrency || 'BDT'}
            onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, shopCurrency: v }))}
            options={[
              { value: 'BDT', label: 'Taka-BDT (৳)' },
              { value: 'INR', label: 'Rupee-INR (₹)' },
              { value: 'USD', label: 'Dollar-USD ($)' },
              { value: 'GBP', label: 'Pound-GBP (£)' },
            ]}
            width="auto"
          />
        </div>
      </div>

      {/* Social Login */}
      {/* <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <SectionHeader title="Social Login" />
        {socialLogins.map((login, index) => (
          <div key={index} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
            <FigmaSelect
              label={index === 0 ? 'Login Type' : ''}
              value={login.type || 'Google'}
              onChange={(v) => updateSocialLogin(index, 'type', v)}
              options={[
                { value: 'Google', label: 'Google' },
                { value: 'Facebook', label: 'Facebook' },
              ]}
              width="426px"
            />
            <FigmaInput
              label={index === 0 ? 'Auth/Client ID' : ''}
              value={login.clientId || ''}
              onChange={(v) => updateSocialLogin(index, 'clientId', v)}
              placeholder="531559968835-9dne3cs01s1knffdctpgvu955qfft588.apps.googleusercontent.com"
              flex
            />
            {socialLogins.length > 1 && (
              <button
                onClick={() => removeSocialLogin(index)}
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'rgba(218,0,0,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={20} color="#da0000" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addSocialLogin}
          style={{
            width: '132px',
            height: '48px',
            background: 'linear-gradient(180deg, #ff6a00 0%, #ff9f1c 100%)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <Plus size={24} color="white" />
          <span style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '16px', color: 'white' }}>
            Add New
          </span>
        </button>
      </div>

      {/* Offer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <SectionHeader title="Offer" />
        {offers.length === 0 ? (
          <div style={{ display: 'flex', gap: '16px' }}>
            <FigmaSelect
              label="Offer Type"
              value="Registration"
              onChange={() => {}}
              options={[
                { value: 'Registration', label: 'Registration' },
                { value: 'First Purchase', label: 'First Purchase' },
                { value: 'Referral', label: 'Referral' },
              ]}
              width="426px"
            />
            <FigmaInput
              label="Discount"
              value=""
              onChange={() => {}}
              placeholder="Ex: 1000 or 20%"
              flex
            />
          </div>
        ) : (
          offers.map((offer, index) => (
            <div key={index} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              <FigmaSelect
                label={index === 0 ? 'Offer Type' : ''}
                value={offer.type || 'Registration'}
                onChange={(v) => updateOffer(index, 'type', v)}
                options={[
                  { value: 'Registration', label: 'Registration' },
                  { value: 'First Purchase', label: 'First Purchase' },
                  { value: 'Referral', label: 'Referral' },
                ]}
                width="426px"
              />
              <FigmaInput
                label={index === 0 ? 'Discount' : ''}
                value={offer.discount || ''}
                onChange={(v) => updateOffer(index, 'discount', v)}
                placeholder="Ex: 1000 or 20%"
                flex
              />
              <button
                onClick={() => removeOffer(index)}
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'rgba(218,0,0,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={20} color="#da0000" />
              </button>
            </div>
          ))
        )}
        <button
          onClick={addOffer}
          style={{
            width: '132px',
            height: '48px',
            background: 'linear-gradient(180deg, #ff6a00 0%, #ff9f1c 100%)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <Plus size={24} color="white" />
          <span style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '16px', color: 'white' }}>
            Add New
          </span>
        </button>
      </div>

      {/* Coupon / Promo Code Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <SectionHeader title="Coupon" />
        
        {promoCodes.length === 0 ? (
          <p style={{ fontFamily: '"Poppins", sans-serif', fontSize: '14px', color: '#999', margin: 0 }}>
            No promo codes created yet. Click "+ Add New" to create one.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {promoCodes.map((promo, index) => {
              const isExpired = promo.expiryDate ? new Date(promo.expiryDate) < new Date() : false;
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px 16px',
                    backgroundColor: promo.isActive === false || isExpired ? '#fafafa' : '#f0fdf4',
                    borderRadius: '12px',
                    border: `1px solid ${promo.isActive === false || isExpired ? '#e5e5e5' : '#bbf7d0'}`,
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 700, fontSize: '16px', color: '#111', letterSpacing: '1px' }}>
                        {promo.code}
                      </span>
                      {isExpired && (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626', backgroundColor: '#fef2f2', padding: '2px 8px', borderRadius: '4px' }}>Expired</span>
                      )}
                      {promo.isActive === false && !isExpired && (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b', backgroundColor: '#fffbeb', padding: '2px 8px', borderRadius: '4px' }}>Inactive</span>
                      )}
                    </div>
                    <span style={{ fontFamily: '"Poppins", sans-serif', fontSize: '13px', color: '#666' }}>
                      {promo.discountType === 'amount' ? `\u09F3${promo.discountAmount || 0} off` : `${promo.discountPercentage || 0}% off`}
                      {promo.maxDiscount ? ` (max \u09F3${promo.maxDiscount})` : ''}
                      {promo.minPurchase ? ` \u2022 Min purchase \u09F3${promo.minPurchase}` : ''}
                      {promo.expiryDate ? ` \u2022 Expires: ${new Date(promo.expiryDate).toLocaleDateString()}` : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => togglePromoCodeActive(index)}
                      style={{
                        width: '48px',
                        height: '28px',
                        borderRadius: '14px',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: promo.isActive !== false ? '#f59e0b' : '#fffbeb',
                        position: 'relative',
                        transition: 'background-color 0.2s',
                      }}
                      title={promo.isActive !== false ? 'Deactivate' : 'Activate'}
                    >
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        position: 'absolute',
                        top: '3px',
                        left: promo.isActive !== false ? '23px' : '3px',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </button>
                    <button
                      onClick={() => removePromoCode(index)}
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: 'rgba(218,0,0,0.1)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      
                    >
                      <Trash2 size={18} color="#da0000" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <button
          onClick={() => setShowPromoModal(true)}
          style={{
            width: '132px',
            height: '48px',
            background: 'linear-gradient(180deg, #ff6a00 0%, #ff9f1c 100%)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <Plus size={24} color="white" />
          <span style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '16px', color: 'white' }}>
            Add New
          </span>
        </button>
      </div>

      {/* Create Promo Code Modal */}
      {showPromoModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowPromoModal(false); resetPromoForm(); } }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 700, fontSize: '20px', margin: 0 }}>Create Promo Code</h3>
              <button onClick={() => { setShowPromoModal(false); resetPromoForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '14px', color: '#111', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                Code Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input type="text" value={promoForm.code} onChange={(e) => setPromoForm(prev => ({ ...prev, code: e.target.value }))} placeholder="Promo Code" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '2px solid #e5e7eb', fontFamily: '"Poppins", sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const }} onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#ff6a00'} onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#e5e7eb'} />
              <p style={{ fontFamily: '"Poppins", sans-serif', fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>Enter a unique promo code. This will help you identify it later.</p>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '14px', color: '#111', marginBottom: '8px', display: 'block' }}>Discount Type (Amount/Percentage)</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input type="number" value={promoForm.discountAmount} onChange={(e) => setPromoForm(prev => ({ ...prev, discountAmount: e.target.value, discountType: 'amount' }))} placeholder="Amount" style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: `2px solid ${promoForm.discountType === 'amount' ? '#ff6a00' : '#e5e7eb'}`, fontFamily: '"Poppins", sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const, backgroundColor: promoForm.discountType === 'amount' ? '#f5f3ff' : 'white' }} onFocus={() => setPromoForm(prev => ({ ...prev, discountType: 'amount' }))} />
                <span style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '14px', color: '#9ca3af' }}>Or</span>
                <input type="number" value={promoForm.discountPercentage} onChange={(e) => setPromoForm(prev => ({ ...prev, discountPercentage: e.target.value, discountType: 'percentage' }))} placeholder="Percentage" style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: `2px solid ${promoForm.discountType === 'percentage' ? '#ff6a00' : '#e5e7eb'}`, fontFamily: '"Poppins", sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const, backgroundColor: promoForm.discountType === 'percentage' ? '#f5f3ff' : 'white' }} onFocus={() => setPromoForm(prev => ({ ...prev, discountType: 'percentage' }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={() => setPromoForm(prev => ({ ...prev, maxDiscountEnabled: !prev.maxDiscountEnabled }))} style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', backgroundColor: promoForm.maxDiscountEnabled ? '#ff6a00' : '#d1d5db', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '3px', left: promoForm.maxDiscountEnabled ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                </button>
                <div>
                  <span style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '13px', color: '#111', display: 'flex', alignItems: 'center', gap: '4px' }}>Max Discount <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></span>
                  <p style={{ fontFamily: '"Poppins", sans-serif', fontSize: '11px', color: '#9ca3af', margin: '2px 0 0' }}>Apply the highest available discount on eligible purchases.</p>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={() => setPromoForm(prev => ({ ...prev, minPurchaseEnabled: !prev.minPurchaseEnabled }))} style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', backgroundColor: promoForm.minPurchaseEnabled ? '#ff6a00' : '#d1d5db', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '3px', left: promoForm.minPurchaseEnabled ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                </button>
                <div>
                  <span style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '13px', color: '#111', display: 'flex', alignItems: 'center', gap: '4px' }}>Min Purchase <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></span>
                  <p style={{ fontFamily: '"Poppins", sans-serif', fontSize: '11px', color: '#9ca3af', margin: '2px 0 0' }}>Set a minimum purchase requirement for discounts to apply.</p>
                </div>
              </div>
            </div>
            {promoForm.maxDiscountEnabled && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '14px', color: '#111', marginBottom: '8px', display: 'block' }}>Max Discount</label>
                <input type="number" value={promoForm.maxDiscount} onChange={(e) => setPromoForm(prev => ({ ...prev, maxDiscount: e.target.value }))} placeholder="Type max discount amount (ex.\u09F32000)" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '2px solid #e5e7eb', fontFamily: '"Poppins", sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const }} onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#ff6a00'} onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#e5e7eb'} />
              </div>
            )}
            {promoForm.minPurchaseEnabled && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '14px', color: '#111', marginBottom: '8px', display: 'block' }}>Min Purchase</label>
                <input type="number" value={promoForm.minPurchase} onChange={(e) => setPromoForm(prev => ({ ...prev, minPurchase: e.target.value }))} placeholder="Type min purchase amount (ex.\u09F32000)" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '2px solid #e5e7eb', fontFamily: '"Poppins", sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const }} onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#ff6a00'} onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#e5e7eb'} />
              </div>
            )}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '14px', color: '#111', marginBottom: '8px', display: 'block' }}>Expiry Date:</label>
              <input type="date" value={promoForm.expiryDate} onChange={(e) => setPromoForm(prev => ({ ...prev, expiryDate: e.target.value }))} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '2px solid #e5e7eb', fontFamily: '"Poppins", sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const }} onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#ff6a00'} onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#e5e7eb'} />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowPromoModal(false); resetPromoForm(); }} style={{ padding: '12px 32px', borderRadius: '10px', border: '2px solid #e5e7eb', backgroundColor: 'white', fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '15px', color: '#374151', cursor: 'pointer' }}>Cancel</button>
              <button onClick={addPromoCode} style={{ padding: '12px 32px', borderRadius: '10px', border: 'none', background: 'linear-gradient(180deg, #ff6a00 0%, #4f46e5 100%)', fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '15px', color: 'white', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Rich Text Editors */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <RichTextEditor
          label="About us"
          value={websiteConfiguration.aboutUs || ''}
          onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, aboutUs: v }))}
          placeholder="About your brand"
        />
        <RichTextEditor
          label="Privacy Policy"
          value={websiteConfiguration.privacyPolicy || ''}
          onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, privacyPolicy: v }))}
          placeholder="Shop Privacy And Policy"
        />
        <RichTextEditor
          label="Terms and Condition"
          value={websiteConfiguration.termsAndConditions || ''}
          onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, termsAndConditions: v }))}
          placeholder="Shop Terms And Conditions"
        />
        <RichTextEditor
          label="Return and Cancellation Policy"
          value={websiteConfiguration.returnPolicy || ''}
          onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, returnPolicy: v }))}
          placeholder="Return and Cancellation Policy"
        />
      </div>

      {/* Footer Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
        {/* Footer Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <FooterLinkCard
            title="Footer Quick Links"
            description="Shown in the Quick Links column of Footer 2"
            links={(websiteConfiguration.footerQuickLinks as FooterLink[]) || []}
            onAddLink={() => addFooterLink('footerQuickLinks')}
            onRemoveLink={(i) => removeFooterLink('footerQuickLinks', i)}
            onUpdateLink={(i, k, v) => updateFooterLink('footerQuickLinks', i, k, v)}
          />
          <FooterLinkCard
            title="Footer Useful Links"
            description="Shown in the useful Links column of Footer 3"
            links={(websiteConfiguration.footerUsefulLinks as FooterLink[]) || []}
            onAddLink={() => addFooterLink('footerUsefulLinks')}
            onRemoveLink={(i) => removeFooterLink('footerUsefulLinks', i)}
            onUpdateLink={(i, k, v) => updateFooterLink('footerUsefulLinks', i, k, v)}
          />
        </div>

        {/* Footer Section Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 500, fontSize: '14px', color: 'black', margin: 0 }}>
            Footer Section Settings
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <FigmaCheckbox
              label="Is show new slider"
              checked={websiteConfiguration.showNewsSlider || false}
              onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, showNewsSlider: v }))}
            />
            <FigmaCheckbox
              label="Hide copyright section"
              checked={websiteConfiguration.hideCopyright || false}
              onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, hideCopyright: v }))}
            />
            <FigmaCheckbox
              label="Hide copyright text"
              checked={websiteConfiguration.hideCopyrightText || false}
              onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, hideCopyrightText: v }))}
            />
            <FigmaCheckbox
              label="Powered by System Next IT"
              checked={websiteConfiguration.showPoweredBy || false}
              onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, showPoweredBy: v }))}
            />
          </div>
        </div>

        {/* Product Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 500, fontSize: '14px', color: 'black', margin: 0 }}>
            Product Settings
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <FigmaCheckbox
              label="Show Product Sold Count"
              checked={websiteConfiguration.showProductSoldCount || false}
              onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, showProductSoldCount: v }))}
            />
            <FigmaCheckbox
              label="Allow Product Image Downloads"
              checked={websiteConfiguration.allowProductImageDownloads || false}
              onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, allowProductImageDownloads: v }))}
            />
            <FigmaCheckbox
              label="Show Email Field for Place Order"
              checked={websiteConfiguration.showEmailFieldForOrder || false}
              onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, showEmailFieldForOrder: v }))}
            />
            <FigmaCheckbox
              label="Enable Promo Code for Place Order"
              checked={websiteConfiguration.enablePromoCode || false}
              onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, enablePromoCode: v }))}
            />
          </div>
        </div>
      </div>

      {/* Floating Save Button */}
      {onSave && hasChanges && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
          }}
        >
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 28px',
              background: isSaving 
                ? 'linear-gradient(180deg, #94a3b8 0%, #64748b 100%)'
                : 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
              color: 'white',
              fontFamily: '"Poppins", sans-serif',
              fontWeight: 600,
              fontSize: '16px',
              border: 'none',
              borderRadius: '12px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            {isSaving ? (
              <>
                <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                Save Changes
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default WebsiteInfoTab;
