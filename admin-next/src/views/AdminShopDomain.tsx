import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, CheckCircle, XCircle, RefreshCw, Trash2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminShopDomainProps {
  onBack: () => void;
  tenantId: string;
  currentDomain?: string;
}

interface DnsStatus {
  aRecord: {
    valid: boolean;
    value: string | null;
    expected: string;
  };
  cname: {
    valid: boolean;
    value: string | null;
    expected: string;
  };
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
  currentDomainCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #10b981',
    padding: '16px',
    marginBottom: '0',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
  },
  verifiedBadge: {
    backgroundColor: '#d1fae5',
    color: '#059669',
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
  },
  copyButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#374151',
  },
};

const AdminShopDomain: React.FC<AdminShopDomainProps> = ({ onBack, tenantId, currentDomain: initialDomain }) => {
  const [domain, setDomain] = useState(initialDomain || '');
  const [savedDomain, setSavedDomain] = useState(initialDomain || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [dnsStatus, setDnsStatus] = useState<DnsStatus | null>(null);
  const [dnsVerified, setDnsVerified] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (initialDomain) {
      setDomain(initialDomain);
      setSavedDomain(initialDomain);
      // Auto-verify DNS on load if domain is set
      verifyDns(initialDomain);
    }
  }, [initialDomain]);

  const verifyDns = async (domainToVerify: string) => {
    if (!domainToVerify) return;

    setIsVerifying(true);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/verify-domain?domain=${encodeURIComponent(domainToVerify)}`);
      const result = await response.json();

      if (result.dnsStatus) {
        setDnsStatus(result.dnsStatus);
        setDnsVerified(result.dnsVerified || false);
      }
    } catch (error) {
      console.error('DNS verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save domain');
      }

      setSavedDomain(domain.trim().toLowerCase());
      toast.success('Domain saved successfully! Please configure your DNS settings.');

      // Verify DNS after saving
      setTimeout(() => verifyDns(domain.trim()), 1000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save domain. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!savedDomain) return;

    if (!confirm('Are you sure you want to remove this custom domain?')) {
      return;
    }

    setIsRemoving(true);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/custom-domain`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to remove domain');
      }

      setDomain('');
      setSavedDomain('');
      setDnsStatus(null);
      setDnsVerified(false);
      toast.success('Domain removed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove domain');
    } finally {
      setIsRemoving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const openVideoInstruction = () => {
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

      {/* Current Domain Status Card (if domain is saved) */}
      {savedDomain && (
        <div style={styles.currentDomainCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Current Domain</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>{savedDomain}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{
                ...styles.statusBadge,
                ...(dnsVerified ? styles.verifiedBadge : styles.pendingBadge)
              }}>
                {dnsVerified ? (
                  <>
                    <CheckCircle size={14} />
                    DNS Verified
                  </>
                ) : (
                  <>
                    <XCircle size={14} />
                    DNS Pending
                  </>
                )}
              </span>
            </div>
          </div>

          {/* DNS Status Details */}
          {dnsStatus && (
            <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600, color: '#374151' }}>DNS Configuration Status:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {dnsStatus.aRecord.valid ? (
                    <CheckCircle size={16} color="#10b981" />
                  ) : (
                    <XCircle size={16} color="#ef4444" />
                  )}
                  <span style={{ fontSize: '13px' }}>
                    A Record: {dnsStatus.aRecord.value || 'Not configured'}
                    {!dnsStatus.aRecord.valid && <span style={{ color: '#6b7280' }}> (Expected: {dnsStatus.aRecord.expected})</span>}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {dnsStatus.cname.valid ? (
                    <CheckCircle size={16} color="#10b981" />
                  ) : (
                    <XCircle size={16} color="#ef4444" />
                  )}
                  <span style={{ fontSize: '13px' }}>
                    CNAME (www): {dnsStatus.cname.value || 'Not configured'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => verifyDns(savedDomain)}
              disabled={isVerifying}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px',
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                cursor: isVerifying ? 'wait' : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              <RefreshCw size={16} className={isVerifying ? 'animate-spin' : ''} />
              {isVerifying ? 'Checking...' : 'Check DNS'}
            </button>
            <button
              onClick={handleRemove}
              disabled={isRemoving}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 16px',
                backgroundColor: '#fef2f2',
                border: 'none',
                borderRadius: '8px',
                cursor: isRemoving ? 'wait' : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: '#dc2626',
              }}
            >
              <Trash2 size={16} />
              {isRemoving ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      )}

      {/* Instructions Card */}
      <div style={styles.instructionsCard}>
        <div style={styles.instructionsContent}>
          <p style={styles.instructionsTitle}>Instructions</p>

          <div style={styles.instructionsText}>
            <p style={{ margin: '0 0 12px 0' }}>Configure DNS Settings in Cloudflare</p>

            <p style={{ margin: '0 0 8px 0' }}>The Steps in the Below:</p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 8px 0', padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
              <p style={{ margin: 0 }}>
                1. Point <span style={styles.boldText}>A Record for @: 159.198.47.126</span>
              </p>
              <button
                onClick={() => copyToClipboard('159.198.47.126', 'IP Address')}
                style={styles.copyButton}
              >
                {copied === 'IP Address' ? <Check size={14} /> : <Copy size={14} />}
                Copy
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 12px 0', padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
              <p style={{ margin: 0 }}>
                2. Point <span style={styles.boldText}>CNAME Record for www: {savedDomain || 'your_domain.com'}</span>
              </p>
              {savedDomain && (
                <button
                  onClick={() => copyToClipboard(savedDomain, 'Domain')}
                  style={styles.copyButton}
                >
                  {copied === 'Domain' ? <Check size={14} /> : <Copy size={14} />}
                  Copy
                </button>
              )}
            </div>

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
          <div>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              {savedDomain ? 'Update Domain' : 'Enter Your Domain'}
            </p>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value.toLowerCase())}
              placeholder="your_domain.com"
              style={styles.domainInput}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || !domain.trim() || domain.trim() === savedDomain}
            style={{
              ...styles.saveButton,
              opacity: (isSaving || !domain.trim() || domain.trim() === savedDomain) ? 0.5 : 1,
              cursor: (isSaving || !domain.trim() || domain.trim() === savedDomain) ? 'not-allowed' : 'pointer',
            }}
          >
            <span style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : savedDomain ? 'Update Domain' : 'Save Domain'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminShopDomain;
