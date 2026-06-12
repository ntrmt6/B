import React from 'react';
import { ChevronDown, ArrowUpDown, MoreVertical, CheckCircle, Eye, Edit, Star } from 'lucide-react';
import { ReviewItem } from './types';

interface RatingBadgeStyle {
  bg: string;
  text: string;
  starFill: string;
}

function getRatingBadgeStyle(rating: number): RatingBadgeStyle {
  if (rating >= 4) return { bg: 'bg-[#E0F2FE]', text: 'text-sky-600', starFill: 'text-sky-500' };
  if (rating >= 3) return { bg: 'bg-[#FFEDD5]', text: 'text-orange-600', starFill: 'text-orange-500' };
  return { bg: 'bg-[#FEE2E2]', text: 'text-red-600', starFill: 'text-red-500' };
}

function getUserAvatar(userName: string): string {
  const hash = userName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const avatarIndex = hash % 70;
  return `https://images.unsplash.com/photo-${1500000000000 + avatarIndex}?w=100&h=100&fit=crop&crop=faces`;
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

interface ReviewTableProps {
  reviews: ReviewItem[];
  selectedReviews: string[];
  selectedReviewId: string | null;
  reviewSortBy: string;
  loading: boolean;
  onSortChange: (s: string) => void;
  onSelectAll: () => void;
  onSelectOne: (id: string) => void;
  onSelectReview: (id: string) => void;
  mobileMenuOpen: string | null;
  onToggleMobileMenu: (id: string) => void;
}

const ReviewTable: React.FC<ReviewTableProps> = ({
  reviews,
  selectedReviews,
  selectedReviewId,
  reviewSortBy,
  loading,
  onSortChange,
  onSelectAll,
  onSelectOne,
  onSelectReview,
  mobileMenuOpen,
  onToggleMobileMenu,
}) => {
  return (
    <div className="w-full xl:w-[420px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Review</h3>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm hidden sm:inline">Sort by</span>
          <div className="relative">
            <select
              value={reviewSortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="appearance-none bg-[#F1F5F9] text-gray-700 text-sm font-medium py-1.5 pl-3 pr-8 rounded-md focus:outline-none cursor-pointer"
              style={{ WebkitAppearance: 'none', MozAppearance: 'none', backgroundImage: 'none' }}
            >
              <option>Newest</option>
              <option>Oldest</option>
              <option>Highest Rating</option>
              <option>Lowest Rating</option>
              <option>Most Helpful</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
          </div>
          <button className="p-1.5 bg-[#F1F5F9] rounded-md hover:bg-gray-200 transition">
            <ArrowUpDown className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading reviews…</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#E0F2FE]">
              <tr>
                <th className="p-4 w-10">
                  <div
                    className={`w-5 h-5 rounded border cursor-pointer flex items-center justify-center transition-colors ${
                      selectedReviews.length === reviews.length && reviews.length > 0
                        ? 'bg-[#0095FF] border-[#0095FF]'
                        : 'border-gray-400 bg-transparent'
                    }`}
                    onClick={onSelectAll}
                  >
                    {selectedReviews.length === reviews.length && reviews.length > 0 && (
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                </th>
                <th className="py-4 px-2 text-gray-900 font-semibold text-sm">Sl</th>
                <th className="py-4 px-2 text-gray-900 font-semibold text-sm">Image</th>
                <th className="py-4 px-2 text-gray-900 font-semibold text-sm">Name</th>
                <th className="py-4 px-2 text-gray-900 font-semibold text-sm">Star</th>
                <th className="py-4 px-2 text-gray-900 font-semibold text-sm text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No reviews found
                  </td>
                </tr>
              ) : (
                reviews.map((review, idx) => {
                  const ratingStyle = getRatingBadgeStyle(review.rating);
                  return (
                    <tr
                      key={review._id}
                      className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition ${
                        selectedReviewId === review._id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => onSelectReview(review._id)}
                    >
                      <td className="p-4">
                        <div
                          className={`w-5 h-5 rounded border cursor-pointer flex items-center justify-center transition-colors ${
                            selectedReviews.includes(review._id)
                              ? 'bg-[#0095FF] border-[#0095FF]'
                              : 'border-gray-400 bg-transparent'
                          }`}
                          onClick={(e) => { e.stopPropagation(); onSelectOne(review._id); }}
                        >
                          {selectedReviews.includes(review._id) && (
                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-sm text-gray-600">{reviews.length - idx}</td>
                      <td className="py-4 px-2">
                        <img
                          src={getUserAvatar(review.userName)}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover bg-gray-200"
                        />
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-sm text-gray-900 font-medium block truncate max-w-[100px]">
                          {review.userName}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${ratingStyle.bg}`}>
                          <span className={`text-xs font-bold ${ratingStyle.text}`}>{review.rating}</span>
                          <Star className={`w-3 h-3 ${ratingStyle.starFill}`} fill="currentColor" />
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <button className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-3 p-4">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading reviews…</div>
        ) : reviews.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No reviews found</div>
        ) : (
          reviews.map((review) => {
            const ratingStyle = getRatingBadgeStyle(review.rating);
            return (
              <div
                key={review._id}
                className={`bg-white border border-gray-100 rounded-xl p-4 shadow-sm ${
                  selectedReviewId === review._id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => onSelectReview(review._id)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1 w-5 h-5 rounded border cursor-pointer flex items-center justify-center flex-shrink-0 ${
                      selectedReviews.includes(review._id)
                        ? 'bg-[#0095FF] border-[#0095FF]'
                        : 'border-gray-400 bg-transparent'
                    }`}
                    onClick={(e) => { e.stopPropagation(); onSelectOne(review._id); }}
                  >
                    {selectedReviews.includes(review._id) && (
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <img
                    src={getUserAvatar(review.userName)}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover bg-gray-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{review.userName}</h4>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full mt-1 ${ratingStyle.bg}`}>
                          <span className={`text-xs font-bold ${ratingStyle.text}`}>{review.rating}</span>
                          <Star className={`w-3 h-3 ${ratingStyle.starFill}`} fill="currentColor" />
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          className="text-gray-400 p-1 hover:bg-gray-100 rounded-full"
                          onClick={(e) => { e.stopPropagation(); onToggleMobileMenu(review._id); }}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {mobileMenuOpen === review._id && (
                          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                            <button
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              onClick={(e) => { e.stopPropagation(); onSelectReview(review._id); onToggleMobileMenu(review._id); }}
                            >
                              <Eye className="w-4 h-4" /> View
                            </button>
                            <button
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              onClick={(e) => { e.stopPropagation(); onSelectReview(review._id); onToggleMobileMenu(review._id); }}
                            >
                              <Edit className="w-4 h-4" /> Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{review.comment}</p>
                    <p className="text-xs text-gray-400 mt-2">{formatDate(review.createdAt)}</p>
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

export default ReviewTable;
