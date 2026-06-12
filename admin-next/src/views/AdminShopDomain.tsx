import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminShopDomainProps {
  onBack: () => void;
  tenantId: string;
  currentDomain?: string;
}

// Figma-matched styles
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    width: '100%',
    maxWidth: '666px',
    margin: '0 auto',
  },
  headerCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px 18px',
    overflow: 'visible',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    height: '42px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
  },
  title: {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 500,
    fontSize: '20px',
    color: 'black',
    margin: 0,
  },
  instructionsCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #da0000',
    padding: '14px 9px',
    overflow: 'hidden',
  },
  instructionsContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    padding: '10px',
  },
  instructionsTitle: {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 500,
    fontSize: '20px',
    color: 'black',
    margin: 0,
  },
  instructionsText: {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 400,
    fontSize: '14px',
    color: 'black',
    lineHeight: '1.6',
    margin: 0,
  },
  boldText: {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 700,
    fontSize: '14px',
    color: 'black',
  },
  videoButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffefef',
    borderRadius: '8px',
    padding: '8px 12px',
    border: 'none',
    cursor: 'pointer',
    width: 'fit-content',
  },
  videoIcon: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 500,
    fontSize: '16px',
    color: 'black',
    margin: 0,
  },
  domainCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '14px 9px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  domainContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '17px',
    width: '100%',
    padding: '14px 2px',
  },
  domainInput: {
    width: '100%',
    height: '48px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: 'none',
    padding: '0 13px',
    fontFamily: "'Lato', sans-serif",
    fontWeight: 400,
    fontSize: '14px',
    color: '#333',
    outline: 'none',
  },
  domainInputPlaceholder: {
    color: '#a2a2a2',
  },
  saveButton: {
    width: '100%',
    height: '40px',
    backgroundColor: '#1e90ff',
    borderRadius: '8px',
    border: '1px solid #1e90ff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  saveButtonText: {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 600,
    fontSize: '14px',
    color: 'white',
  },
};

const AdminShopDomain: React.FC<AdminShopDomainProps> = ({ onBack, tenantId, currentDomain }) => {
  const [domain, setDomain] = useState(currentDomain || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentDomain) {
      setDomain(currentDomain);
    }
  }, [currentDomain]);

  const handleSave = async () => {
    if (!domain.trim()) {
      toast.error('Please enter a domain');
      return;
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain.trim())) {
      toast.error('Please enter a valid domain (e.g., example.com)');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/setup-domain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customDomain: domain.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Cannot save domain in local development. Please try again in production.');
      }

      toast.success('Domain saved successfully! Please configure your DNS settings.');
    } catch (error: any) {
      toast.error(error.message || 'HI, Cannot save domain in local development. Please try again in production.');
    } finally {
      setIsSaving(false);
    }
  };

  const openVideoInstruction = () => {
    // Open video tutorial - can be configured to actual video URL
    window.open('https://www.youtube.com/watch?v=YOUR_VIDEO_ID', '_blank');
  };

  return (
    <div style={styles.container}>
      {/* Header Card */}
      <div style={styles.headerCard}>
        <div style={styles.headerRow}>
          <button onClick={onBack} style={styles.backButton}>
            <ChevronLeft size={20} color="black" />
          </button>
          <p style={styles.title}>Shop Domain</p>
        </div>
      </div>

      {/* Instructions Card */}
      <div style={styles.instructionsCard}>
        <div style={styles.instructionsContent}>
          <p style={styles.instructionsTitle}>Instructions</p>
          
          <div style={styles.instructionsText}>
            <p style={{ margin: '0 0 12px 0' }}>Configure DNS Settings in Cloudflare</p>
            
            <p style={{ margin: '0 0 8px 0' }}>The Steps in the Below:</p>
            
            <p style={{ margin: '0 0 4px 0' }}>
              1. Point <span style={styles.boldText}>A Record for @: 159.198.47.126</span>
            </p>
            <p style={{ margin: '0 0 12px 0' }}>
              2. Point <span style={styles.boldText}>CNAME Record for www:your_domain.com</span>
            </p>
            
            <p style={{ margin: 0 }}>
              Add the following DNS record to your <span style={styles.boldText}>Cloudflare DNS</span> with{' '}
              <span style={styles.boldText}>TTL: Auto</span> and{' '}
              <span style={styles.boldText}>Proxy Status: Proxied.</span> Set SSL mode to{' '}
              <span style={styles.boldText}>Flexible</span>. Allow up to 24 hours for verification.
            </p>
          </div>

          <button onClick={openVideoInstruction} style={styles.videoButton}>
            <div style={styles.videoIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="2" fill="#FF0000"/>
                <path d="M10 8.5V15.5L16 12L10 8.5Z" fill="white"/>
              </svg>
            </div>
            <p style={styles.videoText}>View Video Instruction</p>
          </button>
        </div>
      </div>

      {/* Domain Input Card */}
      <div style={styles.domainCard}>
        <div style={styles.domainContent}>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Your_domain.com"
            style={styles.domainInput}
          />
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              ...styles.saveButton,
              opacity: isSaving ? 0.7 : 1,
              cursor: isSaving ? 'wait' : 'pointer',
            }}
          >
            <span style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminShopDomain;
