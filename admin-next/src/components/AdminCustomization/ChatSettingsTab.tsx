import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle, Save } from 'lucide-react';
import { WebsiteConfig } from './types';
import { toast } from 'react-hot-toast';

interface ChatSettingsTabProps {
  websiteConfiguration: WebsiteConfig;
  setWebsiteConfiguration: React.Dispatch<React.SetStateAction<WebsiteConfig>>;
  onSave?: (config?: WebsiteConfig) => Promise<void>;
}

// Figma-styled Toggle Switch
const FigmaToggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ checked, onChange }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      width: '40px',
      height: '20px',
      background: checked ? 'linear-gradient(90deg, #38bdf8 0%, #1e90ff 100%)' : '#b9b9b9',
      borderRadius: '39px',
      padding: '2px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: checked ? 'flex-end' : 'flex-start',
    }}
  >
    <div
      style={{
        width: '16px',
        height: '16px',
        backgroundColor: 'white',
        borderRadius: '186px',
      }}
    />
  </div>
);

// Figma-styled Toggle Card
const ToggleCard: React.FC<{
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ title, description, checked, onChange }) => (
  <div
    style={{
      flex: 1,
      minWidth: '280px',
      height: '54px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      padding: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}
  >
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <p
        style={{
          fontFamily: '"Poppins", sans-serif',
          fontWeight: 500,
          fontSize: '12px',
          color: 'black',
          margin: 0,
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontFamily: '"Poppins", sans-serif',
          fontSize: '8px',
          color: '#b9b9b9',
          margin: 0,
        }}
      >
        {description}
      </p>
    </div>
    <FigmaToggle checked={checked} onChange={onChange} />
  </div>
);

// Figma-styled Input Field
const FigmaInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  labelColor?: string;
}> = ({ label, value, onChange, placeholder, type = 'text', labelColor = '#023337' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
    <p
      style={{
        fontFamily: '"Lato", sans-serif',
        fontWeight: 700,
        fontSize: '15px',
        color: labelColor,
        margin: 0,
      }}
    >
      {label}
    </p>
    <div
      style={{
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        height: '48px',
        padding: '10px 12px',
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

// Chat Support Tab Button
const ChatSupportTab: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      border: active ? '0.5px solid #38bdf8' : 'none',
      minWidth: '120px',
    }}
  >
    {icon}
    <p
      style={{
        fontFamily: '"Lato", sans-serif',
        fontWeight: 500,
        fontSize: '16px',
        color: 'black',
        margin: 0,
      }}
    >
      {label}
    </p>
  </div>
);

export const ChatSettingsTab: React.FC<ChatSettingsTabProps> = ({
  websiteConfiguration,
  setWebsiteConfiguration,
  onSave
}) => {
  const [activeChatSupport, setActiveChatSupport] = useState<'phone' | 'whatsapp' | 'messenger'>('messenger');
  const [chatSupportUrl, setChatSupportUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);

  // Sync chatSupportUrl when tab changes or websiteConfiguration changes
  useEffect(() => {
    if (activeChatSupport === 'phone') {
      setChatSupportUrl(websiteConfiguration.chatSupportPhone || '');
    } else if (activeChatSupport === 'whatsapp') {
      setChatSupportUrl(websiteConfiguration.chatSupportWhatsapp || '');
    } else {
      setChatSupportUrl(websiteConfiguration.chatSupportMessenger || '');
    }
  }, [activeChatSupport, websiteConfiguration.chatSupportPhone, websiteConfiguration.chatSupportWhatsapp, websiteConfiguration.chatSupportMessenger]);

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(websiteConfiguration);
      toast.success('Chat settings saved successfully');
    } catch (e) {
      toast.error('Failed to save chat settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Chat Settings Card */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '32px 19px',
          position: 'relative',
        }}
      >
        {/* Header */}
        <p
          style={{
            fontFamily: '"Lato", sans-serif',
            fontWeight: 700,
            fontSize: '22px',
            color: '#023337',
            letterSpacing: '0.11px',
            margin: 0,
            marginBottom: '24px',
          }}
        >
          Chat settings
        </p>

        {/* Toggle Cards Row */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <ToggleCard
            title="Enable Live Chat"
            description="Allow customers to chat with you"
            checked={websiteConfiguration.chatEnabled ?? false}
            onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, chatEnabled: v }))}
          />
          <ToggleCard
            title="WhatsApp Fallback"
            description="Redirect to WhatsApp when chat disabled"
            checked={websiteConfiguration.chatWhatsAppFallback ?? false}
            onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, chatWhatsAppFallback: v }))}
          />
        </div>

        {/* Main Content Row */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Left Column - Messages */}
          <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FigmaInput
              label="Welcome Message"
              value={websiteConfiguration.chatGreeting || ''}
              onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, chatGreeting: v }))}
              placeholder="Hi! How can we help?"
            />
            <FigmaInput
              label="Offline Message"
              value={websiteConfiguration.chatOfflineMessage || ''}
              onChange={(v) => setWebsiteConfiguration((p) => ({ ...p, chatOfflineMessage: v }))}
              placeholder="We're offline. Leave a message!"
              labelColor="#2d2d2d"
            />
          </div>

          {/* Right Column - Support Hours */}
          <div style={{ width: '267px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FigmaInput
              label="Support Hour From"
              value={websiteConfiguration.chatSupportHours?.from || '09:00'}
              onChange={(v) =>
                setWebsiteConfiguration((p) => ({
                  ...p,
                  chatSupportHours: { from: v, to: p.chatSupportHours?.to || '21:00' },
                }))
              }
              placeholder="09:00 AM"
              type="time"
            />
            <FigmaInput
              label="Support Hour To"
              value={websiteConfiguration.chatSupportHours?.to || '21:00'}
              onChange={(v) =>
                setWebsiteConfiguration((p) => ({
                  ...p,
                  chatSupportHours: { from: p.chatSupportHours?.from || '09:00', to: v },
                }))
              }
              placeholder="09:00 PM"
              type="time"
            />
          </div>
        </div>
      </div>

      {/* Chat Support Card */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px 19px',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <p
            style={{
              fontFamily: '"Lato", sans-serif',
              fontWeight: 500,
              fontSize: '20px',
              color: 'black',
              margin: 0,
            }}
          >
            Chat Support
          </p>
          <p
            style={{
              fontFamily: '"Lato", sans-serif',
              fontSize: '12px',
              color: '#6f6f6f',
              margin: 0,
              marginTop: '8px',
            }}
          >
            Please provide your credentials to integrate
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <ChatSupportTab
            icon={<Phone size={24} color="#4caf50" style={{ transform: 'rotate(-90deg)' }} />}
            label="Phone"
            active={activeChatSupport === 'phone'}
            onClick={() => setActiveChatSupport('phone')}
          />
          <ChatSupportTab
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
                  fill="#25D366"
                />
                <path
                  d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"
                  stroke="#25D366"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
            }
            label="WhatsApp"
            active={activeChatSupport === 'whatsapp'}
            onClick={() => setActiveChatSupport('whatsapp')}
          />
          <ChatSupportTab
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C6.477 2 2 6.145 2 11.259c0 2.913 1.454 5.512 3.726 7.21V22l3.405-1.869c.909.252 1.871.388 2.869.388 5.523 0 10-4.145 10-9.259C22 6.145 17.523 2 12 2z"
                  fill="#0084FF"
                />
                <path d="M13.076 14.028L10.69 11.5l-4.634 2.528 5.096-5.413 2.456 2.529 4.564-2.529-5.096 5.413z" fill="white" />
              </svg>
            }
            label="Messenger"
            active={activeChatSupport === 'messenger'}
            onClick={() => setActiveChatSupport('messenger')}
          />
        </div>

        {/* URL Input Row */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div
            style={{
              flex: 1,
              height: '40px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              padding: '0 13px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              value={chatSupportUrl}
              onChange={(e) => setChatSupportUrl(e.target.value)}
              placeholder={
                activeChatSupport === 'phone'
                  ? '+880XXXXXXXXXX'
                  : activeChatSupport === 'whatsapp'
                  ? '+880XXXXXXXXXX'
                  : 'www.facebook.com/messages/xyz'
              }
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontFamily: '"Lato", sans-serif',
                fontSize: '14px',
                color: chatSupportUrl ? 'black' : '#a2a2a2',
              }}
            />
          </div>
          <button
            disabled={applying}
            onClick={async () => {
              // Save chat support URL to config state and persist to DB
              const key = `chatSupport${activeChatSupport.charAt(0).toUpperCase() + activeChatSupport.slice(1)}` as keyof WebsiteConfig;
              const updatedConfig = { ...websiteConfiguration, [key]: chatSupportUrl };
              setWebsiteConfiguration(updatedConfig);
              if (onSave) {
                setApplying(true);
                try {
                  await onSave(updatedConfig);
                  toast.success(`${activeChatSupport.charAt(0).toUpperCase() + activeChatSupport.slice(1)} saved successfully`);
                } catch (e) {
                  toast.error('Failed to save. Please try again.');
                } finally {
                  setApplying(false);
                }
              }
            }}
            style={{
              width: '120px',
              height: '40px',
              backgroundColor: applying ? '#93c5fd' : '#1e90ff',
              border: '1px solid #1e90ff',
              borderRadius: '8px',
              cursor: applying ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: '"Lato", sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                color: 'white',
              }}
            >
              {applying ? 'Saving...' : 'Apply'}
            </span>
          </button>
        </div>
      </div>

      {/* Floating Save Button */}
      {onSave && (
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
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: saving ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: '"Lato", sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Chat Settings'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatSettingsTab;
