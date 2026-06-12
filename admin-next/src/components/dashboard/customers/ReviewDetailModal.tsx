import React, { useState } from 'react';
import {
  X, Star, Mail, ShoppingBag, Clock, Send, CheckCircle, XCircle,
} from 'lucide-react';
import { ReviewItem, ReviewStatus } from './types';
import { Product } from '../../../types';

function getUserAvatar(userName: string): string {
  const hash = userName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `https://images.unsplash.com/photo-${1500000000000 + (hash % 70)}?w=100&h=100&fit=crop&crop=faces`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getStatusBadge(status: ReviewStatus): string {
  switch (status) {
    case 'approved': return 'bg-emerald-100 text-emerald-700';
    case 'pending': return 'bg-amber-100 text-amber-700';
    case 'rejected': return 'bg-rose-100 text-rose-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

interface ReviewDetailModalProps {
  review: ReviewItem;
  products: Product[];
  isUpdating: boolean;
  onClose: () => void;
  onStatusChange: (reviewId: string, status: ReviewStatus) => Promise<void>;
  onSendReply: (reviewId: string, reply: string) => Promise<void>;
}

const ReviewDetailModal: React.FC<ReviewDetailModalProps> = ({
  review,
  products,
  isUpdating,
  onClose,
  onStatusChange,
  onSendReply,
}) => {
  const [replyDraft, setReplyDraft] = useState(review.reply || '');

  const getProductName = (productId: number): string => {
    const product = products.find((p) => p.id === productId);
    return product?.name || `Product #${productId}`;
  };

  const handleSend = () => {
    if (!replyDraft.trim()) return;
    onSendReply(review._id, replyDraft.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-b border-gray-100 dark:border-gray-700 p-3 sm:p-5 flex items-center justify-between z-10">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Review Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Customer Info */}
        <div className="p-5 border-b border-gray-100">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Customer Information</h4>
          <div className="flex items-center gap-4">
            <img
              src={getUserAvatar(review.userName)}
              alt={review.userName}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100"
            />
            <div className="flex-1">
              <p className="text-base font-bold text-gray-900">{review.userName}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <Mail size={14} />
                <span>{review.userEmail}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Review Content */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Review Analysis</h4>
            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusBadge(review.status)}`}>
              {review.status}
            </span>
          </div>

          <div className="flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={20}
                className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
              />
            ))}
            <span className="ml-2 text-sm font-medium text-gray-600">({review.rating}/5)</span>
          </div>

          {review.headline && (
            <p className="font-bold text-gray-800 mb-2 text-lg">{review.headline}</p>
          )}

          <p className="text-gray-600 text-sm leading-relaxed mb-4">{review.comment}</p>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded">
              <ShoppingBag size={12} />
              <span className="font-medium">{getProductName(review.productId)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={12} />
              <span>{formatDate(review.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Reply Section */}
        {review.reply ? (
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Your Reply</h4>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-700 leading-relaxed">{review.reply}</p>
              {review.repliedAt && (
                <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                  <CheckCircle size={12} />
                  Sent on {formatDate(review.repliedAt)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5 border-b border-gray-100">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Write a Reply</h4>
            <textarea
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
              placeholder="Write a professional response to the customer..."
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
              rows={4}
            />
            <button
              onClick={handleSend}
              disabled={!replyDraft.trim() || isUpdating}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <Send size={16} />
              Send Reply &amp; Approve Review
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-5 bg-gray-50 rounded-b-2xl flex gap-3">
          {review.status !== 'approved' && (
            <button
              onClick={async () => { await onStatusChange(review._id, 'approved'); onClose(); }}
              disabled={isUpdating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm"
            >
              <CheckCircle size={18} />
              Approve
            </button>
          )}
          {review.status !== 'rejected' && (
            <button
              onClick={async () => { await onStatusChange(review._id, 'rejected'); onClose(); }}
              disabled={isUpdating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 disabled:opacity-50 transition-all shadow-sm"
            >
              <XCircle size={18} />
              Reject
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailModal;
