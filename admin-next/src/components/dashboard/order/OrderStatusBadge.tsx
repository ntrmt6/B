import React from 'react';
import { Order } from '../../../types';
import { STATUS_COLORS, STATUS_LABELS } from './constants';

interface OrderStatusBadgeProps {
  status: Order['status'];
  className?: string;
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, className = '' }) => {
  return (
    <span
      className={`px-1 xxs:px-2 py-0.5 xxs:py-1 rounded-full text-[9px] xxs:text-xs font-medium whitespace-nowrap ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'} ${className}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
};

export default OrderStatusBadge;
