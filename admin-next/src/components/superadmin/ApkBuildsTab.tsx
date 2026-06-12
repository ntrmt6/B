import React, { useState, useEffect, useCallback } from 'react';
import { Smartphone, Search, RefreshCw, Eye, Trash2, Bell, Download, ExternalLink, Globe, Package } from 'lucide-react';
import { getAuthHeader } from '../../services/authService';
import { getApiUrl } from '../../utils/appHelpers';
import { toast } from 'react-hot-toast';
import { Tenant } from '../../types';

interface ApkBuild {
  buildId: string;
  appName: string;
  packageName: string;
  websiteUrl: string;
  versionName: string;
  versionCode: number;
  fileName: string;
  fileSize: string;
  userId: string;
  tenantId: string;
  userEmail: string;
  ipAddress: string;
  status: string;
  createdAt: string;
}

interface ApkBuildStats {
  totalBuilds: number;
  todayBuilds: number;
  uniqueUsers: number;
  uniqueTenants: number;
}

interface ApkBuildsTabProps {
  tenants: Tenant[];
  onSendNotification?: (tenantId: string, notification: { title: string; message: string; type: string }) => Promise<void>;
}

const ApkBuildsTab: React.FC<ApkBuildsTabProps> = ({ tenants, onSendNotification }) => {
  const [builds, setBuilds] = useState<ApkBuild[]>([]);
  const [stats, setStats] = useState<ApkBuildStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuild, setSelectedBuild] = useState<ApkBuild | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const notificationForm_init = { title: '', message: '', type: 'info' };
  const [notificationForm, setNotificationForm] = useState(notificationForm_init);

  const API_URL = getApiUrl();

  const loadBuilds = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/apk-builder/builds`, {
        headers: getAuthHeader(),
      });

      if (response.ok) {
        const result = await response.json();
        setBuilds(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load APK builds:', error);
      toast.error('Failed to load APK builds');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const loadStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/apk-builder/builds/stats`, {
        headers: getAuthHeader(),
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load APK build stats:', error);
    }
  }, [API_URL]);

  useEffect(() => {
    loadBuilds();
    loadStats();
  }, [loadBuilds, loadStats]);

  const handleDeleteBuild = async (buildId: string) => {
    if (!confirm('Are you sure you want to delete this build record?')) return;

    try {
      const response = await fetch(`${API_URL}/apk-builder/builds/${buildId}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (response.ok) {
        toast.success('Build record deleted');
        loadBuilds();
        loadStats();
      } else {
        toast.error('Failed to delete build record');
      }
    } catch (error) {
      console.error('Failed to delete build:', error);
      toast.error('Failed to delete build record');
    }
  };

  const handleSendNotification = async () => {
    if (!selectedBuild || !onSendNotification) return;

    const tenantId = selectedBuild.tenantId;
    if (!tenantId || tenantId === 'public') {
      toast.error('Cannot send notification to public/anonymous builds');
      return;
    }

    try {
      await onSendNotification(tenantId, notificationForm);
      toast.success('Notification sent successfully');
      setShowNotificationModal(false);
      setNotificationForm({ title: '', message: '', type: 'info' });
    } catch (error) {
      toast.error('Failed to send notification');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTenantName = (tenantId: string) => {
    if (!tenantId || tenantId === 'public') return 'Public/Anonymous';
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant?.name || tenantId;
  };

  const filteredBuilds = builds.filter(build => 
    build.appName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    build.packageName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    build.websiteUrl?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    build.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Smartphone className="text-emerald-500" />
            APK Builds
          </h1>
          <p className="text-slate-600 mt-1">Track all APK builds created by users and tenants</p>
        </div>
        <button
          onClick={() => { loadBuilds(); loadStats(); }}
          className="px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg hover:from-[#2BAEE8] hover:to-[#1A7FE8] transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-600 mb-1">Total Builds</div>
            <div className="text-2xl font-bold text-slate-800">{stats.totalBuilds.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-600 mb-1">Today's Builds</div>
            <div className="text-2xl font-bold text-emerald-600">{stats.todayBuilds.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-600 mb-1">Unique Users</div>
            <div className="text-2xl font-bold text-blue-600">{stats.uniqueUsers.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-600 mb-1">Unique Tenants</div>
            <div className="text-2xl font-bold text-purple-600">{stats.uniqueTenants.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by app name, package name, website, or email..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Builds Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">App Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Website</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">User/Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Build Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Loading APK builds...
                  </td>
                </tr>
              ) : filteredBuilds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No APK builds found
                  </td>
                </tr>
              ) : (
                filteredBuilds.map((build) => (
                  <tr key={build.buildId} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                          <Smartphone className="text-white" size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-800">{build.appName}</div>
                          <div className="text-xs text-slate-500">{build.packageName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Globe className="text-slate-400" size={14} />
                        <a
                          href={build.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {build.websiteUrl?.replace(/https?:\/\//, '').substring(0, 30)}
                          {build.websiteUrl?.length > 30 ? '...' : ''}
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-800">{getTenantName(build.tenantId)}</div>
                      <div className="text-xs text-slate-500">{build.userEmail || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="text-slate-400" size={14} />
                        <div>
                          <div className="text-sm text-slate-800">v{build.versionName}</div>
                          <div className="text-xs text-slate-500">{build.fileSize}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(build.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedBuild(build)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {build.tenantId && build.tenantId !== 'public' && onSendNotification && (
                          <button
                            onClick={() => {
                              setSelectedBuild(build);
                              setShowNotificationModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Send Notification"
                          >
                            <Bell size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteBuild(build.buildId)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedBuild && !showNotificationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">APK Build Details</h2>
              <button
                onClick={() => setSelectedBuild(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">App Name</label>
                  <div className="text-sm text-slate-800 mt-1">{selectedBuild.appName}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Package Name</label>
                  <div className="text-sm text-slate-800 mt-1">{selectedBuild.packageName}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Website URL</label>
                  <div className="text-sm mt-1">
                    <a
                      href={selectedBuild.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {selectedBuild.websiteUrl}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Version</label>
                  <div className="text-sm text-slate-800 mt-1">
                    {selectedBuild.versionName} (Code: {selectedBuild.versionCode})
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">File Name</label>
                  <div className="text-sm text-slate-800 mt-1">{selectedBuild.fileName}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">File Size</label>
                  <div className="text-sm text-slate-800 mt-1">{selectedBuild.fileSize}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Tenant</label>
                  <div className="text-sm text-slate-800 mt-1">{getTenantName(selectedBuild.tenantId)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">User Email</label>
                  <div className="text-sm text-slate-800 mt-1">{selectedBuild.userEmail || 'Unknown'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">IP Address</label>
                  <div className="text-sm text-slate-800 mt-1">{selectedBuild.ipAddress || 'Unknown'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Created At</label>
                  <div className="text-sm text-slate-800 mt-1">{formatDate(selectedBuild.createdAt)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Build ID</label>
                  <div className="text-xs text-slate-600 mt-1 font-mono">{selectedBuild.buildId}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedBuild.status === 'completed' 
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedBuild.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-2">
              {selectedBuild.tenantId && selectedBuild.tenantId !== 'public' && onSendNotification && (
                <button
                  onClick={() => setShowNotificationModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Bell size={16} />
                  Send Notification
                </button>
              )}
              <button
                onClick={() => setSelectedBuild(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Notification Modal */}
      {showNotificationModal && selectedBuild && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Send Notification</h2>
              <button
                onClick={() => {
                  setShowNotificationModal(false);
                  setNotificationForm({ title: '', message: '', type: 'info' });
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-sm text-slate-600">Sending to:</div>
                <div className="text-sm font-medium text-slate-800">{getTenantName(selectedBuild.tenantId)}</div>
                <div className="text-xs text-slate-500">App: {selectedBuild.appName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notification Type</label>
                <select
                  value={notificationForm.type}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Notification title"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Notification message"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNotificationModal(false);
                  setNotificationForm({ title: '', message: '', type: 'info' });
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotification}
                disabled={!notificationForm.title || !notificationForm.message}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Bell size={16} />
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApkBuildsTab;
