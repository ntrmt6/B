import React, { useState, useEffect } from 'react';
import {
  Smartphone, Search, Filter, Clock, CheckCircle2, AlertCircle, XCircle,
  Building2, Calendar, Loader2, RefreshCw, ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuthHeader } from '../../services/authService';
import { getApiUrl } from '../../utils/appHelpers';

// API URL helper
const API_URL = getApiUrl();

interface AppRequest {
  id: string;
  tenantId: string;
  tenantName?: string;
  appTitle: string;
  description: string;
  platforms: { android: boolean; ios: boolean };
  priority: 'Low' | 'Standard' | 'High (ASAP)';
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Loader2 },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle }
};

const priorityConfig = {
  'Low': { label: 'Low', color: 'bg-slate-100 text-slate-600' },
  'Standard': { label: 'Standard', color: 'bg-blue-100 text-blue-600' },
  'High (ASAP)': { label: 'High (ASAP)', color: 'bg-red-100 text-red-600' }
};

const AppRequestsTab: React.FC = () => {
  const [requests, setRequests] = useState<AppRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch all app requests
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const authHeader = getAuthHeader() as Record<string, string>;
      const response = await fetch(`${API_URL}/tenants/app-requests/all`, {
        headers: {
          'Authorization': authHeader['Authorization'] || ''
        }
      });
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching app requests:', error);
      toast.error('Failed to load app requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Update request status
  const handleStatusUpdate = async (requestId: string, newStatus: AppRequest['status']) => {
    setUpdatingId(requestId);
    try {
      const authHeader = getAuthHeader() as Record<string, string>;
      const response = await fetch(`${API_URL}/tenants/app-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader['Authorization'] || ''
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
        toast.success('Status updated successfully');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.appTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.tenantName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || request.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Smartphone className="w-7 h-7 text-teal-600" />
            App Requests
          </h2>
          <p className="text-gray-500 mt-1">Manage mobile app requests from tenants</p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{requests.length}</div>
          <div className="text-sm text-gray-500">Total Requests</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">
            {requests.filter(r => r.status === 'pending').length}
          </div>
          <div className="text-sm text-yellow-600">Pending</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">
            {requests.filter(r => r.status === 'in-progress').length}
          </div>
          <div className="text-sm text-blue-600">In Progress</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-700">
            {requests.filter(r => r.status === 'completed').length}
          </div>
          <div className="text-sm text-green-600">Completed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by app title, description, or tenant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white cursor-pointer"
            >
              <option value="all">All Priority</option>
              <option value="Low">Low</option>
              <option value="Standard">Standard</option>
              <option value="High (ASAP)">High (ASAP)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-200 text-center">
            <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No app requests found</h3>
            <p className="text-gray-500 mt-1">
              {searchQuery || filterStatus !== 'all' || filterPriority !== 'all'
                ? 'Try adjusting your filters'
                : 'App requests from tenants will appear here'}
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const statusInfo = statusConfig[request.status];
            const priorityInfo = priorityConfig[request.priority];
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={request.id}
                className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 hover:border-teal-300 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{request.appTitle}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityInfo.color}`}>
                        {priorityInfo.label}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{request.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        <span>{request.tenantName || request.tenantId}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(request.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Platforms:</span>
                        {request.platforms.android && (
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Android</span>
                        )}
                        {request.platforms.ios && (
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">iOS</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status & Actions */}
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusInfo.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">{statusInfo.label}</span>
                    </div>

                    {/* Status Dropdown */}
                    <div className="relative">
                      <select
                        value={request.status}
                        onChange={(e) => handleStatusUpdate(request.id, e.target.value as AppRequest['status'])}
                        disabled={updatingId === request.id}
                        className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white cursor-pointer text-sm disabled:opacity-50"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      {updatingId === request.id ? (
                        <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-teal-600" />
                      ) : (
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AppRequestsTab;
