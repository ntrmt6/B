import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, CheckCircle, XCircle, RefreshCw, Trash2, Copy, Check, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Vendor } from '../../../types';
import { VendorService } from '../../../services/VendorService';

interface VendorShopDomainProps {
  vendor: Vendor;
  tenantId: string;
  onBack: () => void;
  onVendorUpdate: (vendor: Vendor) => void;
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

const VendorShopDomain: React.FC<VendorShopDomainProps> = ({ vendor, tenantId, onBack, onVendorUpdate }) => {
  const [domain, setDomain] = useState(vendor.customDomain || '');
  const [savedDomain, setSavedDomain] = useState(vendor.customDomain || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [dnsStatus, setDnsStatus] = useState<DnsStatus | null>(null);
  const [dnsVerified, setDnsVerified] = useState(vendor.domainVerified || false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (vendor.customDomain) {
      setDomain(vendor.customDomain);
      setSavedDomain(vendor.customDomain);
      setDnsVerified(vendor.domainVerified || false);
      verifyDns(vendor.customDomain);
    }
  }, [vendor.customDomain, vendor.domainVerified]);

  const verifyDns = async (domainToVerify: string) => {
    if (!domainToVerify) return;

    setIsVerifying(true);
    try {
      const result = await VendorService.verifyDomain(tenantId, vendor._id, domainToVerify);
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

    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain.trim())) {
      toast.error('Please enter a valid domain (e.g., example.com)');
      return;
    }

    setIsSaving(true);
    try {
      await VendorService.setupDomain(tenantId, vendor._id, domain.trim());
      const updatedDomain = domain.trim().toLowerCase();
      setSavedDomain(updatedDomain);
      toast.success('Domain saved successfully! Please configure your DNS settings.');

      // Update parent with new domain
      onVendorUpdate({ ...vendor, customDomain: updatedDomain, domainVerified: false });

      setTimeout(() => verifyDns(updatedDomain), 1000);
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
      await VendorService.removeDomain(tenantId, vendor._id);
      setDomain('');
      setSavedDomain('');
      setDnsStatus(null);
      setDnsVerified(false);
      toast.success('Domain removed successfully');

      // Update parent
      onVendorUpdate({ ...vendor, customDomain: undefined, domainVerified: false });
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

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <Globe className="w-5 h-5 text-[#FF8C00]" />
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Shop Domain</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{vendor.name}</p>
          </div>
        </div>
      </div>

      {/* Current Domain Status */}
      {savedDomain && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Current Domain</p>
              <p className="text-lg font-semibold text-slate-800 dark:text-white">{savedDomain}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              dnsVerified
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {dnsVerified ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  DNS Verified
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  DNS Pending
                </>
              )}
            </span>
          </div>

          {/* DNS Status Details */}
          {dnsStatus && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 mb-3">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">DNS Configuration Status:</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {dnsStatus.aRecord.valid ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    A Record: {dnsStatus.aRecord.value || 'Not configured'}
                    {!dnsStatus.aRecord.valid && (
                      <span className="text-slate-400"> (Expected: {dnsStatus.aRecord.expected})</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {dnsStatus.cname.valid ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    CNAME (www): {dnsStatus.cname.value || 'Not configured'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => verifyDns(savedDomain)}
              disabled={isVerifying}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
              {isVerifying ? 'Checking...' : 'Check DNS'}
            </button>
            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isRemoving ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      )}

      {/* Instructions Card */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-red-200 dark:border-red-800">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-3">Instructions</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">Configure DNS Settings in Cloudflare</p>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">The Steps in the Below:</p>

        {/* Step 1 */}
        <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-2">
          <p className="text-sm text-slate-700 dark:text-slate-200">
            1. Point <span className="font-semibold">A Record for @: 159.198.47.126</span>
          </p>
          <button
            onClick={() => copyToClipboard('159.198.47.126', 'IP Address')}
            className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded text-xs text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors"
          >
            {copied === 'IP Address' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            Copy
          </button>
        </div>

        {/* Step 2 */}
        <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-3">
          <p className="text-sm text-slate-700 dark:text-slate-200">
            2. Point <span className="font-semibold">CNAME Record for www: {savedDomain || 'your_domain.com'}</span>
          </p>
          {savedDomain && (
            <button
              onClick={() => copyToClipboard(savedDomain, 'Domain')}
              className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded text-xs text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors"
            >
              {copied === 'Domain' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              Copy
            </button>
          )}
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          Add the following DNS record to your <span className="font-semibold">Cloudflare DNS</span> with{' '}
          <span className="font-semibold">TTL: Auto</span> and{' '}
          <span className="font-semibold">Proxy Status: Proxied.</span> Set SSL mode to{' '}
          <span className="font-semibold">Flexible</span>. Allow up to 24 hours for verification.
        </p>
      </div>

      {/* Domain Input Card */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          {savedDomain ? 'Update Domain' : 'Enter Your Domain'}
        </label>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value.toLowerCase())}
          placeholder="your_domain.com"
          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#FF8C00] transition-colors"
        />
        <button
          onClick={handleSave}
          disabled={isSaving || !domain.trim() || domain.trim() === savedDomain}
          className="w-full mt-3 px-4 py-2.5 bg-[#1e90ff] text-white rounded-lg text-sm font-semibold hover:bg-[#1a7fd9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : savedDomain ? 'Update Domain' : 'Save Domain'}
        </button>
      </div>
    </div>
  );
};

export default VendorShopDomain;
